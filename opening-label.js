(()=>{"use strict";
function init(){
 const form=document.getElementById("productForm");if(!form||document.getElementById("davivaOpeningLabel"))return;
 const box=document.createElement("div");box.className="field wide";box.id="davivaOpeningLabel";
 box.innerHTML='<label class="field">Ürün Açılış Etiketi (40 × 20 mm)</label><div class="actions"><label class="field">Açılış tarihi<input id="openingLabelDate" type="date"></label><label class="field">Açan personel<input id="openingLabelStaff" maxlength="45" placeholder="Ad soyad / paraf"></label><label class="field">Açıldıktan sonra kullanım sonu<input id="openingLabelUseBy" type="date"></label><label class="field">Lot<select id="openingLabelLot"><option value="">Lot seçiniz</option></select></label><button class="btn alt" type="button" id="openingLabelPrint">🏷 Açılış Etiketi Yazdır</button></div><p class="hint">Kullanım sonu tarihi üretici talimatına göre personel tarafından girilir; sistem otomatik stabilite süresi hesaplamaz. Bu işlem stok miktarını değiştirmez.</p>';
 form.querySelector(".formgrid").append(box);
 const date=box.querySelector("#openingLabelDate");date.value=new Date().toLocaleDateString("en-CA");
 const lotSelect=box.querySelector("#openingLabelLot");
 function refreshLots(){const old=lotSelect.value;const values=[...document.querySelectorAll("#lotEntryList *")].map(e=>e.textContent||"");const current=form.querySelector('[name="lot"]')?.value||"";const lotCandidates=[...new Set([current,...values.flatMap(t=>{const m=t.match(/(?:Lot\s*[:：]\s*)([^|\n]+)/i);return m?[m[1].trim()]:[]})].filter(Boolean))];lotSelect.replaceChildren(new Option("Lot seçiniz",""),...lotCandidates.map(x=>new Option(x,x)));if(lotCandidates.includes(old))lotSelect.value=old;}
 const observer=new MutationObserver(refreshLots);const list=document.getElementById("lotEntryList");if(list)observer.observe(list,{childList:true,subtree:true});refreshLots();
 const safe=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const fmt=v=>v?String(v).split("-").reverse().join("."):"—";
 box.querySelector("#openingLabelPrint").onclick=()=>{
 const name=form.elements.namedItem("name")?.value.trim();if(!name)return alert("Önce ürün adını girin.");
 const opened=date.value,by=box.querySelector("#openingLabelStaff").value.trim(),useBy=box.querySelector("#openingLabelUseBy").value;
 if(!opened)return alert("Açılış tarihini girin.");if(!useBy)return alert("Üretici talimatına göre kullanım sonu tarihini girin.");if(useBy<opened)return alert("Kullanım sonu açılış tarihinden önce olamaz.");
 const lot=lotSelect.value||form.elements.namedItem("lot")?.value||"—",stock=form.elements.namedItem("code")?.value||"—";
 const w=window.open("","_blank","width=650,height=500");if(!w)return alert("Etiket yazdırmak için açılır pencerelere izin verin.");
 w.document.write('<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Ürün Açılış Etiketi</title><style>@page{size:40mm 20mm;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;font-family:Arial,sans-serif}.label{width:40mm;height:20mm;padding:1mm;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;font-size:6pt;line-height:1.1}.name{font-weight:700;font-size:7pt;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.line{display:flex;justify-content:space-between;gap:1mm}.line span{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.controls{margin:12px;font-size:14px}@media print{.controls{display:none}}</style></head><body><div class="label"><div class="name">'+safe(name)+'</div><div class="line"><span>Stok: '+safe(stock)+'</span><span>Lot: '+safe(lot)+'</span></div><div class="line"><span>Açılış: '+safe(fmt(opened))+'</span></div><div class="line"><span>Kullanım sonu: '+safe(fmt(useBy))+'</span></div><div class="line"><span>Açan: '+safe(by||"—")+'</span></div></div><div class="controls"><button onclick="window.print()">Etiketi Yazdır</button><p>Yazıcı ayarı: 40 × 20 mm, %100 ölçek, kenar boşluğu yok.</p></div></body></html>');w.document.close();w.focus();
 };
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();