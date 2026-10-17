import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,doc,getDoc,collection,getDocs,query,where} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
const auth=getAuth(),db=getFirestore();
const nav=document.querySelector("aside nav"),main=document.querySelector("main");
if(nav&&main){
const button=document.createElement("button");button.type="button";button.dataset.page="mobileAlerts";button.textContent="🔔 Mobil Uyarı Merkezi";nav.append(button);
const page=document.createElement("section");page.id="mobileAlerts";page.className="page hidden";
page.innerHTML='<div class="panel"><h2>🔔 Mobil Uyarı Merkezi</h2><p class="muted">Kritik stok, yaklaşan SKT ve bekleyen talepler. Veriler yalnızca yetkiniz dahilinde görüntülenir.</p><div class="actions"><button class="btn" type="button" id="maRefresh">Şimdi Kontrol Et</button><button class="btn alt" type="button" id="maPermission">Telefon Bildirim İzni</button><label class="field"><input type="checkbox" id="maNotify"> Yeni uyarıları cihazda göster</label></div><p class="muted" id="maStatus" role="status">Giriş bekleniyor.</p><div class="cards" id="maCounters"></div><div id="maItems" aria-live="polite"></div><p class="muted">Uygulama kapalıyken arka plan bildirimi bu sürümde desteklenmiyor.</p></div>';
main.insertBefore(page,main.querySelector("footer"));
const el=id=>document.getElementById(id),status=s=>{el("maStatus").textContent=s};
let user=null,admin=false,canInventory=false,token=0,working=false,previous=new Set(),initialized=false,timer=null;
function expiryDays(value){if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;const d=new Date(value+"T12:00:00");if(!Number.isFinite(d.getTime()))return null;const today=new Date();today.setHours(12,0,0,0);return Math.round((d-today)/86400000)}
function item(title,detail,urgent){const card=document.createElement("div");card.className="card";card.style.margin="8px 0";if(urgent)card.style.borderLeft="4px solid #c0392b";const h=document.createElement("strong");h.textContent=title;const p=document.createElement("p");p.className="muted";p.textContent=detail;card.append(h,p);return card}
async function refresh(){
if(!user||working||document.hidden)return;
working=true;const version=token;el("maRefresh").disabled=true;status("Uyarılar kontrol ediliyor…");
try{
const tasks=[];
if(canInventory)tasks.push(getDocs(collection(db,"products")).then(s=>({type:"products",docs:s.docs})));
const requestQuery=admin?collection(db,"approvalRequests"):query(collection(db,"approvalRequests"),where("requesterUid","==",user.uid));
tasks.push(getDocs(requestQuery).then(s=>({type:"requests",docs:s.docs})));
const results=await Promise.allSettled(tasks);
if(version!==token||!user)return;
const alerts=[],counts={stock:0,expiry:0,requests:0},errors=[];
for(const result of results){
if(result.status!=="fulfilled"){errors.push("Bazı kayıtlara erişilemedi");continue}
const {type,docs}=result.value;
for(const snap of docs){
const data=snap.data();
if(type==="products"){
const quantity=Number(data.quantity),minimum=Number(data.minStock),days=expiryDays(data.expiry),name=String(data.name||data.code||"Ürün").slice(0,120);
if(data.quantity!==null&&data.quantity!==""&&data.quantity!==undefined&&data.minStock!==null&&data.minStock!==""&&data.minStock!==undefined&&Number.isFinite(quantity)&&Number.isFinite(minimum)&&quantity<=minimum){counts.stock++;alerts.push({key:"stock:"+snap.id,title:"Kritik stok",detail:name+" · "+quantity+" / "+minimum,urgent:true})}
if(days!==null&&days<=30){counts.expiry++;alerts.push({key:"expiry:"+snap.id,title:days<0?"SKT geçmiş":"SKT yaklaşıyor",detail:name+" · "+data.expiry,urgent:true})}
}else if(type==="requests"&&data.status==="PENDING"){
counts.requests++;alerts.push({key:"request:"+snap.id,title:admin?"Bekleyen onay":"Bekleyen talebiniz",detail:String(data.title||"Talep").slice(0,120),urgent:false})
}
}
}
const keys=new Set(alerts.map(a=>a.key));
if(initialized&&el("maNotify").checked&&"Notification" in window&&Notification.permission==="granted"){
const added=alerts.filter(a=>!previous.has(a.key));
if(added.length){try{new Notification("DAVIVA LAB · "+added.length+" yeni uyarı",{body:"Uyarı Merkezi'ni kontrol edin.",tag:"daviva-lab-alerts"})}catch(e){}}
}
previous=keys;initialized=true;
const counters=el("maCounters");counters.replaceChildren();
for(const [label,value] of [["Kritik stok",counts.stock],["SKT (30 gün)",counts.expiry],["Bekleyen talepler",counts.requests]]){
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
el("maPermission").addEventListener("click",()=>{
if(!("Notification" in window))return status("Bildirim izni desteklenmiyor. iPhone'da uygulamayı Ana Ekran'a ekleyerek açın.");
if(!isSecureContext)return status("HTTPS bağlantısı gerekli.");
try{Promise.resolve(Notification.requestPermission()).then(p=>status(p==="granted"?"Bildirim izni verildi. Cihazda göster seçeneğini etkinleştirin.":"Bildirim izni: "+p)).catch(e=>status(e.message))}
catch(e){status("Bildirim izni açılamadı: "+e.message)}
});
onAuthStateChanged(auth,async u=>{
const v=++token;user=null;admin=false;canInventory=false;initialized=false;previous.clear();
if(timer){clearInterval(timer);timer=null}
el("maCounters").replaceChildren();el("maItems").replaceChildren();el("maNotify").checked=false;
if(!u){status("Giriş yapın.");return}
try{
const snap=await getDoc(doc(db,"kadro",u.uid));if(v!==token)return;
const staff=snap.data();
if(staff?.aktif!==true||!["admin","stok"].includes(staff.rol)){status("Bu hesap için stok uyarısı erişimi bulunmuyor.");return}
admin=staff.rol==="admin";
if(admin)canInventory=true;
else{const permissions=await getDoc(doc(db,"accessPermissions",u.uid));if(v!==token)return;canInventory=permissions.exists()&&permissions.data()?.inventory===true}
user=u;status("Hazır. Uyarıları kontrol edin.");
timer=setInterval(()=>{if(!document.hidden)refresh()},120000);
refresh();
}catch(e){status("Yetki kontrolü başarısız: "+e.message)}
});
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&user)refresh()});
}
