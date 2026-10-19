import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,doc,getDoc} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
const auth=getAuth(),db=getFirestore(),nav=document.querySelector("aside nav"),main=document.querySelector("main");
if(nav&&main){
const button=document.createElement("button");button.type="button";button.dataset.page="adminSettings";button.textContent="⚙ Yönetim Merkezi";button.className="hidden";nav.append(button);
const page=document.createElement("section");page.id="adminSettings";page.className="page hidden";
page.innerHTML='<div class="panel"><h2>⚙ Yönetim Merkezi</h2><p class="muted">Yönetici olarak tanımları kod yazmadan düzenleyin. Kayıtlı verileri korumak için değişiklikler ilgili yönetim formlarında yapılır.</p><div id="settingsLinks" class="formgrid"></div><p class="muted" id="settingsStatus" role="status"></p></div>';
main.insertBefore(page,main.querySelector("footer"));
const entries=[
["Ürün kategorileri","Kategori ekle, yeniden adlandır veya sil","products","productCategorySelect"],
["Ölçü birimleri","Adet, kutu, kit gibi birimleri yönet","products","productUnitSelect"],
["Raf ve konumlar","Depo ve dolap konumlarını yönet","products","productLocationSelect"],
["İşlem açıklamaları","Giriş ve çıkış açıklamalarını yönet","movements","operationNote"],
["Personel Ad Soyad","Personel adını, rolünü ve aktiflik durumunu düzenle","staff","staffFullName"],
["Nöbet ve vardiya","Personel nöbet kayıtlarını yönet","dutyRoster","dutyPerson"],
["Sistem başlıkları ve metinler","Kurumsal başlıkları ve menü adlarını düzenle","systemSettings",null],
["Görünüm ve tablo yazıları","Etiket, sütun ve düğme metinlerini düzenle","adminSettings","vtSearch"],
["Yeni içerik ve ekran","Kod yazmadan bilgilendirme ekranları oluştur","featureBuilder",null],
["Tedarikçi kayıtları","Tedarikçi bilgilerini güncelle","suppliers",null],
["Stok sayımları","Sayım kayıtlarını görüntüle ve yönet","counts",null],
["Personel işlem geçmişi","Denetim kayıtlarını incele ve dışa aktar","staffActivity",null]
];
for(const [title,description,target,field] of entries){
const card=document.createElement("div");card.className="panel";card.style.cssText="margin:0;padding:16px;min-width:220px";
const heading=document.createElement("h3");heading.textContent=title;heading.style.margin="0 0 7px";
const desc=document.createElement("p");desc.className="muted";desc.textContent=description;
const go=document.createElement("button");go.type="button";go.className="btn alt";go.textContent="Yönet →";go.onclick=()=>{
const link=document.querySelector('aside nav [data-page="'+target+'"]');if(!link||link.classList.contains("hidden")){document.getElementById("settingsStatus").textContent="Bu bölüm hesabınızda henüz erişilebilir değil.";return}
link.click();const input=field?document.getElementById(field):null;if(input){input.scrollIntoView({behavior:"smooth",block:"center"});input.focus({preventScroll:true})}
};
card.append(heading,desc,go);page.querySelector("#settingsLinks").append(card)
}

button.onclick=()=>{document.querySelectorAll("main .page").forEach(x=>x.classList.toggle("hidden",x!==page));document.querySelectorAll("[data-page]").forEach(x=>x.classList.toggle("active",x===button));const heading=document.getElementById("heading");if(heading)heading.textContent="Yönetim Merkezi"};
let epoch=0;onAuthStateChanged(auth,async user=>{const n=++epoch;button.classList.add("hidden");page.classList.add("hidden");if(!user)return;try{const snap=await getDoc(doc(db,"kadro",user.uid));if(n!==epoch)return;const d=snap.data();if(d?.aktif===true&&d.rol==="admin"&&d["e-posta"]===user.email)button.classList.remove("hidden")}catch(e){console.warn("Yönetim Merkezi yetkisi:",e)}})
}