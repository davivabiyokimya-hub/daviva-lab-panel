import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,doc,getDoc} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
const auth=getAuth(),db=getFirestore(),nav=document.querySelector("aside nav"),main=document.querySelector("main");
const folders=[
["SOP ve Talimatlar","1B1Ql9i7YDHeszpEekB_V9044Lb6471UH"],
["Formlar ve Tutanaklar","1dgc448HL_rOnwXAtshlVfACZsYs20X_7"],
["Cihaz Belgeleri","1NFcvpHtfl08ncXeQYtuGNF3iQiY6PV2N"],
["Kalibrasyon ve Bakım","12EIYZVqgD62EyylL2ExQ_1WM7TGZ4zXy"],
["Stok ve Satın Alma","1-Oopp5Nf-DeDcJ5E6eqDdwoCt_LlCaa0"]
];
if(nav&&main){
const btn=document.createElement("button");btn.type="button";btn.dataset.page="driveDocuments";btn.textContent="📁 Google Drive Belgeleri";btn.className="hidden";nav.append(btn);
const page=document.createElement("section");page.id="driveDocuments";page.className="page hidden";
page.innerHTML='<div class="panel"><h2>📁 DAVIVA LAB Belge Yönetimi</h2><p class="muted">SOP, talimat, form, cihaz ve stok belgeleri Google Drive üzerinde saklanır. Dosya yükleme ve indirme işlemleri Google Drive\'da yapılır. Bu bağlantılar tek başına erişim yetkisi vermez; Google hesabınızın klasöre erişimi olmalıdır.</p><div class="formgrid" id="driveFolderCards"></div><p class="hint">Hasta bilgisi içeren belge yüklemeyin. Bu ekran yalnızca doğrulanmış yöneticilere gösterilir. Personel paylaşımı Google Drive izinleriyle ayrıca yönetilir.</p></div>';
main.insertBefore(page,main.querySelector("footer"));
const list=page.querySelector("#driveFolderCards");
const CLIENT_ID="350393111805-5eofrskvpou04vkg5cn88lnkt2a19sqn.apps.googleusercontent.com";
const connect=document.createElement("div");connect.className="panel";
connect.innerHTML='<h3>Google Drive bağlantısı</h3><p class="muted">Kendi Google hesabınızla bağlanın. Uygulama yalnızca okuma izni ister; dosyalar Google Drive paylaşım izinleriyle korunur.</p><div class="actions"><button type="button" class="btn" id="driveConnect">Google hesabımla bağlan</button><button type="button" class="btn alt" id="driveDisconnect" disabled>Bağlantıyı kes</button></div><p id="driveConnectStatus" role="status" class="muted"></p><div id="driveFileLists"></div>';
page.querySelector(".panel").append(connect);
let token=null,googleEmail="",activeUser=null,role="";
const message=s=>connect.querySelector("#driveConnectStatus").textContent=s;
const filesRoot=connect.querySelector("#driveFileLists");
const connectBtn=connect.querySelector("#driveConnect"),disconnectBtn=connect.querySelector("#driveDisconnect");
async function ensureGIS(){
if(window.google?.accounts?.oauth2)return;
await new Promise((resolve,reject)=>{const s=document.createElement("script");s.src="https://accounts.google.com/gsi/client";s.async=true;s.onload=resolve;s.onerror=()=>reject(Error("Google giriş kitaplığı yüklenemedi"));document.head.append(s)});
}
async function driveFetch(url){const res=await fetch(url,{headers:{Authorization:"Bearer "+token},cache:"no-store"});if(!res.ok){if(res.status===401){token=null;disconnectBtn.disabled=true}throw Error("Drive API "+res.status)}return res.json()}
async function showFiles(){
filesRoot.replaceChildren();for(const [label,id] of folders){
const section=document.createElement("section");section.style.marginTop="16px";
const h=document.createElement("h4");h.textContent=label;section.append(h);
try{
const q="'"+id+"' in parents and trashed = false";
const data=await driveFetch("https://www.googleapis.com/drive/v3/files?"+new URLSearchParams({q,fields:"nextPageToken,files(id,name,mimeType,webViewLink,size)",pageSize:"100",orderBy:"name"}));
if(!data.files?.length){const p=document.createElement("p");p.className="muted";p.textContent="Bu klasörde görüntülenebilir dosya yok.";section.append(p)}
for(const f of data.files||[]){const row=document.createElement("div");row.style.cssText="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:9px;border-bottom:1px solid #e1eaf2;flex-wrap:wrap";const name=document.createElement("span");name.textContent=f.name;const a=document.createElement("a");a.className="btn alt";a.target="_blank";a.rel="noopener noreferrer";a.href=f.webViewLink||"https://drive.google.com/file/d/"+encodeURIComponent(f.id)+"/view";a.textContent="Görüntüle / indir ↗";row.append(name,a);section.append(row)}
if(data.nextPageToken){const note=document.createElement("p");note.className="muted";note.textContent="İlk 100 belge gösteriliyor. Diğer belgeler için Drive klasörünü açın.";section.append(note)}
}catch(e){const p=document.createElement("p");p.className="muted";p.textContent="Klasöre erişilemiyor: "+e.message+". Google Drive paylaşım iznini kontrol edin.";section.append(p)}
filesRoot.append(section)
}}
connectBtn.onclick=async()=>{
if(!activeUser){message("Önce DAVIVA LAB'a giriş yapın.");return}
try{await ensureGIS();const client=google.accounts.oauth2.initTokenClient({client_id:CLIENT_ID,scope:"https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email",callback:async response=>{
if(response.error||!response.access_token){message("Google bağlantısı kurulamadı.");return}
token=response.access_token;
try{const res=await fetch("https://www.googleapis.com/oauth2/v3/userinfo",{headers:{Authorization:"Bearer "+token}});if(!res.ok)throw Error("Google hesabı doğrulanamadı");const info=await res.json();googleEmail=String(info.email||"").toLowerCase();const expected=String(activeUser.email||"").toLowerCase();if(googleEmail!==expected&&!(role==="admin"&&googleEmail==="davivabiyokimya@gmail.com")){google.accounts.oauth2.revoke(token,()=>{});token=null;message("Google hesabı DAVIVA LAB hesabınızla eşleşmiyor. Yönetici yalnızca depolama hesabını ayrıca bağlayabilir.");return}
disconnectBtn.disabled=false;message("Bağlandı: "+googleEmail+" — salt okunur erişim.");await showFiles()
}catch(e){message("Bağlantı hatası: "+e.message)}
}});client.requestAccessToken({prompt:"select_account"})}catch(e){message("Google OAuth hatası: "+e.message)}
};
disconnectBtn.onclick=()=>{if(token&&window.google?.accounts?.oauth2)google.accounts.oauth2.revoke(token,()=>{});token=null;googleEmail="";disconnectBtn.disabled=true;filesRoot.replaceChildren();message("Google Drive bağlantısı kesildi.")};

const intro=page.querySelector(".muted");
for(const [name,id] of [["Tüm Belgeler","1e_yHmQgCrwM2EZXGlLyATYvvPbAmND2O"],...folders]){
const card=document.createElement("div");card.className="panel";card.style.cssText="margin:0;padding:16px";
const title=document.createElement("h3");title.textContent="📂 "+name;
const link=document.createElement("a");link.className="btn alt";link.style.cssText="display:inline-block;text-decoration:none";link.href="https://drive.google.com/drive/folders/"+id;link.target="_blank";link.rel="noopener noreferrer";link.textContent="Google Drive'da aç ↗";
card.append(title,link);list.append(card)
}
btn.onclick=()=>{document.querySelectorAll("main .page").forEach(x=>x.classList.toggle("hidden",x!==page));document.querySelectorAll("[data-page]").forEach(x=>x.classList.toggle("active",x===btn));const h=document.getElementById("heading");if(h)h.textContent="Google Drive Belgeleri"};
let epoch=0;
onAuthStateChanged(auth,async user=>{const n=++epoch;btn.classList.add("hidden");page.classList.add("hidden");activeUser=null;role="";if(token){token=null;disconnectBtn.disabled=true;filesRoot.replaceChildren();message("Google Drive bağlantısı kapatıldı.")}if(!user)return;try{const s=await getDoc(doc(db,"kadro",user.uid));if(n!==epoch)return;const d=s.data();if(d?.aktif===true&&d["e-posta"]===user.email&&["admin","personel","staff","user","viewer","laborant","teknisyen","sorumlu"].includes(String(d.rol||"").toLowerCase())){btn.classList.remove("hidden");activeUser=user;role=String(d.rol||"").toLowerCase();intro.textContent=d.rol==="admin"?"Yönetici: Belgeleri Drive üzerinde yönetebilirsiniz. Dosya yükleme ve silme yalnızca Drive yazma izniniz varsa mümkündür.":"Personel: Belgeleri yalnızca Google Drive hesabınıza okuma izni verildiyse görüntüleyebilir ve indirebilirsiniz. Dosya yükleme veya silme yetkiniz yoktur."}}catch(e){console.warn("Drive menüsü yetki kontrolü:",e)}})
}
