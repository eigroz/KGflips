import fs from 'node:fs';
const groups={'index.html':'Homepage','event.html':'Event page','coming-soon.html':'Coming soon page'};
for(const [name,page] of Object.entries(groups)){
 let html=fs.readFileSync(name,'utf8');
 if(html.includes('<!--cms:'))throw Error('Already annotated');
 if(name==='index.html'){
  let templates='';
  html=html.replace(/document\.getElementById\('dialog-title'\)\.textContent='([^']+)';\s*dialogBody\.innerHTML=([^\r\n]+);/g,(_,title,body)=>{
   const id=templates?'duck-popup':'ticket-popup';
   templates+='<template id="'+id+'"><span data-popup-title>'+title+'</span>'+body.slice(1,-1)+'</template>\n';
   return 'showPopup(\x27'+id+'\x27);';
  });
  html=html.replace('let lastFocus;', "let lastFocus;\nfunction showPopup(id){\n const fragment=document.getElementById(id).content.cloneNode(true);\n const title=fragment.querySelector('[data-popup-title]');\n document.getElementById('dialog-title').textContent=title.textContent;\n title.remove();\n dialogBody.replaceChildren(fragment);\n}");
  html=html.replace('  <div class="toast"',templates+'  <div class="toast"');
 }
 const [prefix,body]=html.split(/(?<=<body>)/);
 const stack=[];
 const counts={};
 const key=(group,kind)=>{const slug=(name.split('.')[0]+'-'+group).toLowerCase().replace(/[^a-z0-9]+/g,'-');return slug+'-'+kind+'-'+(counts[slug+kind]=(counts[slug+kind]||0)+1);};
 const sections={'launch-banner':'Top bar','header':'Header','event-intro':'Main block','event-visual':'Main block','event-details':'Ticket block','duck-section':'Middle block · Lucky Duck','past-event':'Past events','coming-soon':'More ways to shop','footer':'Footer','future-hero':'Introduction','future-grid':'Shopping features','future-club':'Membership','event-page':'Event details','ticket-popup':'Ticket popup','duck-popup':'Lucky Duck popup'};
 const voids=new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
 const result=body.replace(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script>|<\/?[a-z][^>]*>|[^<]+|</gi,token=>{
  if(token.startsWith('<!--')||/^<script\b/i.test(token))return token;
  if(token.startsWith('</')){const tag=token.match(/^<\/(\w+)/)?.[1];if(stack.at(-1)?.tag===tag)stack.pop();return token;}
  let group=stack.at(-1)?.group||page;
  if(token.startsWith('<')){
   const tag=token.match(/^<(\w+)/)?.[1];if(!tag)return token;
   const attr=token.match(/\bclass="([^"]*)"/)?.[1]?.split(/\s+/)||[];
   const id=token.match(/\bid="([^"]*)"/)?.[1];
   group=sections[id]||attr.map(c=>sections[c]).find(Boolean)||group;
   if(!voids.has(tag))stack.push({tag,group});
   if(tag==='img')return token.replace(/>$/, ' data-cms-image="'+key(group,'image')+'" data-cms-group="'+group+'">');
   if((tag==='a'&&!attr.includes('skip'))||tag==='iframe'||tag==='time'){
    const field=tag==='time'?'datetime':tag==='iframe'?'src':'href';
    if(new RegExp('\\b'+field+'="').test(token))return token.replace(/>$/, ' data-cms-attr="'+key(group,field)+'" data-cms-group="'+group+'" data-cms-field="'+field+'">');
   }
   return token;
  }
  if(!/[\p{L}\p{N}]/u.test(token)||stack.some(x=>['script','style','svg'].includes(x.tag)))return token;
  const [,lead,value,trail]=token.match(/^(\s*)([\s\S]*?)(\s*)$/);
  return lead+'<!--cms:'+key(group,'text')+'|'+group+'-->'+value+'<!--/cms-->'+trail;
 });
 fs.writeFileSync(name,prefix+result);
}

