# libhoney-js changelog

## [3.1.1] - 2022-04-27

### Bug fixes

- ab689a8 Update tests to properly terminate (#255) | [@kentquirk](https://github.com/kentquirk)
- 79e0c56 Handle `null` transmission in `flush` (#253) | [@sjchmiela](https://github.com/sjchmiela)

### Maintenance
- 987d519 maint: remove unused script (#252)
- acfe0f4 Bump @rollup/plugin-commonjs from 21.0.1 to 21.0.3 (#248)
- 177a17b Bump @babel/preset-env from 7.16.8 to 7.16.11 (#229)
- 6c39532 Bump superagent from 7.0.2 to 7.1.2 (#240)
- 0712ae3 Bump @babel/core from 7.16.12 to 7.17.9 (#245)
- 9e4f698 Bump @babel/eslint-parser from 7.16.5 to 7.17.0 (#251)
- 9d35dd4 Bump prettier from 2.5.1 to 2.6.2 (#250)
- bf1a996 Bump eslint from 8.6.0 to 8.13.0 (#249)
- e6aa53f Bump @rollup/plugin-replace from 3.0.1 to 4.0.0 (#247)


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
