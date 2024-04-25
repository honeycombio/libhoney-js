# libhoney-js changelog

## [4.3.0] - 2024-04-25

### Maintenance

- maint: Update ubuntu image in workflows to latest (#409) | @MikeGoldsmith
- maint: Add labels to release.yml for auto-generated grouping (#408) | @JamieDanielson
- maint(deps): bump formidable and superagent (#414) | @dependabot
- maint(deps): bump ip from 1.1.8 to 1.1.9 (#413) | @dependabot
- maint(deps-dev): bump @babel/preset-env from 7.22.9 to 7.24.4 (#415) | @dependabot
- maint(deps-dev): bump @babel/traverse from 7.22.8 to 7.24.1 (#412) | @dependabot
- maint(deps-dev): bump @rollup/plugin-node-resolve from 15.1.0 to 15.2.3 (#402) | @dependabot
- maint(deps-dev): bump @rollup/plugin-commonjs from 25.0.3 to 25.0.7 (#401) | @dependabot
- maint(deps-dev): bump babel-jest from 29.6.2 to 29.7.0 (#398) | @dependabot
- maint(deps-dev): bump jest from 29.5.0 to 29.7.0 (#399) | @dependabot

## [4.2.0] - 2024-02-28

### Enhancements

- feat: support classic ingest keys (#406) | [@cewkrupa](https://github.com/cewkrupa)

### Maintenance

- maint: update codeowners to pipeline-team (#405) | [@JamieDanielson](https://github.com/JamieDanielson)
- maint: update codeowners to pipeline (#404) | [@JamieDanielson](https://github.com/JamieDanielson)

## [4.1.0] - 2023-08-17

### Fixes

- fix: replace superagent-proxy with direct use of proxy-agent (#389) | [@robbkidd](https://github.com/robbkidd)
  - Note: This resolves a security vulnerability in transitive dependency vm2 (CVE-2023-37466)

### Maintenance

- maint: extra test to check for http info from proxy (#390) | [@JamieDanielson](https://github.com/JamieDanielson)
- docs: add development.md (#374) | [@vreynolds](https://github.com/vreynolds)
- maint: add smoke test (#383) | [@vreynolds](https://github.com/vreynolds)
- maint(deps-dev): bump eslint from 8.24.0 to 8.46.0 (#387)
- maint(deps-dev): bump @rollup/plugin-commonjs from 25.0.2 to 25.0.3 (#385)
- maint(deps-dev): bump @babel/preset-env from 7.22.5 to 7.22.9 (#386)
- maint(deps-dev): bump babel-jest from 29.5.0 to 29.6.2 (#384)
- maint(deps-dev): bump prettier from 2.8.7 to 3.0.0 (#388)
- maint(deps-dev): bump @babel/core from 7.20.12 to 7.22.9 (#382)
- maint(deps-dev): bump @rollup/plugin-node-resolve from 15.0.1 to 15.1.0 (#376)
- maint(deps-dev): bump @rollup/plugin-commonjs from 24.0.1 to 25.0.2 (#377)
- maint(deps-dev): bump @babel/preset-env from 7.21.4 to 7.22.5 (#378)
- maint(deps): bump word-wrap from 1.2.3 to 1.2.4 (#381)
- maint(deps): bump superagent from 8.0.2 to 8.0.9 (#365)
- maint(deps): bump semver from 6.3.0 to 6.3.1 (#379)
- maint(deps-dev): bump @babel/eslint-parser from 7.19.1 to 7.21.8 (#370)
- maint(deps): bump vm2 from 3.9.17 to 3.9.18 (#369)
- maint(deps-dev): bump jest from 29.1.2 to 29.5.0 (#366)
- maint(deps-dev): bump rollup from 2.79.0 to 3.20.2 (#358)
- maint(deps-dev): bump @babel/preset-env from 7.19.3 to 7.21.4 (#357)
- maint(deps): bump vm2 from 3.9.16 to 3.9.17 (#361)
- maint(deps-dev): bump prettier from 2.7.1 to 2.8.7 (#355)
- maint(deps-dev): bump babel-jest from 29.3.1 to 29.5.0 (#356)
- maint(deps-dev): bump @rollup/plugin-commonjs from 24.0.0 to 24.0.1 (#348)
- maint(deps): bump vm2 from 3.9.15 to 3.9.16 (#360)
- maint(deps): bump vm2 from 3.9.11 to 3.9.15 (#359)
- maint(deps): bump cookiejar from 2.1.3 to 2.1.4 (#345)

## [4.0.1] - 2023-01-19

### Fixes

- Use url-join instead of urljoin (#342) [@adamsmasher](https://github.com/adamsmasher)

### Maintenance

- Add new project workflow (#321) | [@vreynolds](https://github.com/vreynolds)
- Delete workflows for old board (#323) | [@vreynolds](https://github.com/vreynolds)
- Add release file (#322) | [@vreynolds](https://github.com/vreynolds)
- Update dependabot title with semantic commit format (#336) | [@pkanal](https://github.com/pkanal)
- Update validate PR title workflow (#330) | [@pkanal](https://github.com/pkanal)
- Validate PR title (#329) | [@pkanal](https://github.com/pkanal)

### Dependencies

- Bump json5 from 2.2.1 to 2.2.3 (#341)
- Bump qs and formidable (#335)
- Bump babel-jest from 29.1.2 to 29.3.1 (#333)
- Bump @rollup/plugin-json from 4.1.0 to 6.0.0 (#337)
- Bump @rollup/plugin-replace from 4.0.0 to 5.0.2 (#338)
- Bump @rollup/plugin-commonjs from 22.0.2 to 24.0.0 (#339)
- Bump @babel/core from 7.19.3 to 7.20.12 (#343)
- Bump @rollup/plugin-node-resolve from 14.1.0 to 15.0.1 (#325)
- Bump eslint from 8.23.1 to 8.24.0 (#320)
- Bump @babel/core from 7.19.0 to 7.19.3 (#319)
- Bump superagent from 8.0.0 to 8.0.2 (#318)
- Bump @babel/eslint-parser from 7.18.9 to 7.19.1 (#317)
- Bump @babel/preset-env from 7.19.0 to 7.19.3 (#316)
- Bump jest from 29.0.3 to 29.1.2 (#315)
- Bump babel-jest from 29.0.3 to 29.1.2 (#313)
- Bump vm2 from 3.9.7 to 3.9.11 (#312)


## [4.0.0] - 2022-09-19

### !!! Breaking Changes !!!

- Drop Node v12, no longer security supported (#308) | [@emilyashley](https://github.com/emilyashley)

### Maintenance

- Set circleCI Node default to latest v16 (#310) | [@emilyashley](https://github.com/emilyashley)

## [3.1.2] - 2022-09-13

### Maintenance

- Add node version to the user-agent header (#299) | [@emilyashley](https://github.com/emilyashley)
- Bump eslint from 8.17.0 to 8.23.1 (#300)
- Bump @babel/core from 7.18.2 to 7.19.0 (#301)
- Bump @rollup/plugin-node-resolve from 13.3.0 to 14.1.0 (#302)
- Bump @babel/preset-env from 7.18.10 to 7.19.0 (#303)
- Bump @babel/eslint-parser from 7.18.2 to 7.18.9 (#305)

## [3.1.1] - 2022-04-27

### Bug fixes

- Update tests to properly terminate (#255) | [@kentquirk](https://github.com/kentquirk)
- Handle `null` transmission in `flush` (#253) | [@sjchmiela](https://github.com/sjchmiela)

### Maintenance
- maint: remove unused script (#252) | [@vreynolds](https://github.com/vreynolds)
- Bump @rollup/plugin-commonjs from 21.0.1 to 21.0.3 (#248)
- Bump @babel/preset-env from 7.16.8 to 7.16.11 (#229)
- Bump superagent from 7.0.2 to 7.1.2 (#240)
- Bump @babel/core from 7.16.12 to 7.17.9 (#245)
- Bump @babel/eslint-parser from 7.16.5 to 7.17.0 (#251)
- Bump prettier from 2.5.1 to 2.6.2 (#250)
- Bump eslint from 8.6.0 to 8.13.0 (#249)
- Bump @rollup/plugin-replace from 3.0.1 to 4.0.0 (#247)

## [3.1.0] - 2022-04-07

### Enhancements

- Add support for environments (#244) | [@kentquirk](https://github.com/kentquirk)
- ci: add node 17 to test matrix (#195) | [@vreynolds](https://github.com/vreynolds)
- empower apply-labels action to apply labels (#205) | [@robbkidd](https://github.com/robbkidd)

### Maintenance

- gh: add re-triage workflow (#215) | [@vreynolds](https://github.com/vreynolds)
- Update dependabot.yml (#212) | [@vreynolds](https://github.com/vreynolds)
- Bump @babel/core to 7.16.12 (#230)
- Bump @babel/eslint-parser to 7.16.5 (#223)
- Bump @babel/preset-env to 7.16.8 (#224)
- Bump @rollup/plugin-commonjs to 21.0.1 (#197)
- Bump @rollup/plugin-node-resolve to 13.1.3 (#225)
- Bump @rollup/plugin-replace to 3.0.1 (#216)
- Bump eslint to 8.6.0 (#227)
- Bump minimist to 2.5.1 (#220)
- Bump superagent from 6.1.0 to 7.0.2 (#226)
- Bump vm2 to 3.9.7 (#234)

## [3.0.0] - 2021-10-18

### !!! Breaking Changes !!!

- drop node 8 (#188) | [@vreynolds](https://github.com/vreynolds)

### Maintenance

- Change maintenance badge to maintained (#186) | [@JamieDanielson](https://github.com/JamieDanielson)
- Adds Stalebot (#187) | [@JamieDanielson](https://github.com/JamieDanielson)
- Bump prettier from 2.4.0 to 2.4.1 (#184)
- Bump tmpl from 1.0.4 to 1.0.5 (#185)

## [2.3.3] - 2021-09-16

### Maintenance

- Bump prettier from 2.3.2 to 2.4.0 (#182)
- Bump @babel/preset-env from 7.15.0 to 7.15.6 (#181)
- Bump @babel/core from 7.15.0 to 7.15.5 (#179)
- Bump husky from 7.0.1 to 7.0.2 (#176)
- Bump superagent-proxy from 2.1.0 to 3.0.0 (#178)
- Bump path-parse from 1.0.6 to 1.0.7 (#174)
- Add note about dropping Node 8 in future (#177)
- Add issue and PR templates (#175)
- Add OSS lifecycle badge (#173)
- Add community health files (#172)

## [2.3.2] - 2021-08-10

### Fixes

- Remove yarn engine constraint introduced in v2.3.1 that prevented downstream
  projects from using yarn. (#170) | [@markandrus](https://github.com/markandrus)

## [2.3.1] - 2021-08-09

### Maintenance

- Add node 16 to test matrix (#135)
- Include all the test names when testing in CI (#125)
- Switch from yarn to npm (#117)
- Bump eslint from 6.5.1 to 7.25.0 (#122)
- Bump lint-staged from 11.0.0 to 11.1.2 (#165)
- Bump @babel/preset-env from 7.14.5 to 7.15.0 (#167)
- Bump @babel/core from 7.14.6 to 7.15.0 (#166)
- Bump eslint from 7.29.0 to 7.32.0 (#164)
- Bump husky from 6.0.0 to 7.0.1 (#157)
- Bump prettier from 2.3.1 to 2.3.2 (#150)
- Bump @babel/core from 7.14.5 to 7.14.6 (#149)
- Bump @babel/preset-env from 7.13.15 to 7.14.5 (#145)
- Bump eslint from 7.28.0 to 7.29.0 (#148)
- Bump @babel/core from 7.14.2 to 7.14.5 (#146)
- Bump prettier from 1.19.1 to 2.3.1 (#144)
- Bump ws from 5.2.2 to 5.2.3 (#147)
- Bump eslint from 7.26.0 to 7.28.0 (#142)
- Bump lint-staged from 7.3.0 to 11.0.0 (#132)
- Bump browserslist from 4.16.4 to 4.16.6 (#136)
- Bump eslint from 7.25.0 to 7.26.0 (#129)
- Bump @babel/core from 7.13.15 to 7.14.2 (#130)
- Bump superagent from 3.8.3 to 6.1.0 (#105)

## [2.3.0] - 2021-04-28

### Enhancements

- add "stdout" transmission implementation (#119) | [@jharley](https://github.com/jharley)

### Fixed

- fix npm publish (#110) | [@vreynolds](https://github.com/vreynolds)

### Maintenance

- Bump y18n from 4.0.0 to 4.0.1 (#113)

## [2.2.2] - 2021-03-18

### Fixed

- Improve transmission unit tests (#91) | [@DavidS](https://github.com/DavidS)
- Use doc comment for WriterTransmission deprecation (#92) | [@DavidS](https://github.com/DavidS)
- Change Builder.addDynamicField to match addField and docs (#89) | [@DavidS](https://github.com/DavidS)

### Maintenance

- Bump @babel/core from 7.6.4 to 7.13.10 (#100)
- Bump @babel/preset-env from 7.6.3 to 7.13.10 (#99)
- Bump handlebars from 4.4.5 to 4.7.6 (#81)
- Bump ini from 1.3.5 to 1.3.8 (#82)
- Bump lodash from 4.17.15 to 4.17.20 (#83)
- Bump yargs-parser from 13.1.1 to 13.1.2 (#84)
