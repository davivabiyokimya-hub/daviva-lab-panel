import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,doc,getDoc,collection,getDocs,query,where} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
const auth=getAuth(),db=getFirestore();
const nav=document.querySelector("aside nav"),main=document.querySelector("main");
if(nav&&main){
const button=document.createElement("button");button.type="button";button.dataset.page="mobileAlerts";button.textContent="🔔 Mobil Uyarı Merkezi";nav.append(button);
const page=document.createElement("section");page.id="mobileAlerts";page.className="page hidden";
page.innerHTML='<div class="panel"><h2>🔔 Mobil Uyarı Merkezi</h2><p class="muted">Kritik stok, yaklaşan SKT ve bekleyen talepler. Veriler yalnızca yetkiniz dahilinde görüntülenir.</p><div class="actions"><button class="btn" type="button" id="maRefresh">Şimdi Kontrol Et</button><button class="btn alt" type="button" id="maPermission">Telefon Bildirim İzni</button><label class="field"><input type="checkbox" id="maNotify"> Yeni uyarıları cihazda göster</label><label class="field"><input type="checkbox" id="maVoice"> 🔊 Yeni kritik uyarıları seslendir</label><button class="btn alt" type="button" id="maTestVoice">Sesi Test Et</button></div><p class="muted" id="maStatus" role="status">Giriş bekleniyor.</p><div class="cards" id="maCounters"></div><div id="maItems" aria-live="polite"></div><p class="muted">Uygulama kapalıyken arka plan bildirimi bu sürümde desteklenmiyor.</p></div>';
main.insertBefore(page,main.querySelector("footer"));
const el=id=>document.getElementById(id),status=s=>{el("maStatus").textContent=s};
let user=null,admin=false,canInventory=false,canDevices=false,token=0,working=false,previous=new Set(),initialized=false,timer=null;
function expiryDays(value){if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;const d=new Date(value+"T12:00:00");if(!Number.isFinite(d.getTime()))return null;const today=new Date();today.setHours(12,0,0,0);return Math.round((d-today)/86400000)}
function item(title,detail,urgent){const card=document.createElement("div");card.className="card";card.style.margin="8px 0";if(urgent)card.style.borderLeft="4px solid #c0392b";const h=document.createElement("strong");h.textContent=title;const p=document.createElement("p");p.className="muted";p.textContent=detail;card.append(h,p);return card}
async function refresh(){
if(!user||working||document.hidden)return;
working=true;const version=token;el("maRefresh").disabled=true;status("Uyarılar kontrol ediliyor…");
try{
const tasks=[];
if(canInventory)tasks.push(getDocs(collection(db,"products")).then(s=>({type:"products",docs:s.docs})));
if(canDevices)tasks.push(getDocs(collection(db,"labModules")).then(s=>({type:"devices",docs:s.docs})));
const requestQuery=admin?collection(db,"approvalRequests"):query(collection(db,"approvalRequests"),where("requesterUid","==",user.uid));
tasks.push(getDocs(requestQuery).then(s=>({type:"requests",docs:s.docs})));
const results=await Promise.allSettled(tasks);
if(version!==token||!user)return;
const alerts=[],counts={stock:0,expiry:0,requests:0,maintenance:0},errors=[];
const maintenanceRows=[];
for(const result of results){
if(result.status!=="fulfilled"){errors.push("Bazı kayıtlara erişilemedi");continue}
const {type,docs}=result.value;
for(const snap of docs){
const data=snap.data();
if(type==="devices"){if(data.category==="device")maintenanceRows.push({id:snap.id,...data});continue}
if(type==="products"){
const quantity=Number(data.quantity),minimum=Number(data.minStock),days=expiryDays(data.expiry),name=String(data.name||data.code||"Ürün").slice(0,120);
if(data.quantity!==null&&data.quantity!==""&&data.quantity!==undefined&&data.minStock!==null&&data.minStock!==""&&data.minStock!==undefined&&Number.isFinite(quantity)&&Number.isFinite(minimum)&&quantity<=minimum){counts.stock++;alerts.push({key:"stock:"+snap.id,title:"Kritik stok",detail:name+" · "+quantity+" / "+minimum,urgent:true})}
if(days!==null&&days<=30){counts.expiry++;alerts.push({key:"expiry:"+snap.id,title:days<0?"SKT geçmiş":"SKT yaklaşıyor",detail:name+" · "+data.expiry,urgent:true})}
}else if(type==="requests"&&data.status==="PENDING"){
counts.requests++;alerts.push({key:"request:"+snap.id,title:admin?"Bekleyen onay":"Bekleyen talebiniz",detail:String(data.title||"Talep").slice(0,120),urgent:false})
}
}
}
if(maintenanceRows.length){
 const records=maintenanceRows.filter(x=>x.recordType==="maintenance").sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))||(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
 const latest=new Map();for(const x of records){const key=String(x.deviceId||x.assetCode||x.device||"")+"|"+String(x.kind||"");if(!latest.has(key))latest.set(key,x)}
 const planned=new Set([...latest.values()].map(x=>String(x.deviceId||x.assetCode||x.device||"")));
 const plans=[...latest.values()].map(x=>({...x,planDate:x.next}));
 for(const x of maintenanceRows.filter(x=>x.recordType==="registry")){if(!planned.has(String(x.id||x.assetCode||x.device||"")))plans.push({...x,planDate:x.next,kind:"Periyodik bakım"})}
 for(const x of plans){const remaining=expiryDays(x.planDate);if(remaining===null||remaining>30)continue;counts.maintenance++;alerts.push({key:"maintenance:"+x.id+":"+x.planDate,title:remaining<0?"Geciken cihaz bakımı":"Yaklaşan cihaz bakımı",detail:String(x.device||"Cihaz").slice(0,120)+" · "+String(x.kind||"Bakım").slice(0,60)+" · "+(remaining<0?Math.abs(remaining)+" gün gecikti":remaining+" gün kaldı"),urgent:remaining<=3})}
}
const keys=new Set(alerts.map(a=>a.key));
if(initialized&&el("maNotify").checked&&"Notification" in window&&Notification.permission==="granted"){
const added=alerts.filter(a=>!previous.has(a.key));
if(added.length){try{new Notification("DAVIVA LAB · "+added.length+" yeni uyarı",{body:"Uyarı Merkezi'ni kontrol edin.",tag:"daviva-lab-alerts"})}catch(e){}}
}
if(initialized&&el("maVoice").checked&&!document.hidden){
 const fresh=alerts.filter(a=>a.urgent&&!previous.has(a.key));
 if(fresh.length&&"speechSynthesis" in window){try{window.speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance("DAVIVA LAB. "+fresh.length+" yeni kritik uyarı. "+fresh.slice(0,2).map(a=>a.title+" "+a.detail).join(". "));speech.lang="tr-TR";speech.rate=0.95;window.speechSynthesis.speak(speech)}catch(e){status("Sesli uyarı başlatılamadı.")}}
}
previous=keys;initialized=true;
const counters=el("maCounters");counters.replaceChildren();
for(const [label,value] of [["Kritik stok",counts.stock],["SKT (30 gün)",counts.expiry],["Bekleyen talepler",counts.requests],["Cihaz bakımı (30 gün)",counts.maintenance]]){
const card=document.createElement("div");card.className="card";const t=document.createElement("div");t.className="muted";t.textContent=label;const n=document.createElement("div");n.className="metric";n.textContent=String(value);card.append(t,n);counters.append(card)
}
const list=el("maItems");list.replaceChildren();for(const a of alerts)list.append(item(a.title,a.detail,a.urgent));
if(!alerts.length)list.append(item("Uyarı yok","Erişilebilir kayıtlar kontrol edildi.",false));
status("Son kontrol: "+new Date().toLocaleTimeString("tr-TR")+(errors.length?" · "+errors.join("; "):""));
}catch(e){status("Uyarılar okunamadı: "+e.message)}
finally{working=false;el("maRefresh").disabled=false}
}
button.addEventListener("click",()=>{
document.querySelectorAll("main .page").forEach(p=>p.classList.toggle("hidden",p!==page));
nav.querySelectorAll("button[data-page]").forEach(b=>b.classList.toggle("active",b===button));
document.body.classList.remove("dv-mobile-open");
if(user)refresh();else status("Lütfen yetkili hesabınızla giriş yapın.")
});
el("maRefresh").addEventListener("click",refresh);
el("maTestVoice").addEventListener("click",()=>{if(!("speechSynthesis" in window))return status("Sesli bildirim desteklenmiyor.");window.speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance("DAVIVA LAB sesli uyarı sistemi hazır.");speech.lang="tr-TR";window.speechSynthesis.speak(speech)});

el("maPermission").addEventListener("click",()=>{
if(!("Notification" in window))return status("Bildirim izni desteklenmiyor. iPhone'da uygulamayı Ana Ekran'a ekleyerek açın.");
if(!isSecureContext)return status("HTTPS bağlantısı gerekli.");
try{Promise.resolve(Notification.requestPermission()).then(p=>status(p==="granted"?"Bildirim izni verildi. Cihazda göster seçeneğini etkinleştirin.":"Bildirim izni: "+p)).catch(e=>status(e.message))}
catch(e){status("Bildirim izni açılamadı: "+e.message)}
});
onAuthStateChanged(auth,async u=>{
const v=++token;user=null;admin=false;canInventory=false;canDevices=false;initialized=false;previous.clear();
if(timer){clearInterval(timer);timer=null}
el("maCounters").replaceChildren();el("maItems").replaceChildren();el("maNotify").checked=true;el("maVoice").checked=true;
if(!u){status("Giriş yapın.");return}
try{
const snap=await getDoc(doc(db,"kadro",u.uid));if(v!==token)return;
const staff=snap.data();
if(staff?.aktif!==true||staff["e-posta"]!==u.email||!["admin","stok"].includes(staff.rol)){status("Bu hesap için stok uyarısı erişimi bulunmuyor.");return}
admin=staff.rol==="admin";
if(admin){canInventory=true;canDevices=true;}
else{const permissions=await getDoc(doc(db,"accessPermissions",u.uid));if(v!==token)return;canInventory=!permissions.exists()||permissions.data()?.inventory===true;canDevices=!permissions.exists()||permissions.data()?.labModules===true}
user=u;status("Otomatik uyarı ve sesli bildirim açık. Tarayıcı izni ve ses desteği gereklidir.");
timer=setInterval(()=>{if(!document.hidden)refresh()},120000);
refresh();
}catch(e){status("Yetki kontrolü başarısız: "+e.message)}
});
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&user)refresh()});
}
