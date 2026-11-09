const assert=require('assert'),C=require('./world-core.js');
for(const n of C.referenceNumbers){const shapes=C.shapes(n);assert(shapes.length>=(n===1?1:2));for(const s of shapes){assert.equal(s.cells.length,n);assert.equal(new Set(s.cells.map(String)).size,n);const seen=new Set([String(s.cells[0])]);let changed=true;while(changed){changed=false;for(const p of s.cells){if(seen.has(String(p)))continue;if([[1,0],[-1,0],[0,1],[0,-1]].some(d=>seen.has(String([p[0]+d[0],p[1]+d[1]])))){seen.add(String(p));changed=true;}}}assert.equal(seen.size,n,'disconnected '+s.name);}}
const A=require('./number-art.js');for(const n of C.referenceNumbers){const spec=A.spec(n);assert.equal(spec.n,n);assert(spec.name.length>0);for(const shape of C.shapes(n)){const cs=C.normalize(shape.cells),colors=cs.map((p,i)=>A.cellColor(n,i,p,cs));assert(colors.every(c=>/^#[0-9a-f]{6}$/i.test(c)));if(n>10&&n<20)assert.equal(colors.filter(c=>c===A.tens[10]).length,10,'ten + units '+n+' '+shape.name);}}assert.equal(new Set(C.defaultCells(7).map((p,i)=>A.cellColor(7,i,p,C.defaultCells(7)))).size,7);assert.equal(A.spec(8).arms,8);assert.equal(A.spec(3).crown,'three');assert.equal(A.spec(100).eye,'single-panel');
assert.throws(()=>C.defaultCells(0));assert.throws(()=>C.shapes(101));assert.throws(()=>C.defaultCells(1.5));
assert(!C.overlap({n:3,col:0,row:0,cells:[[0,0],[0,1],[1,0]]},{n:1,col:1,row:1}));assert(C.overlap({n:3,col:0,row:0,cells:[[0,0],[0,1],[1,0]]},{n:1,col:0,row:1}));
for(const range of ['small','mixed','double'])for(const op of ['add','sub','mul','div'])for(let i=0;i<200;i++){const q=C.question({range,ops:[op]});assert(Number.isSafeInteger(q.ans)&&q.ans>=0);if(range==='mixed'){assert(q.a>=10&&q.a<=99);assert(q.b>=1&&q.b<=9);}if(range==='double'){assert(q.a>=10&&q.a<=99);assert(q.b>=10&&q.b<=99);}assert.equal(q.ans,op==='add'?q.a+q.b:op==='sub'?q.a-q.b:op==='mul'?q.a*q.b:q.a/q.b);}
const mem={data:{},getItem(k){return this.data[k]||null},setItem(k,v){this.data[k]=v}};C.reward(mem,'run:1',5);C.reward(mem,'run:1',5);assert.equal(C.read(mem).stars,5);C.buy(mem,'jp-15',5);assert.equal(C.read(mem).stars,0);assert.throws(()=>C.buy(mem,'jp-15',5));assert.throws(()=>C.buy(mem,'jp-99',5));assert.throws(()=>C.buy(mem,'jp-01',5));assert.deepEqual(C.read(mem).owned,['jp-15']);
const before=mem.data['asobi-world-v1'];mem.setItem=()=>{throw Error('quota')};assert.throws(()=>C.reward(mem,'run:2',5));assert.equal(mem.data['asobi-world-v1'],before);
(async()=>{const clock=C.clock();let hit=0;clock.setTimeout(()=>hit++,50);await new Promise(r=>setTimeout(r,15));clock.pause();const frozen=clock.now();await new Promise(r=>setTimeout(r,70));assert.equal(clock.now(),frozen);assert.equal(hit,0);clock.resume();await new Promise(r=>setTimeout(r,70));assert.equal(hit,1);clock.setTimeout(()=>hit++,10);clock.reset();await new Promise(r=>setTimeout(r,20));assert.equal(hit,1);console.log('PASS shapes: 28 reference numbers, connectivity, occupied-cell collision, 2400 math questions, idempotent rewards, purchases, write failure, pause/resume');})().catch(e=>{console.error(e);process.exitCode=1});

assert.equal(C.referenceNumbers.length,28);for(let n=21;n<100;n++)if(n%10!==0){assert.throws(()=>C.number(n));assert.throws(()=>A.spec(n));}

// Reference colors are explicit; tens must not inherit the next character's palette.
const expectedTens={30:'#f0ed95',40:'#77c768',50:'#69cdbb',60:'#9064c4',80:'#dc449b'};
for(const [value,color] of Object.entries(expectedTens)){const n=Number(value),cs=C.defaultCells(n);assert(cs.every((p,i)=>A.cellColor(n,i,p,cs)===color));}
const seventy=C.defaultCells(70);for(let x=0;x<7;x++)assert.equal(new Set(seventy.filter(p=>p[0]===x).map(p=>A.cellColor(70,seventy.indexOf(p),p,seventy))).size,1);
assert.equal(new Set(seventy.map((p,i)=>A.cellColor(70,i,p,seventy))).size,7);
assert(new Set([30,40,50,60,70,80,90,100].map(n=>JSON.stringify([A.spec(n).eye,A.spec(n).expression,A.spec(n).faceHeight,A.spec(n).faceScale]))).size===8);
console.log('PASS reference tens colors, seven vertical rainbow bands, distinct faces');

const ninety=C.defaultCells(90),ncolors=ninety.map((p,i)=>A.cellColor(90,i,p,ninety));assert.equal(new Set(ncolors).size,3);for(const color of new Set(ncolors))assert.equal(ncolors.filter(c=>c===color).length,30);
const hundred=C.defaultCells(100),hcolors=hundred.map((p,i)=>A.cellColor(100,i,p,hundred));assert.equal(new Set(hcolors).size,2);for(const color of new Set(hcolors))assert.equal(hcolors.filter(c=>c===color).length,50);for(let i=0;i<100;i++){if(i%10<9)assert.notEqual(hcolors[i],hcolors[i+1]);if(i<90)assert.notEqual(hcolors[i],hcolors[i+10]);}
console.log('PASS 90: three 30-cell bands; 100: 50/50 checkerboard');

{let data=null;const storage={getItem(){return data},setItem(k,v){data=v}};C.update(storage,s=>{s.stars=900;s.owned.push('jp-15')});const old=C.read(storage);assert.deepEqual(old.exhibits,[]);
 const result=C.capsule(storage,'planet','capsule:first',()=>0);assert.equal(result.id,'planet-1');assert.equal(C.read(storage).stars,880);assert.deepEqual(C.capsule(storage,'planet','capsule:first',()=>.9),result);assert.equal(C.read(storage).stars,880);
 for(let i=2;i<=8;i++)C.capsule(storage,'planet','capsule:p'+i,()=>0);assert.equal(C.read(storage).exhibits.length,8);const replay=data;assert.throws(()=>C.capsule(storage,'planet','capsule:first',()=>0));assert.equal(data,replay);const full=data;assert.throws(()=>C.capsule(storage,'planet','capsule:full',()=>0));assert.equal(data,full);
 for(let i=1;i<=6;i++)C.capsule(storage,'fossil','capsule:f'+i,()=>0);assert.equal(C.read(storage).exhibits.length,14);assert(C.read(storage).owned.includes('jp-15'));
 const before=data;assert.throws(()=>C.capsule({getItem:()=>data,setItem(){throw Error('quota')}},'japan','capsule:quota',()=>0));assert.equal(data,before);
 C.update(storage,s=>s.stars=0);const empty=data;assert.throws(()=>C.capsule(storage,'japan','capsule:empty',()=>0));assert.equal(data,empty);
 assert.throws(()=>C.capsule(storage,'other','capsule:bad'));assert.throws(()=>C.capsule(storage,'japan','bad'));}
const source=Array.from({length:87},(_,i)=>i);const shuffled=C.shuffled(source);assert.equal(new Set(shuffled).size,87);assert.deepEqual(source,Array.from({length:87},(_,i)=>i));
console.log('PASS capsule debit, old purchases, unique rewards, replay, complete/poor/quota atomicity, random routes');

{const data=new Map(),storage={getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};C.update(storage,s=>{s.stars=84;s.owned=['jp-15'];s.exhibits=['planet-3'];s.stats={brain:{clears:9}}});storage.setItem('asobi-clear','[true]');storage.setItem('asobi-piano-best-v1','{"song":1}');storage.setItem('asobi-settings-v1','keep');C.resetHistory(storage);const after=C.read(storage);assert.equal(after.stars,84);assert.deepEqual(after.owned,['jp-15']);assert.deepEqual(after.exhibits,['planet-3']);assert.deepEqual(after.stats,{});assert.equal(storage.getItem('asobi-clear'),null);assert.equal(storage.getItem('asobi-piano-best-v1'),null);assert.equal(storage.getItem('asobi-settings-v1'),'keep');assert(storage.getItem('asobi-history-reset-v1'));}
console.log('PASS history reset preserves wallet, collections and settings; 87-item shuffle');

{const data=new Map([['asobi-clear','[true]']]),store={getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};C.update(store,s=>s.stars=33);const old=new Map(data);let failed=false;const throwing={getItem:store.getItem,setItem:store.setItem,removeItem(k){if(!failed&&k==='asobi-clear'){failed=true;throw Error('write failure')}store.removeItem(k)}};assert.throws(()=>C.resetHistory(throwing));assert.deepEqual(data,old);}
console.log('PASS failed reset restores prior history and wallet');

{
  const core=require('./world-core.js');
  const data=new Map();
  const storage={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};
  core.update(storage,state=>{state.stars=100;});
  assert.equal(core.kanji.length,81);
  assert.equal(core.zodiac.length,12);
  assert.equal(core.capsule(storage,'kanji','capsule:rare',()=>.019).id,'kanji-81');
  assert.equal(core.capsule(storage,'kanji','capsule:common',()=>0).id,'kanji-1');
  assert.equal(core.capsule(storage,'zodiac','capsule:zodiac',()=>.999).id,'zodiac-12');
  assert.deepEqual(core.read(storage).exhibits,['kanji-81','kanji-1','zodiac-12']);
  assert.equal(core.read(storage).stars,25);
}

{
 const data=new Map(),store={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 C.update(store,s=>{s.stars=100;});
 assert.equal(C.capsuleCost(C.read(store)),20);
 C.capsule(store,'japan','capsule:today',()=>0,20);
 assert.equal(C.capsuleCost(C.read(store)),25);
 assert.throws(()=>C.capsule(store,'planet','capsule:stale',()=>0,20));
 assert.equal(C.read(store).stars,80);
 C.capsule(store,'planet','capsule:second',()=>0,25);
 assert.equal(C.capsuleCost(C.read(store)),30);
 const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
 C.update(store,s=>{s.capsuleDaily.day=[yesterday.getFullYear(),yesterday.getMonth()+1,yesterday.getDate()].join('-');});
 assert.equal(C.capsuleCost(C.read(store)),20);
 C.capsule(store,'fossil','capsule:tomorrow',()=>0,20);
 assert.equal(C.read(store).stars,35);
 assert.equal(C.capsuleCost(C.read(store)),25);
 console.log('PASS shared daily price, stale quote rejection and next-day reset');
}
