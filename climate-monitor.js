import {initializeApp,getApps,getApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,collection,addDoc,doc,getDoc,getDocs,query,where,serverTimestamp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {firebaseConfig} from "./daviva-firebase-config.js?v=20261016-2";
const app=getApps().length?getApp():initializeApp(firebaseConfig),db=getFirestore(app),auth=getAuth(app);
const $=id=>document.getElementById(id);
let current=null,allowed=false,cabinets=[],readings=[];
const css=document.createElement("style");css.textContent=`
#climate-page .cl-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin:16px 0}
#climate-page .cl-card{background:white;border:1px solid #d9e5f0;border-radius:14px;padding:17px}
#climate-page .cl-row{display:flex;gap:10px;flex-wrap:wrap;align-items:end}
#climate-page label{display:grid;gap:5px;font-size:13px;font-weight:600;flex:1;min-width:150px}
#climate-page input,#climate-page select,#climate-page textarea{width:100%;padding:10px;border:1px solid #cbd9e6;border-radius:8px}
#climate-page table{border-collapse:collapse;width:100%;font-size:13px}
#climate-page td,#climate-page th{padding:9px;border-bottom:1px solid #e3edf5;text-align:left}
#climate-page .cl-bad{color:#a52c25;font-weight:700}
#climate-page .cl-good{color:#16683e;font-weight:700}
#climate-page .cl-note{color:#62758a;font-size:12px}
`;document.head.append(css);
const nav=document.querySelector("aside nav"),btn=document.createElement("button");btn.type="button";btn.textContent="🌡 Dolap Isı / Nem";btn.dataset.page="climate-page";nav?.append(btn);
const page=document.createElement("section");page.id="climate-page";page.className="page hidden";page.innerHTML=`
<div class="panel"><h3>Dolap Isı ve Nem Takibi</h3><p class="muted">Manuel kayıt ve yetkilendirilmiş sensör veri aktarımı. Sınırlar dolap/ürün üretici talimatına göre belirlenir.</p>
<div id="cl-status" role="status"></div><div class="cl-grid" id="cl-summary"></div>
<div class="cl-card"><h3>Dolap tanımla (yönetici)</h3><form id="cl-cab-form" class="cl-row">
<label>Dolap adı<input name="name" maxlength="100" required></label>
<label>Konum<input name="location" maxlength="100" required></label>
<label>Min °C<input name="minTemp" type="number" step="0.1" required></label>
<label>Max °C<input name="maxTemp" type="number" step="0.1" required></label>
<label>Min nem % (isteğe bağlı)<input name="minHumidity" type="number" min="0" max="100" step="0.1"></label>
<label>Max nem % (isteğe bağlı)<input name="maxHumidity" type="number" min="0" max="100" step="0.1"></label>
<label>Limit kaynağı<input name="limitSource" maxlength="200" placeholder="Üretici IFU / yerel onay" required></label>
<button class="btn" type="submit">Dolabı kaydet</button></form></div>
<div class="cl-card" style="margin-top:15px"><h3>Manuel ölçüm kaydı</h3><form id="cl-read-form" class="cl-row">
<label>Dolap<select name="cabinetId" id="cl-cab-select" required></select></label>
<label>Sıcaklık °C<input name="temperature" type="number" step="0.1" min="-100" max="100" required></label>
<label>Nem % (varsa)<input name="humidity" type="number" step="0.1" min="0" max="100"></label>
<label>Ölçüm zamanı<input name="observedAt" type="datetime-local" required></label>
<label>Not<input name="note" maxlength="300"></label>
<button class="btn" type="submit">Ölçümü kaydet</button></form><p class="cl-note">Ölçüm saati kullanıcı tarafından girilir; kayıt oluşturma zamanı sunucudan alınır. Limit dışı kayıtlar silinmez, uygunsuzluk takibi gerektirir.</p></div>
<div class="cl-card" style="margin-top:15px"><h3>Ölçüm geçmişi</h3><div style="overflow:auto"><table><thead><tr><th>Zaman</th><th>Dolap</th><th>°C</th><th>Nem %</th><th>Kaynak</th><th>Durum</th><th>Kullanıcı / Not</th></tr></thead><tbody id="cl-history"></tbody></table></div><div class="actions"><button type="button" class="btn alt" id="cl-export">CSV dışa aktar</button><button type="button" class="btn alt" id="cl-refresh">Yenile</button></div></div>
<div class="cl-card" style="margin-top:15px"><h3>Otomatik sensör desteği</h3><p class="cl-note">Sensör verileri tarayıcıdan veya herkese açık Firestore yazma izniyle kabul edilmez. Gelecekte güvenli sunucu/Cloud Function sensör kimliğini doğrulayarak <code>climateReadings</code> koleksiyonuna <code>source: "sensor"</code> ile kayıt oluşturacaktır. Sensör entegrasyonu henüz aktif değildir.</p></div></div>`;
document.querySelector("main footer")?.before(page);
function show(){document.querySelectorAll(".page").forEach(x=>x.classList.toggle("hidden",x!==page));document.querySelectorAll("[data-page]").forEach(x=>x.classList.toggle("active",x===btn));const h=$("heading");if(h)h.textContent="Dolap Isı ve Nem Takibi";}
btn.addEventListener("click",()=>{show();if(allowed)refresh();});
const status=(s,bad=false)=>{const e=$("cl-status");e.textContent=s;e.className=bad?"cl-bad":"cl-note";};
const num=(v)=>v===""||v==null?null:Number(v);
const ok=(v,min,max)=>v>=min&&v<=max;
function assess(r,c){if(!c)return "Dolap bulunamadı";if(!ok(r.temperature,c.minTemp,c.maxTemp))return "Limit dışı";if(r.humidity!=null&&c.minHumidity!=null&&c.maxHumidity!=null&&!ok(r.humidity,c.minHumidity,c.maxHumidity))return "Limit dışı";return "Uygun";}
function render(){const summary=$("cl-summary"),sel=$("cl-cab-select"),tbody=$("cl-history");summary.replaceChildren();sel.replaceChildren();for(const c of cabinets){const option=document.createElement("option");option.value=c.id;option.textContent=c.name;sel.append(option);const latest=readings.filter(r=>r.cabinetId===c.id).sort((a,b)=>b.observedAt.localeCompare(a.observedAt))[0];const div=document.createElement("div");div.className="cl-card";const title=document.createElement("strong");title.textContent=c.name;const desc=document.createElement("p");desc.className="cl-note";desc.textContent=c.location+" · "+c.minTemp+"–"+c.maxTemp+" °C";const value=document.createElement("p");value.textContent=latest?latest.temperature+" °C · "+(latest.humidity??"—")+" %":"Henüz ölçüm yok";const state=document.createElement("div");state.textContent=latest?assess(latest,c):"Kayıt bekleniyor";state.className=latest?(assess(latest,c)==="Uygun"?"cl-good":"cl-bad"):"cl-note";div.append(title,desc,value,state);summary.append(div);}tbody.replaceChildren();for(const r of readings.sort((a,b)=>b.observedAt.localeCompare(a.observedAt)).slice(0,300)){const c=cabinets.find(x=>x.id===r.cabinetId),tr=document.createElement("tr");const fields=[r.observedAt.replace("T"," "),c?.name||r.cabinetId,r.temperature,r.humidity??"—",r.source,assess(r,c),(r.email||"sensör")+" · "+(r.note||"")];fields.forEach((v,i)=>{const td=document.createElement("td");td.textContent=String(v);if(i===5)td.className=v==="Uygun"?"cl-good":"cl-bad";tr.append(td)});tbody.append(tr);}}
async function refresh(){if(!allowed)return;try{const [cs,rs]=await Promise.all([getDocs(collection(db,"climateCabinets")),getDocs(collection(db,"climateReadings"))]);cabinets=cs.docs.map(d=>({id:d.id,...d.data()}));readings=rs.docs.map(d=>({id:d.id,...d.data()}));render();status(cabinets.length+" dolap, "+readings.length+" ölçüm kaydı.");}catch(e){status("Veriler yüklenemedi: "+e.message,true);}}
onAuthStateChanged(auth,async u=>{current=u;allowed=false;if(!u){status("Giriş yapın.");return;}try{const s=await getDoc(doc(db,"kadro",u.uid));allowed=s.exists()&&s.data().aktif===true&&s.data()["e-posta"]===u.email&&["admin","stok"].includes(s.data().rol);$("cl-cab-form").hidden=!allowed||s.data().rol!=="admin";if(allowed)await refresh();else status("Bu modüle erişim yetkiniz yok.",true);}catch(e){status("Yetki kontrolü başarısız: "+e.message,true);}});
$("cl-cab-form").addEventListener("submit",async e=>{e.preventDefault();if(!allowed)return;const f=e.target,v=Object.fromEntries(new FormData(f));const minTemp=num(v.minTemp),maxTemp=num(v.maxTemp),minHumidity=num(v.minHumidity),maxHumidity=num(v.maxHumidity);if(!Number.isFinite(minTemp)||!Number.isFinite(maxTemp)||minTemp>=maxTemp||((minHumidity==null)!==(maxHumidity==null))||(minHumidity!=null&&minHumidity>=maxHumidity)){status("Sınırları kontrol edin.",true);return;}try{await addDoc(collection(db,"climateCabinets"),{name:v.name.trim(),location:v.location.trim(),minTemp,maxTemp,minHumidity,maxHumidity,limitSource:v.limitSource.trim(),active:true,createdBy:current.uid,createdAt:serverTimestamp()});f.reset();await refresh();}catch(err){status("Dolap kaydedilemedi: "+err.message,true);}});
$("cl-read-form").addEventListener("submit",async e=>{e.preventDefault();if(!allowed)return;const f=e.target,v=Object.fromEntries(new FormData(f));const temperature=num(v.temperature),humidity=num(v.humidity);if(!cabinets.some(c=>c.id===v.cabinetId)||temperature==null||!Number.isFinite(temperature)||temperature< -100||temperature>100||humidity!=null&&(!Number.isFinite(humidity)||humidity<0||humidity>100)){status("Ölçüm değerleri geçersiz.",true);return;}try{await addDoc(collection(db,"climateReadings"),{cabinetId:v.cabinetId,temperature,humidity,observedAt:v.observedAt,source:"manual",note:v.note.trim(),uid:current.uid,email:current.email,createdAt:serverTimestamp()});f.reset();await refresh();}catch(err){status("Ölçüm kaydedilemedi: "+err.message,true);}});
$("cl-refresh").onclick=refresh;
$("cl-export").onclick=()=>{if(!allowed)return;const lines=[["Zaman","Dolap","Sicaklik C","Nem %","Kaynak","Durum","Kullanici","Not"],...readings.map(r=>[r.observedAt,cabinets.find(c=>c.id===r.cabinetId)?.name||r.cabinetId,r.temperature,r.humidity??"",r.source,assess(r,cabinets.find(c=>c.id===r.cabinetId)),r.email||"",r.note||""])].map(row=>row.map(x=>'"'+String(x??"").replaceAll('"','""')+'"').join(";")).join("\r\n");const blob=new Blob(["\uFEFF"+lines],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="DAVIVALAB_isi_nem_kayitlari.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
