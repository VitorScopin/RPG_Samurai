/**
 * Automated browser smoke test for the skinned/animated Samurai.
 * CI runs this after npm run build downloads the licensed assets.
 */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({
  headless:true,
  args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
});
const page=await browser.newPage({viewport:{width:1280,height:800}});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('console',message=>{if(message.type()==='error')errors.push(message.text());if(['warning','warn','error'].includes(message.type()))console.log('BROWSER '+message.type()+': '+message.text());});
try{
  let available=false;
  for(let attempt=0;attempt<40;attempt++){
    try{await page.goto('http://127.0.0.1:5173/',{waitUntil:'domcontentloaded',timeout:4000});available=true;break;}
    catch{await new Promise(resolve=>setTimeout(resolve,250));}
  }
  assert(available,'Vite did not start');
  await page.waitForFunction(
    ()=>['ready','fallback'].includes(document.body.dataset.samuraiVisual),
    {timeout:90000}
  );
  const status=await page.evaluate(()=>document.body.dataset.samuraiVisual);
  console.log('Character status:',status);
  console.log('Character exception:',await page.evaluate(()=>document.body.dataset.characterError||'none'));
  assert.equal(status,'ready','Realistic model and animations should load');
  const enemies=await page.evaluate(()=>window.__kageEnemies?.());
  console.log('THREE ENEMY ARCHETYPES',JSON.stringify(enemies));
  assert.equal(enemies?.length,3,'Three enemy types should spawn');
  assert.deepEqual(enemies.map(e=>e.id),['shinobi','ashigaru','cursed']);
  assert(enemies.every(e=>e.rigged),'Every enemy must have an animated, skinned rig');
  assert(enemies.every(e=>e.bones>30&&e.skinned>=1),'All enemies have skeletal models');
  assert(enemies.every(e=>e.equippedKind===e.id),'Each class has its own 3D armor and weapon equipment');
  assert(enemies.every(e=>e.accessories>10),'Each model has distinctive mesh geometry');
  assert(enemies[0].speed>enemies[1].speed,'Shinobi is fastest');
  assert(enemies[1].range>enemies[0].range,'Ashigaru has longest attack reach');
  assert(enemies[2].health>enemies[1].health&&enemies[2].damage>enemies[1].damage,'Cursed Ronin is tanky and hard-hitting');

  await page.locator('#start-button').click();
  assert(await page.locator('#creator').isVisible(),'First launch must open the creator');
  assert.equal(await page.locator('[data-preset]').count(),6,'Six preset choices available');
  await page.locator('#character-name').fill('Takeda');
  await page.locator('[data-preset="crimson"]').click();
  await page.locator('[data-headwear="hat"]').click();
  await page.locator('[data-color-type="armor"][data-hex="#354c3d"]').click();
  await page.waitForTimeout(280);
  const previewState=await page.evaluate(()=>({
    visible:!document.querySelector('#creator').classList.contains('hidden'),
    title:document.querySelector('#preview-name').textContent,
    preset:document.querySelector('#preview-class').textContent,
    model:document.querySelector('#creator-model-status').textContent
  }));
  console.log('CHARACTER PREVIEW',JSON.stringify(previewState));
  assert.equal(previewState.title,'TAKEDA');
  assert(previewState.model.includes('DETALHADO'),'Preview should use rigged detailed model');
  await page.locator('#creator-confirm').click();
  assert(await page.locator('#hud').isVisible(),'Confirm should start RPG');
  const savedProfile=await page.evaluate(()=>JSON.parse(localStorage.getItem('kage-no-michi-character-v1')));
  console.log('SAVED CHARACTER',JSON.stringify(savedProfile));
  assert.equal(savedProfile.name,'Takeda');
  assert.equal(savedProfile.preset,'crimson');
  assert.equal(savedProfile.headwear,'hat');
  assert.equal(savedProfile.armor,'#354c3d');
  assert.equal(await page.locator('#player-name').textContent(),'TAKEDA');
  async function snapshot(label,imageCheck=true){
    let pixels=null;
    if(imageCheck){
    const buffer=await page.screenshot();
    const image=buffer.toString('base64');
    pixels=await page.evaluate(async(base64)=>{
      const img=new Image();
      img.src='data:image/png;base64,'+base64;
      await img.decode();
      const off=document.createElement('canvas');off.width=img.width;off.height=img.height;
      const ctx=off.getContext('2d');ctx.drawImage(img,0,0);
      const {data,width,height}=ctx.getImageData(0,0,img.width,img.height);
      const values=[];let sum=0,square=0,gray=0,nearSky=0;
      for(let y=Math.floor(height*.25);y<Math.floor(height*.75);y+=8){
        for(let x=Math.floor(width*.23);x<Math.floor(width*.77);x+=8){
          const i=(y*width+x)*4;
          const r=data[i],g=data[i+1],b=data[i+2],l=(r+g+b)/3;
          sum+=l;square+=l*l;gray+=(Math.abs(r-g)+Math.abs(g-b)<15?1:0);
          nearSky+=(r>80&&g>90&&b>90&&Math.abs(g-b)<30?1:0);
          values.push(l);
        }
      }
      const mean=sum/values.length;
      return {mean:Math.round(mean),std:Math.round(Math.sqrt(Math.max(0,square/values.length-mean*mean))),grayFraction:Math.round(gray/values.length*100),skyFraction:Math.round(nearSky/values.length*100)};
    },image);
    }
    const debug=await page.evaluate(()=>window.__kageDebug?.());
    console.log('DIAG '+label,JSON.stringify({pixels,debug}));
    assert(debug,'Expected debug movement snapshot');
    for(const [name,value] of Object.entries({
      playerX:debug.hero.x,playerZ:debug.hero.z,heading:debug.hero.angle,
      cameraX:debug.camera.x,cameraY:debug.camera.y,cameraZ:debug.camera.z,
      cameraDistance:debug.cameraDistance
    })){
      assert(Number.isFinite(value),label+': '+name+' must be finite (got '+value+')');
    }
    if(imageCheck){
      assert(pixels.std>12,label+': viewport has collapsed into a flat gray image');
      assert(pixels.skyFraction<90,label+': almost the entire view is gray fog/sky');
    }
    return {pixels,debug};
  }
  await snapshot('starting');
  for(const k of ['w','a','s','d']){
    await page.keyboard.down(k);
    await page.waitForTimeout(850);
    await page.keyboard.up(k);
    await snapshot('key '+k,false);
  }
  await page.keyboard.down('Shift');
  await page.keyboard.down('w');
  await page.waitForTimeout(1200);
  await page.keyboard.up('w');
  await page.keyboard.up('Shift');
  await snapshot('sprint');

  await page.keyboard.down('w');
  await page.waitForTimeout(1600);
  await page.keyboard.up('w');
  await page.keyboard.down('Shift');
  await page.keyboard.down('w');
  await page.waitForTimeout(650);
  await page.keyboard.up('w');
  await page.keyboard.up('Shift');
  await page.keyboard.press('j');
  await page.waitForTimeout(1100);
  await page.screenshot({path:'/tmp/kage-realistic-smoke.png'});
  const stats=await page.evaluate(()=>({
    hudVisible:!document.querySelector('#hud')?.classList.contains('hidden'),
    level:document.querySelector('#level')?.textContent,
    quest:document.querySelector('#quest-title')?.textContent
  }));
  console.log('Game state:',JSON.stringify(stats));
  assert(stats.hudVisible,'HUD should be visible after start');

  await page.keyboard.press('Escape');
  assert(await page.locator('#pause-screen').isVisible(),'Esc should pause');
  await page.locator('#pause-customize-button').click();
  assert(await page.locator('#creator').isVisible(),'Can reopen editor from pause');
  assert.equal(await page.locator('#character-name').inputValue(),'Takeda');
  assert.equal(await page.locator('[data-preset="crimson"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-preset="shadow"]').click();
  await page.locator('#creator-cancel').click();
  assert(await page.locator('#pause-screen').isVisible(),'Cancelling edit returns to pause');
  assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('kage-no-michi-character-v1')))).preset,'crimson','Cancel must not save changes');
  await page.locator('#pause-customize-button').click();
  await page.locator('[data-preset="forest"]').click();
  await page.locator('#creator-confirm').click();
  assert(await page.locator('#pause-screen').isVisible(),'Confirming edit returns to pause');
  const edited=await page.evaluate(()=>JSON.parse(localStorage.getItem('kage-no-michi-character-v1')));
  assert.equal(edited.preset,'forest');
  assert.equal(edited.name,'Takeda');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#start-button').click();
  assert(await page.locator('#hud').isVisible(),'Saved character bypasses creator on next launch');
  assert.equal(await page.locator('#player-name').textContent(),'TAKEDA');
  const savedAfterReload=await page.evaluate(()=>JSON.parse(localStorage.getItem('kage-no-michi-character-v1')));
  assert.equal(savedAfterReload.preset,'forest','The selected preset survives reload');
  console.log('PRESET PERSISTENCE PASS:',JSON.stringify(savedAfterReload));
  if(errors.length)console.warn('Browser warnings/errors:',errors.join(' | '));
  assert.equal(errors.length,0,'No uncaught browser errors are allowed');
  console.log('PASS: three distinct skinned and animated enemies, character creator, movement, combat and saved character');
}finally{
  await browser.close();
}
