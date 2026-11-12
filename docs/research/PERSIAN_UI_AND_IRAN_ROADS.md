# FARMAN — Iranian Road Environment & Persian (RTL) UI Reference

**Version** 1.0 · 2026-11-12 · Art direction, Persian strings, RTL contract, UI tokens.
**Tags:** `[P]` primary · `[V]` vendor/technical · `[F]` photographic · `[J]` art-direction judgement. Read §1 before modelling, §2 before a string, §3 before layout CSS.

---
## 1. Iranian road environment
### 1.1 Lane markings

Opposing flows are separated with **yellow**, same-direction lanes with **white** `[V]`. Paint is thermoplastic; on older mountain sections it is worn to 40–60 % opacity with a dark wear halo — model the wear, not a fresh stripe.

| Element | Form | Colour | Rule | Src |
|---|---|---|---|---|
| Centre line, two-way | single solid | yellow `#E4B23C` | no crossing or overtaking, both ways | [V] trafficsaz |
| Centre line, two-way | single broken | yellow | overtaking permitted when safe | [V] trafficsaz |
| Centre line, two-way | solid + broken pair | yellow | only the side with the **broken** line may overtake | [V] trafficsaz |
| Centre line, hazard | double solid | yellow | no crossing; bends, crests, tunnel approaches | [V] trafficsaz |
| Lane divider, same direction | broken | white `#EDEAE0` | lane change permitted | [V] dot.co.ir |
| Edge / shoulder line | solid | white | carriageway edge | [V] dot.co.ir |
| Stop line, zebra, arrows, bays | bar 30–40 cm; bars 45–50 cm with 60 cm gaps, parallel to travel | white | regulation / pedestrian priority | [V] dot.co.ir |

Scene scale `[J]`: line width 0.15 m; urban dash 3 m mark / 6 m gap; rural 4 / 8; freeway lane 3.65 m; urban lane 3.0–3.5 m.
### 1.2 Direction signs

Legal frame: INSO 14815-1 and 14815-2; Iran signed the Vienna Convention on 1968-11-08, ratified 1976-05-21 `[P]`. Shapes `[P]`: prohibitory = white disc with red ring; warning = white triangle with red ring; stop = red octagon with `ایست`; give-way = inverted triangle.

| Family | Field | Legend | Where |
|---|---|---|---|
| Freeway direction (آزادراه) | green `#0A5C3C` | white, 200–250 mm caps | Tehran–Shomal gantries and verge panels `[F]` |
| Main-road direction (جاده اصلی) | blue `#12508F` | white | Chalus, Haraz, urban arterials `[F]` |
| Warning / supplementary | white | black pictogram, red ring; black text | bends, rockfall, tunnel ahead, exceptions |

Panel composition, reconstructed — exact INSO grid not obtained, treat as art spec `[J]`:

```
┌────────────────────────────────────────────┐
│  چالوس      ۱۲      │  مرزن‌آباد     ۳۵    │  Persian line, reading right→left
│  Chālūs    12 km    │  Marzānābād   35 km  │  Latin line beneath, ~60 % size
└────────────────────────────────────────────┘
```

- Destination sits at the panel's right edge, distance immediately to its left; Persian line first and largest, Latin transliteration second, never primary `[F]`.
- Distances are bare numbers; `کیلومتر` appears only on small plates `[F]`. Route shield at the outer corner `[J]`.
- Freeway gantries: full-width green panel on lattice or tubular gantry, 5.5–6.0 m clearance, repeated ~1 km before a tunnel portal `[J]`.
- **Caveat:** the blue/green split is photographic, high confidence, not verified against INSO text (see §6).
### 1.3 Tehran–Shomal Freeway vs Chalus Road

| | Freeway 3 (آزادراه تهران–شمال) | Road 59 (جاده چالوس) |
|---|---|---|
| Class | controlled-access freeway, green signs | two-lane mountain road, blue signs |
| Character | tunnel–viaduct–tunnel, concrete portals, no at-grade access | cliff one side, river gorge the other, villages, trucks, checkpoints |
| Facts | Section 1: 32 km, 28 tunnels / 28.4 km, Talun 4,870 m, opened 2020-02-25. Section 2: 25 km, 20 tunnels, Alborz Tunnel 6,378 m, 2023. Section 4: 20 km, opened 2013-03. Section 3: 46 km, 92 tunnels, under construction `[P]` | Kandovan Tunnel (1938), one of Iran's first road tunnels `[P]` |

Art consequence: the freeway reads as light–dark alternation — glare, portal, 4–6 s of sodium/LED, glare. Tunnel walls carry exhaust staining at the crown and a dirty white kicker panel; lane lines continue inside. Chalus reads as continuous curvature under intermittent canopy shadow.
### 1.4 Barriers and retaining structures

| Type | Look | Use |
|---|---|---|
| W-beam steel guardrail | galvanised `#9BA1A3`, beam at 0.75 m, posts every 2 m, slight sag | valley edges, embankments, freeway verges `[J]` |
| Concrete New Jersey | 0.81 m high, 0.61 m base, `#B7B3A8` with grey streaks | freeway medians, tunnel approaches, parapets `[J]` |
| Stone / concrete retaining wall | coursed stone or board-formed concrete, weep holes, dark staining, moss | Mazandaran uphill side, village edges `[F]` |
| Rockfall mesh | galvanised mesh, anchor plates, draped rock cut | Chalus and Haraz cuttings `[F]` |
| Delineator post | 1 m white post, black band, red reflector | fog-prone rural edges `[J]` |

Iranian catalogues list guardrail (گاردریل), New Jersey (نیوجرسی), rumble strip (شیار لرزاننده) and road studs (گلمیخ / چشم گربه‌ای) as standard lines — correct furniture vocabulary `[V]`.
### 1.5 Roadside furniture

| Item | Form / colour | Placement |
|---|---|---|
| Lighting mast | 10–12 m tapered galvanised pole, single or twin arm, 4000 K LED; decorative twin-globe on old Tehran arterials | freeway 40–50 m, urban 25–30 m |
| Kilometre post (کیلومترنما) | white concrete or plastic, black km numeral, small green/blue plate on freeways | every 1 km, right shoulder |
| Police checkpoint (ایستگاه پلیس راه) | blue-and-white booth, flat canopy, cone taper, radar | before tunnels, province boundaries |
| Fuel station (پمپ بنزین) | white canopy with red band and NIOPDC branding, price totem, air/water point, shop | freeway exits, town entries |
| Tyre shop (لاستیک‌فروشی) | stacked tyres outside, hand-painted red/white board, roller shutter | urban kerbside, highway villages |
| Road cafe (قهوه‌خانه) | samovar, plastic chairs, kebab grill, tiled facade | Chalus and Haraz at springs |
| Billboard / speed camera | large Persian ad on lattice frame; grey cabinet on pole, warning sign 300 m ahead | approach embankments, arterials |

### 1.6 Urban streetscape

- 3–6 storey walk-ups: tan brick `#B0805E`, older red-brown `#8E5340`, concrete frames, glazed tile as accent; balconies with painted railings, many glazed in; rooftop water tanks, satellite dishes, AC units.
- Ground floor: Persian signboards, roller shutters, awnings, produce crates on the pavement, cars half on the kerb; plane trees (چنار) canopy on Valiasr, open water channel (jube) in older districts.
- Traffic mix Paykan, Pride, Samand, Saipa/Tiba, Peugeot 405/Pars, Chinese crossovers; plates `## X ### – NN`, province code squared at the right end under `ایران` `[P]`.
### 1.7 Caspian / Mazandaran scenery

The corridor crosses the **Hyrcanian forests** — ~55,000 km² of lowland and montane broadleaf along the Caspian's southern shore, UNESCO World Heritage since 2019 `[P]`. Read: closed broadleaf canopy (beech, hornbeam, oak, alder), fern and moss understory, seepage on rock cuts, fog banks around 1,200–2,000 m, wet asphalt with leaf litter in the gutter.

| Layer | Detail |
|---|---|
| Road | constant curvature, 6–7 m carriageway, guardrail valley-side, retaining wall uphill, drainage channel, springs crossing the road |
| Structures | short concrete river bridges, stone parapets, portal facings in tile or stone |
| Atmosphere | humidity haze, low cloud in the canopy, wet sheen, no dust |
| Settlement | galvanised sheet and tile roofs, tea gardens, roadside stalls with oranges and honey |

### 1.8 What to avoid

| Don't | Why | Do instead |
|---|---|---|
| Desert palette, palms, camels | most of the corridor is humid broadleaf and mountain | wet asphalt, fog, broadleaf canopy |
| Arabic letterforms `ي` `ك` | wrong orthography, reads as foreign instantly | Persian `ی` `ک` only |
| Latin-only or English-first signage | breaks immersion | Persian primary, Latin secondary |
| US furniture: yellow edge lines, wooden poles, school buses, mph, gallons | wrong convention set | white edge lines, steel/concrete poles, km/h, litres |
| Gulf glass towers, malls, lawns | not this corridor | brick walk-ups, low-rise, plane trees |
| Right-hand-drive vehicles | Iran drives on the right, LHD | LHD interiors |
| Autobahn-blue signs on the mountain road | wrong colour family for a main road | blue local / green freeway |
| Orientalist props: carpets in cars, oil derricks, turbans, Persepolis motifs on guardrails | stereotype, not street reality | ordinary modern Iranian daily life |
| Teal-orange postcard grade | cliché | neutral grey-green, low saturation |
| Fake Persian as texture gibberish | native players read it | real strings from §2 |
| Uniform pure-white LED night | unreal | mixed 3000–4000 K, pools of light, dark gaps |

### 1.9 Colour targets (sRGB, art direction `[J]`)

| Surface | Hex | Note |
|---|---|---|
| Asphalt | fresh `#2E3134` · worn `#3D4041` · wet `#202426` · patch `#26282A` | cool grey, polished wheel tracks |
| Concrete | `#B7B3A8` · stained `#8F8C83` | sun-bleached; tunnel portals |
| Soil / shoulder | dry `#8B6B4E` · dust `#B6A489` · gravel `#6E6255` | settles on guardrails and signs |
| Foliage | deep `#2C4726` · mid `#41602F` · lit `#5E7F3A` · fog `#C9D2CE` | desaturated green-grey haze |
| Brick | tan `#B0805E` · old red `#8E5340` · glazed tile `#3C7F8C` | tile as accent only |
| Signage | green `#0A5C3C` · blue `#12508F` · white `#F4F2EA` | legend slightly warm, never pure white |
| Markings | white `#EDEAE0` · yellow `#E4B23C` | |
| Metal / livery | galvanised `#9BA1A3` · police blue `#1B4F8A` · NIOPDC red `#C8102E` | |

---
## 2. Persian automotive terminology

Ship these as strings, not as translations. Column 2 gives the sense an Iranian driver attaches to the word.

| فارسی | English |
|---|---|
| سرعت | speed |
| کیلومترشمار | speedometer (also odometer) |
| دور موتور | RPM / tachometer ("engine revs") |
| دنده | gear (also gearbox in speech) |
| خلاص | neutral |
| دنده عقب | reverse |
| کلاچ | clutch |
| ترمز | brake |
| گاز | accelerator (the pedal; گاز دادن = to accelerate) |
| ترمز دستی | handbrake / parking brake (formal: ترمز پارک) |
| فرمان | steering wheel (also "command") |
| لاستیک | tyre |
| باد لاستیک | tyre pressure (literally "tyre air") |
| بنزین | fuel / petrol |
| دمای آب | engine temperature (coolant, آب رادیاتور) |
| سرویس دوره‌ای | scheduled service |
| تعمیر | repair |
| تعمیرگاه | garage / workshop |
| رنگ | paint (body colour) |
| رینگ | rims (alloy wheel) |
| اسب بخار | horsepower |
| گشتاور | torque |
| اتوماتیک | automatic |
| دنده‌ای (دستی) | manual |
| CVT | CVT |
| گیربکس | transmission / gearbox |
| رانندگی آزاد | free drive |
| تنظیمات | settings |
| صدا | volume |
| کیفیت گرافیک | graphics quality |
| کنترل‌ها | controls |
| حساسیت فرمان | steering sensitivity |
| فرمان چپ / فرمان راست | left-hand drive / right-hand drive |
| شروع دوباره | restart |
| ادامه | resume |
| مکث | pause |
| خروج | exit |
| ذخیره | save |
| بارگذاری | load |
| امتیاز | score |
| زمان | time |
| جریمه | penalty |
| رد شدن | fail (a test or stage) |
| موفقیت | success |
| پارک | parking |
| حرکت در سربالایی | hill start |
| جاده خیس | wet road |
| ترمز ضد قفل (ABS) | ABS |
| کنترل کشش (TCS) | traction control |
| کنترل پایداری (ESC) | stability control |
| خسارت | damage |
| کارکرد | mileage / odometer reading |
| پلاک | licence plate (formal: شماره پلاک) |

Register rules: `مأموریت` never means transmission — "mission" maps to **گیربکس**. Drivers say `دور موتور` not `تاکومتر`, `باد لاستیک` not `فشار تایر`, `خلاص` though the dash may show `N`. Formal-neutral for menus (`تنظیمات`, `خروج`), colloquial only for tutorial voice (`کلاچ رو بیار بالا`). No Arabic `ي`/`ك`; use ZWNJ (U+200C) where the word needs it (`می‌روم`, `دنده‌ای`).

---
## 3. RTL implementation notes
### 3.1 Document direction

```html
<html lang="fa" dir="rtl">
```

`dir` "sets the element's base text direction and directionally isolates its contents from surrounding text"; omitting it "does not enable automatic direction detection" and defaults to LTR `[P]`. Set it on `<html>` once, override only on LTR islands. `lang="fa"` drives glyph choice and line-breaking.
### 3.2 Logical properties

| Physical (wrong here) | Logical (use) |
|---|---|
| `margin-left/right` | `margin-inline-start/end` |
| `padding-left/right` | `padding-inline-start/end` |
| `left/right` (positioned) | `inset-inline-start/end` |
| `width` | `inline-size` |
| `border-top-left-radius` | `border-start-start-radius` |
| `text-align: right` | `text-align: start` |
| `float: left` | `float: inline-start` |

MDN defines these as flow-relative equivalents of `top/bottom/left/right` (`block-start`, `inline-start`, …) `[P]`. One rule covers both directions; no `[dir="rtl"]` override blocks to maintain.
### 3.3 Bidi isolation

- Wrap Latin-only runs in `<bdi>` or `dir="ltr"` + `unicode-bidi: isolate`: `ABS`, `TCS`, `CVT`, model names, `205/55 R16`, URLs, paths.
- `<bdi>` behaves "as if `dir="auto"` were set" and isolates its content `[P]` — right for player names, save titles; last resort LRM U+200E / RLM U+200F, FSI U+2068 / PDI U+2069 in plain-text exports.
- **Persian digits are bidi class EN**, not AN — verified: `unicodedata.bidirectional('۱') == 'EN'` while Arabic-Indic `٠` is `AN`. `۱۲۰` therefore behaves like a Latin number in RTL text: an LTR island. A trailing `٪` (class ET) or a Latin unit can reorder around it — isolate the whole value+unit pair.
- A full stop after a Latin run attaches to the Latin run, not the Persian sentence; keep the Persian stop inside the Persian run.
### 3.4 The digit decision

| Context | Digits | Why |
|---|---|---|
| Player-facing UI: speed, RPM, gear, fuel, time, score | Persian `۰۱۲۳۴۵۶۷۸۹` | mixed scripts read as broken |
| Tyre size, displacement, model/engine codes, VIN | Latin | physically Latin on the car and in catalogues |
| Gear knob engraving | Latin `1 2 3 4 5 R` | as manufactured; dashboard stays Persian |
| Timers | Persian, tabular | one script in the HUD |

Format in JS with `Intl.NumberFormat('fa-IR')`; do not rely on the font. Vazirmatn ships separate `Farsi-Digits` builds precisely because the standard build keeps Latin digits — documented as "all Latin and Arabic digits replaced with Persian" `[P]`. Ship the standard build so Latin spec strings still render; convert per string in code.
### 3.5 Persian punctuation

| Mark | Code point | Use |
|---|---|---|
| `،` `؛` `؟` | U+060C / U+061B / U+061F | comma, semicolon, question mark (semicolon and question are class AL, inherit RTL) |
| `٪` | U+066A | percent — class ET, keep tight to the number |
| `«»` `…` | U+00AB / U+00BB, U+2026 | quotes; ellipsis sits at the line's left end in RTL |
| `٫` `٬` | U+066B / U+066C | decimal and thousands separators (official; Iranian print often uses `/`) |

Pick one decimal separator and enforce it in the string table; mixing `٫` and `/` on one screen reads as machine translation.
### 3.6 Parentheses, slashes, ranges

- Parentheses **mirror automatically**. Never swap the characters by hand — that double-mirrors into `)ABS(`.
- A Latin-only parenthetical still needs isolation: `ترمز (<bdi>ABS</bdi>)`.
- `/` has no mirroring; `روشن/خاموش` breaks at line ends — prefer `روشن یا خاموش`, or `white-space: nowrap`.
- Ranges: `۸۰ تا ۱۲۰` reads unambiguously; `۸۰–۱۲۰` can flip. Paths and URLs always `dir="ltr"`.
### 3.7 Why `text-align: right` alone is wrong

Alignment moves glyphs; it does not set the **base direction** the bidi algorithm resolves against. With an LTR base and right alignment, neutrals (spaces, `:`, `.`) follow LTR rules, a line starting with a number can push it to the wrong end, list markers and ellipsis stay physically left, `flex-row` order is unaffected, and `start`/`end` still mean left/right. MDN's framing is the right model: "The start of a line is not always the left side of a line" `[P]`.
### 3.8 Vazirmatn settings

- Family `Vazirmatn`, **OFL-1.1**, release 33.003 `[P]`; `Vazirmatn UI` cut where vertical metrics must be tight.
- Weights 400 / 500 / 700 / 800 only; no synthetic bold or italic — Arabic script has no italic and browser slant is visibly wrong.
- `font-feature-settings: "liga" 1, "calt" 1;` keeps cursive joining; `letter-spacing: 0` always — tracking breaks joins. `font-variant-numeric: tabular-nums` for live readouts so digits do not jitter; verify the build carries `tnum` for Persian digits, else fix box width in `ch`.
### 3.9 Size and leading

Reference: 2400 × 1080 landscape at DPR 3 → **800 × 360 CSS px**. Author in CSS px; at device px divide by 3.

| Need | CSS px | Device px @3× |
|---|---|---|
| Absolute minimum (non-essential captions) | 12 | 36 |
| Minimum body / menu row | 14 | 42 |
| Comfortable body | 16 | 48 |
| Body line-height / single-line numerals / 12 px captions | 1.75 / 1.2–1.3 / 1.9 | — |

Persian needs ~+1 px over Latin at equal weight to read as the same size `[J]`, and more leading: deep descenders (`ی`, `ج`, `ع`) plus stacked diacritics. 1.4 (a common Latin default) crowds or clips; treat 1.7–1.8 as the floor for multi-line Persian.
### 3.10 Ten RTL bugs to test

| # | Test | Correct behaviour |
|---|---|---|
| 1 | Fuel / temperature bar at 50 % | depletes toward the **right** (start = right) |
| 2 | Volume slider at max | knob at the **left** end; dragging left increases |
| 3 | "Back" control | chevron points **right** |
| 4 | `ترمز (ABS)` | renders `ترمز (ABS)`, never `)ABS(` |
| 5 | Sentence ending in a Latin word + `.` | Persian stop ends the sentence, not glued to Latin |
| 6 | `۱۲۰ کیلومتر` in a 120 px column | number and unit never split across lines |
| 7 | Badge with `left: -6px` | lands on the **inline-start** corner after mirroring |
| 8 | Long save title truncation | ellipsis at the **left**, title start still visible |
| 9 | Scrollable list opening | starts at the **right** edge; `scrollLeft` handled |
| 10 | Canvas HUD vs DOM text | same direction and alignment; set `ctx.direction = "rtl"` before `fillText`, or draw Persian via DOM overlay |

Also regression-test a spec table (tyre size, power, torque): `dir="ltr"` on the numeric cell, not the row.

---
## 4. Type scale and design system
### 4.1 Type scale (CSS px, DPR 3)

| Token | Size | Device px | Line-height | Weight | Use |
|---|---|---|---|---|---|
| `caption` | 12 | 36 | 20 | 400 | units, legal line, metadata |
| `body-sm` | 14 | 42 | 24 | 400/500 | menu rows, list items |
| `body` | 16 | 48 | 28 | 400 | paragraphs, tutorial |
| `title` | 20 | 60 | 32 | 600 | panel headers |
| `display` | 28 | 84 | 40 | 700 | screen titles, stage name |
| `hero` | 40 | 120 | 48 | 700 | primary metric |
| `numeral` | 64 | 192 | 68 | 800 | speed readout, tabular |

### 4.2 Spacing, radius, elevation

| Token | Value | Use |
|---|---|---|
| `space-1…8` | 2 / 4 / 8 / 12 / 16 / 24 / 32 / 48 | 4-pt grid; 48 = landscape gutter |
| `radius-1…6` | 2 / 4 / 8 / 12 / 16 / 24 | 8 cards, 12 panels, 16 modals, 24 pills; `999` circular |
| `elev-1/2/3` | `0 1px 2px rgba(0,0,0,.45)` / `0 4px 12px rgba(0,0,0,.50)` / `0 12px 32px rgba(0,0,0,.55)` | rows / cards / modals |
| `scrim` | `rgba(4,7,6,.72)` + 8 px backdrop blur | behind modal |

### 4.3 Surfaces and palette

| Token | Hex | Role |
|---|---|---|
| `bg-void` / `bg-base` | `#070A09` / `#0C1110` | letterbox / app background |
| `surf-1` / `surf-2` / `surf-3` | `#141A18` / `#1B2320` / `#232C28` | cards / HUD plate / modal |
| `border` | `#2E3833` | 1 px hairlines |
| `text-hi` / `text-mid` / `text-low` | `#F3F6F4` / `#AEB9B4` / `#87928D` | primary / secondary / tertiary |
| `silver` | `#C6CDC9` | metallic labels, dividers |
| `green-fill` / `green-text` / `green-deep` | `#2FA37F` / `#5FD3AE` / `#17614C` | primary fill / accent text and focus / pressed fill |
| `amber` / `danger` | `#F0B429` / `#F26D6D` | warning / destructive, penalty |

Measured contrast (WCAG 2.1; 4.5:1 body, 3:1 large `[P]`):

| Foreground | `bg-base` | `surf-1` | `surf-2` | `surf-3` |
|---|---|---|---|---|
| `text-hi` | 17.49 | 16.21 | 14.76 | 13.20 |
| `text-mid` | 9.42 | 8.73 | 7.95 | 7.11 |
| `text-low` | 5.92 | 5.48 | 4.99 | **4.46 ✗** |
| `green-text` | 10.35 | 9.59 | 8.73 | 7.81 |
| `amber` | 10.21 | 9.46 | 8.61 | 7.70 |
| `danger` | 6.51 | 6.03 | 5.49 | 4.91 |
| `silver` | 11.76 | 10.90 | 9.92 | 8.87 |

Fill rules, measured: white `#F3F6F4` on `green-fill` = **2.90 ✗** — never white on green. Near-black `#0C1110` on `green-fill` = **6.04 ✓**. White on `green-deep` = **6.77 ✓**. WCAG does not round (4.499 fails); keep `text-low` off `surf-3` or bump it to `#8F9A95`.
### 4.4 HUD rules

- HUD plate `surf-2` at 82 % opacity with 1 px `border`; never raw gameplay pixels without a scrim.
- Numerals: Persian, tabular, `numeral` token; units in `caption` at `text-low`, same baseline group.
- Every icon gets a Persian label on first run, icon-only after the tutorial; 48 px minimum hit area, 56 px while driving. Motion 120–180 ms `ease-out`, no bounce on safety indicators (ABS, ESC, damage).

---
## 5. Reference photographs

Wikimedia Commons, licence-safe for reference; check each file page before redistribution.

| # | Subject | File page | Author | Licence |
|---|---|---|---|---|
| 1 | Tehran–Shomal Freeway, gantry and cut slope | [Tehran-Shomal Freeway.jpg](https://commons.wikimedia.org/wiki/File:Tehran-Shomal_Freeway.jpg) | Telluride749 | CC BY-SA 3.0 |
| 2 | Tehran–Shomal Freeway, tunnel approach | [Tehran-Shomal Freeway (3).jpg](https://commons.wikimedia.org/wiki/File:Tehran-Shomal_Freeway_(3).jpg) | Telluride749 | CC BY-SA 4.0 |
| 3 | Chalus Road — cliff and guardrail | [Chalus Road, Mazandaran (3015269883).jpg](https://commons.wikimedia.org/wiki/File:Chalus_Road,_Mazandaran_Province,_Iran_(3015269883).jpg) | Ninara | CC BY 2.0 |
| 4 | Old Chalus Road — narrow two-lane, canopy | [Old Chalus Road (3016108920).jpg](https://commons.wikimedia.org/wiki/File:Old_Chalus_Road,_Mazandaran,_Iran_(3016108920).jpg) | Ninara | CC BY 2.0 |
| 5 | Heyran road, Hyrcanian forest | [Gilan, Iran - 11314195416.jpg](https://commons.wikimedia.org/wiki/File:Gilan,_Iran_-_11314195416.jpg) | Ninara | CC BY 2.0 |
| 6 | Baladeh–Royan road, Caspian panorama | [Royan road.jpg](https://commons.wikimedia.org/wiki/File:Royan_road.jpg) | Alireza Javaheri | CC BY 3.0 |
| 7 | Valiasr St. — plane trees, facades | [Valiasr St. - Tehran.jpg](https://commons.wikimedia.org/wiki/File:Valiasr_St._-_Tehran.jpg) | Ali Hadadi Asl | CC BY 4.0 |
| 8 | Hakim Expressway traffic, Milad Tower | [Traffic in Tehran (1403711760).jpg](https://commons.wikimedia.org/wiki/File:Traffic_in_Tehran._(1403711760).jpg) | Siavash Sam Anvari | CC BY 2.0 |
| 9 | Tehran petrol station | [Young Man in Petrol Station (7383385294).jpg](https://commons.wikimedia.org/wiki/File:Young_Man_in_Petrol_Station_-_Tehran_-_Iran_(7383385294).jpg) | Adam Jones | CC BY-SA 2.0 |
| 10 | Valiasr St. shopfront, signage, awning | [A shop on Valiasr Street (24964315725).jpg](https://commons.wikimedia.org/wiki/File:A_shop_on_Valiasr_Street,_Tehran,_Iran_(24964315725).jpg) | Simon Inns | CC BY 2.0 |

Blocking notes: #3 and #4 are the two Chalus characters (open cliff road vs closed canopy); #1–#2 the freeway's concrete-and-green-sign vocabulary; #7 and #10 facade rhythm and shopfront depth; #9 forecourt lighting and clutter.

---
## 6. Open items

Blue/green sign fields: photographic, high confidence, **no clause text** — check INSO 14815-2 or a fabricator sheet. Panel grid, legend sizes, route shield: not obtained — INSO annex plus high-res photo survey. `tnum` coverage for Persian digits: unverified — render `۱۱۱۱`/`۸۸۸۸` and measure advances. BRT lane colour, checkpoint layout, speed limits by class: inferred — street survey, driving-code text.

## Sources

- Markings — [trafficsaz](https://trafficsaz.com/yellow-line-middle-road/) · [dot.co.ir](https://dot.co.ir/رنگ-ترافیکی-زرد-یا-سفید/)
- Signs, INSO 14815-1/-2, Vienna dates — [fa.wikipedia](https://fa.wikipedia.org/wiki/نشان‌های_راهنمایی_و_رانندگی_در_ایران) · [en.wikipedia](https://en.wikipedia.org/wiki/Road_signs_in_Iran)
- Roads, landscape, plates — [Tehran–Shomal](https://en.wikipedia.org/wiki/Tehran-Shomal_Freeway) · [Chalus Road](https://en.wikipedia.org/wiki/Chalus_Road) · [Hyrcanian forests](https://en.wikipedia.org/wiki/Hyrcanian_forests) · [plates](https://en.wikipedia.org/wiki/Vehicle_registration_plates_of_Iran)
- RTL — [MDN dir](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir) · [logical properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values)
- Type, contrast, licence — [Vazirmatn](https://rastikerdar.github.io/vazirmatn/fa/docs) · [OFL-1.1](https://github.com/rastikerdar/vazirmatn/blob/master/LICENSE) · [W3C 1.4.3](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
