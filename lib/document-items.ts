export type DocumentItem={description:string;quantity:number;unit:string;unit_price:number;vat_rate:number;category?:string;source_type?:string};
export function mergeDryingItems(items:DocumentItem[],suggestions:any[],update=false):DocumentItem[]{
 const next=items.map(x=>({...x}));
 for(const s of suggestions){
  const source=s.source_type;
  let index=next.findIndex(x=>source?.startsWith('drying:')?x.source_type===source:(['drying','drying_actual'].includes(x.source_type||'')&&x.description===s.description));
  const legacyDescription=s.description.replace(/ \[[^\]]+\]$/,'');
  const legacy=next.map((x,i)=>({x,i})).filter(({x})=>['drying','drying_actual'].includes(x.source_type||'')&&x.description===legacyDescription);
  if(index<0&&legacy.length===1&&suggestions.filter(x=>x.description.replace(/ \[[^\]]+\]$/,'')===legacyDescription).length===1){index=legacy[0].i;next[index]={...next[index],source_type:source};}
  const item:DocumentItem={description:s.description,quantity:Number(s.quantity),unit:s.unit||'Tage',unit_price:0,vat_rate:19,category:'Trocknung/Geräteeinsatz',source_type:source||'drying'};
  if(index<0)next.push(item);
  else if(update&&['tag','tage','t'].includes(next[index].unit.toLowerCase().trim().replace(/\.$/,'')))next[index]={...next[index],quantity:item.quantity};
 }
 return next;
}
export function applyCatalogPrice(item:DocumentItem,article:{unit:string;unit_price:number|null}):DocumentItem{
 if(article.unit_price==null||!Number.isFinite(Number(article.unit_price)))throw new Error('Dieser Artikel hat keinen hinterlegten Preis.');
 const norm=(s:string)=>s.toLowerCase().trim().replace(/\.$/,'');
 const unit=(s:string)=>['tag','tage','t'].includes(norm(s))?'tage':norm(s);
 if(unit(item.unit)!==unit(article.unit))throw new Error(`Einheiten passen nicht zusammen (${item.unit} / ${article.unit}). Bitte die Abrechnungseinheit zuerst prüfen.`);
 return {...item,unit_price:Number(article.unit_price)};
}
