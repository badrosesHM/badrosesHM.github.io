import {readFile} from 'node:fs/promises';

function readQuoted(source,start){
  if(source[start]!=="'")throw new Error('Expected a quoted string');
  let value='';
  let index=start+1;
  while(index<source.length){
    const character=source[index++];
    if(character==="'")return{value,index};
    if(character!=='\\'){
      value+=character;
      continue;
    }
    const escaped=source[index++];
    if(escaped==='x'){
      value+=String.fromCharCode(Number.parseInt(source.slice(index,index+2),16));
      index+=2;
    }else if(escaped==='u'){
      value+=String.fromCharCode(Number.parseInt(source.slice(index,index+4),16));
      index+=4;
    }else{
      value+=({n:'\n',r:'\r',t:'\t',b:'\b',f:'\f',v:'\v'}[escaped]??escaped);
    }
  }
  throw new Error('Unterminated quoted string');
}

function encode(number,base){
  if(number<base)return number>35?String.fromCharCode(number+29):number.toString(36);
  return encode(Math.floor(number/base),base)+encode(number%base,base);
}

function decodePacker(source){
  const marker=source.indexOf("}('");
  if(marker<0)throw new Error('Packed payload not found');
  const payload=readQuoted(source,marker+2);
  let cursor=payload.index;
  if(source[cursor++]!==',')throw new Error('Packed base not found');
  const baseEnd=source.indexOf(',',cursor);
  const base=Number(source.slice(cursor,baseEnd));
  cursor=baseEnd+1;
  const countEnd=source.indexOf(',',cursor);
  const count=Number(source.slice(cursor,countEnd));
  cursor=countEnd+1;
  const words=readQuoted(source,cursor).value.split('|');
  let decoded=payload.value;
  for(let index=count-1;index>=0;index--){
    if(!words[index])continue;
    decoded=decoded.replace(new RegExp(`\\b${encode(index,base)}\\b`,'g'),words[index]);
  }
  return decoded;
}

const source=await readFile(process.argv[2],'utf8');
const decoded=decodePacker(source);
if(process.argv.includes('--urls')){
  const matches=[...decoded.matchAll(/url\s*:\s*['"]([^'"]+)['"]/g)].map(match=>match[1]);
  process.stdout.write([...new Set(matches)].join('\n'));
}else{
  process.stdout.write(decoded);
}
