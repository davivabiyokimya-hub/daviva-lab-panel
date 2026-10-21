"use strict";
const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {defineSecret}=require("firebase-functions/params");
const admin=require("firebase-admin");
admin.initializeApp();
const apiKey=defineSecret("OPENAI_API_KEY");
const systemText="Sen DAVIVA LAB idari yönetim asistanısın. Yalnızca laboratuvar stok yönetimi, nöbet planlaması, cihaz bakımı, kalite dokümanları ve idari süreçler hakkında Türkçe destek ver. Hasta kimliği, hasta tetkik sonucu, tanı, tedavi veya klinik karar talep etme, analiz etme ya da saklama. Kullanıcının verdiği bilgiye dayan; gerçek Firestore kayıtlarına erişimin olmadığını açıkça belirt. SAS ve mevzuat uyumunu kesin onaylama. Kayıt değiştirme veya işlem yapma yetkin yok; yalnızca taslak ve öneri üret.";
exports.davivaAiChat=onCall({region:"europe-west1",secrets:[apiKey],maxInstances:3,memory:"256MiB",timeoutSeconds:30},async request=>{
 if(!request.auth?.uid||!request.auth?.token?.email)throw new HttpsError("unauthenticated","Oturum açmanız gerekiyor.");
 const uid=request.auth.uid;
 const staff=await admin.firestore().doc("kadro/"+uid).get();
 const s=staff.data();
 if(!staff.exists||s.aktif!==true||s["e-posta"]!==request.auth.token.email||s.rol!=="admin")throw new HttpsError("permission-denied","DAVIVA AI ilk sürümü yalnızca yöneticilere açıktır.");
 const message=request.data?.message;
 if(typeof message!=="string"||!message.trim()||message.length>1500)throw new HttpsError("invalid-argument","Mesaj 1–1500 karakter olmalıdır.");
 // Never read or forward Firestore documents, staff names, inventory or patient data.
 const now=Date.now(),ref=admin.firestore().doc("aiUsage/"+uid);
 await admin.firestore().runTransaction(async tx=>{
  const snapshot=await tx.get(ref),v=snapshot.data()||{};
  const reset=typeof v.windowStart==="number"&&now-v.windowStart<3600000?v.windowStart:now;
  const count=reset===v.windowStart?(v.count||0):0;
  if(count>=20)throw new HttpsError("resource-exhausted","Saatlik 20 mesaj sınırına ulaşıldı.");
  tx.set(ref,{windowStart:reset,count:count+1,updatedAt:admin.firestore.FieldValue.serverTimestamp()});
 });
 let response;
 try{
  response=await fetch("https://api.openai.com/v1/responses",{
   method:"POST",headers:{"Authorization":"Bearer "+apiKey.value(),"Content-Type":"application/json"},
   body:JSON.stringify({model:"gpt-4.1-mini",instructions:systemText,input:message,max_output_tokens:500,store:false}),
   signal:AbortSignal.timeout(25000)
  });
 }catch(_){throw new HttpsError("unavailable","Yapay zekâ servisine erişilemiyor.");}
 if(!response.ok){console.error("OpenAI request failed",response.status);throw new HttpsError("unavailable","Yapay zekâ yanıtı alınamadı.");}
 const payload=await response.json();
 const answer=(payload.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text).join("\n").trim();
 if(!answer)throw new HttpsError("unavailable","Yanıt oluşturulamadı.");
 return {answer};
});

const {onSchedule}=require("firebase-functions/v2/scheduler");
const maintenanceMailKey=defineSecret("RESEND_API_KEY");
const maintenanceMailFrom=defineSecret("MAINTENANCE_MAIL_FROM");
// Runs at 09:00 Türkiye time; deploy with Firebase CLI. No client-side credentials.
exports.sendMaintenanceReminders=onSchedule({schedule:"0 9 * * *",timeZone:"Europe/Istanbul",region:"europe-west1",secrets:[maintenanceMailKey,maintenanceMailFrom],maxInstances:1,timeoutSeconds:120},async()=>{
 const db=admin.firestore(),staffSnap=await db.collection("kadro").get();
 const staff=new Map(staffSnap.docs.filter(d=>d.data().aktif===true&&["admin","stok"].includes(d.data().rol)&&typeof d.data()["e-posta"]==="string").map(d=>[d.id,d.data()]));
 const admins=[...staff.values()].filter(x=>x.rol==="admin").map(x=>x["e-posta"]);
 if(!admins.length){console.warn("Maintenance email: no active administrators");return}
 const snap=await db.collection("labModules").where("category","==","device").get();
 const rows=snap.docs.map(d=>({id:d.id,...d.data()}));
 const registry=rows.filter(x=>x.recordType==="registry");
 const maintenance=rows.filter(x=>x.recordType==="maintenance").sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))||(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
 const latest=new Map();for(const m of maintenance){const key=String(m.deviceId||m.assetCode||m.device||"")+"|"+String(m.kind||"");if(!latest.has(key))latest.set(key,m)}
 const plans=[...latest.values()].map(m=>({...m,planId:m.id,planDate:m.next,kind:m.kind||"Bakım"}));
 const plannedIds=new Set(plans.map(m=>String(m.deviceId||m.assetCode||m.device||"")));
 for(const d of registry){if(d.next&&!plannedIds.has(String(d.id||d.assetCode||d.device||"")))plans.push({...d,planId:d.id,planDate:d.next,kind:"Envanter bakımı"})}
 const formatter=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Istanbul",year:"numeric",month:"2-digit",day:"2-digit"});
 const parts=formatter.formatToParts(new Date()),value=k=>parts.find(x=>x.type===k)?.value;
 const today=value("year")+"-"+value("month")+"-"+value("day");
 const dayNumber=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||""))?Date.parse(s+"T12:00:00Z")/86400000:null;
 const todayN=dayNumber(today);
 const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 for(const p of plans){
  const due=dayNumber(p.planDate);if(due===null||!Number.isFinite(due))continue;
  const remaining=Math.round(due-todayN);
  // Seven, three, one and zero days before due; daily after due.
  if(remaining>7||![7,3,1,0].includes(remaining)&&remaining>=0)continue;
  const recipients=[...new Set([...admins,...(p.assignedUid&&staff.has(p.assignedUid)?[staff.get(p.assignedUid)["e-posta"]]:[])])].filter(x=>emailPattern.test(x));
  if(!recipients.length)continue;
  const safe=x=>String(x||"").replace(/[<>\r\n]/g," ").slice(0,160);
  const title=safe(p.device||"Cihaz"),kind=safe(p.kind),label=remaining<0?Math.abs(remaining)+" gün gecikti":remaining===0?"Bugün":remaining+" gün kaldı";
  const key=[p.planId,p.planDate,today].map(encodeURIComponent).join("_");
  const log=db.collection("maintenanceMailLog").doc(key);
  try{
   // Reservation avoids duplicate sends across concurrent scheduler retries.
   await log.create({status:"pending",createdAt:admin.firestore.FieldValue.serverTimestamp(),planId:p.planId,planDate:p.planDate,recipientCount:recipients.length});
  }catch(e){if(e.code===6||e.code==="already-exists")continue;throw e}
  try{
   const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+maintenanceMailKey.value(),"Content-Type":"application/json","Idempotency-Key":key.slice(0,200)},body:JSON.stringify({from:maintenanceMailFrom.value(),to:recipients,subject:"DAVIVA LAB | "+title+" - "+label,text:"DAVIVA LAB cihaz bakım hatırlatması\nCihaz: "+title+"\nİşlem: "+kind+"\nPlan tarihi: "+p.planDate+"\nDurum: "+label+"\n\nDetaylar için DAVIVA LAB Cihaz Yönetim Merkezi'ni açın.\nhttps://davivabiyokimya-hub.github.io/daviva-lab-panel/"})});
   if(!response.ok)throw Error("Mail provider HTTP "+response.status);
   await log.update({status:"sent",sentAt:admin.firestore.FieldValue.serverTimestamp()});
  }catch(e){console.error("Maintenance mail failed",p.planId,e.message);await log.update({status:"failed",error:String(e.message).slice(0,200),failedAt:admin.firestore.FieldValue.serverTimestamp()})}
 }
});
