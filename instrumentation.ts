export async function register(){
 if(process.env.NEXT_RUNTIME==="nodejs"){
  // Backfill the already linked ECG owner when a production instance starts.
  const {reconcileLinkedEcgTimes}=await import("./lib/ecg-sync");
  const result=await reconcileLinkedEcgTimes();
  console.info("ECG reconciliation",JSON.stringify(result));
 }
}
