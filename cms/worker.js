import { editorPage, loginPage } from './ui.js';

const pages = {'/':'index.html','/event':'event.html','/event.html':'event.html','/coming-soon':'coming-soon.html','/coming-soon.html':'coming-soon.html','/index':'index.html','/index.html':'index.html'};
const files = [...new Set(Object.values(pages))];
const mediaPath = /^\/cms-media\/[0-9a-f-]{36}$/;
const pastEventsKey = 'pastEvents';
const textPattern = /<!--cms:([\w-]+)\|([^>]+)-->([\s\S]*?)<!--\/cms-->/g;
const tagPattern = /<(?:img|a|iframe|time)\b[^>]*\bdata-cms-(?:image|attr)="[\w-]+"[^>]*>/g;
const enc = new TextEncoder();
const noindex = {'X-Robots-Tag':'noindex, nofollow, noarchive','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'};
const attr = (tag,name) => tag.match(new RegExp('(?:^|\\s)'+name+'="([^"]*)"'))?.[1] ?? '';
const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function decode(value) {
 return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,(entity,code)=>{
  if(code[0]!=='#') return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:'\u00a0'}[code]??entity;
  const n=code[1].toLowerCase()==='x'?parseInt(code.slice(2),16):Number(code.slice(1));
  return n<=0x10ffff?String.fromCodePoint(n):entity;
 });
}
function fields(html,file){
 const list=[];
 for(const match of html.matchAll(new RegExp(textPattern.source+'|'+tagPattern.source,'g'))){
  const [tag,id,group,value]=match;
  if(id){
   const before=html.slice(Math.max(0,match.index-360),match.index);
   const tag=before.match(/<([a-z][\w-]*)([^<>]*)>\s*$/i);
   const format=tag&&(/^h[1-6]$/.test(tag[1])?'Heading':/^(strong|b)$/.test(tag[1])?'Bold':tag[1]==='button'?'Button label':tag[1]==='a'?'Link label':/\beyebrow\b/.test(tag[2])?'Small heading':/\b(?:small|credit-note)\b/.test(tag[2])?'Small print':null);
   list.push({id,group,kind:'text',value:decode(value),file,format});continue;
  }
  const image=attr(tag,'data-cms-image'), field=attr(tag,'data-cms-field');
  const base={group:attr(tag,'data-cms-group'),file};
  if(image)list.push({...base,id:image,kind:'image',value:decode(attr(tag,'src')),alt:decode(attr(tag,'alt'))},{...base,id:image+'-alt',kind:'alt',value:decode(attr(tag,'alt'))});
  else list.push({...base,id:attr(tag,'data-cms-attr'),kind:field,value:decode(attr(tag,field))});
 }
 return list;
}
function replaceAttr(tag,key,value){
 const re=new RegExp('(\\s'+key+'=")[^"]*(")');
 return re.test(tag)?tag.replace(re,(_,a,b)=>a+escape(value)+b):tag.replace(/>$/,' '+key+'="'+escape(value)+'">');
}
function render(html,values){
 const events=Array.isArray(values[pastEventsKey])?[...values[pastEventsKey]].sort((a,b)=>b.date.localeCompare(a.date)):[];
 const rendered=html.replace(textPattern,(_,id,group,value)=>Object.hasOwn(values,id)?escape(values[id]):value)
 .replace(tagPattern,tag=>{
  const image=attr(tag,'data-cms-image'),id=image||attr(tag,'data-cms-attr');
  if(Object.hasOwn(values,id)){
   tag=replaceAttr(tag,image?'src':attr(tag,'data-cms-field'),values[id]);
   if(image)tag=tag.replace(/\s(?:srcset|sizes)="[^"]*"/g,'');
  }
  if(image&&Object.hasOwn(values,image+'-alt'))tag=replaceAttr(tag,'alt',values[image+'-alt']);
  return tag.replace(/\sdata-cms-[\w-]+="[^"]*"/g,'');
 });
 return rendered.replace('<!--cms-past-events-->',()=>events.map(event=>{
  const date=new Intl.DateTimeFormat('en-GB',{dateStyle:'long',timeZone:'UTC'}).format(new Date(event.date+'T00:00:00Z'));
  return '<article class="past-recap"><p class="eyebrow"><time datetime="'+escape(event.date)+'">'+escape(date)+'</time> · '+escape(event.venue)+'</p><h3>'+escape(event.title)+'</h3><p class="past-recap-text">'+escape(event.recap)+'</p>'+(event.image?'<img src="'+escape(event.image)+'" alt="'+escape(event.alt||event.title)+'" loading="lazy" decoding="async">':'')+'</article>';
 }).join(''));
}
function pastEvents(value){
 if(!Array.isArray(value)||value.length>30)throw new InputError('You can save up to 30 past events.');
 return value.map(event=>{
  if(!event||typeof event!=='object')throw new InputError('Invalid past event.');
  const read=(key,max)=>{const v=event[key]??'';if(typeof v!=='string'||v.length>max)throw new InputError('Check the length of the past event '+key+'.');return v.trim();};
  const title=read('title',120), date=read('date',10), venue=read('venue',160), recap=read('recap',2500), image=read('image',60), alt=read('alt',200);
  const timestamp=Date.parse(date+'T00:00:00Z');
  if(!title||!venue||!recap||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(timestamp)||new Date(timestamp).toISOString().slice(0,10)!==date)throw new InputError('Add a title, valid date, venue and recap for each past event.');
  if(image&&!mediaPath.test(image))throw new InputError('Upload a valid past event photo.');
  return {title,date,venue,recap,image,alt};
 });
}
const sha=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
const matchHash=(a,b)=>{let n=a.length^b.length;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^(b.charCodeAt(i)||0);return n===0;};
const randomToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
const now=()=>Math.floor(Date.now()/1000);
const cookieName = (url) => url.protocol==='https:'?'__Host-kgcms':'kgcms-local';
function cookie(url,value,maxAge){return cookieName(url)+'='+value+'; Path=/; HttpOnly; SameSite=Strict; Max-Age='+maxAge+(url.protocol==='https:'?'; Secure':'');}
function response(body,status=200,headers={}){
 return new Response(body,{status,headers:{...noindex,...headers}});
}
function json(data,status=200){return response(JSON.stringify(data),status,{'Content-Type':'application/json; charset=utf-8'});}
function adminPage(html,nonce,status=200){
 return response(html,status,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; style-src 'nonce-"+nonce+"'; style-src-attr 'unsafe-inline'; script-src 'nonce-"+nonce+"'; connect-src 'self'; img-src 'self' blob:; frame-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"});
}
function redirect(path,headers={}){return response(null,303,{Location:path,...headers});}
async function readLimited(request,max){
 if(Number(request.headers.get('Content-Length'))>max)throw new InputError('File or request is too large.',413);
 if(!request.body)return new Uint8Array();
 const reader=request.body.getReader(), chunks=[];let length=0;
 while(true){const {done,value}=await reader.read();if(done)break;
  length+=value.byteLength;if(length>max){await reader.cancel();throw new InputError('File or request is too large.',413);}chunks.push(value);
 }
 const bytes=new Uint8Array(length);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.byteLength;}return bytes;
}
class InputError extends Error{constructor(message,status=400){super(message);this.status=status;}}
const textDecoder=new TextDecoder();
async function getState(db){
 const row=await db.prepare('SELECT revision, content FROM cms_content WHERE id = 1').first();
 return {revision:row?.revision??0,values:JSON.parse(row?.content??'{}')};
}
async function assetHtml(env,url,file){
 const path=file==='index.html'?'/':'/'+file.replace(/\.html$/,'');
 const asset=await env.ASSETS.fetch(new URL(path,url));
 if(!asset.ok)throw Error('Site page unavailable');
 return asset.text();
}
async function allFields(env,url){
 return (await Promise.all(files.map(async file=>fields(await assetHtml(env,url,file),file)))).flat();
}
async function session(request,url,db){
 const raw=request.headers.get('Cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName(url)+'='))?.split('=')[1];
 if(!raw||!/^[a-f0-9]{64}$/.test(raw))return null;
 const hash=await sha(raw);
 return await db.prepare('SELECT token FROM cms_sessions WHERE token = ? AND expires > ?').bind(hash,now()).first()?hash:null;
}
function imageType(bytes){
 const sig=(...p)=>p.every((v,i)=>bytes[i]===v), ascii=(start,end)=>String.fromCharCode(...bytes.subarray(start,end));
 if(bytes.length>=24&&sig(137,80,78,71,13,10,26,10)&&ascii(12,16)==='IHDR')return 'image/png';
 if(bytes.length>4&&sig(255,216,255)&&bytes.at(-2)===255&&bytes.at(-1)===217)return 'image/jpeg';
 if(bytes.length>=20&&ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP'&&['VP8 ','VP8L','VP8X'].includes(ascii(12,16)))return 'image/webp';
 return null;
}
function validLink(value,kind){
 if(kind==='datetime')return /^\d{4}-\d{2}-\d{2}$/.test(value);
 if(kind==='src'){try{const url=new URL(value);return url.protocol==='https:'&&url.hostname==='www.google.com'&&url.pathname.startsWith('/maps')&&!url.username&&!url.password;}catch{return false;}}
 if(/^(\/(?!\/)|#)/.test(value)&&!/[\\\x00-\x20]/.test(value))return true;
 try{const url=new URL(value);return !url.username&&!url.password&&['https:','mailto:'].includes(url.protocol)&&!/[\x00-\x20\\]/.test(value);}catch{return false;}
}
async function admin(request,url,env){
 const {CMS_DB:db,CMS_PASSWORD_HASH:passwordHash}=env;
 const nonce=randomToken();
 if(!db||!/^([a-f0-9]{64})$/.test(passwordHash??''))return response('The editor has not been configured.',503);
 const method=request.method, path=url.pathname.replace(/\/+$/,'');
 if(method==='POST'&&request.headers.get('Origin')!==url.origin)return json({error:'Invalid request origin.'},403);
 if(path==='/admin/login'&&method==='POST'){
  const form=new URLSearchParams(textDecoder.decode(await readLimited(request,4096)));
  const ip=await sha((request.headers.get('CF-Connecting-IP')||'local')+passwordHash);
  const time=now(), bucket=Math.floor(time/900);
  await db.prepare('DELETE FROM cms_attempts WHERE bucket < ?').bind(bucket-1).run();
  const attempt=await db.prepare('INSERT INTO cms_attempts (ip, bucket, attempts) VALUES (?, ?, 1) ON CONFLICT(ip,bucket) DO UPDATE SET attempts = attempts + 1 RETURNING attempts').bind(ip,bucket).first();
  if(attempt.attempts>8)return adminPage(loginPage(nonce,'Too many attempts. Try again in 15 minutes.'),nonce,429);
  if(!matchHash(await sha(form.get('password')??''),passwordHash))return adminPage(loginPage(nonce,'Incorrect password.'),nonce,401);
  const token=randomToken(), ttl=28800;
  await db.batch([
   db.prepare('DELETE FROM cms_sessions WHERE expires <= ?').bind(time),
   db.prepare('INSERT INTO cms_sessions (token, expires) VALUES (?, ?)').bind(await sha(token),time+ttl),
   db.prepare('DELETE FROM cms_attempts WHERE ip = ? AND bucket = ?').bind(ip,bucket)
  ]);
  return redirect('/admin',{'Set-Cookie':cookie(url,token,ttl)});
 }
 const token=await session(request,url,db);
 if(path==='/admin/login'&&method==='GET')return token?redirect('/admin'):adminPage(loginPage(nonce),nonce);
 if(!token)return path.startsWith('/admin/api/')?json({error:'Please sign in again.'},401):redirect('/admin/login');
 if(path==='/admin/logout'&&method==='POST'){
  await db.prepare('DELETE FROM cms_sessions WHERE token = ?').bind(token).run();
  return redirect('/admin/login',{'Set-Cookie':cookie(url,'',0)});
 }
 if(path==='/admin'&&method==='GET')return adminPage(editorPage(nonce),nonce);
 if(path==='/admin/api/content'&&method==='GET'){
  const [current,available]=await Promise.all([getState(db),allFields(env,url)]);
  return json({...current,fields:available});
 }
 if(path==='/admin/api/preview'&&method==='POST'){
  let data;
  try{data=JSON.parse(textDecoder.decode(await readLimited(request,280000)));}catch(e){if(e instanceof InputError)throw e;throw new InputError('Invalid preview.');}
  if(!data||!files.includes(data.file)||!data.values||typeof data.values!=='object'||Array.isArray(data.values))throw new InputError('Invalid preview.');
  const html=await assetHtml(env,url,data.file), overrides=Object.create(null);
  if(Object.hasOwn(data.values,pastEventsKey))overrides[pastEventsKey]=pastEvents(data.values[pastEventsKey]);
  for(const field of fields(html,data.file)){
   const value=data.values[field.id];
   if(typeof value!=='string'||value.length>2500)continue;
   if(['text','alt'].includes(field.kind)||(field.kind==='image'&&mediaPath.test(value)))overrides[field.id]=value;
  }
  if(typeof data.nonce!=='string'||!/^[a-f0-9]{64}$/.test(data.nonce))throw new InputError('Invalid preview.');
  const preview=render(html,overrides)
   .replace(/<script\b[^>]*>[\s\S]*?<\/script>|<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,'')
   .replace(/<style>/gi,'<style nonce="'+data.nonce+'">')
   .replace(/<a\b[^>]*>/gi,tag=>tag.replace(/\s(?:href|target)="[^"]*"/gi,''));
  return json({html:preview});
 }
 if(path==='/admin/api/image'&&method==='POST'){
  const bytes=await readLimited(request,1500000), type=imageType(bytes);
  if(!type||request.headers.get('Content-Type')!==type)throw new InputError('Choose a JPG, PNG or WebP image, up to 1.5 MB.');
  const id=crypto.randomUUID();
  await db.prepare('INSERT INTO cms_images (id, mime, bytes) VALUES (?, ?, ?)').bind(id,type,bytes.buffer).run();
  return json({url:'/cms-media/'+id},201);
 }
 if(path==='/admin/api/content'&&method==='POST'){
  let data;try{data=JSON.parse(textDecoder.decode(await readLimited(request,280000)));}catch(e){if(e instanceof InputError)throw e;throw new InputError('Invalid content.');}
  if(!data||!Number.isSafeInteger(data.revision)||!data.values||Array.isArray(data.values)||typeof data.values!=='object')throw new InputError('Invalid content.');
  const map=new Map((await allFields(env,url)).map(field=>[field.id,field]));
  const validated=Object.create(null);
  for(const [id,value] of Object.entries(data.values)){
   if(id===pastEventsKey){
    const events=pastEvents(value);
    for(const image of new Set(events.map(event=>event.image).filter(Boolean)))if(!(await db.prepare('SELECT id FROM cms_images WHERE id = ?').bind(image.split('/').at(-1)).first()))throw new InputError('Upload a valid past event photo first.');
    if(events.length)validated[id]=events;
    continue;
   }
   const field=map.get(id);if(!field||typeof value!=='string'||value.length>2500)throw new InputError('Invalid field or text is too long.');
   if(field.kind==='image'){
    if(!mediaPath.test(value)||!(await db.prepare('SELECT id FROM cms_images WHERE id = ?').bind(value.split('/').at(-1)).first()))throw new InputError('Upload a valid image first.');
   }else if(!['text','alt'].includes(field.kind)&&!validLink(value,field.kind))throw new InputError('Check the URL or date in '+field.group+'.');
   if(value!==field.value)validated[id]=value;
  }
  const saved=await db.prepare('UPDATE cms_content SET content = ?, revision = revision + 1 WHERE id = 1 AND revision = ? RETURNING revision').bind(JSON.stringify(validated),data.revision).first();
  if(!saved)return json({error:'Someone else saved changes. Reload before publishing again.'},409);
  return json(saved);
 }
 return response('Not found',404);
}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  try{
   if(url.pathname==='/admin'||url.pathname.startsWith('/admin/'))return await admin(request,url,env);
   if(url.pathname.startsWith('/cms-media/')){
    if(!['GET','HEAD'].includes(request.method)||!mediaPath.test(url.pathname)||!env.CMS_DB)return response('Not found',404);
    const asset=await env.CMS_DB.prepare('SELECT mime, bytes FROM cms_images WHERE id = ?').bind(url.pathname.split('/').at(-1)).first();
    if(!asset)return response('Not found',404);
    return new Response(request.method==='HEAD'?null:new Uint8Array(asset.bytes),{headers:{'Content-Type':asset.mime,'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
   }
   if(!Object.hasOwn(pages,url.pathname)||!['GET','HEAD'].includes(request.method))return env.ASSETS.fetch(request);
   const original=await env.ASSETS.fetch(request);
   if(!original.ok||!original.headers.get('Content-Type')?.includes('text/html'))return original;
   let values={};
   if(env.CMS_DB){try{({values}=await getState(env.CMS_DB));}catch(e){console.error('CMS read failed',e);}}
   const headers=new Headers(original.headers);
   for(const name of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(name);
   headers.set('Cache-Control','no-store');
   return new Response(request.method==='HEAD'?null:render(await original.text(),values),{headers});
  }catch(e){
   if(e instanceof InputError)return json({error:e.message},e.status);
   console.error('CMS error',e);
   return url.pathname.startsWith('/admin/api/')?json({error:'The editor is temporarily unavailable.'},503):response('Temporarily unavailable',503);
  }
 }
};
export {fields,render,imageType,validLink};

