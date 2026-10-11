"""LangGraph smoke test with fixture data; never invokes Ollama or kubectl."""
import importlib.util
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
AGENT_DIR = ROOT / "k8s-incident-agent"
sys.path.insert(0, str(AGENT_DIR))
spec = importlib.util.spec_from_file_location("incident_agent", AGENT_DIR / "agent.py")
agent = importlib.util.module_from_spec(spec)
spec.loader.exec_module(agent)


class AgentTests(unittest.TestCase):
    def test_offline_graph(self):
        result = agent.build_graph().invoke({
            "fixture": str(AGENT_DIR / "sample.json"),
            "namespace": "default",
            "offline": True,
        })
        self.assertEqual(result["diagnosis"]["status"], "needs-attention")
        self.assertIn("no LLM", result["explanation"])

    def test_refuses_remote_ollama(self):
        with self.assertRaises(ValueError):
            agent.ollama_explain({}, model="llama3.2", base_url="https://external.example")


if __name__ == "__main__":
    unittest.main()
