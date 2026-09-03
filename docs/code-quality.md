# Code Quality (Static Analysis)

## Overview

SonarQube provides continuous static analysis for the Insightt monorepo, detecting bugs, code smells, and security vulnerabilities across both backend and frontend TypeScript codebases.

## Configuration

The analysis is configured via `sonar-project.properties` at the project root:

- **Project Key:** `Tkr0n_insight-test_608039e6-e7b6-45d1-81c1-62c3abd9ff55`
- **Sources:** `apps/backend/src`, `apps/frontend/src`
- **Tests:** `apps/backend/src/middlewares/__tests__`, `apps/backend/src/use-cases/__tests__`, `apps/frontend/cypress`, `apps/frontend/src/tests`
- **Exclusions:** `node_modules/`, `dist/`, `.next/`, `build/`, `cypress/`, `__tests__/`, `coverage/`, `public/`, test files (`*.test.*`, `*.spec.*`), config files (`*.config.*`), and type declarations (`*.d.ts`)
- **Report Paths:** `apps/backend/coverage/lcov.info`, `apps/frontend/coverage/lcov.info` (declared via `sonar.typescript.lcov.reportPaths`)

## Local Analysis

### Prerequisites

Install the SonarScanner CLI:

```bash
# macOS
brew install sonar-scanner

# Windows (Chocolatey)
choco install sonarqube.portable

# Linux (apt)
sudo apt-get install sonar-scanner
```

### Run Analysis Locally

```bash
# From project root
sonar-scanner

# With coverage reports (run tests first; coverage flags produce lcov.info)
cd apps/backend && npm run test:coverage
cd apps/frontend && npm test -- --coverage
cd ../..
sonar-scanner
```

### Docker Alternative

```bash
docker run --rm \
  -e SONAR_HOST_URL=http://localhost:9000 \
  -v "$(pwd):/usr/src" \
  sonarsource/sonar-scanner-cli
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: SonarQube Scan
  uses: SonarSource/sonarqube-scan-action@7006c4492b2e0ee0f816d36501671557c97f5995 # v8.1.0
  continue-on-error: true
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```

The `sonarqube-scan` job sets `continue-on-error: true`, so a failed SonarQube scan does not block the deployment pipeline (the scan runs on `push` to `main` / `workflow_dispatch`).

### Pipeline Steps

1. Run backend tests with coverage: `cd apps/backend && npm run test:coverage` (Jest with `--coverage`)
2. Run frontend tests: `cd apps/frontend && npm test` (Vitest). Generate coverage with `cd apps/frontend && npm test -- --coverage` if needed.
3. Execute `sonar-scanner` from project root
4. Quality gate fails if issues exceed threshold

## Coverage Reports

| App | Tool | Report Path |
|-----|------|-------------|
| Backend | Jest | `apps/backend/coverage/lcov.info` |
| Frontend | Vitest | `apps/frontend/coverage/lcov.info` |
| Frontend E2E | Cypress | Not reported to SonarQube (visual/integration only) |

Generate coverage before scanning:

```bash
cd apps/backend && npm run test:coverage
cd ../frontend && npm test -- --coverage
cd .. && sonar-scanner
```

Coverage reports are only emitted when the coverage flag is passed (backend: `jest --coverage`, frontend: `vitest run --coverage`). Without it, the `lcov.info` files referenced by `sonar.typescript.lcov.reportPaths` are not produced.
