const css = 'body{margin:0;background:#f2f7fc;color:#173658;font:16px/1.5 system-ui,sans-serif}*{box-sizing:border-box}main{max-width:900px;margin:auto;padding:26px 16px 70px}h1{margin:0}h2{font-size:1.35rem}p{margin:8px 0 16px}header,.actions,.tabs{display:flex;gap:10px;align-items:center;flex-wrap:wrap}header{justify-content:space-between}button,.button{font:inherit;padding:9px 15px;border:1px solid #285d9d;border-radius:9px;background:#285d9d;color:white;cursor:pointer;text-decoration:none}button.secondary,.button.secondary{background:white;color:#173658}button:disabled{opacity:.6;cursor:wait}details,.card{border:1px solid #ccd8e5;border-radius:12px;background:white;margin:12px 0;padding:14px}summary{font-weight:750;cursor:pointer}label{display:block;font-weight:650;margin:14px 0 4px}textarea,input:not([type=file]){width:100%;font:inherit;border:1px solid #9aacc1;border-radius:8px;padding:8px;color:inherit}textarea{min-height:58px;resize:vertical}.field{margin:16px 0;padding-bottom:12px;border-bottom:1px solid #e1e8ef}.field small{display:block;margin-bottom:5px;overflow-wrap:anywhere}.field img{display:block;max-width:160px;max-height:150px;margin:8px 0;border-radius:7px}.tabs{margin:18px 0}.tabs button[aria-pressed=true]{background:#173658;color:white}.save{position:sticky;bottom:0;background:#f2f7fc;padding:12px 0;border-top:1px solid #ccd8e5}.login{max-width:430px;margin:12vh auto}.error{color:#9e2626}input[type=file]{max-width:100%;margin:6px 0}';
function shell(title,nonce,body,script=''){
 return '<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>'+title+'</title><style nonce="'+nonce+'">'+css+'.site-branch{border-left:4px solid #285d9d}.site-branch>summary{font-size:1.1rem}.branch-items{border-left:2px solid #d9e6f3;margin:12px 0 0 7px;padding-left:12px}.branch-items>details{margin:8px 0;padding:10px 12px;background:#f8fbff}.branch-items .branch-items>details{background:white}@media(max-width:500px){.branch-items{margin-left:2px;padding-left:6px}.branch-items>details{padding:8px}}</style></head><body>'+body+(script?'<script nonce="'+nonce+'">'+script+'</script>':'')+'</body></html>';
}
export function loginPage(nonce,error=''){
 return shell('KGflips sign in',nonce,'<main class="login"><div class="card"><h1>KGflips editor</h1><p>Sign in to update the website.</p>'+(error?'<p class="error" role="alert">'+error+'</p>':'')+'<form action="/admin/login" method="post"><label for="password">Password</label><input id="password" type="password" name="password" maxlength="256" autocomplete="current-password" required><p><button type="submit">Sign in</button></p></form><a href="/">Back to KGflips</a></div></main>');
}
const script = String.raw
`
'use strict';
const $=id=>document.getElementById(id);
const previewNonce=document.currentScript.nonce;
const status=$('status'), sections=$('sections'), tabs=$('tabs'), publish=$('publish'), discard=$('discard'), preview=$('preview');
const names={'index.html':'Homepage','event.html':'Event page','coming-soon.html':'Coming soon'};
const trees={
 'index.html':{
  'Header':{'Top bar':'Top bar','Logo and navigation':'Header','Accessibility link':'Homepage'},
  'Main body':{
   'Opening section':{'Text and advert':'Main block','Event details button':'Main block · Event details button'},
   'Ticket card':{'Main copy':'Ticket block','Directions link':'Ticket card · Directions link','Large price':'Ticket card · Large price','Green badge':'Ticket card · Green badge','Credit callout':'Ticket card · Credit callout','Buy button':'Ticket card · Buy button','Underlined credit link':'Ticket card · Underlined credit link','Small print':'Ticket card · Small print'},
   'Lucky Duck':{'Text and poster':'Middle block · Lucky Duck','Offer rules button':'Lucky Duck · Offer rules button'},
   'More ways to shop':{'Main copy':'More ways to shop','Button':'More ways to shop · Button'},
   'Popups':{'Ticket copy':'Ticket popup','Square payment button':'Ticket popup · Square payment button','Lucky Duck rules':'Lucky Duck popup'}
  },
  'Past events':{'Ipswich recap, photos and quotes':'Past events','Add or manage past events':'@pastEvents'},
  'Footer':{'Logo, links and footer text':'Footer'}
 },
 'event.html':{
  'Header':{'Logo and navigation':'Header','Accessibility link':'Event page'},
  'Main body':{'Event details and poster':'Event details','Directions button':'Event page · Directions button','Tickets button':'Event page · Tickets button'},
  'Footer':{'Links and footer text':'Footer'}
 },
 'coming-soon.html':{
  'Header':{'Logo and navigation':'Header'},
  'Main body':{'Introduction':'Introduction','Shopping features':'Shopping features','Membership':'Membership','Extra information':'Coming soon page','Tickets button':'Coming soon · Tickets button'},
  'Footer':{'Logo, links and footer text':'Footer'}
 }
};
let model, draft={}, selected='index.html', dirty=false, busy=0, saving=false;
const sectionEdits=new Map(), invalidSections=new Set();
function message(text,bad=false){status.textContent=text;status.className=bad?'error':'';}
function update(){publish.disabled=!model||!dirty||busy>0||saving||invalidSections.size>0;discard.disabled=!model||!dirty||busy>0||saving;preview.disabled=!model||invalidSections.size>0;}
function changed(id,value){draft[id]=value;dirty=true;update();}
async function api(path,options){
 const r=await fetch('/admin/api/'+path,options);
 const data=await r.json();
 if(!r.ok)throw Error(data.error||'Could not complete the request.');
 return data;
}
function el(tag,content,props={}){const n=document.createElement(tag);if(content!==undefined)n.textContent=content;for(const [k,v] of Object.entries(props))n.setAttribute(k,v);return n;}
function pastEventsEditor(){
 const box=el('details');box.append(el('summary','Add or manage past events'));
 const list=el('div');
 const add=el('button','Add past event',{type:'button'});
 const events=()=>draft.pastEvents??[];
 const replace=(index,patch)=>changed('pastEvents',events().map((event,i)=>i===index?{...event,...patch}:event));
 function drawEvents(open=-1){
  list.replaceChildren();
  for(const [i,event] of events().entries()){
   const card=el('details',undefined,{class:'card'}), heading=el('summary',event.title||'New past event');
   card.open=i===open;card.append(heading);
   for(const [key,label,limit] of [['title','Event title',120],['date','Event date',10],['venue','Venue',160],['recap','Recap',2500],['alt','Photo description (optional)',200]]){
    const id='past-event-'+i+'-'+key;
    const input=el(key==='recap'?'textarea':'input',undefined,{id,maxlength:String(limit),...(key==='date'?{type:'date'}:{})});
    input.value=event[key]??'';
    input.oninput=()=>{replace(i,{[key]:input.value});if(key==='title')heading.textContent=input.value||'New past event';};
    card.append(el('label',label,{for:id}),input);
   }
   const photo=el('div',undefined,{class:'field'});
   const img=el('img',undefined,{alt:'Current past event photo'});
   if(event.image)img.src=event.image;else img.hidden=true;
   const file=el('input',undefined,{id:'past-event-'+i+'-photo',type:'file',accept:'image/jpeg,image/png,image/webp'});
   const removePhoto=el('button','Remove photo',{type:'button',class:'secondary'});
   removePhoto.hidden=!event.image;
   const remove=el('button','Remove event',{type:'button',class:'secondary'});
   file.onchange=async()=>{
    const f=file.files[0];if(!f)return;
    if(f.size>1500000){message('Choose an image up to 1.5 MB.',true);file.value='';return;}
    busy++;update();message('Uploading photo…');
    try{
     const data=await api('image',{method:'POST',headers:{'Content-Type':f.type},body:f});
     replace(i,{image:data.url});img.src=data.url;img.hidden=false;removePhoto.hidden=false;
     message('Photo uploaded. Publish changes to update the site.');
    }catch(e){message(e.message,true);}finally{busy--;file.value='';update();}
   };
   removePhoto.onclick=()=>{if(busy)return;replace(i,{image:''});img.removeAttribute('src');img.hidden=true;removePhoto.hidden=true;};
   remove.onclick=()=>{if(busy||!window.confirm('Remove this recap? It will be removed from the website when you publish.'))return;changed('pastEvents',events().filter((_,j)=>i!==j));drawEvents();};
   photo.append(el('label','Photo (optional)',{for:file.id}),el('small','JPG, PNG or WebP · maximum 1.5 MB'),img,file,removePhoto);
   card.append(photo,remove);list.append(card);
  }
  add.disabled=events().length>=30;
 }
 add.onclick=()=>{if(busy||events().length>=30)return;changed('pastEvents',[...events(),{title:'',date:'',venue:'',recap:'',image:'',alt:''}]);drawEvents(events().length-1);list.lastElementChild.querySelector('input').focus();};
 box.append(el('p','Add a separate recap without changing the Ipswich recap.'),list,add);drawEvents();return box;
}
function draw(){
 tabs.replaceChildren();
 for(const [file,name] of Object.entries(names)){
  const b=el('button',name,{type:'button',class:'secondary','aria-pressed':String(selected===file)});
  b.onclick=()=>{selected=file;$('preview-panel').hidden=true;draw();};tabs.append(b);
 }
 sections.replaceChildren();
 const groups=new Map();
 for(const field of model.fields.filter(x=>x.file===selected)){
  if(!groups.has(field.group))groups.set(field.group,[]);
  groups.get(field.group).push(field);
 }
 const items=new Map();
 if(selected==='index.html')items.set('@pastEvents',pastEventsEditor());
 for(const [group,fields] of groups){
  const box=el('details');box.append(el('summary',group));items.set(group,box);
  const copy=fields.filter(f=>f.kind==='text');
  if(copy.length){
   const id=copy[0].id+'-section', row=el('div',undefined,{class:'field'});
   const line=value=>value.replace(/\r?\n/g,' ');
   const input=el('textarea',undefined,{id,rows:String(Math.min(16,Math.max(3,copy.length+1))),'aria-describedby':id+'-help'});
   const hint=el('small',undefined,{id:id+'-help'});
   const instructions=copy.length>1?'Edit the copy in this box. Keep the '+copy.length+' lines in order so the site keeps its formatting.':'Edit the copy in this box.';
   input.value=sectionEdits.get(id)??copy.map(f=>line(draft[f.id]??f.value)).join('\n');
   const feedback=()=>{const invalid=invalidSections.has(id);hint.textContent=invalid?'Keep exactly '+copy.length+' lines, with up to 2,500 characters per line.':instructions;hint.className=invalid?'error':'';input.setAttribute('aria-invalid',String(invalid));};
   input.oninput=()=>{
    sectionEdits.set(id,input.value);dirty=true;
    const values=copy.length===1?[input.value]:input.value.split('\n');
    if(values.length!==copy.length||values.some(value=>value.length>2500))invalidSections.add(id);
    else{invalidSections.delete(id);copy.forEach((f,i)=>{if(values[i]!==line(draft[f.id]??f.value))draft[f.id]=values[i];});}
    feedback();update();
   };
   const reset=el('button','Restore original text',{type:'button',class:'secondary'});
   reset.onclick=()=>{for(const f of copy)delete draft[f.id];sectionEdits.delete(id);invalidSections.delete(id);input.value=copy.map(f=>line(f.value)).join('\n');dirty=true;feedback();update();};
   const roles=copy.flatMap((f,i)=>f.format?[(copy.length>1?'Line '+(i+1)+': ':'')+f.format]:[]);
   feedback();row.append(el('label',copy.length===1?(copy[0].format||'Text'):'Section text',{for:id}),hint);
   if(copy.length>1&&roles.length)row.append(el('small',roles.join(' · ')));
   row.append(input,reset);box.append(row);
  }
  const settings=el('details');settings.append(el('summary','Links and other settings'));
  for(const field of fields.filter(f=>f.kind!=='text')){
  const row=el('div',undefined,{class:'field'});
  const value=draft[field.id]??field.value;
  const label={text:'Text',href:'Link destination',src:'Google Maps embed URL',datetime:'Calendar date (YYYY-MM-DD)',image:'Image',alt:'Image description (alt text)'}[field.kind];
  row.append(el('label',label,{for:field.id}));
  if(field.kind==='image'){
   const img=el('img',undefined,{src:value,alt:field.alt||'Current image'});
   const file=el('input',undefined,{id:field.id,type:'file',accept:'image/jpeg,image/png,image/webp'});
   row.append(img,file,el('small','JPG, PNG or WebP · maximum 1.5 MB'));
   file.onchange=async()=>{
    const f=file.files[0];if(!f)return;
    if(f.size>1500000){message('Choose an image up to 1.5 MB.',true);file.value='';return;}
    busy++;update();message('Uploading image…');
    try{const data=await api('image',{method:'POST',headers:{'Content-Type':f.type},body:f});changed(field.id,data.url);img.src=data.url;message('Image uploaded. Publish changes to update the site.');}
    catch(e){message(e.message,true);}finally{busy--;update();file.value='';}
   };
  }else{
   const input=el('input',undefined,{id:field.id,maxlength:'2500'});
   input.value=value;input.oninput=()=>changed(field.id,input.value);row.append(input);
  }
  const reset=el('button','Restore original',{type:'button',class:'secondary'});
  reset.onclick=()=>{delete draft[field.id];dirty=true;update();const input=row.querySelector('textarea,input');if(field.kind==='image'){row.querySelector('img').src=field.value;input.value='';}else input.value=field.value;};
  row.append(reset);(field.kind==='image'?box:settings).append(row);
  }
  if(settings.children.length>1)box.append(settings);
 }
 function branch(parent,tree,level=0){
  for(const [label,node] of Object.entries(tree)){
   if(typeof node==='string'){
    const item=items.get(node);if(!item)continue;
    item.firstElementChild.textContent=label;parent.append(item);items.delete(node);
   }else{
    const box=el('details',undefined,level===0?{class:'site-branch'}:{});
    const children=el('div',undefined,{class:'branch-items'});
    branch(children,node,level+1);
    if(children.childElementCount){box.append(el('summary',label),children);parent.append(box);}
   }
  }
 }
 branch(sections,trees[selected]);
 if(items.size){
  const other=el('details',undefined,{class:'site-branch'});
  const children=el('div',undefined,{class:'branch-items'});
  children.append(...items.values());other.append(el('summary','Other editable content'),children);sections.append(other);
 }
}
discard.onclick=()=>{
 if(!window.confirm('Discard unsaved edits and return to the last published version?'))return;
 draft={...model.values};sectionEdits.clear();invalidSections.clear();dirty=false;$('preview-panel').hidden=true;draw();message('Unsaved edits discarded.');update();
};
preview.onclick=async()=>{
 try{
  const file=selected;
  const result=await api('preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({file,values:draft,nonce:previewNonce})});
  if(file!==selected)return;
  $('preview-frame').srcdoc=result.html;$('preview-panel').hidden=false;$('preview-panel').scrollIntoView();
 }catch(e){message(e.message,true);}
};
publish.onclick=async()=>{
 saving=true;update();message('Publishing…');
 const snapshot={...draft};
 try{const result=await api('content',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:model.revision,values:snapshot})});model.revision=result.revision;model.values=snapshot;dirty=invalidSections.size>0||JSON.stringify(snapshot)!==JSON.stringify(draft);message(dirty?'Published. You still have unsaved changes.':'Published to the website.');}
 catch(e){message(e.message,true);}finally{saving=false;update();}
};
window.addEventListener('beforeunload',e=>{if(dirty||busy){e.preventDefault();e.returnValue='';}});
api('content').then(data=>{model=data;const active=new Set([...data.fields.map(x=>x.id),'pastEvents']);model.values=Object.fromEntries(Object.entries(data.values).filter(([key])=>active.has(key)));draft={...model.values};draw();message('');update();}).catch(e=>message(e.message,true));
`;
export function editorPage(nonce){
 return shell('KGflips editor',nonce,'<main><header><div><h1>KGflips editor</h1><p>Update text, links and images. Preview your edits before publishing.</p></div><div class="actions"><a class="button secondary" href="/" target="_blank" rel="noopener">View website</a><form action="/admin/logout" method="post"><button class="secondary">Sign out</button></form></div></header><nav id="tabs" class="tabs" aria-label="Pages"></nav><div id="sections"></div><section id="preview-panel" hidden><h2>Draft preview</h2><p>Shows draft text and images in the website layout. Links and popups are not interactive here.</p><iframe id="preview-frame" title="Draft website preview" sandbox width="100%" height="650"></iframe></section><div class="save"><p id="status" role="status" aria-live="polite">Loading content…</p><div class="actions"><button id="publish" type="button" disabled>Publish changes</button><button id="preview" class="secondary" type="button" disabled>Preview changes</button><button id="discard" class="secondary" type="button" disabled>Discard unsaved changes</button></div></div></main>',script);
}

