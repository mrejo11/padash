export type RollGeometry =
  | { kind: 'area'; area: number; layers: number }
  | { kind: 'rectangle'; width: number; length: number; count: number; layers: number }
  | { kind: 'pipe'; wrapLength: number; pipeLength: number };

export type RollInput = {
  geometry: RollGeometry; rollWidth: number; rollLength: number;
  extraArea: number; wastePercent: number;
};
export type RollEstimate = {
  netArea: number; extraArea: number; baseArea: number; reserveArea: number;
  requiredArea: number; rollArea: number; areaRolls: number; purchaseArea: number; surplusArea: number;
  pipePlan?: { possible: boolean; segments: number; piecesPerRoll: number; baseRolls: number; reserveRolls: number; totalRolls: number };
};

function measured(value: number, min: number, max: number, scale = 1000) {
  return Number.isFinite(value) && value >= min && value <= max
    && Math.abs(value * scale - Math.round(value * scale)) < 0.00001;
}
const mm = (value: number) => BigInt(Math.round(value * 1000));
const squareMm = (value: number) => BigInt(Math.round(value * 1_000_000));
const ceilDivide = (a: bigint, b: bigint) => (a + b - BigInt(1)) / b;

/** Decimal measurements are converted to integer mm/mm² before rounding rolls. */
export function calculateRolls(input: RollInput): RollEstimate {
  const { geometry: shape, rollWidth, rollLength, extraArea, wastePercent } = input;
  if (!measured(rollWidth, .001, 10) || !measured(rollLength, .001, 1000)
    || !measured(extraArea, 0, 1_000_000) || !measured(wastePercent, 0, 50)) {
    throw new Error('ابعاد رول، مساحت افزوده و درصد ذخیره را بررسی کنید؛ حداکثر سه رقم اعشار مجاز است.');
  }
  let net: bigint;
  if (shape.kind === 'pipe') {
    if (!measured(shape.wrapLength, .001, 100) || !measured(shape.pipeLength, .001, 100_000)) {
      throw new Error('طول واقعی دورپیچ و طول مسیر لوله معتبر نیست.');
    }
    net = mm(shape.wrapLength) * mm(shape.pipeLength);
  } else {
    if (!Number.isInteger(shape.layers) || shape.layers < 1 || shape.layers > 10) throw new Error('تعداد لایه باید عدد صحیح بین ۱ و ۱۰ باشد.');
    if (shape.kind === 'area') {
      if (!measured(shape.area, .001, 1_000_000)) throw new Error('مساحت خالص باید مثبت و حداکثر یک میلیون مترمربع باشد.');
      net = squareMm(shape.area) * BigInt(shape.layers);
    } else {
      if (!measured(shape.width, .001, 10_000) || !measured(shape.length, .001, 10_000)
        || !Number.isInteger(shape.count) || shape.count < 1 || shape.count > 100_000) {
        throw new Error('ابعاد سطح و تعداد قطعات مستطیلی معتبر نیست.');
      }
      net = mm(shape.width) * mm(shape.length) * BigInt(shape.count) * BigInt(shape.layers);
    }
  }
  const base = net + squareMm(extraArea);
  const basis = BigInt(100_000);
  const reserve = base * BigInt(Math.round(wastePercent * 1000));
  const required = base * basis + reserve;
  if (required > BigInt(10_000_000) * BigInt(1_000_000) * basis) throw new Error('مساحت کل از محدوده محاسبه این ابزار بیشتر است.');
  const perRoll = mm(rollWidth) * mm(rollLength);
  const areaRolls = Number(ceilDivide(required, perRoll * basis));
  const asArea = (value: bigint) => Number(value) / 1_000_000;
  const requiredArea = Number(required) / 100_000 / 1_000_000;
  const result: RollEstimate = {
    netArea: asArea(net), extraArea, baseArea: asArea(base), reserveArea: Number(reserve) / 100_000 / 1_000_000,
    requiredArea, rollArea: asArea(perRoll), areaRolls,
    purchaseArea: asArea(perRoll * BigInt(areaRolls)),
    surplusArea: Number(perRoll * BigInt(areaRolls) * basis - required) / 100_000 / 1_000_000,
  };
  if (shape.kind === 'pipe') {
    // The roll's natural curvature is kept: circumference along roll length,
    // axial pipe sections along roll width. Offcuts are not reused in this plan.
    const segments = Number(ceilDivide(mm(shape.pipeLength), mm(rollWidth)));
    const piecesPerRoll = Number(mm(rollLength) / mm(shape.wrapLength));
    const baseRolls = piecesPerRoll ? Math.ceil(segments / piecesPerRoll) : 0;
    const reserveRolls = Number(ceilDivide(squareMm(extraArea) * basis + reserve, perRoll * basis));
    result.pipePlan = { possible: piecesPerRoll > 0, segments, piecesPerRoll, baseRolls,
      reserveRolls, totalRolls: baseRolls + reserveRolls };
  }
  return result;
}
