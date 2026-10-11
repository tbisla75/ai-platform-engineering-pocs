#!/usr/bin/env python3
"""Read-only Kubernetes incident triage POC. Standard library only."""
import argparse
import json
import subprocess
from pathlib import Path


def collect(namespace: str, fixture: Path | None) -> dict:
    if fixture:
        return json.loads(fixture.read_text())
    def kubectl(*args):
        proc = subprocess.run(['kubectl', '-n', namespace, *args, '-o', 'json'], capture_output=True, text=True, timeout=15, check=True)
        return json.loads(proc.stdout)
    return {'pods': kubectl('get', 'pods'), 'events': kubectl('get', 'events')}


def investigate(snapshot: dict) -> dict:
    findings = []
    for pod in snapshot.get('pods', {}).get('items', []):
        name = pod.get('metadata', {}).get('name', 'unknown')
        for container in pod.get('status', {}).get('containerStatuses', []):
            waiting = container.get('state', {}).get('waiting', {})
            reason = waiting.get('reason', '')
            if reason:
                hint = {'ImagePullBackOff': 'Verify image reference and registry credentials',
                        'CrashLoopBackOff': 'Inspect previous container logs and probes',
                        'ErrImagePull': 'Verify registry reachability and image tag'}.get(reason, 'Inspect pod events')
                findings.append({'pod': name, 'reason': reason, 'recommendation': hint})
    for event in snapshot.get('events', {}).get('items', []):
        if event.get('type') == 'Warning':
            findings.append({'event': event.get('reason', 'Warning'), 'message': event.get('message', '')[:400]})
    return {'status': 'needs-attention' if findings else 'no-obvious-issues', 'findings': findings,
            'safety': 'Read-only analysis; no remediation performed'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--namespace', default='default')
    parser.add_argument('--fixture', type=Path, help='Use example data; no cluster access')
    args = parser.parse_args()
    print(json.dumps(investigate(collect(args.namespace, args.fixture)), indent=2))

if __name__ == '__main__':
    main()
