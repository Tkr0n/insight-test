# Code Quality (Static Analysis)

## Overview

SonarQube provides continuous static analysis for the Insightt monorepo, detecting bugs, code smells, and security vulnerabilities across both backend and frontend TypeScript codebases.

## Configuration

The analysis is configured via `sonar-project.properties` at the project root:

- **Project Key:** `insightt`
- **Sources:** `apps/backend/src`, `apps/frontend/src`
- **Tests:** `apps/backend/src/**/__tests__`, `apps/frontend/cypress`, `apps/frontend/src/tests`
- **Exclusions:** `node_modules/`, `dist/`, `.next/`, `build/`, `cypress/`, `__tests__/`, test files, config files

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

# With coverage reports (run tests first)
cd apps/backend && npm test
cd apps/frontend && npm test
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
  uses: SonarSource/sonarqube-scan-action@master
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```

### Pipeline Steps

1. Run backend tests with coverage: `cd apps/backend && npm run test:coverage`
2. Run frontend tests with coverage: `cd apps/frontend && npm test`
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
cd ../frontend && npm test
cd .. && sonar-scanner
```
