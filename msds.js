import {connectDriveAdmin,uploadMsdsDrive,driveFileUrl} from "./drive-upload.js?v=20261020-msdsdrive1";
import {getApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,collection,addDoc,getDocs,query,orderBy,serverTimestamp,doc,updateDoc} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {getStorage,ref,uploadBytes,getDownloadURL} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";
const app=getApp(),auth=getAuth(app),db=getFirestore(app),storage=getStorage(app),el=id=>document.getElementById(id);
let records=[],devices=[],canEdit=false;
async function loadDevices(){const snap=await getDocs(collection(db,"labModules"));devices=snap.docs.map(x=>({id:x.id,...x.data()})).filter(x=>x.category==="device"&&x.recordType==="registry");for(const id of ["msdsDevice","msdsDeviceFilter"]){const s=el(id),old=s.value;s.replaceChildren();const empty=document.createElement("option");empty.value="";empty.textContent=id==="msdsDevice"?"Cihaz seçin":"Tüm cihazlar";s.append(empty);for(const d of devices){const o=document.createElement("option");o.value=d.id;o.textContent=(d.device||"Cihaz")+" · "+(d.assetCode||"—");s.append(o)}s.value=old}}

function notice(s){el("status").textContent=s;el("status").classList.remove("error")}
function drawDeviceRows(){const area=el("msdsDeviceRows");area.replaceChildren();for(const d of devices){const count=records.filter(x=>x.deviceId===d.id).length;const b=document.createElement("button");b.type="button";b.className="btn alt";b.textContent="📁 "+(d.device||"Cihaz")+" ("+count+")";b.onclick=()=>{el("msdsDeviceFilter").value=d.id;draw()};area.append(b)}const all=document.createElement("button");all.type="button";all.className="btn alt";all.textContent="Tüm Cihazlar";all.onclick=()=>{el("msdsDeviceFilter").value="";draw()};area.prepend(all)}
function draw(){const term=el("msdsSearch").value.trim().toLocaleLowerCase("tr"),device=el("msdsDeviceFilter").value,body=el("msdsBody");body.replaceChildren();for(const d of records.filter(x=>(!device||x.deviceId===device)&&[x.name,x.manufacturer,devices.find(y=>y.id===x.deviceId)?.device||x.deviceName].some(v=>String(v||"").toLocaleLowerCase("tr").includes(term)))){const tr=document.createElement("tr");for(const val of [devices.find(x=>x.id===d.deviceId)?.device||d.deviceName||"Eski kayıt / Cihaz belirtilmemiş",d.name,d.manufacturer,d.revision||"—",d.createdAt?.toDate?.()?.toLocaleDateString("tr-TR")||"—"]){const td=document.createElement("td");td.textContent=val;tr.append(td)}const td=document.createElement("td"),b=document.createElement("button");b.type="button";b.className="btn alt";b.textContent="PDF Aç";b.onclick=async()=>{const win=window.open("","_blank");try{const url=d.driveFileId?(d.driveFileUrl||driveFileUrl(d.driveFileId)):await getDownloadURL(ref(storage,d.storagePath));if(win)win.location.href=url;else window.location.href=url}catch(e){if(win)win.close();notice("Dosya açılamadı: "+e.message)}};td.append(b);
if(canEdit){
 const edit=document.createElement("button");edit.type="button";edit.className="btn alt";edit.style.marginLeft="6px";edit.textContent="Düzenle";
 edit.onclick=async()=>{
  const name=prompt("MSDS belge adı",d.name);if(name===null)return;
  const manufacturer=prompt("Üretici",d.manufacturer);if(manufacturer===null)return;
  const revision=prompt("Revizyon / tarih",d.revision||"");if(revision===null)return;
  const n=name.trim(),m=manufacturer.trim(),rev=revision.trim();
  if(!n||n.length>160||!m||m.length>120||rev.length>10)return notice("Belge adı, üretici veya revizyon uzunluğu geçersiz.");
  edit.disabled=true;
  try{await updateDoc(doc(db,"msdsDocuments",d.id),{name:n,manufacturer:m,revision:rev,editedBy:auth.currentUser.uid,editedAt:serverTimestamp()});await refresh();notice("MSDS bilgileri güncellendi. PDF dosyasının adı değişmedi.")}
  catch(e){notice("MSDS düzenlenemedi: "+e.message)}
  finally{edit.disabled=false}
 };td.append(edit);
}
tr.append(td);body.append(tr)}if(!body.children.length){const tr=document.createElement("tr"),td=document.createElement("td");td.colSpan=6;td.textContent="Kayıt bulunamadı.";tr.append(td);body.append(tr)}}
async function refresh(){if(!auth.currentUser){records=[];draw();return}try{await loadDevices();const snap=await getDocs(query(collection(db,"msdsDocuments"),orderBy("createdAt","desc")));records=snap.docs.map(d=>({id:d.id,...d.data()}));drawDeviceRows();draw()}catch(e){notice("MSDS arşivi yüklenemedi: "+e.message)}}
el("msdsConnectDrive").onclick=async()=>{try{await connectDriveAdmin();notice("Google Drive bağlantısı hazır. MSDS dosyası yükleyebilirsiniz.")}catch(e){notice("Drive bağlantısı başarısız: "+e.message)}};
el("msdsDeviceFilter").onchange=draw;
el("msdsRefresh").onclick=refresh;el("msdsSearch").oninput=draw;
el("msdsForm").onsubmit=async e=>{e.preventDefault();const u=auth.currentUser,deviceId=el("msdsDevice").value,device=devices.find(x=>x.id===deviceId),file=el("msdsFile").files[0],name=el("msdsName").value.trim(),manufacturer=el("msdsManufacturer").value.trim(),revision=el("msdsRevision").value;if(!u)return notice("Önce giriş yapın.");if(!device||!name||!manufacturer||!file)return notice("Gerekli alanları doldurun.");if(!file.name.toLowerCase().endsWith(".pdf")||file.size>20*1024*1024||file.size===0)return notice("En fazla 20 MB PDF yükleyin.");const btn=el("msdsSave");btn.disabled=true;try{const uploaded=await uploadMsdsDrive(file);await addDoc(collection(db,"msdsDocuments"),{name,manufacturer,revision,deviceId,deviceName:device.device||"Cihaz",driveFileId:uploaded.id,driveFileUrl:uploaded.webViewLink||driveFileUrl(uploaded.id),storageProvider:"google-drive",fileName:file.name.slice(0,200),uid:u.uid,email:u.email,createdAt:serverTimestamp()});el("msdsForm").reset();await refresh();notice("MSDS dosyası yüklendi ve arşive eklendi.")}catch(err){notice("MSDS yükleme başarısız: "+err.message)}finally{btn.disabled=false}};
onAuthStateChanged(auth,async u=>{
 canEdit=false;
 if(u){try{const {getDoc}=await import("https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js");const s=await getDoc(doc(db,"kadro",u.uid));const p=s.data();canEdit=p?.aktif===true&&p["e-posta"]===u.email&&p.rol==="admin"}catch(e){console.warn("MSDS düzenleme yetkisi",e)}}
 refresh();
});