const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const compile=p=>ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
const helper={};vm.runInNewContext(compile('lib/document-items.ts'),{exports:helper});
async function scenario(props){
 const states=[],effects=[],requests=[];let index=0,mount=true;
 const hooks={useState(initial){const n=index++;if(mount)states[n]=initial;return[states[n],v=>{states[n]=typeof v==='function'?v(states[n]):v}]},useMemo(fn){return fn()},useEffect(fn){if(mount)effects.push(fn)}};
 const jsx=(type,props)=>({type,props});
 const fixture={id:'doc',case_id:'case-from-document',document_type:'rechnung',items:[],company_id:'company'};
 const suggestion={description:'Trockner',quantity:4,unit:'Tage',source_type:'drying:fixture'};
 const mod={};vm.runInNewContext(compile('components/DocumentBuilder.tsx'),{exports:mod,require:n=>n==='react'?hooks:n==='react/jsx-runtime'?{jsx,jsxs:jsx}:n==='@/lib/document-items'?helper:{default:()=>null},AbortController,setTimeout,clearTimeout,fetch:async url=>{requests.push(url);return{ok:true,json:async()=>url.includes('billing-suggestions')?{suggested_items:[suggestion],search_terms:['Trocknung']}:url.includes('articles')?[]:fixture}}});
 mod.default(props);const cleanup=effects.map(fn=>fn());await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));
 mount=false;index=0;const tree=mod.default(props);
 function nodes(n){if(!n||typeof n!=='object')return[];if(Array.isArray(n))return n.flatMap(nodes);return[n,...nodes(n.props?.children)]}
 const buttons=nodes(tree).filter(n=>n.type==='button');
 assert.ok(requests.includes('/api/cases/case-from-document/billing-suggestions'));
 const add=buttons.find(n=>n.props.children==='Trocknungspositionen übernehmen');assert.ok(add);add.props.onClick();add.props.onClick();assert.equal(states[2].length,1);
 cleanup.forEach(fn=>fn?.());return states;
}
(async()=>{
 await scenario({documentId:'doc'});
 await scenario({sourceDocumentId:'offer',initialType:'rechnung'});
 const state=await scenario({caseId:'case-from-document',initialType:'rechnung'});assert.equal(state[2][0].quantity,4);
 console.log('Editor-Hooktests: Dokument bearbeiten, Angebot übernehmen, neue Rechnung und doppeltes Übernehmen bestanden (gemockte API, kein Browser).');
})().catch(e=>{console.error(e);process.exitCode=1});
