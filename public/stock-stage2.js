import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,collection,getDocs} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
const form=document.getElementById("movementForm"),search=document.getElementById("operationSearch"),select=document.getElementById("operationProduct");
if(form&&search&&select){
 const auth=getAuth(),db=getFirestore();let user=null,cache=[],loadedAt=0,seq=0;
 const style=document.createElement("style");style.textContent='#dvStockAssistant{border:1px solid #cbdfea;background:#f2f9ff;border-radius:12px;padding:14px;margin:12px 0}#dvStockAssistant h4{margin:0 0 8px;color:#123e60}#dvStockAssistant p{margin:7px 0;font-size:13px}#dvStockAssistant .dv-fefo-warn{color:#a24416;font-weight:700}#dvStockAssistant .dv-fefo-ok{color:#18694e;font-weight:700}';document.head.append(style);
 const box=document.createElement("div");box.id="dvStockAssistant";box.innerHTML='<h4>▤ Barkod ve FEFO Kontrolü</h4><p id="dvStockScanStatus">Barkodu okutun veya ürün seçin. Stok kaydı değiştirilmez.</p><p id="dvStockFefo"></p><button type="button" class="btn alt" id="dvStockReload">Ürünleri Yeniden Kontrol Et</button>';form.insertBefore(box,form.querySelector(".actions"));
 const status=document.getElementById("dvStockScanStatus"),fefo=document.getElementById("dvStockFefo"),reload=document.getElementById("dvStockReload");
 onAuthStateChanged(auth,u=>{user=u;cache=[];loadedAt=0;seq++;status.textContent=u?"Barkodu okutun veya ürün seçin.":"Oturum açın.";fefo.textContent=""});
 const validDate=s=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(new Date(s+"T12:00:00").getTime());
 async function load(force=false){if(!user)return false;if(!force&&Date.now()-loadedAt<60000)return true;const token=seq;try{const snap=await getDocs(collection(db,"products"));if(token!==seq||!user)return false;cache=snap.docs.map(d=>({id:d.id,...d.data()}));loadedAt=Date.now();return true}catch(_){status.textContent="Ürünler okunamadı. Firestore yetkilerini kontrol edin.";return false}}
 function review(){const p=cache.find(x=>x.id===select.value),type=document.getElementById("operationType")?.value;fefo.textContent="";fefo.className="";if(!p)return;const qty=Number(p.quantity);const expiry=p.expiry;const today=new Date();today.setHours(12,0,0,0);
 if(validDate(expiry)){const days=Math.round((new Date(expiry+"T12:00:00")-today)/86400000);if(days<0){fefo.className="dv-fefo-warn";fefo.textContent="UYARI: Seçili lotun son kullanma tarihi geçmiş ("+expiry+"). İşlem öncesi kurum prosedürüne göre kontrol edin.";return}if(days<=30){fefo.className="dv-fefo-warn";fefo.textContent="UYARI: Seçili lotun SKT'sine "+days+" gün kaldı ("+expiry+")."}}
 if(type!=="OUT")return;
 const same=cache.filter(x=>x.id!==p.id&&Number(x.quantity)>0&&validDate(x.expiry)&&[String(x.code||"").trim(),String(x.name||"").trim()].some((v,i)=>v&&v===String(i===0?p.code:p.name||"").trim()));
 const earlier=same.filter(x=>!validDate(expiry)||x.expiry<expiry).sort((a,b)=>a.expiry.localeCompare(b.expiry));
 if(earlier.length){fefo.className="dv-fefo-warn";fefo.textContent="FEFO UYARISI: Aynı ürün için daha erken SKT'li "+earlier.length+" kayıt var. Önce "+String(earlier[0].lot||"lot belirtilmemiş")+" (SKT: "+earlier[0].expiry+") lotunu kontrol edin. Bu uyarı işlemi otomatik engellemez."}
 else if(!fefo.textContent){fefo.className="dv-fefo-ok";fefo.textContent="Kayıtlı lotlar arasında daha erken SKT'li ürün tespit edilmedi. FEFO kararı için fiziksel stok kontrolü gerekir."}
 }
 async function scan(){const q=search.value.trim();if(!q||!await load())return;const matches=cache.filter(p=>String(p.barcode||"").trim()===q);if(matches.length===1){const p=matches[0];search.dispatchEvent(new Event("input",{bubbles:true}));const option=[...select.options].find(o=>o.value===p.id);if(option){select.value=p.id;select.dispatchEvent(new Event("change",{bubbles:true}));status.textContent="Barkod eşleşti: "+String(p.name||"Ürün")+" · Lot: "+String(p.lot||"—");review()}else status.textContent="Ürün bulundu ancak seçim listesinde gösterilemiyor."}else if(matches.length>1){status.textContent="Aynı barkoda ait "+matches.length+" lot var. Lütfen doğru lotu listeden seçin.";review()}else status.textContent="Bu barkodla eşleşen kayıt yok. Ürün kartını kontrol edin."}
 search.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();scan()}});
 select.addEventListener("change",async()=>{if(await load())review()});document.getElementById("operationType")?.addEventListener("change",review);
 reload.onclick=async()=>{if(await load(true)){status.textContent=cache.length+" ürün kaydı güncellendi.";review()}};
 form.addEventListener("submit",()=>{status.textContent="İşlem mevcut stok kayıt mekanizması tarafından değerlendiriliyor. FEFO uyarıları bilgilendirme amaçlıdır."});
}
