# Construction products and quantity estimates

Added 2026-11-09. Existing catalogue IDs and saved request formats are retained.

## Catalogue

Seven product families use the existing cards, gallery, detail pages, comparison, quote basket, validation and sitemap:

- `PB-TWINE`: plastic tying twine (the owner's intended meaning of “سیم پلاستیکی”).
- `PB-ROPE`: twisted plastic rope.
- `RF-DRILL`: washer-head self-drilling roofing screws for metal substructures.
- `RF-TIMBER`: washer-head roofing screws for timber substructures.
- `RF-PANEL`: long sandwich-panel screws.
- `EPS-SHEET`: expanded-polystyrene sheets.
- `EPS-ROOF`: joist/Chromite roof infill blocks.

Photos illustrate product families, not a claim about an offered brand or available stock. Original image URLs, page URLs, dimensions and SHA-256 hashes are in `new-product-image-sources.json`. Selected photos were copied without visual editing. The technical descriptions do not transfer a pictured manufacturer's certifications or performance to a future supplied product.

## Arithmetic

Valid calculator results can be reviewed in the product form and added to the existing quote basket. The surface calculators use the cutting-plan purchase count when available, then the pipe cut plan, then the area minimum. Square-metre catalogue items receive purchase area rounded up to the form's 0.1 m² order increment; rolls, sheets, coils and individual fasteners retain their own order units. Missing dimensions, an impossible one-piece cut, or a quantity outside the online order range cannot be submitted through this shortcut. The customer still reviews thickness and specifications before adding the estimate; no order is sent automatically.

The new calculator functions are in `lib/accessory-estimate.ts`. Entered lengths use integer millimetres and percentages use thousandths of a percent. Inputs reject non-finite values, fractional counts, dimensions beyond supported ranges and more than three decimal places.

- Twine/rope: count measured ties, count ties along measured routes at a supplied maximum spacing (including both endpoints), or enter groups of continuous cuts. Add knot/end allowance once per piece. Show the linear-length lower bound and a separate feasible unspliced cut plan. Full-piece reserve is rounded separately for each length group. Different length groups are packed separately; global nesting and joining short tails are not assumed. Optional free extra length may use uncut tails; continuous extras belong in the cut groups instead.
- Screws: count sheets × supports per sheet × screws per sheet/support, or sum regularly spaced fixing rows including both endpoints. Add only uncounted special fixings, then reserve rounded to whole screws, then complete sales packs. Different fastener types must be measured independently. The tool does not prescribe structural spacing, screw sizes or connection capacity.
- EPS sheets: reuse the existing exact roll/sheet area and grid layout engine. Actual sheet dimensions, layer counts and optional 90-degree rotation are user inputs. A grid layout is feasible, not globally optimal nesting; sheet offcuts are not reused.
- Roof blocks: sum `row repetition × ceil(clear run length / effective block length)` independently for each uninterrupted run. Show final piece lengths and total unused end lengths. Openings, solid strips and transverse members split or shorten the entered runs. Reserve and packs are added after the row count. Block width, seating, height and technical compliance are checked against the project details, not inferred from floor area.

## Checks

`node scripts/test-calculator.mjs` includes the new deterministic examples, millimetre boundaries, invalid inputs and 200 coverage/packaging invariants, alongside the existing roll and sheet suites. The browser review uses isolated preview data and covers new product pages, image loading, filters, inquiries, calculator methods, query entry points, Persian digits, mobile layouts and accessibility. No live requests are created by the preview review.
