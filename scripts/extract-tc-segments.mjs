import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const dir='docs/localization-tc';await fs.mkdir(dir,{recursive:true});
await fs.cp('src',dir+'/before/src',{recursive:true,errorOnExist:true,force:false});
const docs=JSON.parse(await fs.readFile('src/content/whitepaper/manifest.json','utf8'));
const b=await chromium.launch({channel:'msedge'});const p=await b.newPage();const all=[];let id=0;
for(const doc of docs){
 await p.setContent(await fs.readFile('src/content/whitepaper/'+doc.file,'utf8'));
 const units=await p.evaluate(()=>{
  const units=[];const allowed=new Set(['A','STRONG','B','EM','I','SPAN','BR','CODE','SUP','SUB']);
  const walk=e=>{
   if(e.matches('pre,code,.katex,svg,math,script,style'))return;
   const text=e.textContent.trim();
   if(!/[A-Za-z]{2}/.test(text))return;
   if([...e.querySelectorAll('*')].every(n=>allowed.has(n.tagName))&&!e.querySelector('.katex')&&e!==document.body){
    if(/^(https?:\/\/|0x[0-9a-f]{10})/i.test(text)&&!text.includes(' '))return;
    units.push({html:e.innerHTML,text});e.setAttribute('data-tc-unit',String(units.length-1));return;
   }
   for(const n of [...e.childNodes]){
    if(n.nodeType===Node.ELEMENT_NODE)walk(n);
    else if(n.nodeType===Node.TEXT_NODE&&/[A-Za-z]{2}/.test(n.textContent.trim())){
     const span=document.createElement('span');span.textContent=n.textContent;n.replaceWith(span);walk(span);
    }
   }
  };walk(document.body);return {units,template:document.body.innerHTML};
 });
 const entries=units.units.map((u,index)=>({id:id++,local:index,...u}));
 all.push({route:doc.route,file:doc.file,title:doc.title,units:entries});
 await fs.mkdir(dir+'/templates/'+doc.file.split('/')[0],{recursive:true});await fs.writeFile(dir+'/templates/'+doc.file,units.template);
}
await b.close();await fs.writeFile(dir+'/segments.json',JSON.stringify(all,null,2));
for(let i=0;i<all.length;i++)await fs.writeFile(dir+'/'+String(i).padStart(2,'0')+'.txt',all[i].route+'\n'+all[i].units.map(u=>`${u.id}\t${u.html}`).join('\n'));
console.log(all.map((d,i)=>i+' '+d.route+' '+d.units.length).join('\n'));console.log('Units '+id);
