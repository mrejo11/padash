/** Quantity take-offs from measured details; all length arithmetic uses integer millimetres. */
export type MeasuredRun = { length:number; count:number };
export type PackageEstimate = { baseCount:number; extraCount:number; reserveCount:number; requiredCount:number; packs:number; purchaseCount:number; surplusCount:number };
const ceil = (a:bigint, b:bigint) => (a + b - BigInt(1)) / b;
const mm = (n:number) => BigInt(Math.round(n * 1000));
const decimal = (n:number, min:number, max:number) => Number.isFinite(n) && n >= min && n <= max && Math.abs(n * 1000 - Math.round(n * 1000)) < 0.00001;
const integer = (n:number, min=1, max=1_000_000) => Number.isInteger(n) && n >= min && n <= max;
const percent = (n:number) => {
  if (!decimal(n, 0, 50)) throw new Error('درصد ذخیره باید بین صفر و ۵۰ و حداکثر با سه رقم اعشار باشد.');
  return BigInt(Math.round(n * 1000));
};
const safe = (n:bigint) => {
  if (n > BigInt(1000000000)) throw new Error('مقدار کل از محدوده محاسبه بیشتر است.');
  return Number(n);
};
function checkRuns(runs:MeasuredRun[]) {
  if (!runs.length || runs.length > 50 || runs.some(run => !decimal(run.length, .001, 10000) || !integer(run.count, 1, 100000)))
    throw new Error('طول خالص هر مسیر باید مثبت، با حداکثر سه رقم اعشار و تعداد تکرار، عدد صحیح مثبت باشد.');
}
export function calculatePackages(baseCount:number, extraCount:number, wastePercent:number, packSize:number):PackageEstimate {
  if (!integer(baseCount, 0, 1_000_000_000) || !integer(extraCount, 0) || !integer(packSize))
    throw new Error('تعداد قطعه، قطعات افزوده و تعداد داخل بسته باید عدد صحیح معتبر باشند.');
  const base = BigInt(baseCount), extra = BigInt(extraCount), p = percent(wastePercent);
  const reserve = ceil((base + extra) * p, BigInt(100000)), required = base + extra + reserve;
  const packs = ceil(required, BigInt(packSize)), purchase = packs * BigInt(packSize);
  return { baseCount, extraCount, reserveCount:safe(reserve), requiredCount:safe(required), packs:safe(packs), purchaseCount:safe(purchase), surplusCount:safe(purchase - required) };
}

export type CordInput = {
  geometry: { kind:'ties'; ties:number; tieLength:number } | { kind:'spaced'; runs:MeasuredRun[]; spacing:number; tieLength:number } | { kind:'runs'; runs:MeasuredRun[] };
  allowance:number; extraLength:number; wastePercent:number; coilLength:number;
};
export function calculateCord(input:CordInput) {
  const { geometry:g, allowance, extraLength, coilLength } = input, p = percent(input.wastePercent);
  if (!decimal(allowance, 0, 100) || !decimal(extraLength, 0, 1_000_000) || !decimal(coilLength, .001, 100000))
    throw new Error('اضافه گره، طول افزوده و طول واقعی کلاف را بررسی کنید؛ حداکثر سه رقم اعشار مجاز است.');
  let pieces = BigInt(0), base = BigInt(0), longestPiece = BigInt(0);
  let cuts:{ length:bigint; count:bigint }[];
  if (g.kind === 'ties' || g.kind === 'spaced') {
    if (!decimal(g.tieLength, .001, 100)) throw new Error('طول اندازه‌گیری‌شده هر بست باید مثبت باشد.');
    if (g.kind === 'ties') {
      if (!integer(g.ties)) throw new Error('تعداد بست باید عدد صحیح مثبت باشد.');
      pieces = BigInt(g.ties);
    } else {
      checkRuns(g.runs);
      if (!decimal(g.spacing, .001, 100)) throw new Error('فاصله بست‌ها باید مثبت و حداکثر ۱۰۰ متر باشد.');
      pieces = g.runs.reduce((sum, run) => sum + (ceil(mm(run.length), mm(g.spacing)) + BigInt(1)) * BigInt(run.count), BigInt(0));
    }
    longestPiece = mm(g.tieLength) + mm(allowance);
    cuts = [{ length:longestPiece, count:pieces }];
    base = pieces * longestPiece;
  } else if (g.kind === 'runs') {
    checkRuns(g.runs);
    cuts = g.runs.map(run => ({ length:mm(run.length) + mm(allowance), count:BigInt(run.count) }));
    base = cuts.reduce((sum, cut) => sum + cut.length * cut.count, BigInt(0));
    pieces = cuts.reduce((sum, cut) => sum + cut.count, BigInt(0));
    longestPiece = cuts.reduce((max, cut) => cut.length > max ? cut.length : max, BigInt(0));
  } else throw new Error('روش اندازه‌گیری نخ معتبر نیست.');
  const extra = mm(extraLength), coil = mm(coilLength), need = (base + extra) * (BigInt(100000) + p);
  const minimumCoils = ceil(need, coil * BigInt(100000));
  // Reserve whole pieces before packing. Short tails cannot be added together to make one tie.
  // Groups of different lengths are kept separate; this is a feasible plan, not global nesting.
  let cutPlan:{ baseCoils:number; extraCoils:number; totalCoils:number; reservePieces:number; purchasedLength:number; unusedLength:number }|undefined;
  if (longestPiece <= coil) {
    const baseCoils = cuts.reduce((sum, cut) => sum + ceil(cut.count, coil / cut.length), BigInt(0));
    const reservedCuts = cuts.map(cut => ({ ...cut, reserve:ceil(cut.count * p, BigInt(100000)) }));
    const piecesWithReserve = reservedCuts.reduce((sum, cut) => sum + (cut.count + cut.reserve) * cut.length, BigInt(0));
    const coilsWithReserve = reservedCuts.reduce((sum, cut) => sum + ceil(cut.count + cut.reserve, coil / cut.length), BigInt(0));
    const uncut = coilsWithReserve * coil - piecesWithReserve, extraNeed = extra * (BigInt(100000) + p);
    const deficit = extraNeed - uncut * BigInt(100000);
    const total = coilsWithReserve + (deficit > BigInt(0) ? ceil(deficit, coil * BigInt(100000)) : BigInt(0));
    cutPlan = { baseCoils:safe(baseCoils), extraCoils:safe(total - baseCoils), totalCoils:safe(total), reservePieces:safe(reservedCuts.reduce((sum, cut) => sum + cut.reserve, BigInt(0))), purchasedLength:Number(total * coil) / 1000, unusedLength:Number(total * coil * BigInt(100000) - piecesWithReserve * BigInt(100000) - extraNeed) / 100000000 };
  }
  return { pieces:safe(pieces), baseLength:Number(base) / 1000, extraLength, reserveLength:Number((base + extra) * p) / 100000000,
    requiredLength:Number(need) / 100000000, minimumCoils:safe(minimumCoils), purchasedLength:Number(minimumCoils * coil) / 1000,
    surplusLength:Number(minimumCoils * coil * BigInt(100000) - need) / 100000000, cutPlan };
}

export type FastenerInput = {
  geometry:{ kind:'count'; sheets:number; supportsPerSheet:number; screwsPerSupport:number }
    | { kind:'spacing'; runs:MeasuredRun[]; spacing:number; screwsPerPoint:number };
  extraCount:number; wastePercent:number; packSize:number;
};
export function calculateFasteners(input:FastenerInput) {
  const g = input.geometry;
  let base:bigint;
  if (g.kind === 'count') {
    if (![g.sheets, g.supportsPerSheet, g.screwsPerSupport].every(n => integer(n))) throw new Error('تعداد ورق، تکیه‌گاه و پیچ هر اتصال باید عدد صحیح مثبت باشند.');
    base = BigInt(g.sheets) * BigInt(g.supportsPerSheet) * BigInt(g.screwsPerSupport);
  } else if (g.kind === 'spacing') {
    checkRuns(g.runs);
    if (!decimal(g.spacing, .001, 100) || !integer(g.screwsPerPoint)) throw new Error('فاصله اتصال‌ها باید مثبت و تعداد پیچ هر نقطه، عدد صحیح مثبت باشد.');
    base = g.runs.reduce((sum, run) => sum + (ceil(mm(run.length), mm(g.spacing)) + BigInt(1)) * BigInt(run.count) * BigInt(g.screwsPerPoint), BigInt(0));
  } else throw new Error('روش شمارش پیچ معتبر نیست.');
  return calculatePackages(safe(base), input.extraCount, input.wastePercent, input.packSize);
}

export type RoofBlockInput = { runs:MeasuredRun[]; blockLength:number; extraCount:number; wastePercent:number; packSize:number };
export function calculateRoofBlocks(input:RoofBlockInput) {
  checkRuns(input.runs);
  if (!decimal(input.blockLength, .001, 10)) throw new Error('طول مفید بلوک سقفی باید مثبت، حداکثر ۱۰ متر و با حداکثر سه رقم اعشار باشد.');
  const block = mm(input.blockLength);
  const rows = input.runs.map(run => {
    const length = mm(run.length), perRun = ceil(length, block), last = length - (perRun - BigInt(1)) * block;
    return { length:run.length, count:run.count, perRun:safe(perRun), total:safe(perRun * BigInt(run.count)), lastPieceLength:Number(last) / 1000,
      offcutLength:Number((perRun * block - length) * BigInt(run.count)) / 1000 };
  });
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  return { ...calculatePackages(total, input.extraCount, input.wastePercent, input.packSize), rows,
    netLength:input.runs.reduce((sum, row) => sum + row.length * row.count, 0), offcutLength:rows.reduce((sum, row) => sum + row.offcutLength, 0) };
}
