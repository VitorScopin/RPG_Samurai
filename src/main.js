import * as THREE from 'three';
import { createWorld } from './world.js';
import { createActor, animateActor } from './actor.js';
import { installRealisticSamurai } from './realisticSamurai.js';
import './style.css';

const $ = (selector) => document.querySelector(selector);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const approach=(current,target,amount)=>current+(target-current)*clamp(amount,0,1);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const SAVE_KEY='kage-no-michi-v1';
const QUESTS=[
  {title:'Um encontro no crepúsculo',desc:'Encontre e converse com Mestre Hideo na aldeia.',label:'Siga o marcador dourado',value:0},
  {title:'Sombras na estrada',desc:'Elimine os três saqueadores que aterrorizam o vale.',label:'Saqueadores derrotados',value:0},
  {title:'A palavra do mestre',desc:'Retorne à aldeia e fale com Mestre Hideo.',label:'Retorne ao seu mentor',value:0},
  {title:'O demônio do santuário',desc:'Encontre e derrote o Oni além dos portais torii.',label:'Oni do santuário',value:0},
  {title:'A honra restaurada',desc:'Volte ao Mestre Hideo e conte sobre a vitória.',label:'Seu mestre aguarda',value:0},
  {title:'O caminho está aberto',desc:'A aldeia está em paz. Explore o vale como um samurai livre.',label:'Capítulo I concluído',value:1}
];
function loadSave() {try{return JSON.parse(localStorage.getItem(SAVE_KEY))||null;}catch{return null;}}
function save() {
  if(!state.started||state.dead)return;
  try{localStorage.setItem(SAVE_KEY,JSON.stringify({
    level:state.level,xp:state.xp,health:state.health,coins:state.coins,
    potions:state.potions,quest:state.quest,kills:state.kills,
    slain:bandits.map(e=>e.dead),bossDead:boss.dead,
    x:hero.model.position.x,z:hero.model.position.z
  }));}catch{/* storage may be blocked */}
}
const canvas=$('#game');
let renderer;
try {
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
  renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.25;
} catch (error) {
  $('#menu').classList.add('hidden');
  $('#help').classList.remove('hidden');
  $('#help').textContent='Este navegador não conseguiu iniciar o WebGL. Verifique a aceleração de hardware.';
  throw error;
}
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(59,innerWidth/innerHeight,.1,260);
const world=createWorld(scene);
const hero=createActor({type:'hero'});
hero.model.position.set(0,0,13);
scene.add(hero.model);
const mentor=createActor({type:'mentor',name:'Mestre Hideo'});
mentor.model.position.set(world.mentor.x,0,world.mentor.z);
mentor.model.rotation.y=Math.PI*.75;
scene.add(mentor.model);
const bandits=world.enemies.map((p,i)=>{
  const actor=createActor({type:'bandit',name:'Saqueador'});
  actor.model.position.set(p.x,0,p.z);
  scene.add(actor.model);
  return {actor,spawn:{...p},health:65,maxHealth:65,dead:false,notice:false,
    cooldown:1+i*.6,attackTime:0,stun:0,velocity:0,walk:0,home:{...p},isBoss:false};
});
const bossActor=createActor({type:'oni',name:'Oni da Montanha'});
bossActor.model.position.set(world.boss.x,0,world.boss.z);
scene.add(bossActor.model);
const boss={actor:bossActor,spawn:{...world.boss},health:230,maxHealth:230,dead:false,notice:false,
  cooldown:1.8,attackTime:0,stun:0,velocity:0,walk:0,home:{...world.boss},isBoss:true};
const enemies=[...bandits,boss];
boss.actor.model.visible=false;
// Load the skinned, textured samurai and authored FBX motions, while retaining
// the procedural meshes as an immediate, offline-safe fallback.
document.body.dataset.samuraiVisual='loading';
installRealisticSamurai([
  {actor:hero,role:'hero'},
  {actor:mentor,role:'mentor'},
  ...bandits.map(e=>({actor:e.actor,role:'bandit'}))
]).then(count=>{
  const ready=count>0&&hero.rigged;
  document.body.dataset.samuraiVisual=ready?'ready':'fallback';
  $('#model-status').textContent=ready?'PERSONAGENS 3D · ANIMAÇÕES ATIVAS':'MODO CLÁSSICO · FALLBACK';
  if(ready&&state.started)toast('PERSONAGENS 3D DETALHADOS CARREGADOS','gold');
}).catch(error=>{
  document.body.dataset.samuraiVisual='fallback';
  $('#model-status').textContent='MODO CLÁSSICO · FALLBACK';
  console.warn('Samurai detalhado não carregou; usando modelos anteriores.',error);
});
const state={
  started:false,paused:true,dead:false,dialogue:false,sound:true,
  level:1,xp:0,health:100,stamina:100,coins:0,potions:3,
  quest:0,kills:0,attackCooldown:0,attackAnim:0,attackHitPending:false,attackHitDelay:0,
  dodgeCooldown:0,dodgeTime:0,invulnerable:0,blockTime:99,healCooldown:0,
  run:false,blocking:false,time:0,uiClock:0,saveClock:0,
  yaw:0,pitch:.26,zoom:10,locked:false,lastMove:0,screenShake:0
};
const keys=new Set();
let dialogueCallback=null;
let audioContext=null;
let hoveringEnemy=null;
const clock=new THREE.Clock();
const camTarget=new THREE.Vector3(0,2,0);
const camDesired=new THREE.Vector3(0,8,13);
const camLook=new THREE.Vector3(0,1.6,0);
let dragging=false,mouseX=0,mouseY=0;
const particles=[];
function makeSound(freq=250,duration=.1,kind='triangle',volume=.04){
  if(!state.sound||!audioContext)return;
  try{
    const o=audioContext.createOscillator(),gain=audioContext.createGain();
    const now=audioContext.currentTime;
    o.type=kind;o.frequency.setValueAtTime(freq,now);
    o.frequency.exponentialRampToValueAtTime(Math.max(50,freq*.55),now+duration);
    gain.gain.setValueAtTime(volume,now);
    gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    o.connect(gain);gain.connect(audioContext.destination);
    o.start(now);o.stop(now+duration);
  }catch{/* audio may be unavailable */}
}
function unlockAudio(){
  if(!audioContext) {
    const Context=window.AudioContext||window.webkitAudioContext;
    if(Context)audioContext=new Context();
  }
  if(audioContext?.state==='suspended')audioContext.resume().catch(()=>{});
}
function toast(message,style=''){
  const el=$('#toast');el.textContent=message;el.className='toast show '+style;
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>el.classList.remove('show'),2700);
}
function numberPopup(p,message,isCrit=false) {
  const element=document.createElement('div');
  element.className='floating-number'+(isCrit?' crit':'');
  element.textContent=message;
  const v=new THREE.Vector3(p.x,2.8,p.z).project(camera);
  element.style.left=clamp((v.x*.5+.5)*innerWidth,16,innerWidth-16)+'px';
  element.style.top=clamp((-v.y*.5+.5)*innerHeight,12,innerHeight-12)+'px';
  $('#app').appendChild(element);
  setTimeout(()=>element.remove(),850);
}
function showDialogue(text,callback) {
  state.dialogue=true;dialogueCallback=callback;
  $('#dialogue-text').textContent=text;$('#dialogue').classList.remove('hidden');
  keys.clear();state.blocking=false;
}
function closeDialogue(){
  if(!state.dialogue)return;
  state.dialogue=false;$('#dialogue').classList.add('hidden');
  const cb=dialogueCallback;dialogueCallback=null;if(cb)cb();
}
$('#dialogue-next').addEventListener('click',closeDialogue);
function maxHealth(){return 100+(state.level-1)*18;}
function expForLevel(){return state.level*105;}
function updateQuest(){
  const q=QUESTS[state.quest];
  $('#quest-title').textContent=q.title;
  $('#quest-description').textContent=q.desc;
  const progress=state.quest===1?state.kills/3:q.value;
  $('#quest-progress-fill').style.width=clamp(progress*100,0,100)+'%';
  $('#quest-progress-label').textContent=state.quest===1?state.kills+' / 3 saqueadores derrotados':q.label;
  boss.actor.model.visible=state.quest>=3&&!boss.dead;
  save();
}
function advanceQuest(next){
  // Pre-quest victories must never soft-lock the first mission.
  if(next===1){
    state.kills=bandits.filter(e=>e.dead).length;
    if(state.kills>=3)next=2;
  }
  state.quest=next;
  updateQuest();makeSound(660,.34,'sine',.07);
  toast(next===5?'CAPÍTULO I CONCLUÍDO — HONRA RESTAURADA':'NOVA ETAPA DA MISSÃO','gold');
}
function talkToMentor() {
  if(state.quest===0) showDialogue('Finalmente nos encontramos, jovem ronin. Saqueadores profanaram nossa terra. Mostre que sua lâmina ainda conhece a honra. Liberte a estrada e volte a mim.',()=>advanceQuest(1));
  else if(state.quest===1) showDialogue('Não deixe que a fúria empunhe sua katana. Observe o inimigo, proteja sua guarda e ataque no instante certo. Os três invasores ainda rondam o vale.');
  else if(state.quest===2) showDialogue('Sua coragem trouxe esperança, mas um mal antigo despertou junto ao santuário. Além dos dois portais vermelhos, um Oni aguarda. Enfrente-o, meu discípulo.',()=>advanceQuest(3));
  else if(state.quest===3) showDialogue('O santuário está ao sul da trilha. O Oni golpeia com força, mas cada ataque revela uma abertura. Use a esquiva, defenda-se e sobreviva.');
  else if(state.quest===4) showDialogue('O vale volta a respirar. Que sua jornada seja longa e sua espada, justa. A partir de hoje, você é guardião destas terras.',()=>advanceQuest(5));
  else showDialogue('A paz floresce como uma cerejeira após o inverno. Caminhe livremente, meu amigo. Que a honra guie sua lâmina.');
  makeSound(320,.14,'sine',.03);
}
function findInteractive(){
  if(!state.started||state.dead)return null;
  if(dist(hero.model.position,mentor.model.position)<3.25)return 'mentor';
  return null;
}
function interact(){
  if(state.paused||state.dialogue||state.dead)return;
  if(findInteractive()==='mentor')talkToMentor();
  else toast('Aproxime-se do Mestre Hideo para conversar.');
}
function addXP(amount){
  state.xp+=amount;
  while(state.xp>=expForLevel()){
    state.xp-=expForLevel();state.level++;
    state.health=Math.min(maxHealth(),state.health+40);
    state.stamina=100;toast('NÍVEL '+state.level+' — SEU ESPÍRITO SE FORTALECEU!','gold');
    makeSound(950,.35,'sine',.06);
  }
}
function effects(x,z,color=0xeec7a4,size=1) {
  const geometry=new THREE.TorusGeometry(1.3*size,.042,5,26,Math.PI*1.15);
  const mat=new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.9,depthWrite:false});
  const o=new THREE.Mesh(geometry,mat);
  o.position.set(x,1.55,z);o.rotation.x=-Math.PI/2;o.rotation.z=hero.model.rotation.y+Math.PI/6;
  scene.add(o);particles.push({o,mat,life:.26,max:.26});
}
function enemyDies(enemy){
  enemy.dead=true;enemy.actor.model.visible=false;
  state.coins+=enemy.isBoss?85:22;
  addXP(enemy.isBoss?200:45);
  makeSound(enemy.isBoss?110:160,.32,'sawtooth',.035);
  if(enemy.isBoss) {if(state.quest===3)advanceQuest(4);toast('O ONI FOI DERROTADO! +200 XP','gold');}
  else {
    if(state.quest===1){
      state.kills=Math.min(3,state.kills+1);
      if(state.kills===3)advanceQuest(2);else updateQuest();
    }
    toast('+45 XP   •   +22 MON','gold');
  }
  save();
}
function damageEnemy(enemy,damage){
  if(enemy.dead||enemy.stun>0.3)return;
  enemy.health=Math.max(0,enemy.health-damage);
  enemy.notice=true;enemy.stun=.23;enemy.attackTime=0;
  numberPopup(enemy.actor.model.position,'−'+damage,damage>=40);
  effects(enemy.actor.model.position.x,enemy.actor.model.position.z,0xffc6a2,.55);
  makeSound(185,.13,'square',.025);
  if(enemy.health<=0)enemyDies(enemy);
}
function attack(){
  if(!state.started||state.paused||state.dialogue||state.dead||state.attackCooldown>0||state.dodgeTime>0)return;
  if(state.stamina<16){toast('Vigor insuficiente. Aguarde a recuperação.');return;}
  state.stamina-=16;
  state.attackCooldown=hero.rigged?.82:.48;
  state.attackAnim=hero.rigged?.72:.30;
  state.attackHitDelay=hero.rigged?.24:.12;
  state.attackHitPending=true;
  state.blocking=false;state.locked=false;
  makeSound(630,.13,'sawtooth',.022);
}
function performHit(){
  const p=hero.model.position;
  effects(p.x-Math.sin(hero.model.rotation.y)*1.45,p.z-Math.cos(hero.model.rotation.y)*1.45,0xe6efff,1);
  const facing=new THREE.Vector2(-Math.sin(hero.model.rotation.y),-Math.cos(hero.model.rotation.y));
  for(const enemy of enemies){
    if(enemy.dead||!enemy.actor.model.visible)continue;
    const ep=enemy.actor.model.position;
    const distance=dist(p,ep);
    if(distance> (enemy.isBoss?3.8:3.15)||distance<.2)continue;
    const toTarget=new THREE.Vector2((ep.x-p.x)/distance,(ep.z-p.z)/distance);
    if(facing.dot(toTarget)<.12)continue;
    const dealt=Math.round(22+state.level*5+Math.random()*12);
    damageEnemy(enemy,dealt);
  }
}
function dodge() {
  if(state.paused||state.dialogue||state.dead||state.dodgeCooldown>0||state.stamina<23)return;
  state.stamina-=23;state.dodgeTime=.30;state.dodgeCooldown=.78;state.invulnerable=.42;
  makeSound(360,.2,'triangle',.035);
}
function heal(){
  if(state.paused||state.dialogue||state.dead||state.healCooldown>0)return;
  if(state.potions<=0){toast('Seus elixires acabaram.');return;}
  if(state.health>=maxHealth()){toast('Sua vida já está completa.');return;}
  state.potions--;state.health=Math.min(maxHealth(),state.health+55);
  state.healCooldown=1;makeSound(790,.25,'sine',.045);toast('ELIXIR USADO — +55 VIDA','gold');save();
}
function damageHero(amount,enemy){
  if(state.invulnerable>0||state.dead)return;
  const ep=enemy.actor.model.position,p=hero.model.position;
  const facing=new THREE.Vector2(-Math.sin(hero.model.rotation.y),-Math.cos(hero.model.rotation.y));
  const distance=dist(p,ep);
  const toward=new THREE.Vector2((ep.x-p.x)/(distance||1),(ep.z-p.z)/(distance||1));
  if(state.blocking&&state.stamina>=8&&facing.dot(toward)>-.2){
    state.stamina=Math.max(0,state.stamina-10);
    if(state.blockTime<.26){enemy.stun=1.15;enemy.notice=true;makeSound(1080,.24,'triangle',.075);toast('APARADA PERFEITA!','gold');numberPopup(ep,'APARADO!',true);}
    else {makeSound(660,.14,'triangle',.03);numberPopup(p,'DEFENDIDO');}
    state.invulnerable=.2;return;
  }
  state.health=Math.max(0,state.health-amount);
  state.invulnerable=.55;state.screenShake=.22;
  $('#damage-flash').classList.add('flash');
  setTimeout(()=>$('#damage-flash').classList.remove('flash'),230);
  numberPopup(p,'−'+amount,true);
  makeSound(105,.25,'sawtooth',.07);
  if(state.health<=0){
    state.dead=true;state.paused=true;state.blocking=false;
    $('#death-screen').classList.remove('hidden');
    toast('SUA JORNADA NÃO TERMINOU...');
  }
}
function resetEnemies() {
  bandits.forEach((e,i)=>{
    e.health=e.maxHealth;e.dead=false;e.notice=false;e.stun=0;e.cooldown=1+i*.5;
    e.actor.model.visible=true;e.actor.model.position.set(e.spawn.x,0,e.spawn.z);
  });
  boss.health=boss.maxHealth;boss.dead=false;boss.stun=0;boss.notice=false;
  boss.actor.model.position.set(boss.spawn.x,0,boss.spawn.z);
  boss.actor.model.visible=state.quest>=3;
}
function applySavedData(data) {
  if(!data)return;
  state.level=clamp(Number(data.level)||1,1,99);
  state.xp=clamp(Number(data.xp)||0,0,expForLevel());
  state.health=clamp(Number(data.health)||100,1,maxHealth());
  state.coins=Math.max(0,Number(data.coins)||0);
  state.potions=Math.max(0,Number.isFinite(Number(data.potions))?Number(data.potions):3);
  state.quest=clamp(Number(data.quest)||0,0,5);
  state.kills=clamp(Number(data.kills)||0,0,3);
  const x=Number(data.x),z=Number(data.z);
  if(Number.isFinite(x)&&Number.isFinite(z)&&!world.collides(x,z))hero.model.position.set(x,0,z);
  if(Array.isArray(data.slain)){
    bandits.forEach((e,i)=>{if(data.slain[i]){e.dead=true;e.health=0;e.actor.model.visible=false;}});
  }
  if(data.bossDead){boss.dead=true;boss.health=0;boss.actor.model.visible=false;}
}
function initFresh(){
  try{localStorage.removeItem(SAVE_KEY);}catch{}
  hero.model.position.set(0,0,13);hero.model.rotation.y=0;
  Object.assign(state,{level:1,xp:0,health:100,stamina:100,coins:0,potions:3,quest:0,kills:0,dead:false,attackCooldown:0,attackAnim:0,attackHitPending:false,attackHitDelay:0,invulnerable:0});
  resetEnemies();
  updateQuest();
}
function startGame(fresh=false){
  unlockAudio();
  if(fresh)initFresh();
  else if(!state.started)applySavedData(loadSave());
  state.started=true;state.paused=false;state.dead=false;
  $('#menu').classList.add('hidden');$('#pause-screen').classList.add('hidden');$('#death-screen').classList.add('hidden');
  $('#hud').classList.remove('hidden');
  updateQuest();updateHUD();toast('O DESTINO AGUARDA, RONIN.','gold');
}
function pauseGame() {
  if(!state.started||state.dead||state.dialogue)return;
  state.paused=!state.paused;
  $('#pause-screen').classList.toggle('hidden',!state.paused);
  if(state.paused){keys.clear();state.blocking=false;save();}
}
function resumeGame(){state.paused=false;$('#pause-screen').classList.add('hidden');}
$('#start-button').addEventListener('click',()=>startGame());
$('#new-game-button').addEventListener('click',()=>startGame(true));
$('#resume-button').addEventListener('click',resumeGame);
$('#back-menu-button').addEventListener('click',()=>{
  save();state.paused=true;$('#pause-screen').classList.add('hidden');$('#menu').classList.remove('hidden');$('#hud').classList.add('hidden');
});
$('#respawn-button').addEventListener('click',()=>{
  state.health=maxHealth();state.stamina=100;state.dead=false;state.paused=false;
  hero.model.position.set(0,0,13);hero.model.rotation.y=0;state.invulnerable=2;
  $('#death-screen').classList.add('hidden');save();toast('O SAMURAI RENASCE.','gold');
});
$('#sound-toggle').addEventListener('click',()=>{
  state.sound=!state.sound;if(state.sound)unlockAudio();
  $('#sound-toggle').textContent=state.sound?'♪':'♩';
});
window.addEventListener('keydown',event=>{
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code))event.preventDefault();
  if(event.repeat && ['KeyE','KeyF','Space','KeyJ','KeyR'].includes(event.code))return;
  if(event.code==='Escape'){if(state.dialogue)closeDialogue();else pauseGame();return;}
  if(!state.started||state.paused||state.dialogue)return;
  keys.add(event.code);
  if(event.code==='KeyJ')attack();
  if(event.code==='Space')dodge();
  if(event.code==='KeyE')interact();
  if(event.code==='KeyF')heal();
  if(event.code==='KeyR'){state.locked=!state.locked;toast(state.locked?'ALVO TRAVADO':'ALVO LIBERADO');}
  if(event.code==='KeyQ'&&!state.blocking){state.blockTime=0;state.blocking=true;}
});
window.addEventListener('keyup',event=>{keys.delete(event.code);if(event.code==='KeyQ')state.blocking=false;});
window.addEventListener('blur',()=>{keys.clear();state.blocking=false;if(state.started&&!state.paused&&!state.dialogue)pauseGame();});
canvas.addEventListener('contextmenu',event=>event.preventDefault());
canvas.addEventListener('pointerdown',event=>{
  if(!state.started||state.paused||state.dialogue||state.dead)return;
  if(event.button===0)attack();
  if(event.button===2){state.blocking=true;state.blockTime=0;}
  dragging=true;mouseX=event.clientX;mouseY=event.clientY;
});
window.addEventListener('pointermove',event=>{
  if(!dragging||!state.started||state.paused||state.dialogue)return;
  state.yaw-=(event.clientX-mouseX)*.006;
  state.pitch=clamp(state.pitch+(event.clientY-mouseY)*.003,-.20,.65);
  mouseX=event.clientX;mouseY=event.clientY;
});
window.addEventListener('pointerup',()=>{dragging=false;state.blocking=keys.has('KeyQ');});
canvas.addEventListener('wheel',event=>{event.preventDefault();state.zoom=clamp(state.zoom+event.deltaY*.008,6,15);},{passive:false});
window.addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
});
document.querySelectorAll('[data-key]').forEach(btn=>{
  const code=btn.dataset.key;
  btn.addEventListener('pointerdown',event=>{event.preventDefault();keys.add(code);});
  for(const type of ['pointerup','pointerleave','pointercancel'])btn.addEventListener(type,()=>keys.delete(code));
});
document.querySelectorAll('[data-action]').forEach(btn=>{
  const type=btn.dataset.action;
  btn.addEventListener('pointerdown',event=>{
    event.preventDefault();
    if(type==='attack')attack();
    if(type==='dodge')dodge();
    if(type==='heal')heal();
    if(type==='interact')interact();
    if(type==='block'){state.blocking=true;state.blockTime=0;}
  });
  for(const eventType of ['pointerup','pointercancel','pointerleave'])btn.addEventListener(eventType,()=>{if(type==='block')state.blocking=false;});
});
const mapCanvas=$('#minimap'),mapCtx=mapCanvas.getContext('2d');
function mapDraw(){
  const ctx=mapCtx,w=216,h=216;
  ctx.clearRect(0,0,w,h);
  const sx=x=>w/2+(x-hero.model.position.x)*2.25;
  const sy=z=>h/2+(z-hero.model.position.z)*2.25;
  ctx.fillStyle='#162824';ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='#7d917655';ctx.lineWidth=2.3;
  const line=[[0,17],[0,7],[0,-6],[3,-14],[7,-23],[9,-37],[11,-49]];
  ctx.beginPath();line.forEach(([x,z],i)=>{if(i===0)ctx.moveTo(sx(x),sy(z));else ctx.lineTo(sx(x),sy(z));});ctx.stroke();
  ctx.strokeStyle='#fff3';ctx.strokeRect(.5,.5,w-1,h-1);
  for(const [x,z] of [[-10,10],[11,9],[12,-2],[-12,-1],[12,-46]]){
    ctx.fillStyle='#aab4a16c';ctx.fillRect(sx(x)-6,sy(z)-4,12,8);
  }
  const marker=(x,z,col,size=4)=>{
    ctx.fillStyle=col;ctx.beginPath();ctx.arc(sx(x),sy(z),size,0,Math.PI*2);ctx.fill();
  };
  if([0,2,4].includes(state.quest))marker(2,8,'#e6c58a',5);
  if(state.quest===3&&!boss.dead)marker(boss.actor.model.position.x,boss.actor.model.position.z,'#f57162',6);
  for(const e of bandits)if(!e.dead)marker(e.actor.model.position.x,e.actor.model.position.z,'#c66459',3.4);
  ctx.save();ctx.translate(w/2,h/2);ctx.rotate(-hero.model.rotation.y);
  ctx.fillStyle='#f4ead4';ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(-6,7);ctx.lineTo(0,3);ctx.lineTo(6,7);ctx.closePath();ctx.fill();ctx.restore();
}
function updateHUD(){
  $('#health-fill').style.width=clamp(state.health/maxHealth()*100,0,100)+'%';
  $('#health-text').textContent=Math.ceil(state.health)+' / '+maxHealth();
  $('#stamina-fill').style.width=state.stamina+'%';
  $('#stamina-text').textContent=Math.round(state.stamina)+' / 100';
  $('#level').textContent='NÍVEL '+state.level;
  $('#xp-fill').style.width=clamp(state.xp/expForLevel()*100,0,100)+'%';
  $('#coins').textContent=state.coins;
  $('#potions').textContent=state.potions;
  const nearby=findInteractive();
  $('#interaction').classList.toggle('visible',!!nearby);
  $('#interaction-text').textContent=nearby==='mentor'?'CONVERSAR COM MESTRE HIDEO':'';
  $('#location').textContent=hero.model.position.z<-30?'SANTUÁRIO DAS SOMBRAS':hero.model.position.z<-8?'CAMINHO DAS CEREJEIRAS':'A ALDEIA DAS CEREJEIRAS';
  const active=enemies.filter(e=>!e.dead&&e.actor.model.visible&&dist(e.actor.model.position,hero.model.position)<13);
  active.sort((a,b)=>dist(a.actor.model.position,hero.model.position)-dist(b.actor.model.position,hero.model.position));
  hoveringEnemy=active[0]||null;
  $('#enemy-label').classList.toggle('visible',!!hoveringEnemy);
  if(hoveringEnemy) {
    $('#enemy-name').textContent=hoveringEnemy.isBoss?'ONI DA MONTANHA · CHEFE':'SAQUEADOR · HOSTIL';
    $('#enemy-health-fill').style.width=hoveringEnemy.health/hoveringEnemy.maxHealth*100+'%';
  }
  mapDraw();
}
function updateMovement(dt){
  const left=keys.has('KeyA')||keys.has('ArrowLeft'),right=keys.has('KeyD')||keys.has('ArrowRight');
  const forward=keys.has('KeyW')||keys.has('ArrowUp'),back=keys.has('KeyS')||keys.has('ArrowDown');
  let mx=(right?1:0)-(left?1:0),mz=(forward?1:0)-(back?1:0);
  const mag=Math.hypot(mx,mz);if(mag){mx/=mag;mz/=mag;}
  const dx=mx*Math.cos(state.yaw)-mz*Math.sin(state.y);
  const dz=-mx*Math.sin(state.yaw)-mz*Math.cos(state.yaw);
  state.run=keys.has('ShiftLeft')||keys.has('ShiftRight');
  const running=state.run&&state.stamina>5&&mag>0;
  const speed=state.dodgeTime>0?13:running?7.3:4.3;
  if(mag>0){
    const yaw=Math.atan2(-dx,-dz);
    const diff=Math.atan2(Math.sin(yaw-hero.model.rotation.y),Math.cos(yaw-hero.model.rotation.y));
    hero.model.rotation.y+=diff*Math.min(dt*13,1);
    state.lastMove=speed;
  } else state.lastMove=approach(state.lastMove,0,dt*14);
  const moveScale=state.dodgeTime>0?1.55:1;
  if((mag||state.dodgeTime>0)&&!state.dialogue) {
    let vx=dx,vz=dz;
    if(state.dodgeTime>0&&!mag){vx=-Math.sin(hero.model.rotation.y);vz=-Math.cos(hero.model.rotation.y);}
    const p=hero.model.position,delta=dt*speed*moveScale;
    if(!world.collides(p.x+vx*delta,p.z))p.x+=vx*delta;
    if(!world.collides(p.x,p.z+vz*delta))p.z+=vz*delta;
  }
  if(running&&state.dodgeTime<=0)state.stamina=Math.max(0,state.stamina-dt*13);
  else if(!state.blocking)state.stamina=Math.min(100,state.stamina+dt*22);
  const action=state.dodgeTime>0?'dodge':state.attackAnim>0?'attack':state.blocking?'block':'idle';
  animateActor(hero,dt,state.lastMove,action,state.invulnerable>.3);
}
function updateEnemy(e,dt) {
  if(e.dead||!e.actor.model.visible)return;
  const p=e.actor.model.position,pp=hero.model.position;
  const distance=dist(p,pp);
  e.cooldown-=dt;e.stun=Math.max(0,e.stun-dt);
  e.attackTime=Math.max(0,e.attackTime-dt);
  if(distance<(e.isBoss?18:13))e.notice=true;
  let walking=0,acting='idle';
  if(e.notice&&distance>2.2&&distance<33&&e.stun===0) {
    const speed=e.isBoss?2.4:2.35;
    const dx=(pp.x-p.x)/(distance||1),dz=(pp.z-p.z)/(distance||1);
    const nextX=p.x+dx*speed*dt,nextZ=p.z+dz*speed*dt;
    if(!world.collides(nextX,nextZ,.3)){p.x=nextX;p.z=nextZ;walking=speed;}
  }
  if(e.notice&&distance<= (e.isBoss?3.45:2.35)&&e.cooldown<=0&&e.stun===0&&!state.dead) {
    e.attackTime=.60;
    e.cooldown=e.isBoss?2.6:1.7+Math.random()*.5;
    if(distance<4.1) {
      // Telegraph provides a reaction window before damage resolves.
      setTimeout(()=>{
        if(!state.dead&&!state.paused&&!state.dialogue&&!e.dead&&e.actor.model.visible&&dist(e.actor.model.position,hero.model.position)<(e.isBoss?4.05:2.8)&&e.stun===0){
          damageHero(e.isBoss?34:17,e);
        }
      },430);
    }
    makeSound(e.isBoss?95:170,.24,'sawtooth',.025);
  }
  if(e.notice) {
    const target=Math.atan2(-(pp.x-p.x),-(pp.z-p.z));
    const difference=Math.atan2(Math.sin(target-e.actor.model.rotation.y),Math.cos(target-e.actor.model.rotation.y));
    e.actor.model.rotation.y+=difference*clamp(dt*7,0,1);
  }
  if(e.attackTime>0)acting='attack';
  animateActor(e.actor,dt,walking,acting,e.stun>0);
  if(!e.isBoss&&distance>35&&e.notice){e.notice=false;}
}
function tick(){
  const dt=Math.min(clock.getDelta(),.05);
  const time=clock.elapsedTime;
  world.update(time,dt);
  const active=state.started&&!state.paused&&!state.dead&&!state.dialogue;
  if(active){
    state.time+=dt;state.uiClock+=dt;state.saveClock+=dt;
    state.attackCooldown=Math.max(0,state.attackCooldown-dt);
    state.attackAnim=Math.max(0,state.attackAnim-dt);
    if(state.attackHitPending){
      state.attackHitDelay-=dt;
      if(state.attackHitDelay<=0){state.attackHitPending=false;performHit();}
    }
    state.dodgeTime=Math.max(0,state.dodgeTime-dt);
    state.dodgeCooldown=Math.max(0,state.dodgeCooldown-dt);
    state.invulnerable=Math.max(0,state.invulnerable-dt);
    state.healCooldown=Math.max(0,state.healCooldown-dt);
    state.blockTime+=dt;
    state.screenShake=Math.max(0,state.screenShake-dt);
    updateMovement(dt);
    for(const e of enemies)updateEnemy(e,dt);
    if(state.uiClock>.10){updateHUD();state.uiClock=0;}
    if(state.saveClock>10){save();state.saveClock=0;}
  } else {
    animateActor(hero,dt*.3,0,'idle');
  }
  animateActor(mentor,dt*.3,0);
  particles.forEach((p,i)=>{
    p.life-=dt;p.mat.opacity=clamp(p.life/p.max,0,1);
    p.o.scale.setScalar(1+(1-p.life/p.max)*.45);
    if(p.life<=0){scene.remove(p.o);p.o.geometry.dispose();p.mat.dispose();particles.splice(i,1);}
  });
  if(state.locked&&active){
    const target=enemies.filter(e=>!e.dead&&e.actor.model.visible).sort((a,b)=>dist(a.actor.model.position,hero.model.position)-dist(b.actor.model.position,hero.model.position))[0];
    if(target&&dist(target.actor.model.position,hero.model.position)<18){
      const dx=target.actor.model.position.x-hero.model.position.x,dz=target.actor.model.position.z-hero.model.position.z;
      const targetYaw=Math.atan2(-dx,-dz);
      const diff=Math.atan2(Math.sin(targetYaw-state.yaw),Math.cos(targetYaw-state.yaw));
      state.yaw+=diff*Math.min(dt*3,1);
    }
  }
  const p=hero.model.position;
  const angle=state.yaw,zoom=state.zoom;
  camDesired.set(p.x+Math.sin(angle)*zoom,5.3+zoom*.22+state.pitch*4,p.z+Math.cos(angle)*zoom);
  const follow=1-Math.exp(-dt*5.5);
  camera.position.lerp(camDesired,follow);
  camTarget.set(p.x,1.6,p.z);
  camLook.lerp(camTarget,follow);
  if(state.screenShake>0){camera.position.x+=(Math.random()-.5)*state.screenShake*.7;camera.position.y+=(Math.random()-.5)*state.screenShake*.4;}
  camera.lookAt(camLook);
  renderer.render(scene,camera);
}
renderer.setAnimationLoop(tick);
camera.position.set(0,8,24);camera.lookAt(0,1,5);
mapDraw();
if(import.meta.env.DEV){
  window.__kageDebug=()=>{
    const character=hero.model.children.find(c=>c.name==='DetailedSamurai');
    const rig=character?.children.find(c=>c.isGroup||c.isObject3D);
    const bounds=character?new THREE.Box3().setFromObject(character):null;
    const size=bounds?bounds.getSize(new THREE.Vector3()):null;
    return {
      hero:{x:hero.model.position.x,y:hero.model.position.y,z:hero.model.position.z,angle:hero.model.rotation.y},
      camera:{x:camera.position.x,y:camera.position.y,z:camera.position.z,up:camera.up.toArray()},
      cameraDistance:camera.position.distanceTo(hero.model.position),
      rigLoaded:hero.rigged||false,
      rigWorldSize:size?size.toArray():null,
      skeletonHips:rig?.getObjectByName('mixamorigHips')?.position.toArray()||null,
      moveSpeed:state.lastMove,
      yaw:state.yaw,
      elapsed:state.time
    };
  };
}

