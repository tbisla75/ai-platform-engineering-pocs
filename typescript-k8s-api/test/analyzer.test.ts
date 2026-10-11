import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {analyzeSnapshot} from '../src/analyzer.js';
import {makeServer} from '../src/server.js';
test('detects CrashLoopBackOff and warnings',()=>{
  const report=analyzeSnapshot({pods:{items:[{metadata:{name:'web'},status:{containerStatuses:[{state:{waiting:{reason:'CrashLoopBackOff'}}}]}}]},events:{items:[{type:'Warning',reason:'BackOff'}]}});
  assert.equal(report.findingCount,2);
  assert.equal(report.status,'needs-attention');
});
test('empty snapshot is healthy',()=>assert.equal(analyzeSnapshot({}).findingCount,0));
test('HTTP health, fixture and POST analysis',async()=>{
  const server=makeServer();server.listen(0,'127.0.0.1');await once(server,'listening');
  try{
    const addr=server.address();
    if(!addr||typeof addr==='string') throw Error('Invalid address');
    const base='http://127.0.0.1:'+addr.port;
    assert.equal((await fetch(base+'/health')).status,200);
    const sample=await fetch(base+'/api/incidents/sample');
    assert.equal((await sample.json() as {findingCount:number}).findingCount,2);
    const result=await fetch(base+'/api/incidents/analyze',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({pods:{items:[]}})});
    assert.equal((await result.json() as {findingCount:number}).findingCount,0);
  }finally{server.close();await once(server,'close');}
});
