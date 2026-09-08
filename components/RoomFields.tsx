"use client";
export const STANDARD_FLOORS=["Untergeschoss","Erdgeschoss","1. OG","2. OG","Dachgeschoss"];
export const STANDARD_ROOMS=["Badezimmer","WC","Küche","Wohnzimmer","Schlafzimmer","Kinderzimmer","Flur","Keller","Büro","Hauswirtschaftsraum","Technikraum","Garage"];
export function SelectOrCustom({name,items,label,placeholder,value=""}:{name:string;items:string[];label:string;placeholder:string;value?:string}){
 return <div className="field"><label>{label}</label><div className="selectWithCustom">
  <select name={name+"_preset"} defaultValue={items.includes(value)?value:""} onChange={e=>{const i=e.currentTarget.parentElement?.querySelector<HTMLInputElement>(`input[name="${name}"]`);if(i&&e.target.value)i.value=e.target.value}}>
   <option value="">Standard auswählen</option>{items.map(x=><option key={x} value={x}>{x}</option>)}
  </select>
  <input name={name} defaultValue={value} placeholder={placeholder}/>
 </div></div>
}
