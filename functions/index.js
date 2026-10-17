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
