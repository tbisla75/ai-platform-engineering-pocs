"""Unit tests that require no live Kubernetes cluster or GPU hardware."""
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


def load_module(name: str, relative_path: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / relative_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


incident = load_module("investigate", "k8s-incident-agent/investigate.py")
gpu = load_module("check_gpu", "gpu-readiness-analyzer/check_gpu.py")


class IncidentTests(unittest.TestCase):
    def test_crashloop_detected(self):
        fixture = json.loads((ROOT / "k8s-incident-agent/sample.json").read_text())
        result = incident.investigate(fixture)
        self.assertEqual(result["status"], "needs-attention")
        self.assertTrue(any(f.get("reason") == "CrashLoopBackOff" for f in result["findings"]))

    def test_empty_cluster(self):
        self.assertEqual(incident.investigate({"pods": {"items": []}, "events": {"items": []}})["status"], "no-obvious-issues")


class GpuTests(unittest.TestCase):
    def test_gpu_count(self):
        fixture = json.loads((ROOT / "gpu-readiness-analyzer/sample.json").read_text())
        result = gpu.report(fixture)
        self.assertEqual(result["total_advertised_gpus"], 4)
        self.assertEqual(len(result["nodes"]), 2)

    def test_no_nodes(self):
        self.assertEqual(gpu.report({"items": []})["total_advertised_gpus"], 0)


if __name__ == "__main__":
    unittest.main()
