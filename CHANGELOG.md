# 0.10.0 - September 5, 2026
- **Breaking**: The package moved to the `@kabukisolutions` scope. It is now published as
  `@kabukisolutions/patrika`; `@akshat1/patrika` receives no further releases. Update your
  imports and point the new scope at the GitHub Packages registry:
  `echo "@kabukisolutions:registry=https://npm.pkg.github.com" >> .npmrc`
- The repository moved from `github.com/akshat1/patrika` to `github.com/kabukisolutions/patrika`.
- **Breaking**: The `@akshat1/js-logger` dependency likewise moved, and is now
  `@kabukisolutions/js-logger` at `^4.0.0` (up from `^3.0.0`). Its public API is unchanged;
  4.0.0 fixes circular-reference detection so that values repeated in sibling positions are
  no longer logged as `"[Circular]"`.
- Removed a redundant `console.error` in the build worker's error handler. It worked around
  the logger dropping an error passed as a non-first argument, which no longer happens.
- Dropped `.npmrc` from the published `files` list. npm strips `.npmrc` when packing, and a
  dependency's own `.npmrc` is never consulted during a consumer's install, so the entry had
  no effect. Consumers configure the scope in their own `.npmrc`, as the README describes.
- Fixed the test runner discovering each test twice. `tsc` compiles `src/**/*.test.ts` into
  `lib/` alongside the sources, and the bare `node --test` then found both the TypeScript
  originals and their compiled copies, so a run after a build reported 34 tests where a clean
  checkout reported 17. The `test` script now passes an explicit, quoted `"src/**/*.test.ts"`
  glob, which Node expands itself; `lib/` is never scanned. Test files are still compiled and
  still ship inside the package, which keeps them type-checked by `npm run build`.
- CI now type-checks. The workflow ran only ESLint and the test suite; ESLint does not check
  types and `tsx` strips them without checking, so a genuine type error could pass CI green.
  Added a build step, which type-checks sources and tests alike.

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
