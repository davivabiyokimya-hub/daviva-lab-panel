// DAVIVA LAB — isolated 40 x 20 mm Code 39 label printing.
// No Firebase writes, no changes to existing product list printing.
const patterns={"0":"bsbSBsBsb","1":"BsbSbsbsB","2":"bsBSbsbsB","3":"BsBSbsbsb","4":"bsbSBsbsB","5":"BsbSBsbsb","6":"bsBSBsbsb","7":"bsbSbsBsB","8":"BsbSbsBsb","9":"bsBSbsBsb","A":"BsbsbSbsB","B":"bsBsbSbsB","C":"BsBsbSbsb","D":"bsbsBSbsB","E":"BsbsBSbsb","F":"bsBsBSbsb","G":"bsbsbSBsB","H":"BsbsbSBsb","I":"bsBsbSBsb","J":"bsbsBSBsb","K":"BsbsbsbSB","L":"bsBsbsbSB","M":"BsBsbsbSb","N":"bsbsBsbSB","O":"BsbsBsbSb","P":"bsBsBsbSb","Q":"bsbsbsBSB","R":"BsbsbsBSb","S":"bsBsbsBSb","T":"bsbsBsBSb","U":"BSbsbsbsB","V":"bSBsbsbsB","W":"BSBsbsbsb","X":"bSbsBsbsB","Y":"BSbsBsbsb","Z":"bSBsBsbsb","-":"bSbsbsBsB",".":"BSbsbsBsb"," ":"bSBsbsBsb","*":"bSbsBsBsb","$":"bSbSbSbsb","/":"bSbSbsbSb","+":"bSbsbSbSb","%":"bsbSbSbSb"};
function barcodeSvg(raw){
  const value=String(raw).trim().toUpperCase();
  if(!value||value.length>28||![...value].every(c=>c!=="*"&&patterns[c]))throw Error("Code 39 için geçersiz barkod. En fazla 28 karakter; A-Z, 0-9, boşluk ve - . $ / + % desteklenir.");
  const encoded="*"+value+"*";let x=8;const bars=[];
  for(const c of encoded){for(const p of patterns[c]){const width=p===p.toUpperCase()?3:1;if(p.toLowerCase()==="b")bars.push('<rect x="'+x+'" y="0" width="'+width+'" height="38"/>');x+=width;}x+=1}
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+(x+8)+' 38" preserveAspectRatio="none" role="img" aria-label="Code 39 barkod">'+bars.join("")+'</svg>';
}
const source=document.getElementById("productsBody"),existing=document.getElementById("printProducts");
if(source&&existing){
  let selected=null;
  const btn=document.createElement("button");btn.type="button";btn.className="btn alt";btn.textContent="🏷 Barkod Etiketi (40×20)";
  existing.after(btn);
  source.addEventListener("click",e=>{const row=e.target.closest("tr");if(!row||!source.contains(row)||row.querySelectorAll("td").length<4)return;selected={code:row.cells[0].textContent.trim(),name:row.cells[1].textContent.trim(),barcode:row.cells[3].textContent.split("|")[0].trim()};for(const tr of source.rows)tr.style.outline="";row.style.outline="2px solid #1378d4"});
  btn.onclick=()=>{
    if(!selected){alert("Önce ürün listesinden yazdırılacak ürün satırına tıklayın.");return}
    let svg;try{svg=barcodeSvg(selected.barcode||selected.code)}catch(e){alert(e.message);return}
    const popup=window.open("","_blank","width=620,height=420");
    if(!popup){alert("Tarayıcı açılır pencereyi engelledi. Bu site için açılır pencerelere izin verin.");return}
    const doc=popup.document;doc.open();doc.write('<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>DAVIVA LAB Barkod Etiketi</title><style>@page{size:40mm 20mm;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;font-family:Arial,sans-serif}.label{width:40mm;height:20mm;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1mm}.name{font-size:7pt;font-weight:bold;max-width:38mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bars{width:36mm;height:9mm}.bars svg{width:100%;height:100%;fill:#000}.code{font-size:7pt;line-height:1.2}.toolbar{margin:15px;font:14px Arial}@media print{.toolbar{display:none}html,body{width:40mm;height:20mm}}</style></head><body><div class="label"><div class="name" id="name"></div><div class="bars">'+svg+'</div><div class="code" id="code"></div></div><div class="toolbar"><button onclick="window.print()">Yazdır</button> PALMX DXP-400: 40×20 mm, %100 ölçek, kenar boşluğu yok.</div></body></html>');doc.close();
    doc.getElementById("name").textContent=selected.name;
    doc.getElementById("code").textContent=selected.barcode||selected.code;
    popup.focus();
  };
}
export {barcodeSvg};
