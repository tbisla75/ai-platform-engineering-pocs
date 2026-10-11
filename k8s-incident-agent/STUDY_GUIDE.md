# Study guide: LangGraph + local Ollama incident agent

## What this teaches

1. **Collect**: `investigate.collect()` loads a synthetic JSON fixture or reads Kubernetes resources via `kubectl` (read-only).
2. **Triage**: `investigate.investigate()` converts raw pod statuses and events into structured findings.
3. **Explain**: `ollama_explain()` optionally sends *bounded diagnosis data* to a local LLM for an explanation.
4. **Orchestrate**: `build_graph()` links these three nodes with LangGraph's `StateGraph`.

This is a **linear agent workflow** rather than a fully autonomous tool-using agent. The LLM cannot call tools or remediate infrastructure. That is intentional for a safe first POC.

## Quick start

Python 3.10+:

```bash
python -m venv .venv
source .venv/bin/activate      # Windows PowerShell: .venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
python k8s-incident-agent/agent.py --fixture k8s-incident-agent/sample.json --offline
python -m unittest discover -s tests -v
```

For local AI-generated explanations, install [Ollama](https://ollama.com/), then:

```bash
ollama pull llama3.2
ollama serve
# In a separate terminal:
python k8s-incident-agent/agent.py --fixture k8s-incident-agent/sample.json
```

If Ollama is already running as a service, you don't need a second `ollama serve`.

## Exercises

1. Add a unit test for an `ImagePullBackOff` pod.
2. Add a node that summarizes warning events by reason.
3. Add a redaction function for names and event messages before LLM submission.
4. Add an optional Prometheus query **with read-only credentials**.
5. Measure LLM output consistency using a fixed fixture and evaluation checklist.

## Security notes

The agent never executes remediation. Treat Kubernetes events and logs as untrusted; they may contain confidential data or prompt injection. The local Ollama endpoint is restricted to loopback. Local processing reduces external exposure but does not automatically make logs safe to share. Use fixtures until you have appropriate authorization and data-handling controls.
