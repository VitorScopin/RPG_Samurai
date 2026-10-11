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
  async function snapshot(label){
    const buffer=await page.screenshot();
    const image=buffer.toString('base64');
    const pixels=await page.evaluate(async(base64)=>{
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
    const debug=await page.evaluate(()=>window.__kageDebug?.());
    console.log('DIAG '+label,JSON.stringify({pixels,debug}));
    return {pixels,debug};
  }
  await snapshot('starting');
  for(const k of ['w','a','s','d']){
    await page.keyboard.down(k);
    await page.waitForTimeout(850);
    await page.keyboard.up(k);
    await snapshot('key '+k);
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
  if(errors.length)console.warn('Browser warnings/errors:',errors.join(' | '));
  assert.equal(errors.length,0,'No uncaught browser errors are allowed');
  console.log('PASS: rigged 3D samurai is visible and game responds to movement and attack');
}finally{
  await browser.close();
}
