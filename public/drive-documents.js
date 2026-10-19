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
for(const [name,id] of [["Tüm Belgeler","1e_yHmQgCrwM2EZXGlLyATYvvPbAmND2O"],...folders]){
const card=document.createElement("div");card.className="panel";card.style.cssText="margin:0;padding:16px";
const title=document.createElement("h3");title.textContent="📂 "+name;
const link=document.createElement("a");link.className="btn alt";link.style.cssText="display:inline-block;text-decoration:none";link.href="https://drive.google.com/drive/folders/"+id;link.target="_blank";link.rel="noopener noreferrer";link.textContent="Google Drive'da aç ↗";
card.append(title,link);list.append(card)
}
btn.onclick=()=>{document.querySelectorAll("main .page").forEach(x=>x.classList.toggle("hidden",x!==page));document.querySelectorAll("[data-page]").forEach(x=>x.classList.toggle("active",x===btn));const h=document.getElementById("heading");if(h)h.textContent="Google Drive Belgeleri"};
let epoch=0;
onAuthStateChanged(auth,async user=>{const n=++epoch;btn.classList.add("hidden");page.classList.add("hidden");if(!user)return;try{const s=await getDoc(doc(db,"kadro",user.uid));if(n!==epoch)return;const d=s.data();if(d?.aktif===true&&d.rol==="admin"&&d["e-posta"]===user.email)btn.classList.remove("hidden")}catch(e){console.warn("Drive menüsü yetki kontrolü:",e)}})
}
