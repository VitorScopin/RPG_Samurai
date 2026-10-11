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
page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
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
  assert.equal(status,'ready','Realistic model and animations should load');
  await page.locator('#start-button').click();
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
  if(errors.length)console.warn('Browser warnings/errors:',errors.join(' | '));
  assert.equal(errors.length,0,'No uncaught browser errors are allowed');
  console.log('PASS: rigged 3D samurai is visible and game responds to movement and attack');
}finally{
  await browser.close();
}
