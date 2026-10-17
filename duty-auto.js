// Automatic roster drafts: no database writes; administrator reviews each proposed shift.
const root=document.getElementById("dutyRoster");
if(root){
const editor=document.getElementById("dutyEditor");
const panel=document.createElement("div");panel.className="panel";panel.id="autoDutyPanel";panel.innerHTML='<h3>Otomatik Aylık Nöbet Taslağı</h3><p class="muted">Aktif personel arasında dengeli dağıtım önerir. İzin, dinlenme ve personel uygunluğu ayrıca doğrulanmalıdır. Taslak veritabanına kaydedilmez.</p><div class="formgrid"><label class="field">Günlük görevli sayısı<input id="autoDutyCount" type="number" min="1" max="20" value="1"></label><label class="field">Vardiya<select id="autoDutyShift"><option>Gündüz</option><option>Gece</option><option>24 Saat</option></select></label><label class="field">Başlangıç<input id="autoDutyStart" type="time" value="08:00"></label><label class="field">Bitiş<input id="autoDutyEnd" type="time" value="17:00"></label></div><div class="actions"><button id="autoDutyGenerate" class="btn alt" type="button">Taslak Oluştur</button></div><p class="muted" id="autoDutyMessage" role="status"></p><div class="scroll"><table><thead><tr><th>Tarih</th><th>Personel</th><th>Vardiya</th><th>Saat</th><th>Durum</th></tr></thead><tbody id="autoDutyRows"></tbody></table></div>';
editor?.append(panel);
const $=id=>document.getElementById(id),message=t=>$("autoDutyMessage").textContent=t;
$("autoDutyGenerate").onclick=()=>{
const people=[...$("dutyPerson").options].filter(o=>o.value);const count=Number($("autoDutyCount").value),period=$("dutyMonth").value;
if(!/^\d{4}-\d{2}$/.test(period)||!people.length||!Number.isInteger(count)||count<1||count>people.length){message("Ay, aktif personel ve günlük görevli sayısını kontrol edin.");return}
const [year,month]=period.split("-").map(Number);const days=new Date(year,month,0).getDate(),body=$("autoDutyRows");body.replaceChildren();
const assignments=new Map(),totals=new Map(people.map(p=>[p.value,0]));let proposed=0,skipped=0;
const existing=[...$("dutyRows").rows].map(tr=>[...tr.cells].map(c=>c.textContent));const used=new Set(existing.map(c=>c[0]+"|"+c[1]));
for(let day=1;day<=days;day++){const date=period+"-"+String(day).padStart(2,"0");const yesterday=assignments.get(day-1)||new Set();const todays=new Set();for(let slot=0;slot<count;slot++){const available=people.filter(p=>!todays.has(p.value)&&!yesterday.has(p.value)&&!used.has(date+"|"+p.textContent));available.sort((a,b)=>totals.get(a.value)-totals.get(b.value)||a.value.localeCompare(b.value));const person=available[0];if(!person){skipped++;continue}todays.add(person.value);totals.set(person.value,totals.get(person.value)+1);proposed++;const tr=document.createElement("tr");for(const text of [date,person.textContent,$("autoDutyShift").value,$("autoDutyStart").value+"–"+$("autoDutyEnd").value,"Taslak — kaydedilmedi"]){const td=document.createElement("td");td.textContent=text;tr.append(td)}body.append(tr)}assignments.set(day,todays)}
message(proposed+" taslak nöbet oluşturuldu. "+(skipped?skipped+" görev boş bırakıldı (uygun personel yok). ":"")+"Taslak yalnızca önizlemedir; kayıt için mevcut Nöbet Ekle formunu kullanın. İzinler ve yasal dinlenme koşulları kontrol edilmelidir.");
};
}
