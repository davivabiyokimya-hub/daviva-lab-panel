import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
const db=getFirestore(),auth=getAuth(),root=document.getElementById("adminSettings");
if(root){
const box=document.createElement("div");box.className="panel";
box.innerHTML='<h3>✏ Gelişmiş Görünüm Düzenleyici</h3><p class="muted">Menü, ekran başlığı, alan etiketi ve tablo sütun adlarını kod yazmadan değiştirin. Maliyet hesaplama ekranı hariçtir. Bu ayarlar verileri, yetkileri veya işlem geçmişini değiştirmez.</p><div class="actions"><button type="button" class="btn alt" id="vtScan">Alanları Listele</button><button type="button" class="btn" id="vtSave">Değişiklikleri Kaydet</button><button type="button" class="btn alt" id="vtReset">Değişiklikleri Sıfırla</button></div><label class="field">Alan ara<input id="vtSearch" placeholder="Başlık, menü veya alan adı"></label><p id="vtStatus" class="muted" role="status"></p><div id="vtFields" class="formgrid"></div>';
root.append(box);
let allowed=false,uid="",values={},defaults=new Map(),catalog=[];
const el=id=>document.getElementById(id),status=s=>el("vtStatus").textContent=s;
function items(){
 const result=[];
 const pages=[...document.querySelectorAll("main .page")].filter(p=>p.id!=="adminSettings"&&!/cost|maliyet|loss/i.test(p.id));
 for(const p of pages){
  const candidates=[...p.querySelectorAll("h1,h2,h3,h4,th,label")];
  candidates.forEach((node,index)=>{
   if(node.closest("#adminSettings")||node.closest("[id*=cost],[id*=Cost],[id*=loss],[id*=Loss]"))return;
   if(node.tagName==="LABEL"&&node.querySelector("label"))return;
   const key="page:"+p.id+":"+index;
   const text=node.tagName==="LABEL"?[...node.childNodes].filter(x=>x.nodeType===3).map(x=>x.textContent).join(" ").trim():node.textContent.trim();
   if(text&&text.length<=100)result.push({key,node,text,page:p.id,label:p.id+" · "+text});
  });
 }
 document.querySelectorAll("aside nav button").forEach((node,index)=>{const key="nav:"+(node.dataset.page||index);result.push({key,node,text:node.textContent.trim(),page:"Menü",label:"Menü · "+node.textContent.trim()})});
 return result.slice(0,250);
}
function apply(){
 for(const entry of items()){
  if(!defaults.has(entry.key))defaults.set(entry.key,entry.text);
  const val=values[entry.key]||defaults.get(entry.key);
  if(entry.node.tagName==="LABEL"){
   const textNode=[...entry.node.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());
   if(textNode&&textNode.textContent.trim()!==val)textNode.textContent=val+" ";
  }else if(entry.node.textContent!==val)entry.node.textContent=val;
 }
}
function draw(){
 catalog=items();const q=el("vtSearch").value.trim().toLocaleLowerCase("tr");const area=el("vtFields");area.replaceChildren();
 for(const item of catalog.filter(x=>!q||x.label.toLocaleLowerCase("tr").includes(q))){
  if(!defaults.has(item.key))defaults.set(item.key,item.text);
  const label=document.createElement("label");label.className="field";label.textContent=item.label;
  const input=document.createElement("input");input.maxLength=100;input.dataset.key=item.key;input.value=values[item.key]||defaults.get(item.key);label.append(input);area.append(label);
 }
 status(catalog.length+" düzenlenebilir metin bulundu.");
}
el("vtScan").onclick=()=>{if(allowed)draw()};
el("vtSearch").oninput=draw;
el("vtSave").onclick=async()=>{
 if(!allowed)return;
 const next={...values};
 for(const input of el("vtFields").querySelectorAll("input[data-key]")){
  const val=input.value.trim(),key=input.dataset.key;
  if(val&&val!==defaults.get(key))next[key]=val;else delete next[key];
 }
 if(Object.keys(next).length>250)return status("En fazla 250 alan düzenlenebilir.");
 try{await setDoc(doc(db,"uiTextOverrides","global"),{values:next,updatedBy:uid,updatedAt:serverTimestamp()});values=next;apply();status("Ekran metinleri kaydedildi.")}catch(e){status("Kaydedilemedi: "+e.message)}
};
el("vtReset").onclick=async()=>{if(!allowed||!confirm("Özelleştirilmiş tüm görünüm metinleri sıfırlansın mı?"))return;try{await setDoc(doc(db,"uiTextOverrides","global"),{values:{},updatedBy:uid,updatedAt:serverTimestamp()});values={};apply();draw()}catch(e){status("Sıfırlanamadı: "+e.message)}};
let seq=0;onAuthStateChanged(auth,async u=>{const n=++seq;allowed=false;box.hidden=true;if(!u)return;try{const own=await getDoc(doc(db,"kadro",u.uid));if(n!==seq||own.data()?.aktif!==true||own.data()?.["e-posta"]!==u.email)return;allowed=own.data().rol==="admin";uid=u.uid;box.hidden=!allowed;const snap=await getDoc(doc(db,"uiTextOverrides","global"));values=snap.data()?.values||{};apply();if(allowed)draw()}catch(e){status("Ayarlar okunamadı: "+e.message)}});
const observer=new MutationObserver(()=>{if(Object.keys(values).length)apply()});
observer.observe(document.querySelector("aside nav"),{childList:true});
}
