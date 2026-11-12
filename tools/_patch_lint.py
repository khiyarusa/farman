import io

# --- eslint ignores + Persian whitespace rule ------------------------------
p = "eslint.config.js"
s = io.open(p, encoding="utf-8").read()
s = s.replace("'tools/*.py', 'docs/**', '.agents/**'", "'tools/*.py', 'docs/**', '.agents/**', '.zwork/**'")
s = s.replace(
    "      eqeqeq: ['error', 'always'],",
    "      eqeqeq: ['error', 'always'],\n      'no-irregular-whitespace': ['error', { skipStrings: true, skipTemplates: true, skipComments: true, skipRegExps: true }],",
)
io.open(p, "w", encoding="utf-8", newline="").write(s)

# --- vehicle leftovers -----------------------------------------------------
p = "src/vehicles/vehicle.ts"
s = io.open(p, encoding="utf-8").read()
s = s.replace("const REFERENCE_LOAD_FACTOR = 1;\n", "")
s = s.replace("      let fx = fz > 0 ? tireLongitudinalForce(", "      const fx = fz > 0 ? tireLongitudinalForce(")
io.open(p, "w", encoding="utf-8", newline="").write(s)

# --- empty interface -------------------------------------------------------
p = "src/ui/ui.ts"
s = io.open(p, encoding="utf-8").read()
s = s.replace("export interface GameHost extends App {}", "export type GameHost = App;")
io.open(p, "w", encoding="utf-8", newline="").write(s)
print("lint fixes applied")
