# TypeScript Kubernetes Incident REST API

A **learning POC**: an HTTP API exposing typed Kubernetes incident analysis, based on the Python investigator in the parent repository. No live cluster, LLM, credentials, or remediation needed.

## Architecture

`HTTP client → src/server.ts (routing and input checks) → src/analyzer.ts (typed business logic) → JSON report`

The central software abstraction is `analyzeSnapshot(snapshot: Snapshot): Report`. Consumers get a consistent report without needing to understand the nested Kubernetes pod/event structure.

## Run locally (Node.js 22+)

```bash
cd typescript-k8s-api
npm install
npm run typecheck
npm test
npm run dev
```

In a second terminal:

```bash
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:3000/api/incidents/sample
curl -X POST http://127.0.0.1:3000/api/incidents/analyze -H 'Content-Type: application/json' --data-binary @fixtures/incident.json
```

PowerShell:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/health
Invoke-RestMethod http://127.0.0.1:3000/api/incidents/sample
Get-Content fixtures/incident.json -Raw | Invoke-RestMethod http://127.0.0.1:3000/api/incidents/analyze -Method Post -ContentType 'application/json'
```

## Study path

1. **src/analyzer.ts** — `interface`, union types, optional chaining, `Record`, pure functions.
2. **src/server.ts** — HTTP routing, async/await, JSON, validation, Node.js.
3. **test/analyzer.test.ts** — unit and integration testing.
4. **tsconfig.json** — strict TypeScript compiler settings.
5. **GitHub Actions** — continuous integration.

## Exercises

1. Add `severity: 'low' | 'medium' | 'high'` to findings and tests.
2. Add `GET /api/incidents/rules`.
3. Build a **separate read-only** Kubernetes collector with minimum RBAC and sensitive-data redaction.
4. Later, integrate the existing Python LangGraph agent through an internal API.

**Security:** This demo binds only to localhost, uses synthetic data, and cannot change infrastructure. It is not production ready: no authentication, rate limiting or comprehensive runtime schema validation. Do not expose it publicly or submit real customer data.
