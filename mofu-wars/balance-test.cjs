const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const js=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function cls(){const s={};return{add:x=>s[x]=1,remove:x=>delete s[x],toggle:(x,v)=>v===undefined?(s[x]?(delete s[x],false):(s[x]=1,true)):(v?(s[x]=1,true):(delete s[x],false)),contains:x=>!!s[x]};}
function ctx(){return new Proxy({}, {get:(o,k)=>o[k]||(o[k]=()=>{}),set:(o,k,v)=>(o[k]=v,true)});}
const els={};
function el(id){return els[id]||(els[id]={id,style:{},classList:cls(),innerHTML:'',textContent:'',width:1024,height:500,addEventListener(){},getBoundingClientRect(){return {width:1024,height:500}},getContext(){return ctx()}});}
const storage={};
const sandbox={
 console,Math,Date,JSON,Proxy,parseInt,isNaN,escape,unescape,
 btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary'),
 setTimeout:()=>0,clearTimeout(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){},confirm:()=>true,
 localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=String(v)},
 Image:function(){this.complete=false;this.naturalWidth=0;this.removeAttribute=function(k){delete this[k];};},
 navigator:{},location:{protocol:'file:',search:'',href:''},
 document:{body:{classList:cls()},querySelector:s=>el(s.replace(/^#/,'')),createElement:()=>el('made'+Math.random()),addEventListener(){}},
 window:{addEventListener(){},devicePixelRatio:1}
};
sandbox.window.window=sandbox.window; sandbox.window.document=sandbox.document;
vm.createContext(sandbox); vm.runInContext(js,sandbox,{filename:'index.html'});
const MW=sandbox.window.MW, S=MW.s();
const missingLooks=[];
for(const u of MW.data.UNITS) if(!sandbox.LOOK[u.id]) missingLooks.push(u.id);
for(const id of Object.keys(MW.data.ENEMIES)) if(!sandbox.LOOK[id]) missingLooks.push(id);
const knownSkills=new Set(['armor','slow','bounty','stun','rage','heal','shield','crit']);
const badSkills=[];
for(const u of MW.data.UNITS) if(u.skill&&!knownSkills.has(u.skill)) badSkills.push(u.id+':'+u.skill);
for(const [id,e] of Object.entries(MW.data.ENEMIES)) if(e.skill&&!knownSkills.has(e.skill)) badSkills.push(id+':'+e.skill);
let brainChecks=0;
for(let ch=0;ch<6;ch++) for(let n=0;n<100;n++){
  const q=sandbox.makeBrainQuestion(ch),vals=q.choices.map(String);
  if(vals.length!==3||new Set(vals).size!==3||!vals.includes(String(q.a))) throw new Error('bad brain question '+JSON.stringify(q));
  brainChecks++;
}
S.star=777;sandbox.save();const code=sandbox.makeSaveCode();const restored=sandbox.readSaveCode(code);
if(restored.star!==777||restored.schemaVersion!==1||!code.startsWith('MWB1.'))throw new Error('save code roundtrip failed');
const oldPayload=JSON.stringify({v:4,at:Date.now(),data:JSON.parse(JSON.stringify(S))});
const oldCode='MW4.'+sandbox.saveHash(oldPayload)+'.'+Buffer.from(unescape(encodeURIComponent(oldPayload)),'binary').toString('base64');
if(sandbox.readSaveCode(oldCode).star!==777)throw new Error('MW4 compatibility failed');
let tamperBlocked=false;try{sandbox.readSaveCode(code.slice(0,-1)+(code.endsWith('A')?'B':'A'));}catch(e){tamperBlocked=true;}
if(!tamperBlocked)throw new Error('tampered save code was accepted');
const newerPayload=JSON.stringify({format:1,schema:99,build:'future',at:Date.now(),data:{schemaVersion:99}});
const newerCode='MWB1.'+sandbox.saveHash(newerPayload)+'.'+Buffer.from(unescape(encodeURIComponent(newerPayload)),'binary').toString('base64');
let newerBlocked=false;try{sandbox.readSaveCode(newerCode);}catch(e){newerBlocked=String(e.message).includes('更新');}
if(!newerBlocked)throw new Error('newer save code was not blocked');
const legacy=JSON.parse(JSON.stringify(S));delete legacy.schemaVersion;
if(sandbox.migrateSave(legacy).schemaVersion!==1)throw new Error('schema 0 migration failed');
S.star=778;sandbox.save();const recent=JSON.parse(storage['mofu-wars-recovery-recent']);
if(recent.star!==777)throw new Error('automatic previous-save backup failed');
const slotA=sandbox.readSlot(storage['mofu-wars-slot-a']),slotB=sandbox.readSlot(storage['mofu-wars-slot-b']);
if(slotA.seq!==1||slotB.seq!==2||slotA.data.star!==777||slotB.data.star!==778)throw new Error('dual slot save failed');
const summary={stages:Object.keys(MW.data.STAGES).length,units:MW.data.UNITS.length,enemies:Object.keys(MW.data.ENEMIES).length,missingLooks,badSkills,brainChecks,saveCodeRoundtrip:true,mw4Compatibility:true,tamperBlocked,newerBlocked,schemaMigration:true,dualSlot:true,autoBackup:true};
console.log(JSON.stringify(summary,null,2));
if(summary.stages!==60||summary.units!==36||summary.enemies!==24||missingLooks.length||badSkills.length) throw new Error('data validation failed');
const base=['mofu','tama','usa','kuma','tori','kaeru','pen','kitsu','risu','kapu','luna','mogu','goat','otter','koala','shika','hamu'];
for(const id of base) S.u[id]={lv:20,ev:1};
S.deck=['mogu','otter','goat','koala','hamu'];
S.b={wallet:9,castle:9,cannon:9};
const strong=MW.simAll(300);
console.log(JSON.stringify({strongWins:strong.filter(x=>x.win).length,losses:strong.filter(x=>!x.win),final:strong[strong.length-1]},null,2));
if(strong.filter(x=>x.win).length!==60) throw new Error('strong progression failed');

for(const id of base) S.u[id]={lv:10,ev:0};
S.deck=['mofu','tama','tori','kaeru','kuma'];
S.b={wallet:5,castle:5,cannon:5};
const mid=[]; for(let c=0;c<3;c++) for(let i=0;i<10;i++) mid.push(MW.sim(`${c+1}-${i+1}`,300));
console.log(JSON.stringify({midWins:mid.filter(x=>x.win).length,losses:mid.filter(x=>!x.win)},null,2));
if(mid.filter(x=>x.win).length!==30) throw new Error('mid progression failed');

for(const id of base) S.u[id]={lv:15,ev:1};
S.deck=['mogu','otter','goat','koala','hamu'];
S.b={wallet:7,castle:7,cannon:7};
const late=[]; for(let c=4;c<6;c++) for(let i=0;i<10;i++) late.push(MW.sim(`${c+1}-${i+1}`,300));
console.log(JSON.stringify({lateWins:late.filter(x=>x.win).length,losses:late.filter(x=>!x.win),final:late[late.length-1]},null,2));
if(late.filter(x=>x.win).length!==20) throw new Error('late progression failed');

console.log(JSON.stringify({bonus:sandbox.deckBonuses(),bonusText:sandbox.bonusText(),gachaState:S.gacha},null,2));
storage['mofu-wars-slot-b']='{broken newest slot';sandbox.load();
let autoRecovered=sandbox.window.MW.s();
if(autoRecovered.star!==777||!String(sandbox.LOADNOTICE).includes('二重セーブ'))throw new Error('dual-slot recovery failed');
console.log(JSON.stringify({dualSlotRecovery:true,recoveredStar:autoRecovered.star,notice:sandbox.LOADNOTICE},null,2));
storage['mofu-wars-slot-a']='{broken a';storage['mofu-wars-slot-b']='{broken b';storage['mofu-wars-save-2']='{broken main';sandbox.load();
autoRecovered=sandbox.window.MW.s();
if(autoRecovered.star!==777||!String(sandbox.LOADNOTICE).includes('自動復旧'))throw new Error('automatic recovery failed');
console.log(JSON.stringify({automaticRecovery:true,recoveredStar:autoRecovered.star,notice:sandbox.LOADNOTICE},null,2));
