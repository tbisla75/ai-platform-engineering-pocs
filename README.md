# AI Platform Engineering — Portfolio Proofs of Concept

Two **read-only, dependency-free Python POCs** intended as a starting point for an AI infrastructure portfolio. Neither changes a cluster or requires paid AI APIs.

## 1. Kubernetes Incident Investigator

```bash
python3 k8s-incident-agent/investigate.py --fixture k8s-incident-agent/sample.json
```

To inspect a live cluster (requires `kubectl` and appropriate read-only RBAC):

```bash
python3 k8s-incident-agent/investigate.py --namespace default
```

This first version is a deterministic incident triage engine, **not yet an LLM agent**. Suggested extensions: add a redacted evidence collector, local LLM reasoning, a human approval gate, unit tests, and an auditable remediation workflow.

## 2. NVIDIA GPU Cluster Readiness Analyzer

```bash
python3 gpu-readiness-analyzer/check_gpu.py --fixture gpu-readiness-analyzer/sample.json
```

To inspect a live cluster:

```bash
python3 gpu-readiness-analyzer/check_gpu.py
```

Reports node readiness, advertised GPU capacity and optional NVIDIA product labels. It **does not certify GPU cluster readiness**: driver, CUDA, GPU Operator, RDMA and NVLink checks are future work.

## Safety and portfolio notes

- Use a read-only Kubernetes service account in real environments.
- Never commit kubeconfigs, secrets, tokens, production logs or customer identifiers.
- Fixture data is synthetic.
- No changes are made to the cluster.
- Requires Python 3.10+; no external packages required.

## Suggested roadmap

1. Add pytest and GitHub Actions.
2. Add Prometheus metrics collection and structured diagnostics.
3. Add NVIDIA GPU Operator health checks and DCGM Exporter metrics.
4. Add a local LLM for incident explanations with citations to gathered evidence.
5. Add approval-gated, audited AWX remediation (disabled by default).


## 3. LangGraph Kubernetes AI Incident Agent

A three-stage **read-only** agent workflow (collect → triage → explain), with optional **local Ollama** inference. This is a guided graph, not an autonomous remediation bot.

### Installation

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

On Windows PowerShell, activate with `.venv\\Scripts\\Activate.ps1`.

### Run without an LLM (safe first exercise)

```bash
python k8s-incident-agent/agent.py --fixture k8s-incident-agent/sample.json --offline
```

### Run with a local LLM

Install [Ollama](https://ollama.com/), download the model using `ollama pull llama3.2`, and ensure Ollama is running locally. Then run:

```bash
python k8s-incident-agent/agent.py --fixture k8s-incident-agent/sample.json
```

### Run tests

```bash
python -m unittest discover -s tests -v
```

See [the study guide](k8s-incident-agent/STUDY_GUIDE.md) and [GitHub Actions](.github/workflows/tests.yml) for the implementation and CI configuration.

**Data caution:** Live Kubernetes events may contain confidential details. The LLM is restricted to a loopback Ollama endpoint, but do not process real customer data without authorization and appropriate redaction.


## TypeScript Kubernetes Incident REST API

New learning project: [typescript-k8s-api](typescript-k8s-api/README.md). A Node.js 22 + TypeScript read-only HTTP API with typed Kubernetes incident analysis, unit/integration tests, and [GitHub Actions](.github/workflows/typescript.yml). Start with `src/analyzer.ts`, then `src/server.ts`.
