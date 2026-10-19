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

/* DAVIVA ADMIN: salt okunur kimlik ve yetki teşhisi. Rol atamaz. */
{
 const host=page.querySelector(".panel");
 const diag=document.createElement("div");diag.className="panel";diag.style.cssText="margin-top:16px;padding:16px";
 const title=document.createElement("h3");title.textContent="🔐 Firebase Hesap ve Yetki Kontrolü";
 const info=document.createElement("p");info.className="muted";info.textContent="Kimlik doğrulaması, personel kaydı ve yönetici rolü kontrol edilir. Bu ekran yetki vermez.";
 const status=document.createElement("pre");status.style.cssText="white-space:pre-wrap;overflow-wrap:anywhere;background:#f2f6fa;padding:12px;border-radius:8px";
 const check=document.createElement("button");check.type="button";check.className="btn alt";check.textContent="Yetkimi Doğrula";
 const expectedEmail="berkant.7324@gmail.com";
 async function verify(){
  const current=auth.currentUser;
  if(!current){status.textContent="Oturum açık değil.";return}
  status.textContent="Firebase kayıtları kontrol ediliyor…";
  try{
   await current.getIdToken(true);
   const snapshot=await getDoc(doc(db,"kadro",current.uid));
   const staff=snapshot.data();
   const lines=[
    "Oturum UID: "+current.uid,
    "Oturum e-postası: "+(current.email||"(yok)"),
    "UID üzerinden kadro kaydı: "+(snapshot.exists()?"EVET":"HAYIR"),
    "Hedef e-posta eşleşmesi: "+(current.email===expectedEmail?"EVET":"HAYIR"),
    "Kadro kaydı: "+(snapshot.exists()?"VAR":"YOK"),
    "Kayıt e-posta eşleşmesi: "+(staff?.["e-posta"]===current.email?"EVET":"HAYIR"),
    "Kayıt aktif: "+(staff?.aktif===true?"EVET":"HAYIR"),
    "Kayıt yönetici rolü: "+(staff?.rol==="admin"?"EVET":"HAYIR")
   ];
   const verified=current.email===expectedEmail&&snapshot.exists()&&staff?.["e-posta"]===current.email&&staff?.aktif===true&&staff?.rol==="admin";
   lines.push("SONUÇ: "+(verified?"Yönetici kimliği ve kadro eşleşmesi doğrulandı.":"Yönetici doğrulaması tamamlanamadı."));
   status.textContent=lines.join("\n");
  }catch(e){status.textContent="Doğrulama başarısız. Firestore erişimi veya oturum yetkilerini kontrol edin. ("+(e.code||"hata")+")"}
 }
 check.addEventListener("click",verify);
 diag.append(title,info,check,status);host.append(diag);
}

button.onclick=()=>{document.querySelectorAll("main .page").forEach(x=>x.classList.toggle("hidden",x!==page));document.querySelectorAll("[data-page]").forEach(x=>x.classList.toggle("active",x===button));const heading=document.getElementById("heading");if(heading)heading.textContent="Yönetim Merkezi"};
let epoch=0;onAuthStateChanged(auth,async user=>{const n=++epoch;button.classList.add("hidden");page.classList.add("hidden");if(!user)return;try{const snap=await getDoc(doc(db,"kadro",user.uid));if(n!==epoch)return;const d=snap.data();if(d?.aktif===true&&d.rol==="admin"&&d["e-posta"]===user.email)button.classList.remove("hidden")}catch(e){console.warn("Yönetim Merkezi yetkisi:",e)}})
}