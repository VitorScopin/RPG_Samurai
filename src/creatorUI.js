import {
  PRESETS,COLOR_OPTIONS,DEFAULT_CHARACTER,
  normalizeCharacter,saveCharacter,applyCharacterAppearance
} from './characterCustomization.js';

const $=selector=>document.querySelector(selector);
const HATS=[
  ['none','SEM ACESSÓRIO'],
  ['band','HACHIMAKI'],
  ['hat','CHAPÉU KASA'],
  ['mask','MÁSCARA']
];
function makeButton(className,label){
  const b=document.createElement('button');
  b.type='button';b.className=className;b.textContent=label;
  return b;
}
export function setupCharacterCreator({actor,onConfirm,onCancel}){
  let draft=normalizeCharacter(DEFAULT_CHARACTER);
  let active=false,dragging=false,lastX=0,rotateVelocity=0;
  const overlay=$('#creator');
  const name=$('#character-name');
  const build=$('#character-build');
  function updateAppearance(){
    applyCharacterAppearance(actor,draft);
    const preset=PRESETS.find(p=>p.id===draft.preset)||PRESETS[0];
    $('#preview-mark').textContent=preset.mark;
    $('#preview-name').textContent=draft.name.toUpperCase();
    $('#preview-class').textContent=preset.name.toUpperCase();
    $('#build-text').textContent=draft.build<.95?'ÁGIL':draft.build>1.05?'ROBUSTO':'EQUILIBRADO';
    build.value=String(draft.build);
    document.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.preset===draft.preset)));
    document.querySelectorAll('[data-color-type]').forEach(b=>b.setAttribute('aria-pressed',String(draft[b.dataset.colorType]===b.dataset.hex)));
    document.querySelectorAll('[data-headwear]').forEach(b=>b.setAttribute('aria-pressed',String(draft.headwear===b.dataset.headwear)));
  }
  for(const preset of PRESETS){
    const b=makeButton('preset-card','');
    b.dataset.preset=preset.id;
    b.setAttribute('aria-label',preset.name+' — '+preset.subtitle);
    const icon=document.createElement('span');icon.className='preset-mark';icon.textContent=preset.mark;
    const meta=document.createElement('span');meta.className='preset-meta';
    const title=document.createElement('strong');title.textContent=preset.name;
    const caption=document.createElement('small');caption.textContent=preset.subtitle;
    meta.append(title,caption);b.append(icon,meta);
    b.addEventListener('click',()=>{
      draft=normalizeCharacter({...draft,preset:preset.id,armor:preset.armor,accent:preset.accent,headwear:preset.headwear,build:preset.build});
      updateAppearance();
    });
    $('#preset-grid').append(b);
  }
  for(const type of ['armor','accent']){
    const parent=$('#'+type+'-swatches');
    for(const color of COLOR_OPTIONS[type]){
      const b=makeButton('color-swatch','');
      b.dataset.colorType=type;b.dataset.hex=color;
      b.setAttribute('aria-label',(type==='armor'?'Armadura':'Detalhes')+' '+color);
      b.style.setProperty('--swatch',color);
      b.addEventListener('click',()=>{draft=normalizeCharacter({...draft,[type]:color});updateAppearance();});
      parent.append(b);
    }
  }
  for(const [id,label] of HATS){
    const b=makeButton('headwear-choice',label);
    b.dataset.headwear=id;
    b.addEventListener('click',()=>{draft=normalizeCharacter({...draft,headwear:id});updateAppearance();});
    $('#headwear-options').append(b);
  }
  name.addEventListener('input',()=>{
    draft=normalizeCharacter({...draft,name:name.value});
    $('#preview-name').textContent=draft.name.toUpperCase();
  });
  build.addEventListener('input',()=>{
    draft=normalizeCharacter({...draft,build:Number(build.value)});
    updateAppearance();
  });
  function open(profile){
    draft=normalizeCharacter(profile||DEFAULT_CHARACTER);
    name.value=draft.name;
    overlay.classList.remove('hidden');
    active=true;dragging=false;rotateVelocity=0;
    actor.model.rotation.y=.25;
    updateAppearance();
    // Name should not automatically focus: it would bring up the mobile keyboard
    // and obscure the full-body model on opening the creator.
  }
  function close(){
    active=false;dragging=false;overlay.classList.add('hidden');
  }
  $('#creator-confirm').addEventListener('click',()=>{
    const result=saveCharacter({...draft,name:name.value});
    close();onConfirm(result);
  });
  $('#creator-cancel').addEventListener('click',()=>{
    close();onCancel();
  });
  $('#rotate-left').addEventListener('click',()=>{actor.model.rotation.y-=Math.PI/4;rotateVelocity=0;});
  $('#rotate-right').addEventListener('click',()=>{actor.model.rotation.y+=Math.PI/4;rotateVelocity=0;});
  const visual=$('.creator-visual');
  visual.addEventListener('pointerdown',event=>{
    if(event.target.closest('button'))return;
    dragging=true;lastX=event.clientX;rotateVelocity=0;
    visual.setPointerCapture?.(event.pointerId);
  });
  visual.addEventListener('pointermove',event=>{
    if(!dragging)return;
    const delta=event.clientX-lastX;lastX=event.clientX;
    actor.model.rotation.y+=delta*.009;
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture'])
    visual.addEventListener(type,()=>{dragging=false;});
  return {
    open,close,refreshAppearance:updateAppearance,
    get active(){return active;},
    setModelStatus(loaded){
      $('#creator-model-status').textContent=loaded?'MODELO 3D DETALHADO · ANIMAÇÕES ATIVAS':'MODELO BÁSICO · RECURSOS INDISPONÍVEIS';
    },
    update(dt){
      if(!active)return;
      actor.model.rotation.y+=(dragging?0:.12*dt);
      if(actor.rigged&&actor.updateRig)actor.updateRig(dt,0,'idle');
    }
  };
}
