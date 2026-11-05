// Testes puros de regras, sem a interface Foundry. Rode: node tests/linking.test.cjs
const fs=require('fs');const vm=require('vm');const assert=require('assert/strict');
const file=require('path').join(__dirname,'../scripts/main.js');
let source=fs.readFileSync(file,'utf8');
source=source.slice(0,source.indexOf("Hooks.on('getSceneControlButtons'"));
const settings=new Map();
const game={world:{id:'test'},user:{isGM:true},settings:{get:(_,key)=>settings.get(key),set:async(_,key,value)=>{settings.set(key,value)}},socket:{emit(){}} ,users:[]};
const ctx={game,window:{innerWidth:1200,innerHeight:800},localStorage:{getItem(){return null}},foundry:{utils:{randomID(){return 'test123'},escapeHTML:x=>String(x)} ,applications:{api:{HandlebarsApplicationMixin:()=>class{},ApplicationV2:class{}}}},console,ChatMessage:{create:async()=>{}},ui:{notifications:{warn(){}}}};
vm.createContext(ctx);
vm.runInContext(source+'\nthis.__test={normalized,addAmount,resolveWinner,completionEvents,linkTargets,change,getCollection};',ctx);
const T=ctx.__test;
const bar=T.normalized({mode:'bar',leftCount:4,rightCount:5,leftFilled:1,rightFilled:2});
let next=T.addAmount(bar,2,'right');assert.equal(next.rightFilled,4);assert.equal(next.leftFilled,1);
next=T.addAmount(bar,10,'right');assert.equal(next.rightFilled,5);T.resolveWinner(bar,next);assert.equal(next.centerWinner,'right');assert.equal(T.completionEvents(bar,next)[0].kind,'right');
next=T.addAmount(bar,2,'left');assert.equal(next.leftFilled,3);assert.equal(next.rightFilled,2);
const clock=T.normalized({mode:'clock',clockCount:6,clockFilled:4});next=T.addAmount(clock,4,'clock');assert.equal(next.clockFilled,6);assert.equal(T.completionEvents(clock,next)[0].kind,'clock');
const panel=T.normalized({mode:'panel',tracks:[{id:'a',label:'A',count:5,filled:1},{id:'b',label:'B',count:5,filled:2}]});
next=T.addAmount(panel,2,'track:b');assert.equal(next.tracks[0].filled,1);assert.equal(next.tracks[1].filled,4);
next=T.addAmount(panel,2,'track:deleted');assert.equal(next.tracks[0].filled,1);assert.equal(next.tracks[1].filled,2);
next=T.addAmount(panel,2,'');assert.equal(next.tracks[0].filled,3);
assert.equal(T.linkTargets(panel)[1].value,'track:b');
const legacy=T.normalized({mode:'bar',linkedMarkerId:'target'});assert.equal(legacy.linkedTarget,'');
// Operação de vínculo e mensagem ao completar (sem recursão).
(async()=>{
 settings.set('markers',[
  {id:'source',...T.normalized({mode:'clock',clockCount:2,clockFilled:1,linkedMarkerId:'target',linkedAction:'advance',linkedAmount:2,linkedTarget:'right'})},
  {id:'target',...T.normalized({mode:'bar',leftCount:4,rightCount:4,leftFilled:0,rightFilled:2})}
 ]);
 await T.change({clockFilled:2},'source');
 let result=T.getCollection();assert.equal(result[1].leftFilled,0);assert.equal(result[1].rightFilled,4);assert.equal(result[1].centerWinner,'right');
 await T.change({clockFilled:2},'source');result=T.getCollection();assert.equal(result[1].rightFilled,4,'Não avança novamente em conclusão repetida');
 console.log('OK: 13 asserções de destinos, compatibilidade, conclusão e vínculo');
})().catch(e=>{console.error(e);process.exitCode=1});
