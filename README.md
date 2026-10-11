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
