import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,doc,getDoc,collection,getDocs} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
const center=document.getElementById("deviceCenter");
if(center){
 const auth=getAuth(),db=getFirestore(),panel=document.createElement("div");
 panel.className="panel";panel.id="dcQualityPanel";
 panel.innerHTML='<h3>📋 Cihaz Bazlı Kalite ve Denetim Özeti</h3><p class="muted">Cihaz envanteri ve bakım/kalibrasyon kayıtlarının izlenebilirlik görünümü. Bu rapor, SAS uygunluğu veya kalibrasyon geçerliliği onayı değildir.</p><div class="bar"><label class="field">Cihaz<select id="dqDevice"><option value="">Tüm cihazlar</option></select></label><button class="btn alt" type="button" id="dqRefresh">Raporu Yenile</button><button class="btn alt" type="button" id="dqCsv" disabled>CSV Raporu</button></div><div class="cards"><div class="card"><div class="muted">Seçimdeki Cihaz</div><div class="metric" id="dqDevices">—</div></div><div class="card"><div class="muted">Bakım / Kalibrasyon Kaydı</div><div class="metric" id="dqEvents">—</div></div><div class="card"><div class="muted">Geciken Plan (Cihaz)</div><div class="metric" id="dqOverdue">—</div></div><div class="card"><div class="muted">Plan Tarihi Eksik (Cihaz)</div><div class="metric" id="dqMissing">—</div></div></div><p id="dqStatus" class="muted" role="status">Rapor henüz yüklenmedi.</p><div class="scroll"><table><thead><tr><th>Cihaz / Kod</th><th>İşlem</th><th>İşlem Tarihi</th><th>Sonraki Plan</th><th>Durum</th><th>Belge / Açıklama</th></tr></thead><tbody id="dqRows"></tbody></table></div><p class="hint">Eski kayıtlarda envanter bağlantısı yoksa yalnızca cihaz adıyla eşleştirme yapılır ve bu durum doğrulanmış bağlantı sayılmaz. Belge referansı açıklama alanından gösterilir; belgenin doğruluğu ayrıca kontrol edilmelidir.</p>';
 center.append(panel);
 const $=id=>document.getElementById(id);
 let user=null,allowed=false,token=0,devices=[],events=[],visible=[];
 const day=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s||"")))return null;const d=new Date(s+"T12:00:00");if(!Number.isFinite(+d))return null;const t=new Date();t.setHours(12,0,0,0);return Math.round((d-t)/86400000)};
 const status=s=>{const n=day(s);return n===null?"Plan tarihi belirtilmemiş":n<0?"Plan gecikti ("+(-n)+" gün)":n<=30?"30 gün içinde":"Planlı"};
 const normalize=s=>String(s||"").trim().toLocaleLowerCase("tr-TR");
 function linked(e,d){if(e.deviceId)return e.deviceId===d.id;if(e.assetCode)return normalize(e.assetCode)===normalize(d.assetCode);return normalize(e.device)===normalize(d.device)}
 function draw(){const id=$("dqDevice").value,selected=id?devices.filter(x=>x.id===id):devices;
 const relevant=events.filter(e=>selected.some(d=>linked(e,d)));
 visible=relevant.sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
 $("dqDevices").textContent=selected.length;$("dqEvents").textContent=visible.length;
 $("dqOverdue").textContent=selected.filter(d=>day(d.next)!==null&&day(d.next)<0).length;
 $("dqMissing").textContent=selected.filter(d=>day(d.next)===null).length;
 const body=$("dqRows");body.replaceChildren();
 for(const e of visible.slice(0,200)){const d=selected.find(d=>linked(e,d));const row=body.insertRow();for(const v of [(d?.device||e.device||"—")+" / "+(d?.assetCode||e.assetCode||"—"),e.kind||"—",e.date||"—",e.next||"—",status(e.next),e.note||"Belge referansı yok"]){const cell=row.insertCell();cell.textContent=String(v)}}
 if(!visible.length){const row=body.insertRow(),cell=row.insertCell();cell.colSpan=6;cell.textContent="Bu seçim için işlem kaydı bulunamadı."}
 $("dqStatus").textContent="Rapor "+new Date().toLocaleString("tr-TR")+" tarihinde güncellendi. Listede en fazla 200 işlem gösterilir; CSV seçili tüm kayıtları içerir.";
 $("dqCsv").disabled=false;
 }
 async function refresh(){if(!allowed)return;const n=token;$("dqRefresh").disabled=true;$("dqStatus").textContent="Cihaz geçmişi okunuyor…";try{
 const snap=await getDocs(collection(db,"labModules"));if(n!==token||!allowed)return;
 const all=snap.docs.map(d=>({id:d.id,...d.data()}));devices=all.filter(d=>d.category==="device"&&d.recordType==="registry").sort((a,b)=>String(a.device||"").localeCompare(String(b.device||""),"tr"));
 events=all.filter(d=>d.category==="device"&&d.recordType!=="registry");
 const old=$("dqDevice").value;$("dqDevice").replaceChildren();const empty=document.createElement("option");empty.value="";empty.textContent="Tüm cihazlar";$("dqDevice").append(empty);
 for(const d of devices){const op=document.createElement("option");op.value=d.id;op.textContent=(d.device||"—")+" · "+(d.assetCode||"—");$("dqDevice").append(op)}if(devices.some(d=>d.id===old))$("dqDevice").value=old;
 draw();
 }catch(_){$("dqStatus").textContent="Rapor okunamadı. Laboratuvar modülü erişim yetkisini kontrol edin.";$("dqCsv").disabled=true}finally{$("dqRefresh").disabled=false}}
 $("dqRefresh").onclick=refresh;$("dqDevice").onchange=draw;
 $("dqCsv").onclick=()=>{if(!allowed)return;const rows=[["Cihaz","Envanter Kodu","İşlem","İşlem Tarihi","Sonraki Plan","Plan Durumu","Belge / Açıklama","Kayıt ID"],...visible.map(e=>{const d=devices.find(d=>linked(e,d));return [d?.device||e.device,d?.assetCode||e.assetCode,e.kind,e.date,e.next,status(e.next),e.note,e.id]})];const q=v=>'"'+String(v??"").replace(/"/g,'""')+'"';const blob=new Blob(["\uFEFF"+rows.map(row=>row.map(q).join(";")).join("\r\n")],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="DAVIVA_Cihaz_Kalite_Denetim.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 document.querySelector('aside nav button[data-page="deviceCenter"]')?.addEventListener("click",()=>{if(allowed)refresh()});
 onAuthStateChanged(auth,async u=>{const n=++token;user=null;allowed=false;devices=[];events=[];visible=[];$("dqCsv").disabled=true;if(!u)return;try{const snap=await getDoc(doc(db,"kadro",u.uid));const p=snap.data();if(n!==token||p?.aktif!==true||p["e-posta"]!==u.email||!["admin","stok"].includes(p.rol))return;if(p.rol!=="admin"){const permission=await getDoc(doc(db,"accessPermissions",u.uid));if(n!==token||permission.exists()&&permission.data()?.labModules!==true)return}user=u;allowed=true;await refresh()}catch(_){}});
}
