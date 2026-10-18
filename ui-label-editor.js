import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
const auth=getAuth(),db=getFirestore();
const definitions=[
["appTitle","Uygulama başlığı","aside h1"],
["stockMenu","Stok menüsü",'aside nav [data-page="products"]'],
["movementMenu","İşlemler menüsü",'aside nav [data-page="movements"]'],
["staffMenu","Personel menüsü",'aside nav [data-page="staff"]'],
["dutyMenu","Nöbet menüsü",'aside nav [data-page="dutyRoster"]'],
["settingsMenu","Yönetim merkezi menüsü",'aside nav [data-page="adminSettings"]']
];
let saved={},original=new Map(),admin=false,uid="";
function apply(labels){for(const [key,,selector] of definitions){const node=document.querySelector(selector);if(!node)continue;if(!original.has(key))original.set(key,node.textContent);node.textContent=labels[key]||original.get(key)}}
const page=document.getElementById("adminSettings");
if(page){const panel=document.createElement("div");panel.className="panel";panel.innerHTML='<h3>✏ Ekran ve Menü Adlarını Düzenle</h3><p class="muted">Değişiklikler tüm kullanıcıların ekranına uygulanır. Bu bölüm yalnızca görünür başlıkları değiştirir; yetkileri veya veritabanı alanlarını değiştirmez.</p><form id="uiLabelForm"><div class="formgrid" id="uiLabelFields"></div><div class="actions"><button class="btn" type="submit">Başlıkları Kaydet</button><button class="btn alt" type="button" id="uiLabelReset">Varsayılanlara Dön</button></div></form><p class="muted" id="uiLabelStatus" role="status"></p>';page.append(panel);
const form=panel.querySelector("#uiLabelForm"),fields=panel.querySelector("#uiLabelFields"),status=panel.querySelector("#uiLabelStatus");
for(const [key,title] of definitions){const label=document.createElement("label");label.className="field";label.textContent=title;const input=document.createElement("input");input.name=key;input.maxLength=70;label.append(input);fields.append(label)}
function populate(){for(const [key] of definitions)form.elements[key].value=saved[key]||original.get(key)||""}
form.onsubmit=async e=>{e.preventDefault();if(!admin)return;const labels={};for(const [key] of definitions){const value=form.elements[key].value.trim();if(value)labels[key]=value}try{await setDoc(doc(db,"uiSettings","global"),{labels,updatedBy:uid,updatedAt:serverTimestamp()});saved=labels;apply(saved);status.textContent="Ekran başlıkları kaydedildi."}catch(err){status.textContent="Kaydedilemedi: "+err.message}};
panel.querySelector("#uiLabelReset").onclick=()=>{if(!admin)return;for(const [key] of definitions)form.elements[key].value=original.get(key)||"";status.textContent="Varsayılanlar hazır. Uygulamak için Başlıkları Kaydet'e basın."};
onAuthStateChanged(auth,async user=>{admin=false;panel.hidden=true;uid=user?.uid||"";if(!user)return;try{const own=await getDoc(doc(db,"kadro",user.uid));if(own.data()?.aktif!==true||own.data()?.["e-posta"]!==user.email)return;admin=own.data().rol==="admin";panel.hidden=!admin;const snapshot=await getDoc(doc(db,"uiSettings","global"));saved=snapshot.data()?.labels||{};apply(saved);populate()}catch(err){status.textContent="Ayarlar yüklenemedi: "+err.message}})}
