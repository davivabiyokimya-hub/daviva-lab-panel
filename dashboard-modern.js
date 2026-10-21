import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,collection,getDocs,doc,getDoc} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
const db=getFirestore(),auth=getAuth(),root=document.getElementById("dashboard");
if(root){
 const style=document.createElement("style");style.textContent=`
#dashboard>.dashHero,#dashboard>.dashGrid{display:none!important}
#dashboard>.cards,#dashboard>.panel{position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;overflow:hidden!important;padding:0!important;margin:0!important;pointer-events:none!important}
#dashboard .dv-hero{border-radius:15px;padding:29px 32px;color:white;background:linear-gradient(100deg,#082c50e8,#075788d9),radial-gradient(circle at 85% 40%,#21a5d3,#0b2947);margin:0 0 17px}
#dashboard .dv-hero h2{font-size:28px;color:#fff;margin:0 0 7px}#dashboard .dv-hero p{margin:0;color:#c9e6f6}
#dashboard .dv-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:13px}
#dashboard .dv-metric{padding:18px 16px;border-radius:13px;display:flex;gap:12px;align-items:center;min-width:0;border:1px solid #e0eaf3}
#dashboard .dv-metric .dv-ico{font-size:25px;background:#ffffff99;border-radius:50%;width:47px;height:47px;display:grid;place-items:center;flex-shrink:0}
#dashboard .dv-metric small{display:block;color:#425d78;font-size:12px}#dashboard .dv-metric strong{font-size:26px;color:#0b3054;display:block;margin-top:3px}
#dashboard .dv-blue{background:#e9f5ff}#dashboard .dv-red{background:#fff0f0}#dashboard .dv-green{background:#e8faf4}#dashboard .dv-purple{background:#f3efff}#dashboard .dv-yellow{background:#fff7e4}
#dashboard .dv-panels{display:grid;grid-template-columns:1.25fr 1fr 0.9fr;gap:13px;margin:13px 0}
#dashboard .dv-panel{background:white;border:1px solid #dfe8f0;border-radius:14px;padding:17px;min-width:0;box-shadow:0 4px 16px #12385b09}
#dashboard .dv-panel h3{font-size:16px;margin:0 0 16px;color:#0b2d4f}
#dashboard .dv-chart{height:215px;display:flex;align-items:end;gap:7px;padding:12px 2px 22px;border-bottom:1px solid #dce6ef;position:relative}
#dashboard .dv-chart::before{content:"";position:absolute;inset:12px 0 22px;background:repeating-linear-gradient(to top,transparent 0,transparent calc(25% - 1px),#e7eef5 25%);pointer-events:none}
#dashboard .dv-chartcol{flex:1;height:100%;display:flex;align-items:end;justify-content:center;gap:2px;position:relative;min-width:0}
#dashboard .dv-chartbar{width:35%;min-height:2px;border-radius:4px 4px 0 0;background:#1478ec}#dashboard .dv-chartbar.out{background:#7bc7f5}
#dashboard .dv-chartcol label{position:absolute;bottom:-21px;left:0;width:100%;text-align:center;font-size:10px;color:#60748c}
#dashboard .dv-legend{font-size:11px;color:#678;display:flex;gap:12px;justify-content:flex-end}
#dashboard .dv-swatch{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:4px;background:#1478ec}.dv-swatch.out{background:#7bc7f5}
#dashboard .dv-donutrow{display:flex;align-items:center;justify-content:center;gap:17px;min-height:215px}
#dashboard .dv-donut{width:160px;height:160px;border-radius:50%;display:grid;place-items:center;flex-shrink:0}
#dashboard .dv-donut-inner{background:white;border-radius:50%;width:106px;height:106px;display:grid;place-items:center;text-align:center;font-size:23px;font-weight:800;color:#12375d}
#dashboard .dv-donut-inner small{font-size:11px;font-weight:400;display:block}
#dashboard .dv-category{font-size:12px;display:flex;justify-content:space-between;gap:12px;margin:11px 0;color:#334d67}
#dashboard .dv-category i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px}
#dashboard .dv-spark{width:100%;height:180px}
#dashboard .dv-table{width:100%;min-width:0;font-size:12px}#dashboard .dv-table th,#dashboard .dv-table td{padding:9px 7px;white-space:normal}
#dashboard .dv-table th{background:#f2f7fc}
#dashboard .dv-pill{display:inline-block;padding:4px 8px;border-radius:8px;background:#ffe8e8;color:#be3030;font-weight:700}
#dashboard .dv-pill.warn{background:#fff0d4;color:#a45c00}
#dashboard .dv-quick{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
#dashboard .dv-quick button{padding:18px 9px;border:1px solid #dce8f2;border-radius:12px;background:#e9f5ff;color:#12406a;font-weight:700;cursor:pointer}
#dashboard .dv-quick button:nth-child(2n){background:#e6faf2}#dashboard .dv-quick button:nth-child(3n){background:#fff0f0}#dashboard .dv-quick button:nth-child(4n){background:#f3efff}
#dashboard .dv-quick button span{display:block;font-size:24px;margin-bottom:7px}
#dashboard .dv-link{float:right;border:1px solid #d7e3ee;background:white;border-radius:7px;color:#174e83;padding:6px 9px;font-size:11px;cursor:pointer}
#dashboard .dv-empty{color:#6c8092;font-size:13px}
@media(max-width:1350px){#dashboard .dv-metrics{grid-template-columns:repeat(3,1fr)}#dashboard .dv-panels{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:800px){#dashboard .dv-metrics{grid-template-columns:repeat(2,1fr)}#dashboard .dv-panels{grid-template-columns:1fr}#dashboard .dv-quick{grid-template-columns:repeat(2,1fr)}#dashboard .dv-donutrow{flex-wrap:wrap}}
@media(max-width:450px){#dashboard .dv-metrics{grid-template-columns:1fr}#dashboard .dv-hero{padding:22px}}
`;document.head.append(style);
 const el=document.createElement("div");el.id="dvModernDashboard";root.prepend(el);
 el.innerHTML='<div class="dv-hero"><h2>DAVIVA LAB’a Hoş Geldiniz 👋</h2><p>Laboratuvar stokları, cihazlar ve kalite süreçleri için merkezi yönetim paneliniz.</p></div><div class="dv-metrics" id="dvMetrics"></div><div class="dv-panels"><div class="dv-panel"><h3>▥ Aylık Stok Hareketleri</h3><div class="dv-legend"><span><i class="dv-swatch"></i>Giriş</span><span><i class="dv-swatch out"></i>Çıkış</span></div><div class="dv-chart" id="dvBarChart"></div></div><div class="dv-panel"><h3>◉ Stok Dağılımı</h3><div class="dv-donutrow"><div class="dv-donut" id="dvDonut"><div class="dv-donut-inner" id="dvDonutText">—</div></div><div id="dvCategories"></div></div></div><div class="dv-panel"><h3>◈ Stok Değeri (TL)</h3><div id="dvValue" class="dv-empty">Ürünlerde birim fiyat alanı doğrulanmadı.</div><div id="dvValueChart"></div></div></div><div class="dv-panels"><div class="dv-panel"><h3><button class="dv-link" data-go="critical">Tümünü Gör</button>⚠ Kritik Stoklar</h3><div id="dvCritical"></div></div><div class="dv-panel"><h3><button class="dv-link" data-go="critical">Tümünü Gör</button>▦ SKT Yaklaşan Ürünler</h3><div id="dvExpiry"></div></div><div class="dv-panel"><h3><button class="dv-link" data-go="labModules">Tümünü Gör</button>⚙ Cihaz Bakım Durumu</h3><div id="dvDevices"></div></div></div><div class="dv-panels" style="grid-template-columns:1.2fr 1fr"><div class="dv-panel"><h3><button class="dv-link" data-go="movements">Tümünü Gör</button>◷ Son Stok Hareketleri</h3><div id="dvRecent"></div></div><div class="dv-panel"><h3>ϟ Hızlı İşlemler</h3><div class="dv-quick" id="dvQuick"></div></div></div><p class="muted" id="dvDashboardStatus" role="status">Veriler yükleniyor…</p>';
 const $=id=>document.getElementById(id),colors=["#1764d5","#54aaf8","#16c28a","#ffb927","#9262f7","#94a6b8"];
 const safeNum=v=>v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v))?Number(v):null;
 const trTable=(heads,rows)=>{const table=document.createElement("table");table.className="dv-table";const thead=table.createTHead(),head=thead.insertRow();heads.forEach(h=>{const c=document.createElement("th");c.textContent=h;head.append(c)});const body=table.createTBody();for(const row of rows){const tr=body.insertRow();row.forEach(v=>{const td=tr.insertCell();td.textContent=String(v??"—")})}return table};
 function putTable(id,heads,rows){const node=$(id);node.replaceChildren();if(rows.length)node.append(trTable(heads,rows));else{const p=document.createElement("p");p.className="dv-empty";p.textContent="Kayıt bulunamadı.";node.append(p)}}
 function navigate(id){const button=document.querySelector('aside nav button[data-page="'+id+'"]:not(.hidden)');if(button)button.click();else $("dvDashboardStatus").textContent="Bu bölüme erişim yetkiniz bulunmuyor."}
 el.addEventListener("click",e=>{const button=e.target.closest("[data-go]");if(button)navigate(button.dataset.go)});
 const shortcuts=[["📦","Ürün Ekle","products"],["⬇","Stok Girişi","operations"],["⬆","Stok Çıkışı","operations"],["🚚","Tedarikçiler","suppliers"],["▤","İrsaliye","dispatches"],["▥","Stok Sayımı","counts"],["📊","Raporlar","smartCenter"],["✦","DAVIVA AI","davivaAi"]];
 for(const [icon,label,id] of shortcuts){const b=document.createElement("button");b.type="button";b.dataset.go=id;const i=document.createElement("span");i.textContent=icon;b.append(i,document.createTextNode(label));$("dvQuick").append(b)}
 let current=null,seq=0;
 onAuthStateChanged(auth,async u=>{const token=++seq;current=null;if(!u){$("dvDashboardStatus").textContent="Verileri görmek için giriş yapın.";return}try{const snap=await getDoc(doc(db,"kadro",u.uid));const staff=snap.data();if(token!==seq)return;if(!staff?.aktif||staff["e-posta"]!==u.email||!["admin","stok"].includes(staff.rol))return;current=u;await render(token)}catch(_){$("dvDashboardStatus").textContent="Yetki veya veri okuma hatası."}});
 const refresh=document.getElementById("refresh");if(refresh)refresh.addEventListener("click",()=>{if(current)render(seq)});
 async function render(token){try{const [ps,ms]=await Promise.all([getDocs(collection(db,"products")),getDocs(collection(db,"stockMovements"))]);if(token!==seq||!current)return;
 const products=ps.docs.map(d=>({id:d.id,...d.data()})),movements=ms.docs.map(d=>d.data());const now=new Date(),day=86400000;
 const expiryDays=p=>{if(typeof p.expiry!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(p.expiry))return null;const t=new Date(p.expiry+"T12:00:00");return Number.isNaN(+t)?null:Math.round((t-new Date(now.getFullYear(),now.getMonth(),now.getDate(),12))/day)};
 const critical=products.filter(p=>safeNum(p.quantity)!==null&&safeNum(p.minStock)!==null&&Number(p.quantity)<=Number(p.minStock));
 const expiry=products.map(p=>({...p,days:expiryDays(p)})).filter(p=>p.days!==null&&p.days<=90).sort((a,b)=>a.days-b.days);
 let activeDevices="—";
 try{
  const ds=await getDocs(collection(db,"labModules"));
  if(token!==seq||!current)return;
  const activeStates=new Set(["aktif","faal","çalışıyor","calisiyor","kullanımda","kullaniliyor","kullanılıyor","active","in use"]);
  activeDevices=ds.docs.map(d=>d.data()).filter(d=>d.category==="device"&&d.recordType==="registry"&&activeStates.has(String(d.status||"").trim().toLocaleLowerCase("tr-TR").replace(/\s+/g," "))).length;
 }catch(e){console.warn("Genel bakış aktif cihaz sayısı okunamadı:",e)}
 const pending=products.filter(p=>p.days>=0&&p.days<=30).length;
 const stats=[["📦","Toplam Ürün",products.length,"dv-blue"],["⚠","Kritik Stok",critical.length,"dv-red"],["🚚","Bekleyen Sipariş","—","dv-green"],["📅","SKT ≤30 Gün",expiry.filter(p=>p.days>=0&&p.days<=30).length,"dv-purple"],["⚙","Aktif Cihaz",activeDevices,"dv-yellow"]];
 $("dvMetrics").replaceChildren();for(const [icon,label,value,cls] of stats){const box=document.createElement("div");box.className="dv-metric "+cls;const ico=document.createElement("span");ico.className="dv-ico";ico.textContent=icon;const detail=document.createElement("div"),small=document.createElement("small"),strong=document.createElement("strong");small.textContent=label;strong.textContent=String(value);detail.append(small,strong);box.append(ico,detail);$("dvMetrics").append(box)}
 const monthly=[];for(let i=9;i>=0;i--){const dt=new Date(now.getFullYear(),now.getMonth()-i,1);monthly.push({year:dt.getFullYear(),month:dt.getMonth(),name:dt.toLocaleDateString("tr-TR",{month:"short"}),in:0,out:0})}
 for(const m of movements){const dt=m.createdAt?.toDate?.();if(!(dt instanceof Date))continue;const period=monthly.find(x=>x.year===dt.getFullYear()&&x.month===dt.getMonth());const n=safeNum(m.quantity);if(!period||n===null||n<0)continue;if(m.type==="IN")period.in+=n;else if(m.type==="OUT")period.out+=n}
 const max=Math.max(1,...monthly.flatMap(m=>[m.in,m.out]));$("dvBarChart").replaceChildren();for(const m of monthly){const col=document.createElement("div");col.className="dv-chartcol";for(const [value,cls] of [[m.in,""],[m.out,"out"]]){const bar=document.createElement("div");bar.className="dv-chartbar "+cls;bar.style.height=Math.max(1,value/max*100)+"%";bar.title=m.name+" "+(cls?"Çıkış":"Giriş")+": "+value;col.append(bar)}const label=document.createElement("label");label.textContent=m.name;col.append(label);$("dvBarChart").append(col)}
 const cats=new Map();for(const p of products){const c=String(p.category||"Diğer").trim()||"Diğer";cats.set(c,(cats.get(c)||0)+1)}const sorted=[...cats].sort((a,b)=>b[1]-a[1]);const total=products.length;let percent=0;const stops=[];$("dvCategories").replaceChildren();sorted.slice(0,5).forEach(([name,n],i)=>{const start=percent;percent+=total?n/total*100:0;stops.push(colors[i]+" "+start+"% "+percent+"%");const row=document.createElement("div");row.className="dv-category";const label=document.createElement("span");const dot=document.createElement("i");dot.style.background=colors[i];label.append(dot,document.createTextNode(name));const value=document.createElement("span");value.textContent=n+" · "+Math.round(n/total*100)+"%";row.append(label,value);$("dvCategories").append(row)});if(sorted.length>5)stops.push(colors[5]+" "+percent+"% 100%");$("dvDonut").style.background=total?"conic-gradient("+stops.join(",")+")":"#e8eff5";$("dvDonutText").textContent=total.toLocaleString("tr-TR");const small=document.createElement("small");small.textContent="Ürün";$("dvDonutText").append(small);
 $("dvValue").textContent="Birim fiyat verisi doğrulanmadığı için stok değeri hesaplanmadı.";$("dvValueChart").replaceChildren();
 putTable("dvCritical",["Ürün","Stok","Min."],critical.slice(0,5).map(p=>[p.name,p.quantity,p.minStock]));
 putTable("dvExpiry",["Ürün","SKT","Kalan gün"],expiry.slice(0,5).map(p=>[p.name,p.expiry,p.days<0?"Geçmiş ("+Math.abs(p.days)+")":p.days]));
 putTable("dvRecent",["Tarih","Ürün","İşlem","Miktar"],movements.filter(m=>m.createdAt?.toDate?.() instanceof Date).sort((a,b)=>b.createdAt.toDate()-a.createdAt.toDate()).slice(0,5).map(m=>[m.createdAt.toDate().toLocaleString("tr-TR"),m.productName||"—",m.type==="IN"?"Giriş":m.type==="OUT"?"Çıkış":"—",m.quantity]));
 $("dvDevices").textContent="Cihaz durumu için kayıtlar Laboratuvar Modülleri bölümünden incelenebilir.";
 $("dvDashboardStatus").textContent="Güncellendi: "+new Date().toLocaleString("tr-TR")+" · Göstergeler gerçek kayıtlara dayanır; veri olmayan alanlar — gösterilir.";
 }catch(e){$("dvDashboardStatus").textContent="Grafikler yüklenemedi: Firestore okuma yetkilerini kontrol edin.";}}
}
