#!/usr/bin/env python3
"""Read-only GPU node inventory and readiness POC; no NVIDIA hardware required for fixture mode."""
import argparse
import json
import subprocess
from pathlib import Path


def load_nodes(fixture: Path | None) -> dict:
    if fixture:
        return json.loads(fixture.read_text())
    p = subprocess.run(['kubectl', 'get', 'nodes', '-o', 'json'], check=True, capture_output=True, text=True, timeout=15)
    return json.loads(p.stdout)


def report(data: dict) -> dict:
    nodes = []
    for node in data.get('items', []):
        meta, status = node.get('metadata', {}), node.get('status', {})
        labels = meta.get('labels', {})
        capacity = status.get('capacity', {})
        ready = any(c.get('type') == 'Ready' and c.get('status') == 'True' for c in status.get('conditions', []))
        gpu = int(capacity.get('nvidia.com/gpu', 0))
        nodes.append({'name': meta.get('name'), 'ready': ready, 'advertised_gpus': gpu,
                      'gpu_product': labels.get('nvidia.com/gpu.product', 'unknown'),
                      'gpu_present': gpu > 0})
    return {'nodes': nodes, 'total_advertised_gpus': sum(n['advertised_gpus'] for n in nodes),
            'checks_not_covered': ['driver health', 'GPU Operator state', 'NVLink/RDMA performance', 'MIG partitioning'],
            'safety': 'Read-only inventory; no configuration changes'}


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--fixture', type=Path)
    args = p.parse_args()
    print(json.dumps(report(load_nodes(args.fixture)), indent=2))

if __name__ == '__main__':
    main()
