import {cp,mkdir,rm,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(), out=resolve(root,'dist');
if(out!==resolve(root,'dist'))throw new Error('Unexpected output path');
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
const files=['index.html','styles.css','app.js','favicon.svg','privacy.html','credits.html','robots.txt','sitemap.xml'];
for(const f of files)await cp(f,resolve(out,f));
const assetFiles=['system.css','system.js','ui/cards.css','ui/ui.js','motion/motion.css','motion/motion.js','layout/layout.css','layout/layout.js','moments/moments.js','moments/lib.js','moments/word-highlight/moment.js','moments/word-highlight/moment.css','vendor/gsap.min.js','fonts/red-hat-display.woff2','fonts/red-hat-text.woff2','fonts/OFL.txt','img/stage.webp','img/studio.webp','img/microphone.webp','img/crowd.webp'];
for(const f of assetFiles){const target=resolve(out,'assets',f);await mkdir(resolve(target,'..'),{recursive:true});await cp(resolve(root,'assets',f),target);}
await writeFile(resolve(out,'.nojekyll'),'');
console.log('Built LANP static site in dist/');
