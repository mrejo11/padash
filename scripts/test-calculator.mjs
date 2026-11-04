import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../lib/roll-estimate.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { calculateRolls } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const input = overrides => ({ geometry: { kind: 'area', area: 120, layers: 1 }, rollWidth: 1, rollLength: 10, extraArea: 0, wastePercent: 10, ...overrides });
const sample = calculateRolls(input());
assert.equal(sample.requiredArea, 132);
assert.equal(sample.areaRolls, 14);
assert.equal(sample.purchaseArea, 140);
assert.equal(sample.surplusArea, 8);
assert.equal(calculateRolls(input({ rollLength: 6 })).areaRolls, 22);
const rectangle = calculateRolls(input({ geometry: { kind: 'rectangle', width: 2.5, length: 4.2, count: 3, layers: 2 }, rollWidth: 1.2, extraArea: 1.5, wastePercent: 5 }));
assert.equal(rectangle.netArea, 63);
assert.equal(rectangle.requiredArea, 67.725);
assert.equal(rectangle.areaRolls, 6);
assert.equal(rectangle.surplusArea, 4.275);
assert.equal(calculateRolls(input({ geometry: { kind: 'area', area: .3, layers: 1 }, rollWidth: .1, rollLength: 3, wastePercent: 0 })).areaRolls, 1, 'decimal boundary must not add a spurious roll');
assert.equal(calculateRolls(input({ geometry: { kind: 'area', area: 1.001, layers: 1 }, rollWidth: 1, rollLength: 1, wastePercent: 0 })).areaRolls, 2, 'genuine small excess must round up');
const pipe = calculateRolls(input({ geometry: { kind: 'pipe', wrapLength: .65, pipeLength: 20 } }));
assert.equal(pipe.netArea, 13);
assert.deepEqual(pipe.pipePlan, { possible: true, segments: 20, piecesPerRoll: 15, baseRolls: 2, reserveRolls: 1, totalRolls: 3 });
assert.equal(calculateRolls(input({ geometry: { kind: 'pipe', wrapLength: 12, pipeLength: 2 } })).pipePlan.possible, false);
for (const overrides of [{ rollWidth: 0 }, { rollLength: -1 }, { extraArea: -1 }, { wastePercent: 51 }, { wastePercent: NaN }, { rollWidth: Infinity }, { rollWidth: .0001 }, { geometry: { kind: 'area', area: 10, layers: 1.5 } }, { geometry: { kind: 'rectangle', width: 2, length: 4, count: 0, layers: 1 } }]) assert.throws(() => calculateRolls(input(overrides)));
for (let i = 1; i <= 250; i++) {
  const result = calculateRolls(input({ geometry: { kind: 'area', area: i / 10, layers: i % 3 + 1 }, rollWidth: .3, rollLength: i % 11 + 1, wastePercent: i % 21, extraArea: .1 }));
  assert(result.purchaseArea + 1e-10 >= result.requiredArea, 'purchased area covers computed demand');
  assert((result.areaRolls - 1) * result.rollArea < result.requiredArea, 'area count is the minimum integral count');
}
console.log('PASS: exact decimal roll rounding, geometry, layers, reserve, units, measured pipe cut plan, invalid inputs and 250 coverage invariants.');

const materialSource=await readFile(new URL('../lib/material-estimate.ts',import.meta.url),'utf8');
const materialJs=ts.transpileModule(materialSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {calculateMaterial}=await import('data:text/javascript;base64,'+Buffer.from(materialJs).toString('base64'));
const material=overrides=>({geometry:{kind:'area',area:120,layers:1},unitKind:'roll',unitWidth:1,unitLength:10,extraArea:0,wastePercent:10,overlapWidthMm:0,overlapLengthMm:0,allowRotation:false,...overrides});
assert.equal(calculateMaterial(material()).areaUnits,14);
assert.equal(calculateMaterial(material({unitKind:'sheet',unitWidth:1.2,unitLength:2.4})).areaUnits,46);
assert.equal(calculateMaterial(material({geometry:{kind:'area',area:.3,layers:1},unitWidth:.1,unitLength:3,wastePercent:0})).areaUnits,1,'exact decimal pack boundary');
const strips=calculateMaterial(material({geometry:{kind:'rectangle',width:3,length:2,count:1,layers:1}}));
assert.equal(strips.plan.piecesPerUnit,5);
assert.equal(strips.plan.baseUnits,1);
assert.equal(strips.plan.cutArea,6);
assert.equal(strips.plan.uncutStockArea,4);
assert.equal(strips.plan.reserveArea,.6);
assert.equal(strips.plan.extraUnits,0,'uncut stock supplies reserve without an unnecessary roll');
assert.equal(calculateMaterial(material({geometry:{kind:'rectangle',width:3,length:2,count:1,layers:1},extraArea:5})).plan.totalUnits,2,'extra area beyond uncut stock needs another roll');
const sheets={geometry:{kind:'rectangle',width:3,length:2,count:1,layers:1},unitKind:'sheet',unitWidth:2,unitLength:3,wastePercent:0};
assert.equal(calculateMaterial(material(sheets)).plan.totalUnits,2);
assert.equal(calculateMaterial(material({...sheets,allowRotation:true})).plan.totalUnits,1);
assert.equal(calculateMaterial(material({...sheets,geometry:{...sheets.geometry,count:3,layers:2},allowRotation:true})).plan.totalUnits,6,'surface count and layers multiply physical coverage');
const seams=calculateMaterial(material({geometry:{kind:'rectangle',width:1.9,length:3.9,count:1,layers:1},unitKind:'sheet',unitWidth:1,unitLength:2,wastePercent:0,overlapWidthMm:100,overlapLengthMm:100}));
assert.equal(seams.plan.across,2,'external edge does not lose overlap');
assert.equal(seams.plan.along,2);
assert.equal(seams.plan.totalUnits,4);
assert.equal(calculateMaterial(material({geometry:{kind:'rectangle',width:1.901,length:3.901,count:1,layers:1},unitKind:'sheet',unitWidth:1,unitLength:2,wastePercent:0,overlapWidthMm:100,overlapLengthMm:100})).plan.totalUnits,9,'one millimetre past the seam boundary requires the next row');
for(const invalid of [{unitWidth:NaN},{unitLength:0},{unitKind:'box'},{overlapWidthMm:1000},{overlapLengthMm:-1},{overlapWidthMm:.5},
  {overlapWidthMm:1},{wastePercent:50.001},{geometry:{kind:'rectangle',width:0,length:2,count:1,layers:1}},
  {geometry:{kind:'rectangle',width:2,length:3,count:1.5,layers:1}},{geometry:{kind:'area',area:2,layers:1.5}}])assert.throws(()=>calculateMaterial(material(invalid)));
for(let i=1;i<=250;i++){
  const input=material({geometry:{kind:'rectangle',width:(i%29+1)/10,length:(i%37+1)/10,count:i%4+1,layers:i%3+1},
    unitKind:i%2?'roll':'sheet',unitWidth:1.2,unitLength:2.4,overlapWidthMm:i%90,overlapLengthMm:i%75,extraArea:.3,wastePercent:i%21});
  const estimate=calculateMaterial(input),p=estimate.plan;
  assert(p.across*input.unitWidth-(p.across-1)*input.overlapWidthMm/1000+1e-10>=input.geometry.width,'layout covers full width');
  assert(p.along*input.unitLength-(p.along-1)*input.overlapLengthMm/1000+1e-10>=input.geometry.length,'layout covers full length');
  assert(p.cutArea+1e-10>=estimate.netArea,'cut stock covers net surface');
  assert(p.purchaseArea+1e-10>=p.cutArea+input.extraArea+p.reserveArea,'purchases cover cuts, extras and reserve');
  assert(p.totalUnits>=estimate.areaUnits,'feasible layout cannot beat the area lower bound');
  assert(p.unusedArea>=-1e-10);
  const rotated=calculateMaterial({...input,allowRotation:true});
  assert(rotated.plan.totalUnits<=p.totalUnits,'optional rotation cannot increase purchases');
}
console.log('PASS: roll/sheet quantities, cutting capacity, uncut stock, overlaps at millimetre boundaries, rotation, layers, invalid inputs and 250 material coverage invariants.');
