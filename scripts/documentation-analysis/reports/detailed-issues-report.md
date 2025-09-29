# Detailed Documentation Issues Report

Generated on: 29/09/2025, 17:05:23

This report provides specific details about broken references and outdated commands in each file.

## Summary

- **Files Analyzed**: 14
- **Total Broken References**: 73
- **Total Outdated Commands**: 309

## Detailed Issues by File

### docs/reference/command-reference.md

**Action Required**: update-commands
**Total Issues**: 267 (0 broken references, 267 outdated commands)

#### Outdated Commands (267)

- **Line 49**: `npm run local:emergency-stop`
  - **Command**: `local:emergency-stop`
  - **Issue**: Command does not exist

- **Line 64**: `npm run logs:start`
  - **Command**: `logs:start`
  - **Suggested Fix**: `npm run local:start`
  - **Issue**: Command deprecated, use suggestion

- **Line 65**: `npm run logs:view`
  - **Command**: `logs:view`
  - **Issue**: Command does not exist

- **Line 66**: `npm run logs:backend`
  - **Command**: `logs:backend`
  - **Suggested Fix**: `npm run local:logs:backend`
  - **Issue**: Command deprecated, use suggestion

- **Line 67**: `npm run logs:frontend`
  - **Command**: `logs:frontend`
  - **Suggested Fix**: `npm run dev:frontend`
  - **Issue**: Command deprecated, use suggestion

- **Line 68**: `npm run logs:errors`
  - **Command**: `logs:errors`
  - **Issue**: Command does not exist

- **Line 81**: `npm run dev:hot-reload`
  - **Command**: `dev:hot-reload`
  - **Issue**: Command does not exist

- **Line 146**: `npm run validate-enhanced`
  - **Command**: `validate-enhanced`
  - **Issue**: Command does not exist

- **Line 147**: `npm run validate:complete`
  - **Command**: `validate:complete`
  - **Issue**: Command does not exist

- **Line 197**: `npm run enhanced-integration-test`
  - **Command**: `enhanced-integration-test`
  - **Issue**: Command does not exist

- **Line 198**: `npm run final-validation`
  - **Command**: `final-validation`
  - **Issue**: Command does not exist

- **Line 199**: `npm run integration-test`
  - **Command**: `integration-test`
  - **Issue**: Command does not exist

- **Line 200**: `npm run manage`
  - **Command**: `manage`
  - **Issue**: Command does not exist

- **Line 201**: `npm run migrate`
  - **Command**: `migrate`
  - **Issue**: Command does not exist

- **Line 202**: `npm run monitor`
  - **Command**: `monitor`
  - **Suggested Fix**: `npm run local:monitor`
  - **Issue**: Command deprecated, use suggestion

- **Line 203**: `npm run reset`
  - **Command**: `reset`
  - **Suggested Fix**: `npm run local:reset`
  - **Issue**: Command deprecated, use suggestion

- **Line 204**: `npm run selective`
  - **Command**: `selective`
  - **Issue**: Command does not exist

- **Line 205**: `npm run sync`
  - **Command**: `sync`
  - **Issue**: Command does not exist

- **Line 206**: `npm run test-utilities`
  - **Command**: `test-utilities`
  - **Issue**: Command does not exist

- **Line 207**: `npm run validate-enhanced`
  - **Command**: `validate-enhanced`
  - **Issue**: Command does not exist

- **Line 216**: `npm run test`
  - **Command**: `test`
  - **Issue**: Command does not exist

- **Line 217**: `npm run test:watch`
  - **Command**: `test:watch`
  - **Issue**: Command does not exist

- **Line 218**: `npm run test:coverage`
  - **Command**: `test:coverage`
  - **Issue**: Command does not exist

- **Line 220**: `npm run test:integration:watch`
  - **Command**: `test:integration:watch`
  - **Suggested Fix**: `npm run test:integration:data`
  - **Issue**: Command deprecated, use suggestion

- **Line 221**: `npm run test:cross-page`
  - **Command**: `test:cross-page`
  - **Issue**: Command does not exist

- **Line 224**: `npm run test:accessibility`
  - **Command**: `test:accessibility`
  - **Issue**: Command does not exist

- **Line 225**: `npm run test:responsive`
  - **Command**: `test:responsive`
  - **Issue**: Command does not exist

- **Line 226**: `npm run test:theme`
  - **Command**: `test:theme`
  - **Suggested Fix**: `npm run test:e2e`
  - **Issue**: Command deprecated, use suggestion

- **Line 227**: `npm run test:visual`
  - **Command**: `test:visual`
  - **Suggested Fix**: `npm run test:e2e:visual`
  - **Issue**: Command deprecated, use suggestion

- **Line 231**: `npm run test:e2e:headed`
  - **Command**: `test:e2e:headed`
  - **Suggested Fix**: `npm run test:e2e:headless`
  - **Issue**: Command deprecated, use suggestion

- **Line 233**: `npm run test:e2e:ui`
  - **Command**: `test:e2e:ui`
  - **Suggested Fix**: `npm run test:e2e`
  - **Issue**: Command deprecated, use suggestion

- **Line 236**: `npm run test:e2e:all-coverage`
  - **Command**: `test:e2e:all-coverage`
  - **Issue**: Command does not exist

- **Line 237**: `npm run test:e2e:execution`
  - **Command**: `test:e2e:execution`
  - **Suggested Fix**: `npm run test:e2e:integration`
  - **Issue**: Command deprecated, use suggestion

- **Line 238**: `npm run test:e2e:full-suite`
  - **Command**: `test:e2e:full-suite`
  - **Issue**: Command does not exist

- **Line 239**: `npm run test:e2e:orchestrator`
  - **Command**: `test:e2e:orchestrator`
  - **Suggested Fix**: `npm run test:e2e:integration`
  - **Issue**: Command deprecated, use suggestion

- **Line 240**: `npm run test:e2e:report`
  - **Command**: `test:e2e:report`
  - **Suggested Fix**: `npm run test:e2e:setup`
  - **Issue**: Command deprecated, use suggestion

- **Line 241**: `npm run test:e2e:runner`
  - **Command**: `test:e2e:runner`
  - **Issue**: Command does not exist

- **Line 245**: `npm run test:e2e:accessibility`
  - **Command**: `test:e2e:accessibility`
  - **Issue**: Command does not exist

- **Line 246**: `npm run test:e2e:theme`
  - **Command**: `test:e2e:theme`
  - **Suggested Fix**: `npm run test:e2e:clean`
  - **Issue**: Command deprecated, use suggestion

- **Line 247**: `npm run test:e2e:responsive`
  - **Command**: `test:e2e:responsive`
  - **Issue**: Command does not exist

- **Line 248**: `npm run test:e2e:comprehensive`
  - **Command**: `test:e2e:comprehensive`
  - **Issue**: Command does not exist

- **Line 249**: `npm run test:e2e:portfolio`
  - **Command**: `test:e2e:portfolio`
  - **Suggested Fix**: `npm run test:e2e:workflows`
  - **Issue**: Command deprecated, use suggestion

- **Line 250**: `npm run test:e2e:auth`
  - **Command**: `test:e2e:auth`
  - **Suggested Fix**: `npm run test:e2e:setup`
  - **Issue**: Command deprecated, use suggestion

- **Line 251**: `npm run test:e2e:search`
  - **Command**: `test:e2e:search`
  - **Suggested Fix**: `npm run test:e2e:setup`
  - **Issue**: Command deprecated, use suggestion

- **Line 252**: `npm run test:e2e:errors`
  - **Command**: `test:e2e:errors`
  - **Suggested Fix**: `npm run test:e2e:workflows`
  - **Issue**: Command deprecated, use suggestion

- **Line 255**: `npm run test:comprehensive`
  - **Command**: `test:comprehensive`
  - **Issue**: Command does not exist

- **Line 256**: `npm run test:comprehensive:execution`
  - **Command**: `test:comprehensive:execution`
  - **Issue**: Command does not exist

- **Line 257**: `npm run test:comprehensive:orchestrator`
  - **Command**: `test:comprehensive:orchestrator`
  - **Issue**: Command does not exist

- **Line 258**: `npm run test:comprehensive:core`
  - **Command**: `test:comprehensive:core`
  - **Issue**: Command does not exist

- **Line 259**: `npm run test:comprehensive:search`
  - **Command**: `test:comprehensive:search`
  - **Issue**: Command does not exist

- **Line 260**: `npm run test:comprehensive:portfolio`
  - **Command**: `test:comprehensive:portfolio`
  - **Issue**: Command does not exist

- **Line 261**: `npm run test:comprehensive:auth`
  - **Command**: `test:comprehensive:auth`
  - **Issue**: Command does not exist

- **Line 262**: `npm run test:comprehensive:errors`
  - **Command**: `test:comprehensive:errors`
  - **Issue**: Command does not exist

- **Line 263**: `npm run test:comprehensive:dark`
  - **Command**: `test:comprehensive:dark`
  - **Issue**: Command does not exist

- **Line 264**: `npm run test:comprehensive:mobile`
  - **Command**: `test:comprehensive:mobile`
  - **Issue**: Command does not exist

- **Line 265**: `npm run test:comprehensive:headed`
  - **Command**: `test:comprehensive:headed`
  - **Issue**: Command does not exist

- **Line 266**: `npm run test:comprehensive:debug`
  - **Command**: `test:comprehensive:debug`
  - **Issue**: Command does not exist

- **Line 269**: `npm run test:ui-audit`
  - **Command**: `test:ui-audit`
  - **Issue**: Command does not exist

- **Line 270**: `npm run test:ui-audit:visual`
  - **Command**: `test:ui-audit:visual`
  - **Issue**: Command does not exist

- **Line 271**: `npm run test:ui-audit:accessibility`
  - **Command**: `test:ui-audit:accessibility`
  - **Issue**: Command does not exist

- **Line 272**: `npm run test:ui-audit:theme`
  - **Command**: `test:ui-audit:theme`
  - **Issue**: Command does not exist

- **Line 273**: `npm run test:ui-audit:responsive`
  - **Command**: `test:ui-audit:responsive`
  - **Issue**: Command does not exist

- **Line 276**: `npm run baselines:update`
  - **Command**: `baselines:update`
  - **Issue**: Command does not exist

- **Line 277**: `npm run baselines:validate`
  - **Command**: `baselines:validate`
  - **Suggested Fix**: `npm run seed:validate`
  - **Issue**: Command deprecated, use suggestion

- **Line 284**: `npm run test`
  - **Command**: `test`
  - **Issue**: Command does not exist

- **Line 285**: `npm run test:watch`
  - **Command**: `test:watch`
  - **Issue**: Command does not exist

- **Line 286**: `npm run test:coverage`
  - **Command**: `test:coverage`
  - **Issue**: Command does not exist

- **Line 289**: `npm run test:ci`
  - **Command**: `test:ci`
  - **Suggested Fix**: `npm run test:e2e`
  - **Issue**: Command deprecated, use suggestion

- **Line 314**: `npm run test:debug`
  - **Command**: `test:debug`
  - **Suggested Fix**: `npm run test:e2e:debug`
  - **Issue**: Command deprecated, use suggestion

- **Line 315**: `npm run test:headless`
  - **Command**: `test:headless`
  - **Suggested Fix**: `npm run test:e2e:headless`
  - **Issue**: Command deprecated, use suggestion

- **Line 316**: `npm run test:visual`
  - **Command**: `test:visual`
  - **Suggested Fix**: `npm run test:e2e:visual`
  - **Issue**: Command deprecated, use suggestion

- **Line 317**: `npm run test:workflows`
  - **Command**: `test:workflows`
  - **Suggested Fix**: `npm run test:e2e:workflows`
  - **Issue**: Command deprecated, use suggestion

- **Line 324**: `npm run test:studio`
  - **Command**: `test:studio`
  - **Suggested Fix**: `npm run reset-studios`
  - **Issue**: Command deprecated, use suggestion

- **Line 325**: `npm run test:studio:unit`
  - **Command**: `test:studio:unit`
  - **Issue**: Command does not exist

- **Line 326**: `npm run test:studio:integration`
  - **Command**: `test:studio:integration`
  - **Suggested Fix**: `npm run test:e2e:integration`
  - **Issue**: Command deprecated, use suggestion

- **Line 327**: `npm run test:studio:relationships`
  - **Command**: `test:studio:relationships`
  - **Suggested Fix**: `npm run manage-studio-relationships`
  - **Issue**: Command deprecated, use suggestion

- **Line 328**: `npm run test:studio:health`
  - **Command**: `test:studio:health`
  - **Suggested Fix**: `npm run studio-health`
  - **Issue**: Command deprecated, use suggestion

- **Line 329**: `npm run test:studio:cli`
  - **Command**: `test:studio:cli`
  - **Issue**: Command does not exist

- **Line 330**: `npm run test:studio:data`
  - **Command**: `test:studio:data`
  - **Suggested Fix**: `npm run test:integration:data`
  - **Issue**: Command deprecated, use suggestion

- **Line 331**: `npm run test:studio:frontend`
  - **Command**: `test:studio:frontend`
  - **Issue**: Command does not exist

- **Line 332**: `npm run test:studio:coverage`
  - **Command**: `test:studio:coverage`
  - **Suggested Fix**: `npm run test:integration:coverage`
  - **Issue**: Command deprecated, use suggestion

- **Line 333**: `npm run test:studio:watch`
  - **Command**: `test:studio:watch`
  - **Issue**: Command does not exist

- **Line 336**: `npm run studio-health:comprehensive`
  - **Command**: `studio-health:comprehensive`
  - **Issue**: Command does not exist

- **Line 337**: `npm run studio-health:quick`
  - **Command**: `studio-health:quick`
  - **Suggested Fix**: `npm run studio-health`
  - **Issue**: Command deprecated, use suggestion

- **Line 338**: `npm run studio-health:relationships`
  - **Command**: `studio-health:relationships`
  - **Issue**: Command does not exist

- **Line 339**: `npm run studio-health:images`
  - **Command**: `studio-health:images`
  - **Suggested Fix**: `npm run studio-health`
  - **Issue**: Command deprecated, use suggestion

- **Line 340**: `npm run studio-health:addresses`
  - **Command**: `studio-health:addresses`
  - **Issue**: Command does not exist

- **Line 343**: `npm run studio:dev-setup`
  - **Command**: `studio:dev-setup`
  - **Issue**: Command does not exist

- **Line 344**: `npm run studio:quick-test`
  - **Command**: `studio:quick-test`
  - **Issue**: Command does not exist

- **Line 345**: `npm run studio:full-test`
  - **Command**: `studio:full-test`
  - **Issue**: Command does not exist

- **Line 352**: `npm run test:all`
  - **Command**: `test:all`
  - **Suggested Fix**: `npm run test:e2e`
  - **Issue**: Command deprecated, use suggestion

- **Line 353**: `npm run test:comprehensive`
  - **Command**: `test:comprehensive`
  - **Issue**: Command does not exist

- **Line 354**: `npm run test:final-integration`
  - **Command**: `test:final-integration`
  - **Suggested Fix**: `npm run test:integration`
  - **Issue**: Command deprecated, use suggestion

- **Line 355**: `npm run test:frontend-sync-errors`
  - **Command**: `test:frontend-sync-errors`
  - **Issue**: Command does not exist

- **Line 356**: `npm run test:frontend-sync-errors:verbose`
  - **Command**: `test:frontend-sync-errors:verbose`
  - **Issue**: Command does not exist

- **Line 357**: `npm run test:monitoring`
  - **Command**: `test:monitoring`
  - **Issue**: Command does not exist

- **Line 360**: `npm run test:unit`
  - **Command**: `test:unit`
  - **Issue**: Command does not exist

- **Line 361**: `npm run test:unit:backend`
  - **Command**: `test:unit:backend`
  - **Issue**: Command does not exist

- **Line 362**: `npm run test:unit:coverage`
  - **Command**: `test:unit:coverage`
  - **Suggested Fix**: `npm run test:integration:coverage`
  - **Issue**: Command deprecated, use suggestion

- **Line 363**: `npm run test:unit:frontend`
  - **Command**: `test:unit:frontend`
  - **Issue**: Command does not exist

- **Line 364**: `npm run test:unit:scripts`
  - **Command**: `test:unit:scripts`
  - **Issue**: Command does not exist

- **Line 376**: `npm run monitor:localstack`
  - **Command**: `monitor:localstack`
  - **Suggested Fix**: `npm run local:logs:localstack`
  - **Issue**: Command deprecated, use suggestion

- **Line 377**: `npm run monitor:health`
  - **Command**: `monitor:health`
  - **Issue**: Command does not exist

- **Line 378**: `npm run monitor:report`
  - **Command**: `monitor:report`
  - **Issue**: Command does not exist

- **Line 379**: `npm run monitor:reset`
  - **Command**: `monitor:reset`
  - **Issue**: Command does not exist

- **Line 382**: `npm run monitor:comprehensive:comprehensive`
  - **Command**: `monitor:comprehensive:comprehensive`
  - **Issue**: Command does not exist

- **Line 383**: `npm run monitor:validate`
  - **Command**: `monitor:validate`
  - **Suggested Fix**: `npm run config:validate`
  - **Issue**: Command deprecated, use suggestion

- **Line 384**: `npm run monitor:status`
  - **Command**: `monitor:status`
  - **Issue**: Command does not exist

- **Line 385**: `npm run monitor:config`
  - **Command**: `monitor:config`
  - **Issue**: Command does not exist

- **Line 386**: `npm run monitor:config:reset`
  - **Command**: `monitor:config:reset`
  - **Issue**: Command does not exist

- **Line 387**: `npm run monitor:dashboard`
  - **Command**: `monitor:dashboard`
  - **Issue**: Command does not exist

- **Line 388**: `npm run monitor:health-advanced`
  - **Command**: `monitor:health-advanced`
  - **Issue**: Command does not exist

- **Line 389**: `npm run monitor:health-continuous`
  - **Command**: `monitor:health-continuous`
  - **Issue**: Command does not exist

- **Line 390**: `npm run monitor:environment`
  - **Command**: `monitor:environment`
  - **Issue**: Command does not exist

- **Line 391**: `npm run monitor:environment-continuous`
  - **Command**: `monitor:environment-continuous`
  - **Issue**: Command does not exist

- **Line 398**: `npm run performance:monitor`
  - **Command**: `performance:monitor`
  - **Issue**: Command does not exist

- **Line 399**: `npm run performance:monitor:continuous`
  - **Command**: `performance:monitor:continuous`
  - **Issue**: Command does not exist

- **Line 400**: `npm run performance:monitor:startup`
  - **Command**: `performance:monitor:startup`
  - **Issue**: Command does not exist

- **Line 401**: `npm run performance:resources`
  - **Command**: `performance:resources`
  - **Issue**: Command does not exist

- **Line 402**: `npm run performance:resources:once`
  - **Command**: `performance:resources:once`
  - **Issue**: Command does not exist

- **Line 403**: `npm run performance:benchmark`
  - **Command**: `performance:benchmark`
  - **Issue**: Command does not exist

- **Line 404**: `npm run performance:benchmark:quick`
  - **Command**: `performance:benchmark:quick`
  - **Issue**: Command does not exist

- **Line 405**: `npm run performance:dashboard`
  - **Command**: `performance:dashboard`
  - **Issue**: Command does not exist

- **Line 406**: `npm run performance:export`
  - **Command**: `performance:export`
  - **Issue**: Command does not exist

- **Line 407**: `npm run performance:demo`
  - **Command**: `performance:demo`
  - **Issue**: Command does not exist

- **Line 408**: `npm run performance:test`
  - **Command**: `performance:test`
  - **Issue**: Command does not exist

- **Line 411**: `npm run optimize:startup`
  - **Command**: `optimize:startup`
  - **Issue**: Command does not exist

- **Line 412**: `npm run optimize:startup:benchmark`
  - **Command**: `optimize:startup:benchmark`
  - **Issue**: Command does not exist

- **Line 413**: `npm run optimize:cache`
  - **Command**: `optimize:cache`
  - **Issue**: Command does not exist

- **Line 414**: `npm run optimize:cache:analyze`
  - **Command**: `optimize:cache:analyze`
  - **Issue**: Command does not exist

- **Line 421**: `npm run alerts:test`
  - **Command**: `alerts:test`
  - **Issue**: Command does not exist

- **Line 424**: `npm run test:monitoring`
  - **Command**: `test:monitoring`
  - **Issue**: Command does not exist

- **Line 433**: `npm run dev:mock-data`
  - **Command**: `dev:mock-data`
  - **Issue**: Command does not exist

- **Line 434**: `npm run dev:mock-dataset`
  - **Command**: `dev:mock-dataset`
  - **Issue**: Command does not exist

- **Line 435**: `npm run dev:mock-artists`
  - **Command**: `dev:mock-artists`
  - **Issue**: Command does not exist

- **Line 436**: `npm run dev:mock-search`
  - **Command**: `dev:mock-search`
  - **Issue**: Command does not exist

- **Line 437**: `npm run dev:mock-errors`
  - **Command**: `dev:mock-errors`
  - **Issue**: Command does not exist

- **Line 440**: `npm run dev:error-tester`
  - **Command**: `dev:error-tester`
  - **Issue**: Command does not exist

- **Line 441**: `npm run dev:test-errors`
  - **Command**: `dev:test-errors`
  - **Issue**: Command does not exist

- **Line 442**: `npm run dev:list-scenarios`
  - **Command**: `dev:list-scenarios`
  - **Issue**: Command does not exist

- **Line 443**: `npm run dev:activate-error`
  - **Command**: `dev:activate-error`
  - **Issue**: Command does not exist

- **Line 444**: `npm run dev:deactivate-errors`
  - **Command**: `dev:deactivate-errors`
  - **Issue**: Command does not exist

- **Line 447**: `npm run dev:debug-logger`
  - **Command**: `dev:debug-logger`
  - **Issue**: Command does not exist

- **Line 448**: `npm run dev:debug-test`
  - **Command**: `dev:debug-test`
  - **Issue**: Command does not exist

- **Line 449**: `npm run dev:debug-export`
  - **Command**: `dev:debug-export`
  - **Issue**: Command does not exist

- **Line 452**: `npm run dev:advanced`
  - **Command**: `dev:advanced`
  - **Issue**: Command does not exist

- **Line 453**: `npm run dev:advanced:stop`
  - **Command**: `dev:advanced:stop`
  - **Issue**: Command does not exist

- **Line 454**: `npm run dev:advanced:restart`
  - **Command**: `dev:advanced:restart`
  - **Issue**: Command does not exist

- **Line 455**: `npm run dev:advanced:status`
  - **Command**: `dev:advanced:status`
  - **Issue**: Command does not exist

- **Line 456**: `npm run dev:advanced:health`
  - **Command**: `dev:advanced:health`
  - **Issue**: Command does not exist

- **Line 463**: `npm run debug:start`
  - **Command**: `debug:start`
  - **Issue**: Command does not exist

- **Line 464**: `npm run debug:backend`
  - **Command**: `debug:backend`
  - **Suggested Fix**: `npm run dev:backend`
  - **Issue**: Command deprecated, use suggestion

- **Line 465**: `npm run debug:frontend`
  - **Command**: `debug:frontend`
  - **Suggested Fix**: `npm run dev:frontend`
  - **Issue**: Command deprecated, use suggestion

- **Line 474**: `npm run validate:cross-platform`
  - **Command**: `validate:cross-platform`
  - **Issue**: Command does not exist

- **Line 475**: `npm run validate:parity`
  - **Command**: `validate:parity`
  - **Suggested Fix**: `npm run validate-data`
  - **Issue**: Command deprecated, use suggestion

- **Line 476**: `npm run validate:production-parity`
  - **Command**: `validate:production-parity`
  - **Issue**: Command does not exist

- **Line 477**: `npm run validate:deployment`
  - **Command**: `validate:deployment`
  - **Issue**: Command does not exist

- **Line 478**: `npm run validate:readiness`
  - **Command**: `validate:readiness`
  - **Suggested Fix**: `npm run validate-studios`
  - **Issue**: Command deprecated, use suggestion

- **Line 479**: `npm run validate:all`
  - **Command**: `validate:all`
  - **Suggested Fix**: `npm run validate-data`
  - **Issue**: Command deprecated, use suggestion

- **Line 480**: `npm run validate`
  - **Command**: `validate`
  - **Suggested Fix**: `npm run seed:validate`
  - **Issue**: Command deprecated, use suggestion

- **Line 487**: `npm run security:validate`
  - **Command**: `security:validate`
  - **Suggested Fix**: `npm run seed:validate`
  - **Issue**: Command deprecated, use suggestion

- **Line 488**: `npm run security:validate-env`
  - **Command**: `security:validate-env`
  - **Issue**: Command does not exist

- **Line 489**: `npm run security:validate-network`
  - **Command**: `security:validate-network`
  - **Issue**: Command does not exist

- **Line 490**: `npm run security:validate-access`
  - **Command**: `security:validate-access`
  - **Issue**: Command does not exist

- **Line 491**: `npm run security:scan-images`
  - **Command**: `security:scan-images`
  - **Issue**: Command does not exist

- **Line 494**: `npm run security:fix`
  - **Command**: `security:fix`
  - **Issue**: Command does not exist

- **Line 495**: `npm run security:configure`
  - **Command**: `security:configure`
  - **Issue**: Command does not exist

- **Line 496**: `npm run security:monitor`
  - **Command**: `security:monitor`
  - **Issue**: Command does not exist

- **Line 497**: `npm run security:report`
  - **Command**: `security:report`
  - **Issue**: Command does not exist

- **Line 498**: `npm run security:template`
  - **Command**: `security:template`
  - **Issue**: Command does not exist

- **Line 499**: `npm run security:sanitize`
  - **Command**: `security:sanitize`
  - **Issue**: Command does not exist

- **Line 500**: `npm run security:configure-network`
  - **Command**: `security:configure-network`
  - **Issue**: Command does not exist

- **Line 501**: `npm run security:configure-access`
  - **Command**: `security:configure-access`
  - **Issue**: Command does not exist

- **Line 504**: `npm run local:start:secure`
  - **Command**: `local:start:secure`
  - **Suggested Fix**: `npm run local:start:unix`
  - **Issue**: Command deprecated, use suggestion

- **Line 513**: `npm run ci:test`
  - **Command**: `ci:test`
  - **Suggested Fix**: `npm run docs:test`
  - **Issue**: Command deprecated, use suggestion

- **Line 514**: `npm run ci:validate`
  - **Command**: `ci:validate`
  - **Suggested Fix**: `npm run docs:validate`
  - **Issue**: Command deprecated, use suggestion

- **Line 515**: `npm run ci:setup`
  - **Command**: `ci:setup`
  - **Issue**: Command does not exist

- **Line 516**: `npm run ci:test-integration`
  - **Command**: `ci:test-integration`
  - **Suggested Fix**: `npm run test:integration`
  - **Issue**: Command deprecated, use suggestion

- **Line 517**: `npm run ci:test-config`
  - **Command**: `ci:test-config`
  - **Issue**: Command does not exist

- **Line 518**: `npm run ci:status`
  - **Command**: `ci:status`
  - **Suggested Fix**: `npm run local:status`
  - **Issue**: Command deprecated, use suggestion

- **Line 519**: `npm run ci:local-workflow`
  - **Command**: `ci:local-workflow`
  - **Issue**: Command does not exist

- **Line 526**: `npm run build`
  - **Command**: `build`
  - **Issue**: Command does not exist

- **Line 527**: `npm run build:analyze`
  - **Command**: `build:analyze`
  - **Issue**: Command does not exist

- **Line 528**: `npm run fix:build`
  - **Command**: `fix:build`
  - **Issue**: Command does not exist

- **Line 529**: `npm run validate:build`
  - **Command**: `validate:build`
  - **Suggested Fix**: `npm run validate-studios`
  - **Issue**: Command deprecated, use suggestion

- **Line 530**: `npm run deploy:prep`
  - **Command**: `deploy:prep`
  - **Issue**: Command does not exist

- **Line 539**: `npm run dev`
  - **Command**: `dev`
  - **Issue**: Command does not exist

- **Line 540**: `npm run start`
  - **Command**: `start`
  - **Suggested Fix**: `npm run local:start`
  - **Issue**: Command deprecated, use suggestion

- **Line 541**: `npm run build`
  - **Command**: `build`
  - **Issue**: Command does not exist

- **Line 542**: `npm run test`
  - **Command**: `test`
  - **Issue**: Command does not exist

- **Line 543**: `npm run lint`
  - **Command**: `lint`
  - **Issue**: Command does not exist

- **Line 544**: `npm run clean`
  - **Command**: `clean`
  - **Suggested Fix**: `npm run local:clean`
  - **Issue**: Command deprecated, use suggestion

- **Line 547**: `npm run test`
  - **Command**: `test`
  - **Issue**: Command does not exist

- **Line 548**: `npm run test:watch`
  - **Command**: `test:watch`
  - **Issue**: Command does not exist

- **Line 549**: `npm run test:coverage`
  - **Command**: `test:coverage`
  - **Issue**: Command does not exist

- **Line 550**: `npm run lint`
  - **Command**: `lint`
  - **Issue**: Command does not exist

- **Line 551**: `npm run clean`
  - **Command**: `clean`
  - **Suggested Fix**: `npm run local:clean`
  - **Issue**: Command deprecated, use suggestion

- **Line 552**: `npm run package`
  - **Command**: `package`
  - **Issue**: Command does not exist

- **Line 555**: `npm run setup`
  - **Command**: `setup`
  - **Issue**: Command does not exist

- **Line 556**: `npm run test`
  - **Command**: `test`
  - **Issue**: Command does not exist

- **Line 558**: `npm run info`
  - **Command**: `info`
  - **Issue**: Command does not exist

- **Line 559**: `npm run state-manager`
  - **Command**: `state-manager`
  - **Issue**: Command does not exist

- **Line 560**: `npm run incremental-processor`
  - **Command**: `incremental-processor`
  - **Issue**: Command does not exist

- **Line 561**: `npm run update-data`
  - **Command**: `update-data`
  - **Suggested Fix**: `npm run validate-data`
  - **Issue**: Command deprecated, use suggestion

- **Line 562**: `npm run upload-images`
  - **Command**: `upload-images`
  - **Issue**: Command does not exist

- **Line 565**: `npm run setup`
  - **Command**: `setup`
  - **Issue**: Command does not exist

- **Line 566**: `npm run test`
  - **Command**: `test`
  - **Issue**: Command does not exist

- **Line 567**: `npm run clean`
  - **Command**: `clean`
  - **Suggested Fix**: `npm run local:clean`
  - **Issue**: Command deprecated, use suggestion

- **Line 570**: `npm run test`
  - **Command**: `test`
  - **Issue**: Command does not exist

- **Line 571**: `npm run test:setup`
  - **Command**: `test:setup`
  - **Suggested Fix**: `npm run test:e2e:setup`
  - **Issue**: Command deprecated, use suggestion

- **Line 572**: `npm run test:cleanup`
  - **Command**: `test:cleanup`
  - **Suggested Fix**: `npm run local:cleanup`
  - **Issue**: Command deprecated, use suggestion

- **Line 573**: `npm run test:api`
  - **Command**: `test:api`
  - **Suggested Fix**: `npm run test:e2e`
  - **Issue**: Command deprecated, use suggestion

- **Line 574**: `npm run test:data`
  - **Command**: `test:data`
  - **Suggested Fix**: `npm run reset-data`
  - **Issue**: Command deprecated, use suggestion

- **Line 582**: `npm run build`
  - **Command**: `build`
  - **Issue**: Command does not exist

- **Line 583**: `npm run test`
  - **Command**: `test`
  - **Issue**: Command does not exist

- **Line 593**: `npm run docs:consolidate-duplicates`
  - **Command**: `docs:consolidate-duplicates`
  - **Suggested Fix**: `npm run docs:consolidate`
  - **Issue**: Command deprecated, use suggestion

- **Line 594**: `npm run docs:create-missing`
  - **Command**: `docs:create-missing`
  - **Issue**: Command does not exist

- **Line 595**: `npm run docs:delete-duplicates`
  - **Command**: `docs:delete-duplicates`
  - **Issue**: Command does not exist

- **Line 596**: `npm run docs:file-mapping`
  - **Command**: `docs:file-mapping`
  - **Issue**: Command does not exist

- **Line 597**: `npm run docs:fix-consolidated-links`
  - **Command**: `docs:fix-consolidated-links`
  - **Issue**: Command does not exist

- **Line 598**: `npm run docs:fix-outdated`
  - **Command**: `docs:fix-outdated`
  - **Issue**: Command does not exist

- **Line 599**: `npm run docs:gap-analysis`
  - **Command**: `docs:gap-analysis`
  - **Issue**: Command does not exist

- **Line 601**: `npm run docs:generate-foundation`
  - **Command**: `docs:generate-foundation`
  - **Suggested Fix**: `npm run docs:generate`
  - **Issue**: Command deprecated, use suggestion

- **Line 602**: `npm run docs:health-summary`
  - **Command**: `docs:health-summary`
  - **Issue**: Command does not exist

- **Line 603**: `npm run docs:pipeline`
  - **Command**: `docs:pipeline`
  - **Issue**: Command does not exist

- **Line 604**: `npm run docs:pipeline:dry-run`
  - **Command**: `docs:pipeline:dry-run`
  - **Issue**: Command does not exist

- **Line 608**: `npm run docs:validate-foundation`
  - **Command**: `docs:validate-foundation`
  - **Suggested Fix**: `npm run docs:validate`
  - **Issue**: Command deprecated, use suggestion

- **Line 615**: `npm run analyze`
  - **Command**: `analyze`
  - **Issue**: Command does not exist

- **Line 616**: `npm run consolidate`
  - **Command**: `consolidate`
  - **Suggested Fix**: `npm run docs:consolidate`
  - **Issue**: Command deprecated, use suggestion

- **Line 617**: `npm run consolidate-duplicates`
  - **Command**: `consolidate-duplicates`
  - **Issue**: Command does not exist

- **Line 618**: `npm run create-missing-docs`
  - **Command**: `create-missing-docs`
  - **Issue**: Command does not exist

- **Line 619**: `npm run delete-duplicates`
  - **Command**: `delete-duplicates`
  - **Issue**: Command does not exist

- **Line 620**: `npm run docs-health-summary`
  - **Command**: `docs-health-summary`
  - **Issue**: Command does not exist

- **Line 621**: `npm run file-mapping`
  - **Command**: `file-mapping`
  - **Issue**: Command does not exist

- **Line 622**: `npm run fix-consolidated-links`
  - **Command**: `fix-consolidated-links`
  - **Issue**: Command does not exist

- **Line 623**: `npm run fix-outdated-content`
  - **Command**: `fix-outdated-content`
  - **Issue**: Command does not exist

- **Line 624**: `npm run gap-analysis`
  - **Command**: `gap-analysis`
  - **Issue**: Command does not exist

- **Line 625**: `npm run generate-foundation`
  - **Command**: `generate-foundation`
  - **Issue**: Command does not exist

- **Line 626**: `npm run validate`
  - **Command**: `validate`
  - **Suggested Fix**: `npm run seed:validate`
  - **Issue**: Command deprecated, use suggestion

- **Line 627**: `npm run validate-foundation`
  - **Command**: `validate-foundation`
  - **Suggested Fix**: `npm run validate-studios`
  - **Issue**: Command deprecated, use suggestion

- **Line 630**: `npm run pipeline`
  - **Command**: `pipeline`
  - **Issue**: Command does not exist

- **Line 631**: `npm run pipeline:all`
  - **Command**: `pipeline:all`
  - **Issue**: Command does not exist

- **Line 632**: `npm run pipeline:all-dry`
  - **Command**: `pipeline:all-dry`
  - **Issue**: Command does not exist

- **Line 633**: `npm run pipeline:consolidate`
  - **Command**: `pipeline:consolidate`
  - **Issue**: Command does not exist

- **Line 634**: `npm run pipeline:dry-run`
  - **Command**: `pipeline:dry-run`
  - **Issue**: Command does not exist

- **Line 635**: `npm run pipeline:foundation`
  - **Command**: `pipeline:foundation`
  - **Issue**: Command does not exist

- **Line 636**: `npm run pipeline:quick`
  - **Command**: `pipeline:quick`
  - **Issue**: Command does not exist

- **Line 637**: `npm run pipeline:validate`
  - **Command**: `pipeline:validate`
  - **Issue**: Command does not exist

- **Line 640**: `npm run cleanup`
  - **Command**: `cleanup`
  - **Issue**: Command does not exist

- **Line 641**: `npm run cleanup:live`
  - **Command**: `cleanup:live`
  - **Issue**: Command does not exist

- **Line 642**: `npm run cross-reference`
  - **Command**: `cross-reference`
  - **Issue**: Command does not exist

- **Line 645**: `npm run migrate-legacy`
  - **Command**: `migrate-legacy`
  - **Issue**: Command does not exist

- **Line 646**: `npm run migrate-legacy:live`
  - **Command**: `migrate-legacy:live`
  - **Issue**: Command does not exist

- **Line 664**: `npm run test:watch`
  - **Command**: `test:watch`
  - **Issue**: Command does not exist

- **Line 665**: `npm run test:coverage`
  - **Command**: `test:coverage`
  - **Issue**: Command does not exist

- **Line 701**: `npm run config:platform`
  - **Command**: `config:platform`
  - **Issue**: Command does not exist

- **Line 704**: `npm run state:unlock`
  - **Command**: `state:unlock`
  - **Issue**: Command does not exist

- **Line 713**: `npm run dev:docker`
  - **Command**: `dev:docker`
  - **Suggested Fix**: `npm run dev:backend`
  - **Issue**: Command deprecated, use suggestion

- **Line 716**: `npm run enhanced-integration-test`
  - **Command**: `enhanced-integration-test`
  - **Issue**: Command does not exist

- **Line 723**: `npm run ci:setup`
  - **Command**: `ci:setup`
  - **Issue**: Command does not exist

- **Line 724**: `npm run ci:test-integration`
  - **Command**: `ci:test-integration`
  - **Suggested Fix**: `npm run test:integration`
  - **Issue**: Command deprecated, use suggestion

- **Line 725**: `npm run ci:test-config`
  - **Command**: `ci:test-config`
  - **Issue**: Command does not exist

- **Line 726**: `npm run ci:status`
  - **Command**: `ci:status`
  - **Suggested Fix**: `npm run local:status`
  - **Issue**: Command deprecated, use suggestion

- **Line 727**: `npm run ci:local-workflow`
  - **Command**: `ci:local-workflow`
  - **Issue**: Command does not exist

- **Line 734**: `npm run monitor:comprehensive`
  - **Command**: `monitor:comprehensive`
  - **Issue**: Command does not exist

- **Line 768**: `npm run cross-reference`
  - **Command**: `cross-reference`
  - **Issue**: Command does not exist

- **Line 776**: `npm run local:emergency-stop`
  - **Command**: `local:emergency-stop`
  - **Issue**: Command does not exist

---

### docs/workflows/data-management.md

**Action Required**: update-commands
**Total Issues**: 26 (0 broken references, 26 outdated commands)

#### Outdated Commands (26)

- **Line 130**: `npm run frontend-sync`
  - **Command**: `frontend-sync`
  - **Issue**: Command does not exist

- **Line 133**: `npm run frontend-sync`
  - **Command**: `frontend-sync`
  - **Issue**: Command does not exist

- **Line 136**: `npm run frontend-sync`
  - **Command**: `frontend-sync`
  - **Issue**: Command does not exist

- **Line 139**: `npm run frontend-sync`
  - **Command**: `frontend-sync`
  - **Issue**: Command does not exist

- **Line 142**: `npm run frontend-sync`
  - **Command**: `frontend-sync`
  - **Issue**: Command does not exist

- **Line 145**: `npm run frontend-sync`
  - **Command**: `frontend-sync`
  - **Issue**: Command does not exist

- **Line 220**: `npm run validate-data-data-data-data:frontend`
  - **Command**: `validate-data-data-data-data:frontend`
  - **Issue**: Command does not exist

- **Line 221**: `npm run validate-data-data-data-data:business-data`
  - **Command**: `validate-data-data-data-data:business-data`
  - **Issue**: Command does not exist

- **Line 470**: `npm run frontend-sync`
  - **Command**: `frontend-sync`
  - **Issue**: Command does not exist

- **Line 473**: `npm run frontend-sync`
  - **Command**: `frontend-sync`
  - **Issue**: Command does not exist

- **Line 476**: `npm run frontend-sync`
  - **Command**: `frontend-sync`
  - **Issue**: Command does not exist

- **Line 479**: `npm run frontend-sync`
  - **Command**: `frontend-sync`
  - **Issue**: Command does not exist

- **Line 527**: `npm run frontend-sync`
  - **Command**: `frontend-sync`
  - **Issue**: Command does not exist

- **Line 558**: `npm run validate-data-data-data-data:business-data`
  - **Command**: `validate-data-data-data-data:business-data`
  - **Issue**: Command does not exist

- **Line 564**: `npm run frontend-sync`
  - **Command**: `frontend-sync`
  - **Issue**: Command does not exist

- **Line 585**: `npm run validate-data-data-data-data:business-data`
  - **Command**: `validate-data-data-data-data:business-data`
  - **Issue**: Command does not exist

- **Line 590**: `npm run frontend-sync`
  - **Command**: `frontend-sync`
  - **Issue**: Command does not exist

- **Line 598**: `npm run test`
  - **Command**: `test`
  - **Issue**: Command does not exist

- **Line 606**: `npm run test:performance`
  - **Command**: `test:performance`
  - **Issue**: Command does not exist

- **Line 690**: `npm run validate-data-data-data-data:frontend`
  - **Command**: `validate-data-data-data-data:frontend`
  - **Issue**: Command does not exist

- **Line 790**: `npm run test`
  - **Command**: `test`
  - **Issue**: Command does not exist

- **Line 844**: `npm run test`
  - **Command**: `test`
  - **Issue**: Command does not exist

- **Line 870**: `npm run test`
  - **Command**: `test`
  - **Issue**: Command does not exist

- **Line 915**: `npm run data:seed`
  - **Command**: `data:seed`
  - **Issue**: Command does not exist

- **Line 921**: `npm run data:backup`
  - **Command**: `data:backup`
  - **Issue**: Command does not exist

- **Line 1171**: `npm run manage`
  - **Command**: `manage`
  - **Issue**: Command does not exist

---

### docs/QUICK_START.md

**Action Required**: fix-references
**Total Issues**: 21 (20 broken references, 1 outdated commands)

#### Broken References (20)

- **Line 430**: `[Development Guide](docs/workflows/DEVELOPMENT_GUIDE.md)`
  - **Link Text**: "Development Guide"
  - **Target Path**: `docs/workflows/DEVELOPMENT_GUIDE.md`
  - **Issue**: File does not exist

- **Line 436**: `[Local Development](docs/setup/local-development.md)`
  - **Link Text**: "Local Development"
  - **Target Path**: `docs/setup/local-development.md`
  - **Issue**: File does not exist

- **Line 437**: `[Frontend Only](.setup/frontend-only.md)`
  - **Link Text**: "Frontend Only"
  - **Target Path**: `.setup/frontend-only.md`
  - **Issue**: File does not exist

- **Line 438**: `[Docker Setup](docs/setup/docker-setup.md)`
  - **Link Text**: "Docker Setup"
  - **Target Path**: `docs/setup/docker-setup.md`
  - **Issue**: File does not exist

- **Line 439**: `[Dependencies](docs/setup/dependencies.md)`
  - **Link Text**: "Dependencies"
  - **Target Path**: `docs/setup/dependencies.md`
  - **Issue**: File does not exist

- **Line 443**: `[Frontend](.components/frontend/)`
  - **Link Text**: "Frontend"
  - **Target Path**: `.components/frontend/`
  - **Issue**: File does not exist

- **Line 444**: `[Backend](.components/backend/)`
  - **Link Text**: "Backend"
  - **Target Path**: `.components/backend/`
  - **Issue**: File does not exist

- **Line 445**: `[Infrastructure](.components/infrastructure/)`
  - **Link Text**: "Infrastructure"
  - **Target Path**: `.components/infrastructure/`
  - **Issue**: File does not exist

- **Line 446**: `[Scripts](.components/scripts/)`
  - **Link Text**: "Scripts"
  - **Target Path**: `.components/scripts/`
  - **Issue**: File does not exist

- **Line 450**: `[Data Management](docs/workflows/data-management.md)`
  - **Link Text**: "Data Management"
  - **Target Path**: `docs/workflows/data-management.md`
  - **Issue**: File does not exist

- **Line 451**: `[Testing Strategies](docs/workflows/testing-strategies.md)`
  - **Link Text**: "Testing Strategies"
  - **Target Path**: `docs/workflows/testing-strategies.md`
  - **Issue**: File does not exist

- **Line 452**: `[Deployment Process](docs/workflows/deployment-process.md)`
  - **Link Text**: "Deployment Process"
  - **Target Path**: `docs/workflows/deployment-process.md`
  - **Issue**: File does not exist

- **Line 453**: `[Monitoring](docs/workflows/monitoring.md)`
  - **Link Text**: "Monitoring"
  - **Target Path**: `docs/workflows/monitoring.md`
  - **Issue**: File does not exist

- **Line 457**: `[Command Reference](docs/reference/command-reference.md)`
  - **Link Text**: "Command Reference"
  - **Target Path**: `docs/reference/command-reference.md`
  - **Issue**: File does not exist

- **Line 458**: `[Configuration](.reference/configuration.md)`
  - **Link Text**: "Configuration"
  - **Target Path**: `.reference/configuration.md`
  - **Issue**: File does not exist

- **Line 459**: `[Environment Variables](.reference/environment-variables.md)`
  - **Link Text**: "Environment Variables"
  - **Target Path**: `.reference/environment-variables.md`
  - **Issue**: File does not exist

- **Line 460**: `[npm Scripts](.reference/npm-scripts.md)`
  - **Link Text**: "npm Scripts"
  - **Target Path**: `.reference/npm-scripts.md`
  - **Issue**: File does not exist

- **Line 464**: `[System Overview](.docs/docs/architecture/system-overview.md)`
  - **Link Text**: "System Overview"
  - **Target Path**: `.docs/docs/architecture/system-overview.md`
  - **Issue**: File does not exist

- **Line 465**: `[Data Models](.docs/docs/architecture/data-models.md)`
  - **Link Text**: "Data Models"
  - **Target Path**: `.docs/docs/architecture/data-models.md`
  - **Issue**: File does not exist

- **Line 466**: `[API Design](.docs/docs/architecture/api-design.md)`
  - **Link Text**: "API Design"
  - **Target Path**: `.docs/docs/architecture/api-design.md`
  - **Issue**: File does not exist

#### Outdated Commands (1)

- **Line 402**: `npm run local:emergency-stop`
  - **Command**: `local:emergency-stop`
  - **Issue**: Command does not exist

---

### docs/workflows/DEVELOPMENT_GUIDE.md

**Action Required**: update-commands
**Total Issues**: 19 (17 broken references, 2 outdated commands)

#### Broken References (17)

- **Line 102**: `[API Reference](docs/reference/api_reference.md)`
  - **Link Text**: "API Reference"
  - **Target Path**: `docs/reference/api_reference.md`
  - **Issue**: File does not exist

- **Line 107**: `[Local Development](docs/setup/local-development.md)`
  - **Link Text**: "Local Development"
  - **Target Path**: `docs/setup/local-development.md`
  - **Issue**: File does not exist

- **Line 108**: `[Frontend Only](.setup/frontend-only.md)`
  - **Link Text**: "Frontend Only"
  - **Target Path**: `.setup/frontend-only.md`
  - **Issue**: File does not exist

- **Line 109**: `[Docker Setup](docs/setup/docker-setup.md)`
  - **Link Text**: "Docker Setup"
  - **Target Path**: `docs/setup/docker-setup.md`
  - **Issue**: File does not exist

- **Line 110**: `[Dependencies](docs/setup/dependencies.md)`
  - **Link Text**: "Dependencies"
  - **Target Path**: `docs/setup/dependencies.md`
  - **Issue**: File does not exist

- **Line 114**: `[Frontend](.components/frontend/)`
  - **Link Text**: "Frontend"
  - **Target Path**: `.components/frontend/`
  - **Issue**: File does not exist

- **Line 115**: `[Backend](.components/backend/)`
  - **Link Text**: "Backend"
  - **Target Path**: `.components/backend/`
  - **Issue**: File does not exist

- **Line 116**: `[Infrastructure](.components/infrastructure/)`
  - **Link Text**: "Infrastructure"
  - **Target Path**: `.components/infrastructure/`
  - **Issue**: File does not exist

- **Line 117**: `[Scripts](.components/scripts/)`
  - **Link Text**: "Scripts"
  - **Target Path**: `.components/scripts/`
  - **Issue**: File does not exist

- **Line 121**: `[Data Management](docs/workflows/data-management.md)`
  - **Link Text**: "Data Management"
  - **Target Path**: `docs/workflows/data-management.md`
  - **Issue**: File does not exist

- **Line 124**: `[Monitoring](docs/workflows/monitoring.md)`
  - **Link Text**: "Monitoring"
  - **Target Path**: `docs/workflows/monitoring.md`
  - **Issue**: File does not exist

- **Line 129**: `[Configuration](.reference/configuration.md)`
  - **Link Text**: "Configuration"
  - **Target Path**: `.reference/configuration.md`
  - **Issue**: File does not exist

- **Line 130**: `[Environment Variables](.reference/environment-variables.md)`
  - **Link Text**: "Environment Variables"
  - **Target Path**: `.reference/environment-variables.md`
  - **Issue**: File does not exist

- **Line 131**: `[npm Scripts](.reference/npm-scripts.md)`
  - **Link Text**: "npm Scripts"
  - **Target Path**: `.reference/npm-scripts.md`
  - **Issue**: File does not exist

- **Line 135**: `[System Overview](../architecture/system-overview.md)`
  - **Link Text**: "System Overview"
  - **Target Path**: `../architecture/system-overview.md`
  - **Issue**: File does not exist

- **Line 136**: `[Data Models](../architecture/data-models.md)`
  - **Link Text**: "Data Models"
  - **Target Path**: `../architecture/data-models.md`
  - **Issue**: File does not exist

- **Line 137**: `[API Design](../architecture/api-design.md)`
  - **Link Text**: "API Design"
  - **Target Path**: `../architecture/api-design.md`
  - **Issue**: File does not exist

#### Outdated Commands (2)

- **Line 20**: `npm run test:integration:integration`
  - **Command**: `test:integration:integration`
  - **Suggested Fix**: `npm run test:integration:coverage`
  - **Issue**: Command deprecated, use suggestion

- **Line 148**: `npm run test:integration:integration`
  - **Command**: `test:integration:integration`
  - **Suggested Fix**: `npm run test:integration:coverage`
  - **Issue**: Command deprecated, use suggestion

---

### README.md

**Action Required**: update-commands
**Total Issues**: 17 (17 broken references, 0 outdated commands)

#### Broken References (17)

- **Line 37**: `[Data Management Guide](docs/data_management/DATA_MANAGEMENT_GUIDE.md)`
  - **Link Text**: "Data Management Guide"
  - **Target Path**: `docs/data_management/DATA_MANAGEMENT_GUIDE.md`
  - **Issue**: File does not exist

- **Line 38**: `[Studio Data Schema](docs/data_management/STUDIO_DATA_SCHEMA.md)`
  - **Link Text**: "Studio Data Schema"
  - **Target Path**: `docs/data_management/STUDIO_DATA_SCHEMA.md`
  - **Issue**: File does not exist

- **Line 39**: `[Studio CLI Commands](docs/STUDIO_CLI_COMMANDS.md)`
  - **Link Text**: "Studio CLI Commands"
  - **Target Path**: `docs/STUDIO_CLI_COMMANDS.md`
  - **Issue**: File does not exist

- **Line 40**: `[Studio Image Processing](docs/data_management/STUDIO_IMAGE_PROCESSING.md)`
  - **Link Text**: "Studio Image Processing"
  - **Target Path**: `docs/data_management/STUDIO_IMAGE_PROCESSING.md`
  - **Issue**: File does not exist

- **Line 41**: `[Studio Health Monitoring](docs/STUDIO_HEALTH_MONITORING.md)`
  - **Link Text**: "Studio Health Monitoring"
  - **Target Path**: `docs/STUDIO_HEALTH_MONITORING.md`
  - **Issue**: File does not exist

- **Line 42**: `[Migration Guide](docs/data_management/MIGRATION_GUIDE.md)`
  - **Link Text**: "Migration Guide"
  - **Target Path**: `docs/data_management/MIGRATION_GUIDE.md`
  - **Issue**: File does not exist

- **Line 43**: `[Troubleshooting Guide](docs/TROUBLESHOOTING.md)`
  - **Link Text**: "Troubleshooting Guide"
  - **Target Path**: `docs/TROUBLESHOOTING.md`
  - **Issue**: File does not exist

- **Line 49**: `[PRD](docs/PRD%20Doc%20Tattoo%20Artist%20Directory%20MVP.md)`
  - **Link Text**: "PRD"
  - **Target Path**: `docs/PRD%20Doc%20Tattoo%20Artist%20Directory%20MVP.md`
  - **Issue**: File does not exist

- **Line 50**: `[SRS](docs/SRS%20Doc%20Tattoo%20Artist%20Directory%20MVP.md)`
  - **Link Text**: "SRS"
  - **Target Path**: `docs/SRS%20Doc%20Tattoo%20Artist%20Directory%20MVP.md`
  - **Issue**: File does not exist

- **Line 51**: `[HLD](docs/HLD%20Doc%20Tattoo%20Artist%20Directory%20MVP.md)`
  - **Link Text**: "HLD"
  - **Target Path**: `docs/HLD%20Doc%20Tattoo%20Artist%20Directory%20MVP.md`
  - **Issue**: File does not exist

- **Line 52**: `[LLD](docs/LLD%20Doc%20Tattoo%20Artist%20Directory%20MVP.md)`
  - **Link Text**: "LLD"
  - **Target Path**: `docs/LLD%20Doc%20Tattoo%20Artist%20Directory%20MVP.md`
  - **Issue**: File does not exist

- **Line 53**: `[DPP](docs/DPP%20Doc%20Tattoo%20Artist%20Directory%20MVP.md)`
  - **Link Text**: "DPP"
  - **Target Path**: `docs/DPP%20Doc%20Tattoo%20Artist%20Directory%20MVP.md`
  - **Issue**: File does not exist

- **Line 54**: `[Page Descriptions](docs/Page%20Descriptions%20HL%20Doc%20Tattoo%20Artist%20Directory%20MVP.md)`
  - **Link Text**: "Page Descriptions"
  - **Target Path**: `docs/Page%20Descriptions%20HL%20Doc%20Tattoo%20Artist%20Directory%20MVP.md`
  - **Issue**: File does not exist

- **Line 127**: `[Data Management Guide](docs/DATA_MANAGEMENT_GUIDE.md)`
  - **Link Text**: "Data Management Guide"
  - **Target Path**: `docs/DATA_MANAGEMENT_GUIDE.md`
  - **Issue**: File does not exist

- **Line 144**: `[Data Management Guide](docs/DATA_MANAGEMENT_GUIDE.md)`
  - **Link Text**: "Data Management Guide"
  - **Target Path**: `docs/DATA_MANAGEMENT_GUIDE.md`
  - **Issue**: File does not exist

- **Line 164**: `[Migration Guide](docs/MIGRATION_GUIDE.md)`
  - **Link Text**: "Migration Guide"
  - **Target Path**: `docs/MIGRATION_GUIDE.md`
  - **Issue**: File does not exist

- **Line 174**: `[Data Protection Policy](docs/DPP%20Doc%20Tattoo%20Artist%20Directory%20MVP.md)`
  - **Link Text**: "Data Protection Policy"
  - **Target Path**: `docs/DPP%20Doc%20Tattoo%20Artist%20Directory%20MVP.md`
  - **Issue**: File does not exist

---

### docs/README-Docs.md

**Action Required**: fix-references
**Total Issues**: 9 (9 broken references, 0 outdated commands)

#### Broken References (9)

- **Line 15**: `[System Overview](architecture/system-overview.md)`
  - **Link Text**: "System Overview"
  - **Target Path**: `architecture/system-overview.md`
  - **Issue**: File does not exist

- **Line 16**: `[API Design](architecture/api-design.md)`
  - **Link Text**: "API Design"
  - **Target Path**: `architecture/api-design.md`
  - **Issue**: File does not exist

- **Line 17**: `[Data Models](architecture/data-models.md)`
  - **Link Text**: "Data Models"
  - **Target Path**: `architecture/data-models.md`
  - **Issue**: File does not exist

- **Line 40**: `[Commands](docs/reference/command-reference.md)`
  - **Link Text**: "Commands"
  - **Target Path**: `docs/reference/command-reference.md`
  - **Issue**: File does not exist

- **Line 46**: `[General](docs/README-Docs.md)`
  - **Link Text**: "General"
  - **Target Path**: `docs/README-Docs.md`
  - **Issue**: File does not exist

- **Line 47**: `[LocalStack](docs/troubleshooting/)`
  - **Link Text**: "LocalStack"
  - **Target Path**: `docs/troubleshooting/`
  - **Issue**: File does not exist

- **Line 48**: `[Error Handling](docs/troubleshooting/TROUBLESHOOTING_GUIDE.md)`
  - **Link Text**: "Error Handling"
  - **Target Path**: `docs/troubleshooting/TROUBLESHOOTING_GUIDE.md`
  - **Issue**: File does not exist

- **Line 52**: `[TABLE_OF_CONTENTS.md](TABLE_OF_CONTENTS.md)`
  - **Link Text**: "TABLE_OF_CONTENTS.md"
  - **Target Path**: `TABLE_OF_CONTENTS.md`
  - **Issue**: File does not exist

- **Line 56**: `[GAP_ANALYSIS_REPORT.md](GAP_ANALYSIS_REPORT.md)`
  - **Link Text**: "GAP_ANALYSIS_REPORT.md"
  - **Target Path**: `GAP_ANALYSIS_REPORT.md`
  - **Issue**: File does not exist

---

### docs/setup/local-development.md

**Action Required**: update-commands
**Total Issues**: 6 (3 broken references, 3 outdated commands)

#### Broken References (3)

- **Line 41**: `[SETUP_MASTER.md](../getting-started/SETUP_MASTER.md)`
  - **Link Text**: "SETUP_MASTER.md"
  - **Target Path**: `../getting-started/SETUP_MASTER.md`
  - **Issue**: File does not exist

- **Line 42**: `[Docker Setup](docs/setup/docker-setup.md)`
  - **Link Text**: "Docker Setup"
  - **Target Path**: `docs/setup/docker-setup.md`
  - **Issue**: File does not exist

- **Line 43**: `[Dependencies](docs/setup/dependencies.md)`
  - **Link Text**: "Dependencies"
  - **Target Path**: `docs/setup/dependencies.md`
  - **Issue**: File does not exist

#### Outdated Commands (3)

- **Line 16**: `npm run setup`
  - **Command**: `setup`
  - **Issue**: Command does not exist

- **Line 71**: `npm run test:integration:integration`
  - **Command**: `test:integration:integration`
  - **Suggested Fix**: `npm run test:integration:coverage`
  - **Issue**: Command deprecated, use suggestion

- **Line 72**: `npm run test:integration:e2e`
  - **Command**: `test:integration:e2e`
  - **Suggested Fix**: `npm run test:integration:api`
  - **Issue**: Command deprecated, use suggestion

---

### docs/testing/component_testing.md

**Action Required**: update-commands
**Total Issues**: 5 (0 broken references, 5 outdated commands)

#### Outdated Commands (5)

- **Line 538**: `npm run test:integration:integration`
  - **Command**: `test:integration:integration`
  - **Suggested Fix**: `npm run test:integration:coverage`
  - **Issue**: Command deprecated, use suggestion

- **Line 541**: `npm run test:integration:a11y`
  - **Command**: `test:integration:a11y`
  - **Suggested Fix**: `npm run test:integration:api`
  - **Issue**: Command deprecated, use suggestion

- **Line 544**: `npm run test:integration:performance`
  - **Command**: `test:integration:performance`
  - **Suggested Fix**: `npm run test:integration:coverage`
  - **Issue**: Command deprecated, use suggestion

- **Line 547**: `npm run test:integration:consistency`
  - **Command**: `test:integration:consistency`
  - **Suggested Fix**: `npm run test:integration:coverage`
  - **Issue**: Command deprecated, use suggestion

- **Line 550**: `npm run test:integration:report`
  - **Command**: `test:integration:report`
  - **Suggested Fix**: `npm run test:integration:api`
  - **Issue**: Command deprecated, use suggestion

---

### docs/troubleshooting/TROUBLESHOOTING_MASTER.md

**Action Required**: fix-references
**Total Issues**: 4 (3 broken references, 1 outdated commands)

#### Broken References (3)

- **Line 1788**: `[Platform Setup Guide](PLATFORM_SETUP.md)`
  - **Link Text**: "Platform Setup Guide"
  - **Target Path**: `PLATFORM_SETUP.md`
  - **Issue**: File does not exist

- **Line 1789**: `[Cross-Platform Summary](CROSS_PLATFORM_SUMMARY.md)`
  - **Link Text**: "Cross-Platform Summary"
  - **Target Path**: `CROSS_PLATFORM_SUMMARY.md`
  - **Issue**: File does not exist

- **Line 1790**: `[Debugging Guide](DEBUGGING_GUIDE.md)`
  - **Link Text**: "Debugging Guide"
  - **Target Path**: `DEBUGGING_GUIDE.md`
  - **Issue**: File does not exist

#### Outdated Commands (1)

- **Line 110**: `npm run debug:start`
  - **Command**: `debug:start`
  - **Issue**: Command does not exist

---

### docs/workflows/monitoring.md

**Action Required**: update-commands
**Total Issues**: 2 (0 broken references, 2 outdated commands)

#### Outdated Commands (2)

- **Line 806**: `npm run local:resources:once`
  - **Command**: `local:resources:once`
  - **Suggested Fix**: `npm run local:resources`
  - **Issue**: Command deprecated, use suggestion

- **Line 951**: `npm run local:resources:once`
  - **Command**: `local:resources:once`
  - **Suggested Fix**: `npm run local:resources`
  - **Issue**: Command deprecated, use suggestion

---

### docs/testing/API_TESTING_GUIDE.md

**Action Required**: fix-references
**Total Issues**: 2 (2 broken references, 0 outdated commands)

#### Broken References (2)

- **Line 437**: `[Integration Testing Guide](docs/workflows/testing-strategies.md)`
  - **Link Text**: "Integration Testing Guide"
  - **Target Path**: `docs/workflows/testing-strategies.md`
  - **Issue**: File does not exist

- **Line 438**: `[End-to-End Testing Guide](docs/workflows/testing-strategies.md)`
  - **Link Text**: "End-to-End Testing Guide"
  - **Target Path**: `docs/workflows/testing-strategies.md`
  - **Issue**: File does not exist

---

### docs/setup/frontend-only.md

**Action Required**: update-commands
**Total Issues**: 2 (0 broken references, 2 outdated commands)

#### Outdated Commands (2)

- **Line 129**: `npm run test:frontend:watch`
  - **Command**: `test:frontend:watch`
  - **Issue**: Command does not exist

- **Line 132**: `npm run test:frontend:coverage`
  - **Command**: `test:frontend:coverage`
  - **Issue**: Command does not exist

---

### docs/troubleshooting/TROUBLESHOOTING_GUIDE.md

**Action Required**: fix-references
**Total Issues**: 1 (1 broken references, 0 outdated commands)

#### Broken References (1)

- **Line 37**: `[LocalStack troubleshooting](localstack/TROUBLESHOOTING_MASTER.md)`
  - **Link Text**: "LocalStack troubleshooting"
  - **Target Path**: `localstack/TROUBLESHOOTING_MASTER.md`
  - **Issue**: File does not exist

---

### docs/reference/npm-scripts.md

**Action Required**: fix-references
**Total Issues**: 1 (1 broken references, 0 outdated commands)

#### Broken References (1)

- **Line 18**: `[Commands](./commands.md)`
  - **Link Text**: "Commands"
  - **Target Path**: `./commands.md`
  - **Issue**: File does not exist

---

## Quick Fix Commands

To fix these issues, you can:

1. **Run the automated fix script**:
   ```bash
   cd scripts/documentation-analysis
   node scripts/fix-outdated-content.js
   ```

2. **Manual fixes** for remaining issues:
   - Review each broken reference and update the path
   - Replace outdated commands with suggested alternatives
   - Create missing files if they should exist

## File-by-File Fix Priority

1. **docs/reference/command-reference.md** - 267 issues
2. **docs/workflows/data-management.md** - 26 issues
3. **docs/QUICK_START.md** - 21 issues
4. **docs/workflows/DEVELOPMENT_GUIDE.md** - 19 issues
5. **README.md** - 17 issues
6. **docs/README-Docs.md** - 9 issues
7. **docs/setup/local-development.md** - 6 issues
8. **docs/testing/component_testing.md** - 5 issues
9. **docs/troubleshooting/TROUBLESHOOTING_MASTER.md** - 4 issues
10. **docs/workflows/monitoring.md** - 2 issues

---

*This report was generated automatically by the detailed issue analysis tool.*
