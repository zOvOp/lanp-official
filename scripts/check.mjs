import {readFile,access} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
for(const page of ['index.html','privacy.html','credits.html']){
 const html=await readFile(page,'utf8');
 if(!/<html[^>]*lang="zh-CN"/.test(html))throw new Error(page+': missing Chinese language');
 const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 for(const m of html.matchAll(/(?:src|href)="([^"#]+|#[^"]+)"/g)){
  const url=m[1];if(/^(https?:|mailto:|data:)/.test(url))continue;
  if(url.startsWith('#')){if(!ids.has(url.slice(1)))throw new Error(page+': broken anchor '+url);}
  else await access(resolve(dirname(page),url.split('#')[0]));
 }
 console.log(page+': local links and assets OK');
}
for(const f of ['app.js','scripts/build.mjs','scripts/serve.mjs']){await import('node:child_process').then(({execFileSync})=>execFileSync(process.execPath,['--check',f],{stdio:'inherit'}));}
