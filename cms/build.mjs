import fs from 'node:fs';
import path from 'node:path';
const dist='dist';
const originals=['index.html','event.html','coming-soon.html','robots.txt','sitemap.xml','logo.jpeg','lucky-duck.png','event-kgflips.png','event-ipswich-october.png','event-ipswich-portrait.png'];
fs.mkdirSync(dist,{recursive:true});
fs.cpSync('public',dist,{recursive:true});
for(const name of originals)fs.copyFileSync(name,path.join(dist,name));
const worker=path.join(dist,'_worker.js');
fs.mkdirSync(worker,{recursive:true});
fs.copyFileSync('cms/worker.js',path.join(worker,'index.js'));
fs.copyFileSync('cms/ui.js',path.join(worker,'ui.js'));
fs.writeFileSync(path.join(dist,'_routes.json'),JSON.stringify({version:1,include:['/','/index','/index.html','/event','/event.html','/coming-soon','/coming-soon.html','/admin','/admin/*','/cms-media/*'],exclude:[]},null,2));

