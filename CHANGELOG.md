# 0.9.0 - August 26, 2026
- **Breaking**: Removed built-in LESS support. The `lessDir` property is gone from
  `RunnerConfiguration`; ship CSS via `staticAssets` and run any preprocessor as a
  separate step. (#14)
- Added `--port` / `-p` flag for the live dev server; a port that is already in use now
  produces a one-line error instead of a crash with a stack trace. (#13)
- README corrections: examples now match the current API, and installation instructions
  point at the GitHub Packages registry.

# 0.1.0 - November 5, 2022
- Added markdown to HTML rendering.
- Added custom marked extensions to handle `[PostData]` and `[PostLink]` tags.
- Set up unit testing with mocha, sinon, nyc etc.
