/** Pure analysis logic: no HTTP, filesystem, Kubernetes access or side effects. */
export interface Pod { metadata?: { name?: string }; status?: { containerStatuses?: Array<{state?: {waiting?: {reason?: string}}}> } }
export interface Event { type?: string; reason?: string; message?: string }
export interface Snapshot { pods?: {items?: Pod[]}; events?: {items?: Event[]} }
export interface Finding { kind: 'container' | 'event'; resource: string; reason: string; recommendation: string }
export interface Report { status: 'needs-attention' | 'no-obvious-issues'; findings: Finding[]; findingCount: number; readOnly: true }
const advice: Record<string,string> = {
  CrashLoopBackOff: 'Inspect previous container logs, probes and exit codes.',
  ImagePullBackOff: 'Verify image reference, registry access and imagePullSecrets.',
  ErrImagePull: 'Check registry connectivity, credentials and image tag.',
  OOMKilled: 'Review memory consumption and container resource limits.'
};
export function analyzeSnapshot(snapshot: Snapshot): Report {
  const findings: Finding[] = [];
  for (const pod of snapshot.pods?.items ?? []) {
    for (const container of pod.status?.containerStatuses ?? []) {
      const reason = container.state?.waiting?.reason;
      if (reason) findings.push({kind:'container', resource:pod.metadata?.name ?? 'unknown', reason,
        recommendation:advice[reason] ?? 'Inspect pod status and events.'});
    }
  }
  for (const event of snapshot.events?.items ?? []) {
    if (event.type === 'Warning') findings.push({kind:'event', resource:'cluster-event',
      reason:event.reason ?? 'Warning', recommendation:'Review warning event and affected workload.'});
  }
  return {status:findings.length ? 'needs-attention' : 'no-obvious-issues',
    findings, findingCount:findings.length, readOnly:true};
}
