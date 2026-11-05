const ID = 'engrena-tensao-perigo';
const DEFAULT_TRACKS = Object.freeze([
 {id:'supplies',label:'Suprimentos',description:'Fome, desidratação e disputa por recursos',count:6,filled:3,color:'#668f85'},
 {id:'order',label:'Ordem civil',description:'Saques, milícias e fragmentação política',count:6,filled:3,color:'#668f85'},
 {id:'hope',label:'Esperança',description:'Desespero e maior aceitação de barganhas',count:6,filled:3,color:'#668f85'},
 {id:'infernal',label:'Influência infernal',description:'Quanto maior, mais poder político os diabos possuem',count:6,filled:2,color:'#b64f50'}
]);
const MAX_TRACKS=12;
const DEFAULT = Object.freeze({tracks: DEFAULT_TRACKS, visible:false, mode:'bar', title:'Tensão',leftLabel:'Ameaça',rightLabel:'Heróis',leftCount:5,rightCount:5,leftFilled:0,rightFilled:0,leftColor:'#d85c55',rightColor:'#47a7d1',centerWinner:null,clockCount:6,clockFilled:0,clockColor:'#dc8a46',heroIcon:'shield',leftIcon:'skull',rightIcon:'shield',clockIcon:'skull',stepSize:1,completionLeft:'',completionRight:'',completionClock:'',completionVisibility:'public',linkedMarkerId:'',linkedAction:'none',linkedAmount:1});
const docks = new Map();
let managerOpen = false;
const MAX_MARKERS=30;
const POSITION_KEY = `${ID}:position:${game?.world?.id || 'world'}`;
// Dimensão local e independente por jogador e por formato (não sincronizada com o mundo).
const WIDTH_PRESETS = Object.freeze({
 bar:{min:280,max:740,default:440,step:60},
 clock:{min:240,max:600,default:350,step:50},
 panel:{min:290,max:980,default:540,step:70}
});
function currentMode(markerId){return getState(markerId).mode;}
function widthKey(mode,markerId){return `${ID}:width:${game.world.id}:${markerId}:${mode}`;}
function clampWidth(value,mode){
 const opts=WIDTH_PRESETS[mode]||WIDTH_PRESETS.bar;
 const screenMax=Math.max(180,window.innerWidth-24), allowedMax=Math.min(opts.max,screenMax);
 return Math.min(allowedMax,Math.max(Math.min(opts.min,allowedMax),Number(value)||opts.default));
}
function storedWidth(mode,markerId){
 let value=null;try{value=localStorage.getItem(widthKey(mode,markerId));}catch{}
 return clampWidth(value===null?WIDTH_PRESETS[mode]?.default:Number(value),mode);
}
function applyWidth(markerId){
 const dock=docks.get(markerId),root=dock?.element;if(!root)return;
 const mode=currentMode(markerId),width=storedWidth(mode,markerId);
 root.style.setProperty('width',`${width}px`,'important');
 root.style.setProperty('max-width','calc(100vw - 16px)','important');root.dataset.etpMode=mode;
 const x=Math.max(8,Math.min(window.innerWidth-width-8,root.getBoundingClientRect().left));
 root.style.setProperty('left',`${x}px`,'important');
}
// Dimensões são preferências locais: não mudam os dados do mundo nem o tamanho de outro usuário.
const HEIGHT_LIMITS = Object.freeze({bar:{min:145,max:380},clock:{min:215,max:650},panel:{min:170,max:760}});
function heightKey(mode,markerId){return `${ID}:height:${game.world.id}:${markerId}:${mode}`;}
function clampHeight(value,mode,top=8){
 const limits=HEIGHT_LIMITS[mode]||HEIGHT_LIMITS.bar;
 const maximum=Math.max(90,Math.min(limits.max,window.innerHeight-top-8));
 return Math.round(Math.max(Math.min(limits.min,maximum),Math.min(maximum,Number(value)||limits.min)));
}
function applySavedHeight(markerId){
 const dock=docks.get(markerId),root=dock?.element;if(!root)return;
 const mode=currentMode(markerId);let value=null;
 try{value=localStorage.getItem(heightKey(mode,markerId));}catch{}
 root.classList.toggle('etp-user-sized',value!==null);
 if(value!==null)root.style.setProperty('height',`${clampHeight(value,mode,root.getBoundingClientRect().top)}px`,'important');
 else root.style.removeProperty('height');
}
function attachResize(markerId){
 const root=docks.get(markerId)?.element,handle=root?.querySelector('.etp-resize-handle');
 if(!handle)return;
 handle.addEventListener('pointerdown',event=>{
  if(event.button!==0)return;
  event.preventDefault();event.stopPropagation();
  const mode=currentMode(markerId),box=root.getBoundingClientRect();
  const initialX=event.clientX,initialY=event.clientY,initialWidth=box.width,initialHeight=box.height;
  root.classList.add('etp-user-sized');
  handle.setPointerCapture(event.pointerId);
  const move=e=>{
   if(e.pointerId!==event.pointerId)return;
   const width=clampWidth(initialWidth+e.clientX-initialX,mode);
   const height=clampHeight(initialHeight+e.clientY-initialY,mode,box.top);
   root.style.setProperty('width',`${width}px`,'important');
   root.style.setProperty('height',`${height}px`,'important');
  };
  const finish=e=>{
   if(e.pointerId!==event.pointerId)return;
   handle.removeEventListener('pointermove',move);
   handle.removeEventListener('pointerup',finish);
   handle.removeEventListener('pointercancel',finish);
   const rect=root.getBoundingClientRect();
   try{
    localStorage.setItem(widthKey(mode,markerId),String(Math.round(rect.width)));
    localStorage.setItem(heightKey(mode,markerId),String(Math.round(rect.height)));
   }catch{}
   if(handle.hasPointerCapture(event.pointerId))handle.releasePointerCapture(event.pointerId);
  };
  handle.addEventListener('pointermove',move);
  handle.addEventListener('pointerup',finish);
  handle.addEventListener('pointercancel',finish);
 });
}
function restorePosition(markerId){
 const dock=docks.get(markerId);if(!dock?.element)return;
 let p;try{p=JSON.parse(localStorage.getItem(`${ID}:pos:${game.world.id}:${markerId}`)||'null');}catch{}
 const width=storedWidth(currentMode(markerId),markerId);
 const index=getCollection().findIndex(t=>t.id===markerId);
 const x=Math.max(8,Math.min(window.innerWidth-width-8,Number.isFinite(p?.x)?p.x:Math.round((window.innerWidth-width)/2)+(index%4)*24));
 const y=Math.max(8,Math.min(window.innerHeight-65,Number.isFinite(p?.y)?p.y:65+(index%6)*46));
 dock.element.style.setProperty('left',`${x}px`,'important');dock.element.style.setProperty('top',`${y}px`,'important');
}
function attachDrag(markerId){
 const h=docks.get(markerId)?.element?.querySelector('.etp-header');if(!h)return;
 h.addEventListener('pointerdown',event=>{
  if(event.button!==0||event.target.closest('button, input, select'))return;
  event.preventDefault();const root=docks.get(markerId).element,box=root.getBoundingClientRect();
  const dx=event.clientX-box.left,dy=event.clientY-box.top;h.setPointerCapture(event.pointerId);
  const move=e=>{const x=Math.max(8,Math.min(window.innerWidth-root.getBoundingClientRect().width-8,e.clientX-dx));const y=Math.max(8,Math.min(window.innerHeight-48,e.clientY-dy));root.style.setProperty('left',`${x}px`,'important');root.style.setProperty('top',`${y}px`,'important');};
  const stop=e=>{h.removeEventListener('pointermove',move);h.removeEventListener('pointerup',stop);h.removeEventListener('pointercancel',stop);const b=root.getBoundingClientRect();try{localStorage.setItem(`${ID}:pos:${game.world.id}:${markerId}`,JSON.stringify({x:b.left,y:b.top}));}catch{}};
  h.addEventListener('pointermove',move);h.addEventListener('pointerup',stop);h.addEventListener('pointercancel',stop);
 });
}

const ICONS = Object.freeze({"skull": {"label": "Caveira", "glyph": "☠️"}, "fire": {"label": "Fogo", "glyph": "🔥"}, "swords": {"label": "Espadas", "glyph": "⚔️"}, "biohazard": {"label": "Contaminação", "glyph": "☣️"}, "eye": {"label": "Vigilância", "glyph": "👁️"}, "bomb": {"label": "Explosão", "glyph": "💣"}, "shield": {"label": "Escudo", "glyph": "🛡️"}, "bolt": {"label": "Raio", "glyph": "⚡"}, "sword": {"label": "Espada", "glyph": "🗡️"}, "crown": {"label": "Coroa", "glyph": "👑"}, "heart": {"label": "Coração", "glyph": "❤️"}, "flag": {"label": "Bandeira", "glyph": "🚩"}, "hourglass": {"label": "Ampulheta", "glyph": "⌛"}, "clock": {"label": "Relógio", "glyph": "🕒"}, "key": {"label": "Chave", "glyph": "🔑"}, "lock": {"label": "Cadeado", "glyph": "🔒"}, "footprints": {"label": "Pegadas", "glyph": "👣"}, "compass": {"label": "Bússola", "glyph": "🧭"}, "sparkles": {"label": "Magia", "glyph": "✨"}, "moon": {"label": "Lua", "glyph": "🌙"}, "sun": {"label": "Sol", "glyph": "☀️"}, "book": {"label": "Livro", "glyph": "📖"}, "scale": {"label": "Balança", "glyph": "⚖️"}, "gem": {"label": "Cristal", "glyph": "💎"}});
const ICON_KEYS = new Set(['none', ...Object.keys(ICONS)]);
const iconGlyph = key => ICONS[key]?.glyph ?? '';
const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number(n)||0));
const safeColor=(value,fallback)=>/^#[\da-f]{6}$/i.test(String(value))?String(value):fallback;
function normalized(s={}) {const a={...DEFAULT,...s};for(const k of ['leftCount','rightCount','clockCount'])a[k]=clamp(Math.round(a[k]),1,20);for(const [k,c] of [['leftColor',DEFAULT.leftColor],['rightColor',DEFAULT.rightColor],['clockColor',DEFAULT.clockColor]])a[k]=safeColor(a[k],c);for(const [p,n] of [['leftFilled','leftCount'],['rightFilled','rightCount'],['clockFilled','clockCount']])a[p]=clamp(Math.round(a[p]),0,a[n]);a.mode=['bar','clock','panel'].includes(a.mode)?a.mode:'bar';
const rawTracks=Array.isArray(a.tracks)?a.tracks:DEFAULT_TRACKS;
a.tracks=rawTracks.slice(0,MAX_TRACKS).map((t,i)=>({
 id:String(t?.id||`track-${i}`).slice(0,60),
 label:String(t?.label||`Trilha ${i+1}`).slice(0,60),
 description:String(t?.description||'').slice(0,220),
 count:clamp(Math.round(t?.count||6),1,30),
 filled:clamp(Math.round(t?.filled||0),0,clamp(Math.round(t?.count||6),1,30)),
 color:safeColor(t?.color,'#668f85'),
 completion:String(t?.completion||'').slice(0,600)
}));a.title=String(a.title||DEFAULT.title).slice(0,80);a.leftLabel=String(a.leftLabel||DEFAULT.leftLabel).slice(0,40);a.rightLabel=String(a.rightLabel||DEFAULT.rightLabel).slice(0,40);a.heroIcon=a.heroIcon==='bolt'?'bolt':'shield';for(const [key,fallback] of [['leftIcon','skull'],['rightIcon','shield'],['clockIcon','skull']]) { if (s[key] === undefined && key==='rightIcon' && s.heroIcon) a[key]=s.heroIcon==='bolt'?'bolt':'shield'; a[key]=ICON_KEYS.has(a[key])?a[key]:fallback; }a.stepSize=clamp(Math.round(a.stepSize),1,10);a.linkedAmount=clamp(Math.round(a.linkedAmount),1,10);a.linkedAction=['none','reveal','advance'].includes(a.linkedAction)?a.linkedAction:'none';a.linkedMarkerId=String(a.linkedMarkerId||'').slice(0,70);a.completionVisibility=a.completionVisibility==='gm'?'gm':'public';for(const k of ['completionLeft','completionRight','completionClock'])a[k]=String(a[k]||'').slice(0,600);a.visible=Boolean(a.visible);a.centerWinner=['left','right'].includes(a.centerWinner)?a.centerWinner:null;return a;}
const makeId=()=>foundry.utils.randomID(12);
function getCollection(){
 const data=game.settings.get(ID,'markers');
 return Array.isArray(data)?data.filter(m=>m&&typeof m.id==='string').slice(0,MAX_MARKERS).map(m=>({id:m.id,...normalized(m)})):[];
}
function getState(markerId){return getCollection().find(m=>m.id===markerId)||normalized(DEFAULT);}
async function saveCollection(markers){
 if(!game.user.isGM)return;
 await game.settings.set(ID,'markers',markers.slice(0,MAX_MARKERS));
 game.socket?.emit(`module.${ID}`,{type:'refresh'});
}
// O ciclo de atualização preserva a configuração e dispara eventos apenas ao CRUZAR a meta.
function completionEvents(before,after){
 const events=[];
 if(after.mode==='clock' && before.clockFilled<before.clockCount && after.clockFilled===after.clockCount)
  events.push({kind:'clock',label:after.title,text:after.completionClock});
 if(after.mode==='bar'){
  const winner=after.centerWinner;
  if(winner && winner!==before.centerWinner)
   events.push({kind:winner,label:winner==='left'?after.leftLabel:after.rightLabel,text:winner==='left'?after.completionLeft:after.completionRight});
 }
 if(after.mode==='panel')for(const track of after.tracks){
  const old=before.tracks.find(t=>t.id===track.id);
  if(track.filled===track.count && (!old || old.filled<old.count))events.push({kind:'track',label:track.label,text:track.completion});
 }
 return events;
}
function addAmount(marker,amount){
 const s=normalized(marker),n=clamp(Math.round(amount),1,10);
 if(s.mode==='clock')return {...s,clockFilled:clamp(s.clockFilled+n,0,s.clockCount)};
 if(s.mode==='bar')return {...s,leftFilled:clamp(s.leftFilled+n,0,s.leftCount)};
 // Em painéis, o vínculo avança a primeira trilha ainda incompleta.
 const tracks=s.tracks.map(t=>({...t}));const next=tracks.find(t=>t.filled<t.count);
 if(next)next.filled=clamp(next.filled+n,0,next.count);
 return {...s,tracks};
}
function resolveWinner(previous,next){
 if(next.mode!=='bar'){next.centerWinner=null;return;}
 const oldWinner=previous.mode==='bar'?previous.centerWinner:null;
 if(oldWinner && next[`${oldWinner}Filled`]===next[`${oldWinner}Count`]){next.centerWinner=oldWinner;return;}
 const leftNewlyFull=next.leftFilled===next.leftCount && (previous.leftFilled<previous.leftCount || previous.mode!=='bar');
 const rightNewlyFull=next.rightFilled===next.rightCount && (previous.rightFilled<previous.rightCount || previous.mode!=='bar');
 next.centerWinner=leftNewlyFull?'left':rightNewlyFull?'right':null;
}
async function announceCompletion(marker,event){
 if(!String(event.text||'').trim())return;
 const escaped=foundry.utils.escapeHTML;
 const title=escaped(String(marker.title));
 const label=escaped(String(event.label));
 const body=escaped(String(event.text||'' )).replace(/\n/g,'<br>');
 const content=`<div class="etp-event-message"><strong>Engrena — ${title}</strong><p>Concluído: ${label}</p>${body?`<p>${body}</p>`:''}</div>`;
 const whisper=marker.completionVisibility==='gm'?game.users.filter(u=>u.isGM).map(u=>u.id):[];
 try{await ChatMessage.create({content,speaker:{alias:'Engrena — Tensão & Perigo'},...(whisper.length?{whisper}:{})});}
 catch(error){console.error('Engrena: falha ao publicar conclusão',error);ui.notifications?.warn('O marcador concluiu, mas a mensagem de evento não pôde ser enviada.');}
}
async function change(patch,markerId){
 if(!game.user.isGM)return;
 const all=getCollection(),idx=all.findIndex(t=>t.id===markerId);
 if(idx<0)return;
 const previous=all[idx],next={id:markerId,...normalized({...previous,...patch})};
 resolveWinner(previous,next);
 const events=completionEvents(previous,next);
 all[idx]=next;
 // Gatilho de um único salto: não executa cadeias recursivas nem loops entre marcadores.
 // Ação vinculada ocorre uma vez por operação que conclui uma meta.
 let targetEvent=null;
 if(events.length && next.linkedAction!=='none' && next.linkedMarkerId!==markerId){
  const ti=all.findIndex(t=>t.id===next.linkedMarkerId);
  if(ti>=0){
   const original=all[ti];
   const target=next.linkedAction==='reveal'?{...original,visible:true}:addAmount(original,next.linkedAmount);
   resolveWinner(original,target);
   all[ti]=normalized(target);
   // Não dispara um segundo vínculo, mas anuncia quando uma meta vinculada conclui.
   targetEvent={marker:all[ti],events:completionEvents(original,all[ti])};
  }
 }
 await saveCollection(all);
 for(const event of events)await announceCompletion(next,event);
 if(targetEvent)for(const event of targetEvent.events)await announceCompletion(targetEvent.marker,event);
}
async function createMarker(mode='clock',duplicateId=null){
 if(!game.user.isGM)return;
 const all=getCollection();if(all.length>=MAX_MARKERS){ui.notifications.warn(`Máximo de ${MAX_MARKERS} marcadores.`);return;}
 const previous=duplicateId?all.find(t=>t.id===duplicateId):null;
 const m={...normalized(previous||DEFAULT),id:makeId(),mode:previous?.mode||mode,visible:false,
 title:previous?`${previous.title} (cópia)`:mode==='clock'?'Novo relógio':mode==='panel'?'Novo painel':'Nova barra'};
 // Cópias são novas instâncias prontas, mas não começam visíveis.
 all.push(m);await saveCollection(all);return m.id;
}
async function removeMarker(markerId){
 if(!game.user.isGM)return;
 const all=getCollection();if(all.length<=1){ui.notifications.warn('Mantenha ao menos um marcador.');return;}
 await saveCollection(all.filter(t=>t.id!==markerId));
}
async function refreshDocks(){
 const all=getCollection(),ids=new Set(all.map(t=>t.id));
 for(const [id,d] of docks)if(!ids.has(id)){docks.delete(id);await d.close();}
 for(const m of all){let d=docks.get(m.id);if(!d){d=new TrackerDock(m.id);docks.set(m.id,d);}await d.render({force:true});}
}
function wedges(n,value){const result=[];const r=91,c=110,gap=.012;for(let i=0;i<n;i++){const a=-Math.PI/2+i*2*Math.PI/n+gap,b=-Math.PI/2+(i+1)*2*Math.PI/n-gap;const x=t=>(c+r*Math.cos(t)).toFixed(3),y=t=>(c+r*Math.sin(t)).toFixed(3);result.push({index:i,filled:i<value,path:`M ${c} ${c} L ${x(a)} ${y(a)} A ${r} ${r} 0 ${b-a>Math.PI?1:0} 1 ${x(b)} ${y(b)} Z`});}return result;}
const API=foundry.applications.api;
class TrackerDock extends API.HandlebarsApplicationMixin(API.ApplicationV2){
 static DEFAULT_OPTIONS={id:'engrena-tensao-perigo-dock',tag:'section',classes:['engrena-tensao-perigo'],window:{frame:false,positioned:false},position:{width:440,height:'auto'}};
 static PARTS={main:{template:`modules/${ID}/templates/dock.hbs`}};
 constructor(markerId){super({id:`engrena-tensao-perigo-${markerId}`});this.markerId=markerId;}
 async _prepareContext(){const s=getState(this.markerId);const isGM=game.user.isGM;return {...s,isGM,expanded:s.visible,isPanel:s.mode==='panel',counter:s.mode==='panel'?`${s.tracks.length} trilhas`:s.mode==='clock'?`${s.clockFilled}/${s.clockCount}`:`${s.leftFilled}/${s.leftCount} · ${s.rightFilled}/${s.rightCount}`,isBar:s.mode==='bar',panelTracks:s.tracks.map((t,index)=>({...t,index,value:`${t.filled}/${t.count}`,segments:Array.from({length:t.count},(_,i)=>({index:i,number:i+1,filled:i<t.filled}))})),leftValue:`${s.leftFilled}/${s.leftCount}`,rightValue:`${s.rightFilled}/${s.rightCount}`,clockValue:s.clockFilled,clockComplete:s.clockFilled===s.clockCount,centerColor:s.centerWinner==='left'?s.leftColor:s.centerWinner==='right'?s.rightColor:null,centerIcon:s.centerWinner==='left'?iconGlyph(s.leftIcon):s.centerWinner==='right'?iconGlyph(s.rightIcon):null,clockCenterIcon:s.clockFilled===s.clockCount?iconGlyph(s.clockIcon):null,leftSegments:Array.from({length:s.leftCount},(_,i)=>({index:i,number:i+1,filled:i<s.leftFilled})),rightSegments:Array.from({length:s.rightCount},(_,i)=>({index:i,number:i+1,filled:i<s.rightFilled})).reverse(),clockSegments:wedges(s.clockCount,s.clockFilled),stepSize:s.stepSize};}
 _onRender(context,options){super._onRender(context,options);applyWidth(this.markerId);restorePosition(this.markerId);applySavedHeight(this.markerId);attachDrag(this.markerId);attachResize(this.markerId);this.element.querySelectorAll('[data-etp]').forEach(el=>{el.addEventListener('click',async ev=>{const changeHere=patch=>change(patch,this.markerId);const cmd=el.dataset.etp;if(!game.user.isGM)return;const s=getState(this.markerId);if(cmd==='configure')return configure(this.markerId);if(cmd==='switch')return changeHere({mode:s.mode==='bar'?'clock':s.mode==='clock'?'panel':'bar'});if(cmd==='toggle')return changeHere({visible:!s.visible});if(cmd==='left'||cmd==='right'||cmd==='clock'){const key=cmd==='clock'?'clockFilled':cmd==='left'?'leftFilled':'rightFilled';const index=Number(el.dataset.index);return changeHere({[key]:s[key]===index+1?index:index+1});}if(cmd==='track-step'||cmd==='track-cell'){
 const ti=Number(el.dataset.track);if(!Number.isInteger(ti)||ti<0||ti>=s.tracks.length)return;
 const tracks=s.tracks.map(t=>({...t}));const t=tracks[ti];
 if(cmd==='track-step')t.filled=clamp(t.filled+Number(el.dataset.delta)*(el.dataset.multiple==='true'?s.stepSize:1),0,t.count);
 else {const index=Number(el.dataset.index);if(!Number.isInteger(index)||index<0||index>=t.count)return;t.filled=t.filled===index+1?index:index+1;}
 return changeHere({tracks});
 }
 if(cmd==='reset')return changeHere(s.mode==='bar'?{leftFilled:0,rightFilled:0,centerWinner:null}:s.mode==='clock'?{clockFilled:0}:{tracks:s.tracks.map(t=>({...t,filled:0}))});if(cmd==='increase'||cmd==='decrease'||cmd==='left-increase'||cmd==='left-decrease'||cmd==='right-increase'||cmd==='right-decrease'){const direction=(cmd.endsWith('increase')?1:-1)*(el.dataset.multiple==='true'?s.stepSize:1);if(s.mode==='clock')return changeHere({clockFilled:s.clockFilled+direction});const side=cmd.startsWith('right-')?'right':'left';const key=`${side}Filled`;return changeHere({[key]:s[key]+direction});}});});}
}
function trackFields(s){
 const rows=s.tracks.map(t=>({...t}));
 return `<fieldset class="etp-track-fields"><legend>Painel — trilhas independentes (até ${MAX_TRACKS})</legend><p class="etp-help">Cada trilha tem nome, descrição, cor e meta próprios. Para acrescentar uma, use “Adicionar trilha” ao final.</p>
 <div class="etp-track-editor" id="etp-track-editor">${rows.map(trackRow).join('')}</div>
 <button type="button" class="etp-add-track" id="etp-add-track">+ Adicionar trilha</button></fieldset>`;
}
function trackRow(t){
 const esc=x=>foundry.utils.escapeHTML(String(x??''));
 return `<div class="etp-track-editor-row" data-track-id="${esc(t.id)}">
  <div class="etp-track-editor-head"><strong>Trilha</strong><button type="button" class="etp-remove-track" title="Remover esta trilha">Remover</button></div>
  ${field('Nome',`<input class="etp-track-label" maxlength="60" value="${esc(t.label)}">`)}
  ${field('Descrição',`<input class="etp-track-description" maxlength="220" value="${esc(t.description)}">`)}
  ${field('Meta de segmentos',`<input class="etp-track-count" type="number" min="1" max="30" value="${t.count}">`)}
  ${field('Cor',`<input class="etp-track-color" type="color" value="${t.color}">`)}
  ${field('Consequência ao concluir',`<textarea class="etp-track-completion" maxlength="600" rows="2">${esc(t.completion||'')}</textarea>`)}
 </div>`;
}
function field(label,input){return `<label class="etp-form-row"><span>${label}</span>${input}</label>`;}
function iconPicker(fieldName,selected,title){
 const available=[{id:'none',label:'Nenhum',glyph:'∅'},...Object.entries(ICONS).map(([id,info])=>({id,...info}))];
 return `<div class="etp-picker"><div class="etp-picker-title">${title}</div><div class="etp-icon-gallery" role="group" aria-label="${title}">${available.map(opt=>`<label class="etp-icon-option" title="${opt.label}"><input type="radio" name="${fieldName}" value="${opt.id}" ${selected===opt.id?'checked':''}><span class="etp-icon-choice"><span class="etp-option-glyph" aria-hidden="true">${opt.glyph}</span><span class="etp-option-name">${opt.label}</span></span></label>`).join('')}</div></div>`;
}

async function configure(markerId){if(!game.user.isGM)return;const s=getState(markerId);const content=`<div class="etp-main-scroll" role="region" aria-label="Todas as configurações de tensão e perigo" tabindex="0" style="height:min(55vh,520px);max-height:520px;min-height:240px;overflow-y:scroll;overflow-x:hidden;box-sizing:border-box;padding:8px 14px 14px 4px;scrollbar-gutter:stable"><div class="etp-config" id="etp-settings-fields">
${field('Título',`<input name="title" maxlength="80" value="${foundry.utils.escapeHTML(s.title)}">`)}
${field('Formato',`<select name="mode"><option value="bar" ${s.mode==='bar'?'selected':''}>Barra de tensão</option><option value="clock" ${s.mode==='clock'?'selected':''}>Relógio de perigo</option><option value="panel" ${s.mode==='panel'?'selected':''}>Painel de progresso</option></select>`)}
<fieldset><legend>Barra — lados independentes</legend>
${field('Nome lado esquerdo',`<input name="leftLabel" maxlength="40" value="${foundry.utils.escapeHTML(s.leftLabel)}">`)}
${field('Casas esquerda',`<input name="leftCount" type="number" min="1" max="20" value="${s.leftCount}">`)}
${field('Cor esquerda',`<input name="leftColor" type="color" value="${s.leftColor}">`)}
${field('Nome lado direito',`<input name="rightLabel" maxlength="40" value="${foundry.utils.escapeHTML(s.rightLabel)}">`)}
${field('Casas direita',`<input name="rightCount" type="number" min="1" max="20" value="${s.rightCount}">`)}
${field('Cor direita',`<input name="rightColor" type="color" value="${s.rightColor}">`)}
${iconPicker('leftIcon',s.leftIcon,'Ícone do lado esquerdo')}${iconPicker('rightIcon',s.rightIcon,'Ícone do lado direito')}</fieldset>
<fieldset><legend>Relógio de perigo</legend>
${field('Segmentos',`<input name="clockCount" type="number" min="1" max="20" value="${s.clockCount}">`)}
${field('Cor do relógio',`<input name="clockColor" type="color" value="${s.clockColor}">`)}${iconPicker('clockIcon',s.clockIcon,'Ícone ao concluir o relógio')}</fieldset>
<fieldset><legend>Eventos narrativos e vínculos (opcionais)</legend>
<p class="etp-help">Os eventos são disparados quando uma meta é atingida, não a cada atualização. O vínculo executa apenas um salto por conclusão.</p>
${field('Avanço rápido (casas)',`<input name="stepSize" type="number" min="1" max="10" value="${s.stepSize}">`)}
${field('Conclusão da ameaça',`<textarea name="completionLeft" maxlength="600" rows="2">${foundry.utils.escapeHTML(s.completionLeft)}</textarea>`)}
${field('Conclusão dos heróis',`<textarea name="completionRight" maxlength="600" rows="2">${foundry.utils.escapeHTML(s.completionRight)}</textarea>`)}
${field('Conclusão do relógio',`<textarea name="completionClock" maxlength="600" rows="2">${foundry.utils.escapeHTML(s.completionClock)}</textarea>`)}
${field('Mensagem de conclusão',`<select name="completionVisibility"><option value="public" ${s.completionVisibility==='public'?'selected':''}>Para todos (chat)</option><option value="gm" ${s.completionVisibility==='gm'?'selected':''}>Somente mestres (chat)</option></select>`)}
${field('Marcador vinculado',`<select name="linkedMarkerId"><option value="">Nenhum</option>${getCollection().filter(t=>t.id!==markerId).map(t=>`<option value="${foundry.utils.escapeHTML(t.id)}" ${s.linkedMarkerId===t.id?'selected':''}>${foundry.utils.escapeHTML(t.title)}</option>`).join('')}</select>`)}
${field('Quando concluir',`<select name="linkedAction"><option value="none" ${s.linkedAction==='none'?'selected':''}>Não alterar outro marcador</option><option value="reveal" ${s.linkedAction==='reveal'?'selected':''}>Exibir marcador vinculado</option><option value="advance" ${s.linkedAction==='advance'?'selected':''}>Avançar marcador vinculado</option></select>`)}
${field('Casas a avançar no vínculo',`<input name="linkedAmount" type="number" min="1" max="10" value="${s.linkedAmount}">`)}
</fieldset>
${trackFields(s)}
<label class="etp-show"><input type="checkbox" name="visible" ${s.visible?'checked':''}> Exibir para todos os jogadores</label>
</div></div>`;
const dialog=API.DialogV2;const dialogPromise=dialog.wait({classes:['etp-config-dialog'],window:{title:`Engrena — Configurar: ${s.title}`},position:{width:690},content,buttons:[{action:'cancel',label:'Cancelar'},{action:'save',label:'Salvar',default:true,callback:async(event,button,dlg)=>{const root=dlg?.element?.querySelector?.('#etp-settings-fields') ?? document.querySelector('.etp-config-dialog #etp-settings-fields');
if(!root){ui.notifications.error('Painel de configuração não encontrado. Verifique se a versão instalada está atualizada.');return false;}
// DialogV2 pode envolver o conteúdo em um form próprio: lemos o painel sem criar forms aninhados.
const fd=new FormData();
for(const control of root.querySelectorAll('input[name], select[name], textarea[name]')){
 if(control.disabled || ((control.type==='radio'||control.type==='checkbox')&&!control.checked))continue;
 fd.set(control.name,control.value);
}const tracks=[...root.querySelectorAll('.etp-track-editor-row')].map((row,i)=>{
 const old=s.tracks.find(t=>t.id===row.dataset.trackId);
 const count=clamp(Math.round(row.querySelector('.etp-track-count')?.value||6),1,30);
 return {id:row.dataset.trackId||`track-${Date.now()}-${i}`,label:row.querySelector('.etp-track-label')?.value||`Trilha ${i+1}`,description:row.querySelector('.etp-track-description')?.value||'',color:row.querySelector('.etp-track-color')?.value||'#668f85',completion:row.querySelector('.etp-track-completion')?.value||'',count,filled:Math.min(old?.filled||0,count)};
 });
 await change({tracks,title:fd.get('title'),mode:fd.get('mode'),stepSize:fd.get('stepSize'),completionLeft:fd.get('completionLeft'),completionRight:fd.get('completionRight'),completionClock:fd.get('completionClock'),completionVisibility:fd.get('completionVisibility'),linkedMarkerId:fd.get('linkedMarkerId'),linkedAction:fd.get('linkedAction'),linkedAmount:fd.get('linkedAmount'),leftLabel:fd.get('leftLabel'),leftCount:fd.get('leftCount'),leftColor:fd.get('leftColor'),rightLabel:fd.get('rightLabel'),rightCount:fd.get('rightCount'),rightColor:fd.get('rightColor'),leftIcon:fd.get('leftIcon'),rightIcon:fd.get('rightIcon'),clockIcon:fd.get('clockIcon'),clockCount:fd.get('clockCount'),clockColor:fd.get('clockColor'),visible:fd.has('visible')},markerId);return true;}}]});
 await dialogPromise;
}
Hooks.on('getSceneControlButtons',controls=>{
 const token=controls.tokens;if(!token)return;
 token.tools ||= {};
 token.tools.engrenaTensaoPerigo={name:'engrenaTensaoPerigo',title:'Gerenciar barras, relógios e trilhas',icon:'fa-solid fa-hourglass-half',order:Object.keys(token.tools).length+1,button:true,visible:game.user.isGM,onChange:()=>openManager()};
});
Hooks.once('init',()=>{
 game.settings.register(ID,'state',{name:'Estado legado',scope:'world',config:false,type:Object,default:structuredClone(DEFAULT)});
 game.settings.register(ID,'markers',{name:'Marcadores independentes',scope:'world',config:false,type:Array,default:[],onChange:()=>refreshDocks()});
});
async function openManager(){
 if(!game.user.isGM)return;
 const esc=x=>foundry.utils.escapeHTML(String(x??''));
 const list=getCollection();
 const rows=list.map(t=>`<div class="etp-manager-row" data-marker="${esc(t.id)}">
  <div class="etp-manager-summary"><strong>${esc(t.title)}</strong><small>${t.mode==='bar'?'Barra':t.mode==='clock'?'Relógio':'Painel de trilhas'} · ${t.visible?'Visível':'Oculto'}</small></div>
  <button type="button" data-act="visibility">${t.visible?'Ocultar':'Exibir'}</button>
  <button type="button" data-act="configure">⚙ Configurar</button>
  <button type="button" data-act="duplicate">Duplicar</button>
  <button type="button" data-act="delete" title="Excluir marcador">Excluir</button>
 </div>`).join('');
 const content=`<div class="etp-manager"><p>Prepare diferentes marcadores e exiba vários simultaneamente. Progresso e visibilidade são independentes.</p>
 <div class="etp-manager-list">${rows}</div>
 <div class="etp-manager-create"><button data-create="bar">+ Barra</button><button data-create="clock">+ Relógio</button><button data-create="panel">+ Painel de trilhas</button></div>
 </div>`;
 await API.DialogV2.wait({classes:['etp-manager-dialog'],window:{title:'Engrena — Biblioteca de marcadores'},position:{width:830},content,
 buttons:[{action:'close',label:'Fechar',default:true}]});
}
async function onManagerClick(e){
 const btn=e.target.closest?.('.etp-manager-dialog [data-act],.etp-manager-dialog [data-create]');if(!btn||!game.user.isGM)return;
 e.preventDefault();const markerId=btn.closest('[data-marker]')?.dataset.marker;
 const action=btn.dataset.act;
 if(action==='delete'){
  const marker=getState(markerId);
  const yes=await API.DialogV2.confirm({window:{title:'Excluir marcador?'},content:`Excluir “${foundry.utils.escapeHTML(marker.title)}”? Esta ação remove também seu progresso.`,yes:{label:'Excluir'},no:{label:'Cancelar'}});
  if(!yes)return;
  await removeMarker(markerId);
 }else if(action==='visibility')await change({visible:!getState(markerId).visible},markerId);
 else if(action==='duplicate')await createMarker('clock',markerId);
 else if(action==='configure'){document.querySelector('.etp-manager-dialog .window-header button[aria-label="Close"]')?.click();await configure(markerId);return;}
 else if(btn.dataset.create)await createMarker(btn.dataset.create);
 // Atualize o conteúdo da lista sem fechar a janela de gerenciamento.
 const root=btn.closest('.etp-manager-dialog');
 if(root){const rows=root.querySelector('.etp-manager-list');if(rows){const esc=x=>foundry.utils.escapeHTML(String(x??''));rows.innerHTML=getCollection().map(t=>`<div class="etp-manager-row" data-marker="${esc(t.id)}"><div class="etp-manager-summary"><strong>${esc(t.title)}</strong><small>${t.mode==='bar'?'Barra':t.mode==='clock'?'Relógio':'Painel de trilhas'} · ${t.visible?'Visível':'Oculto'}</small></div><button type="button" data-act="visibility">${t.visible?'Ocultar':'Exibir'}</button><button type="button" data-act="configure">⚙ Configurar</button><button type="button" data-act="duplicate">Duplicar</button><button type="button" data-act="delete">Excluir</button></div>`).join('');}}
}
// Delegação garante que Adicionar/Remover funcionem mesmo quando o DialogV2 renderiza tardiamente.
function onConfigTrackClick(e){
 const add=e.target.closest?.('.etp-config-dialog #etp-add-track');
 const remove=e.target.closest?.('.etp-config-dialog .etp-remove-track');
 if(remove){e.preventDefault();remove.closest('.etp-track-editor-row')?.remove();return;}
 if(!add)return;
 e.preventDefault();
 const root=add.closest('.etp-track-fields')?.querySelector('#etp-track-editor');
 if(!root)return;
 if(root.children.length>=MAX_TRACKS){ui.notifications.warn(`Máximo de ${MAX_TRACKS} trilhas.`);return;}
 const id=`track-${Date.now()}-${Math.floor(Math.random()*100000)}`;
 root.insertAdjacentHTML('beforeend',trackRow({id,label:`Trilha ${root.children.length+1}`,description:'',count:6,filled:0,color:'#668f85',completion:''}));
 root.lastElementChild?.scrollIntoView({block:'nearest'});
}
Hooks.once('ready',async()=>{
 document.addEventListener('click',onConfigTrackClick);
 document.addEventListener('click',onManagerClick);
 window.addEventListener('resize',()=>{for(const id of docks.keys()){applyWidth(id);restorePosition(id);applySavedHeight(id);}});
 if(game.user.isGM && getCollection().length===0){
  const legacy=normalized(game.settings.get(ID,'state'));
  await saveCollection([{id:makeId(),...legacy}]);
 }
 await refreshDocks();
 game.socket?.on(`module.${ID}`,payload=>{if(payload?.type==='refresh')refreshDocks();});
 game.engrenaTensaoPerigo={open:openManager,create:createMarker,configure,change,getState,list:getCollection};
});
