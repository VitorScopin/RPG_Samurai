/**
 * On-demand download of CC BY 4.0 samurai mesh and Mixamo-style animations.
 * Not committed to this repository because these are large upstream assets.
 *
 * Asset attribution: "Shadowflame Samurai" by dark_igorek (Sketchfab), CC BY 4.0.
 * FBX preparation / character demo by achrefelouafi, MIT.
 * Source revision is pinned so the assets and rigging stay in sync.
 */
import { mkdir, rename, stat, unlink } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';

const REVISION='496862cda55bfba3be6d02eec5aee3ca808a31a3';
const ROOT='https://raw.githubusercontent.com/achrefelouafi/SamuraiThirdPersonTemplateThreeJS/'+REVISION+'/public/';
const OUT=path.resolve('public/character');
const FILES=[
  ['ronin.fbx','models/tpose.fbx',21783500],
  ['materials.glb','models/textures.glb',24499980],
  ['Idle.fbx','animations/Idle.fbx',287552],
  ['Walk.fbx','animations/Walk.fbx',200464],
  ['Run.fbx','animations/Run.fbx',179808],
  ['Slash.fbx','animations/fight animations/Slash.fbx',277856],
  ['CrouchSlash.fbx','animations/fight animations/Crouchslash.fbx',168000],
  ['Block.fbx','animations/Crouch.fbx',264864],
  ['Dodge.fbx','animations/Jump.fbx',198992]
];
await mkdir(OUT,{recursive:true});
const failures=[];
for(const [name,source,expected] of FILES){
  const destination=path.join(OUT,name);
  try{if((await stat(destination)).size===expected){console.log('✓ '+name+' (em cache)');continue;}}catch{}
  const temp=destination+'.partial';
  try{
    console.log('↓ Baixando '+name+'...');
    const url=ROOT+source.split('/').map(encodeURIComponent).join('/');
    const response=await fetch(url,{signal:AbortSignal.timeout(120000)});
    if(!response.ok||!response.body)throw Error('HTTP '+response.status);
    await pipeline(Readable.fromWeb(response.body),createWriteStream(temp));
    const size=(await stat(temp)).size;
    if(size!==expected)throw Error('tamanho inesperado: '+size+'/'+expected);
    await rename(temp,destination);
    console.log('✓ '+name+' ('+(size/1048576).toFixed(1)+' MB)');
  }catch(error){
    await unlink(temp).catch(()=>{});
    console.warn('⚠ Não foi possível baixar '+name+': '+error.message);
    failures.push(name);
  }
}
if(failures.length)console.warn('\nAlguns recursos 3D não foram baixados ('+failures.join(', ')+'). O jogo continua usando os modelos anteriores como alternativa; execute "npm run assets" novamente para tentar de novo.');
