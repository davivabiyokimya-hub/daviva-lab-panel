// Client-side draft generator; never writes to Firestore.
const root=document.getElementById("dutyRoster");
if(root){
const editor=document.getElementById("dutyEditor");
const panel=document.createElement("div");panel.className="panel";panel.id="autoDutyPanel";
panel.innerHTML='<h3>Otomatik Aylık Nöbet Taslağı</h3><p class="muted">Taslak kayıt edilmez. İzin, dinlenme süreleri ve personel uygunluğu yönetici tarafından kontrol edilmelidir.</p><div class="formgrid"><label class="field">Planlama modeli<select id="autoDutyMode"><option value="cycle">2 Gündüz · 2 Gece · 2 OFF</option><option value="balanced">Dengeli tek vardiya</option></select></label><label class="field">Döngü başlangıç tarihi<input id="autoDutyAnchor" type="date" value="2026-10-01"></label><label class="field">Gündüz başlangıç<input id="autoDayStart" type="time" value="08:00"></label><label class="field">Gündüz bitiş<input id="autoDayEnd" type="time" value="20:00"></label><label class="field">Gece başlangıç<input id="autoNightStart" type="time" value="20:00"></label><label class="field">Gece bitiş<input id="autoNightEnd" type="time" value="08:00"></label><label class="field">Günlük görevli sayısı (tek vardiya)<input id="autoDutyCount" type="number" min="1" max="20" value="1"></label><label class="field">Tek vardiya<select id="autoDutyShift"><option>Gündüz</option><option>Gece</option><option>24 Saat</option></select></label></div><div class="actions"><button id="autoDutyGenerate" class="btn alt" type="button">Taslak Oluştur</button><button id="autoDutyExport" class="btn alt" type="button">Taslağı CSV İndir</button></div><p class="muted" id="autoDutyMessage" role="status"></p><div class="scroll"><table><thead><tr><th>Tarih</th><th>Personel</th><th>Vardiya</th><th>Saat</th><th>Durum</th></tr></thead><tbody id="autoDutyRows"></tbody></table></div>';
editor?.append(panel);
const $=id=>document.getElementById(id),say=t=>$("autoDutyMessage").textContent=t;
let draft=[];
const dateNum=s=>{const [y,m,d]=s.split("-").map(Number);return Date.UTC(y,m-1,d)/86400000};
function render(){const body=$("autoDutyRows");body.replaceChildren();for(const row of draft){const tr=document.createElement("tr");for(const v of [row.date,row.name,row.shift,row.hours,row.status]){const td=document.createElement("td");td.textContent=v;tr.append(td)}body.append(tr)}}
$("autoDutyGenerate").onclick=()=>{
const people=[...$("dutyPerson").options].filter(o=>o.value);const period=$("dutyMonth").value,anchor=$("autoDutyAnchor").value,mode=$("autoDutyMode").value;
if(!/^\d{4}-\d{2}$/.test(period)||!people.length){say("Ay veya aktif personel seçimi eksik.");return}
const [y,m]=period.split("-").map(Number),days=new Date(y,m,0).getDate(),existing=[...$("dutyRows").rows].map(tr=>[...tr.cells].map(c=>c.textContent)),used=new Set(existing.map(x=>x[0]+"|"+x[1]));draft=[];
if(mode==="cycle"){
if(!/^\d{4}-\d{2}-\d{2}$/.test(anchor)||!Number.isFinite(dateNum(anchor))){say("Döngü başlangıç tarihi geçersiz.");return}
const base=dateNum(anchor),pattern=["Gündüz","Gündüz","Gece","Gece","OFF","OFF"];
for(let day=1;day<=days;day++){const date=period+"-"+String(day).padStart(2,"0");for(let i=0;i<people.length;i++){const person=people[i];const offset=Math.floor(i*6/people.length),phase=((dateNum(date)-base+offset)%6+6)%6,shift=pattern[phase],hours=shift==="OFF"?"—":shift==="Gündüz"?$("autoDayStart").value+"–"+$("autoDayEnd").value:$("autoNightStart").value+"–"+$("autoNightEnd").value;draft.push({date,name:person.textContent,shift,hours,status:used.has(date+"|"+person.textContent)?"Mevcut kayıt var — kontrol":"Taslak — kaydedilmedi"})}}
const min=Array.from({length:days},(_,j)=>{const date=period+"-"+String(j+1).padStart(2,"0");return draft.filter(x=>x.date===date&&x.shift==="Gündüz").length+" gündüz / "+draft.filter(x=>x.date===date&&x.shift==="Gece").length+" gece"});say(draft.length+" satır oluşturuldu. Personeller farklı fazlardan başlatıldı; her gün eşit gündüz/gece personeli garantisi yoktur. Döngü tarihi aylar arasında sabit kalmalıdır. "+(new Set(min).size>1?"Günlük kadro sayıları değişebilir.":""));
}else{
const count=Number($("autoDutyCount").value);if(!Number.isInteger(count)||count<1||count>people.length){say("Günlük görevli sayısı uygun değil.");return}
const totals=new Map(people.map(p=>[p.value,0])),assignments=new Map();let skipped=0;
for(let day=1;day<=days;day++){const date=period+"-"+String(day).padStart(2,"0"),yesterday=assignments.get(day-1)||new Set(),today=new Set();for(let slot=0;slot<count;slot++){const candidates=people.filter(p=>!today.has(p.value)&&!yesterday.has(p.value)&&!used.has(date+"|"+p.textContent));candidates.sort((a,b)=>totals.get(a.value)-totals.get(b.value)||a.value.localeCompare(b.value));const p=candidates[0];if(!p){skipped++;continue}today.add(p.value);totals.set(p.value,totals.get(p.value)+1);draft.push({date,name:p.textContent,shift:$("autoDutyShift").value,hours:$("autoDayStart").value+"–"+$("autoDayEnd").value,status:"Taslak — kaydedilmedi"})}assignments.set(day,today)}
say(draft.length+" nöbet taslağı oluşturuldu. "+(skipped?skipped+" görev boş kaldı. ":"")+"Mevcut kayıtlar değiştirilmedi.");
}
render();
};
$("autoDutyExport").onclick=()=>{if(!draft.length){say("Önce taslak oluşturun.");return}const cell=v=>'"'+String(v??"").replace(/"/g,'""')+'"';const csv="\uFEFF"+[["Tarih","Personel","Vardiya","Saat","Durum"],...draft.map(x=>[x.date,x.name,x.shift,x.hours,x.status])].map(a=>a.map(cell).join(";")).join("\r\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})),a=document.createElement("a");a.href=url;a.download="DAVIVA_Vardiya_Taslak_"+$("dutyMonth").value+".csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),500)};
}
