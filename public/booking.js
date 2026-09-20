var l=document.getElementById("booking-root");if(!l)throw new Error("Missing #booking-root");var f=document.createElement("style");f.textContent=`
#booking-root{max-width:640px;margin:0 auto;padding:80px 20px 60px;min-height:100vh;font-family:'Inter',system-ui,sans-serif;color:#f7efd9}
.bk-title{font-family:'Space Grotesk',system-ui,sans-serif;font-size:2rem;font-weight:700;margin-bottom:8px}
.bk-sub{color:rgba(247,239,217,.6);font-size:.9rem;margin-bottom:32px}
.bk-step-label{font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:rgba(247,239,217,.5);margin-bottom:16px}
.bk-types{display:grid;gap:12px}
.bk-type{background:#1a1a17;border:2px solid transparent;border-radius:12px;padding:20px;cursor:pointer;transition:border-color .2s}
.bk-type:hover,.bk-type.active{border-color:#C0202B}
.bk-type h3{margin:0 0 4px;font-size:1rem;font-weight:600}
.bk-type p{margin:0;font-size:.8rem;color:rgba(247,239,217,.5)}
.bk-type .dur{display:inline-block;margin-top:8px;font-size:.75rem;background:rgba(192,32,43,.15);color:#C0202B;padding:2px 8px;border-radius:20px;font-weight:600}
.bk-calendar{margin-top:16px}
.bk-cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.bk-cal-header h3{margin:0;font-size:1rem;font-weight:600}
.bk-cal-header button{background:none;border:1px solid rgba(247,239,217,.2);color:#f7efd9;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:.8rem}
.bk-cal-header button:hover{border-color:#C0202B;color:#C0202B}
.bk-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}
.bk-cal-day{font-size:.7rem;font-weight:600;color:rgba(247,239,217,.4);padding:6px 0}
.bk-cal-cell{font-size:.85rem;padding:8px 0;border-radius:8px;cursor:pointer;transition:background .15s}
.bk-cal-cell:hover{background:rgba(192,32,43,.2)}
.bk-cal-cell.today{border:1px solid rgba(192,32,43,.4)}
.bk-cal-cell.selected{background:#C0202B;color:#fff;font-weight:600}
.bk-cal-cell.disabled{color:rgba(247,239,217,.15);cursor:default;pointer-events:none}
.bk-cal-cell.empty{pointer-events:none}
.bk-slots{display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:8px;margin-top:16px}
.bk-slot{background:#1a1a17;border:2px solid transparent;border-radius:8px;padding:10px;text-align:center;cursor:pointer;font-size:.85rem;font-weight:600;transition:border-color .2s}
.bk-slot:hover,.bk-slot.active{border-color:#C0202B;color:#C0202B}
.bk-form{display:grid;gap:12px;margin-top:20px}
.bk-form label{display:block;font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:rgba(247,239,217,.5);margin-bottom:4px}
.bk-form input,.bk-form textarea{width:100%;background:#1a1a17;border:1px solid rgba(247,239,217,.15);border-radius:8px;padding:10px 12px;color:#f7efd9;font-size:.9rem;font-family:inherit;outline:none;box-sizing:border-box}
.bk-form input:focus,.bk-form textarea:focus{border-color:#C0202B}
.bk-btn{display:inline-block;background:#C0202B;color:#fff;border:none;padding:14px 32px;border-radius:100px;font-weight:700;font-size:.9rem;cursor:pointer;transition:background .2s;font-family:inherit}
.bk-btn:hover{background:#96131B}
.bk-btn:disabled{opacity:.5;cursor:default}
.bk-btn-ghost{background:transparent;border:1px solid rgba(247,239,217,.2);color:#f7efd9}
.bk-btn-ghost:hover{border-color:#C0202B;color:#C0202B}
.bk-back{font-size:.8rem;color:rgba(247,239,217,.5);cursor:pointer;border:none;background:none;padding:0;margin-bottom:16px;font-family:inherit}
.bk-back:hover{color:#C0202B}
.bk-success{text-align:center;padding:60px 0}
.bk-success h2{font-family:'Space Grotesk',system-ui,sans-serif;font-size:1.6rem;margin-bottom:8px}
.bk-success p{color:rgba(247,239,217,.6);font-size:.9rem}
.bk-success .info{background:#1a1a17;border-radius:12px;padding:20px;margin:24px 0;text-align:left}
.bk-success .info p{margin:4px 0;font-size:.85rem;color:#f7efd9}
.bk-success .info span{color:rgba(247,239,217,.5);display:inline-block;width:80px}
.bk-loading{text-align:center;padding:40px 0;color:rgba(247,239,217,.5);font-size:.9rem}
.bk-err{color:#C0202B;font-size:.85rem;margin-top:8px}
@media(max-width:600px){.bk-title{font-size:1.5rem}.bk-slots{grid-template-columns:repeat(3,1fr)}}
`;document.head.appendChild(f);var e={step:"types",types:[],selectedType:null,selectedDate:"",slots:[],selectedSlot:null,loadingSlots:!1,booking:!1,error:"",result:null};async function E(){let n=await(await fetch("/api/appointments/types")).json();n.ok&&(e.types=n.types)}async function y(t,n){e.loadingSlots=!0,e.selectedSlot=null,e.error="",a();let i=await(await fetch(`/api/appointments/slots/${t}?date=${n}`)).json();e.loadingSlots=!1,i.ok?e.slots=i.slots:e.slots=[],a()}function a(){switch(e.step){case"types":w();break;case"calendar":T();break;case"form":D();break;case"success":z();break}}function w(){l.innerHTML=`
    <h1 class="bk-title">Prendre rendez-vous</h1>
    <p class="bk-sub">Choisissez le type de rendez-vous qui correspond \xE0 votre besoin.</p>
    <p class="bk-step-label">\xC9tape 1 \u2014 Type de RDV</p>
    <div class="bk-types">
      ${e.types.length===0?'<p class="bk-loading">Chargement...</p>':e.types.map((t,n)=>`
          <div class="bk-type" data-idx="${n}">
            <h3>${c(t.title)}</h3>
            ${t.description?`<p>${c(t.description)}</p>`:""}
            <span class="dur">${t.duration} min${t.location?` \xB7 ${c(t.location)}`:""}</span>
          </div>
        `).join("")}
    </div>
  `,l.querySelectorAll(".bk-type").forEach(t=>{t.addEventListener("click",()=>{let n=parseInt(t.dataset.idx||"0");e.selectedType=e.types[n],e.step="calendar";let r=new Date,i=new Date(r.getTime()+864e5);e.selectedDate=i.toISOString().slice(0,10),y(e.selectedType.slug,e.selectedDate),a()})})}function T(){let t=e.selectedType,[n,r]=e.selectedDate?e.selectedDate.split("-").map(Number):[new Date().getFullYear(),new Date().getMonth()+1],i=new Date(n,r-1,1),b=new Date(n,r,0).getDate(),m=i.getDay(),d=new Date().toISOString().slice(0,10),k=["Janvier","F\xE9vrier","Mars","Avril","Mai","Juin","Juillet","Ao\xFBt","Septembre","Octobre","Novembre","D\xE9cembre"],u=["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"].map(o=>`<div class="bk-cal-day">${o}</div>`).join("");for(let o=0;o<m;o++)u+='<div class="bk-cal-cell empty"></div>';for(let o=1;o<=b;o++){let s=`${n}-${String(r).padStart(2,"0")}-${String(o).padStart(2,"0")}`,h=s<d,$=s===e.selectedDate,S=["bk-cal-cell",h?"disabled":"",$?"selected":"",s===d?"today":""].filter(Boolean).join(" ");u+=`<div class="${S}" data-date="${s}">${o}</div>`}let x=r===1?`${n-1}-12`:`${n}-${String(r-1).padStart(2,"0")}`,v=r===12?`${n+1}-01`:`${n}-${String(r+1).padStart(2,"0")}`;l.innerHTML=`
    <button class="bk-back" id="bk-back">\u2190 Changer de type</button>
    <h1 class="bk-title">${c(t.title)}</h1>
    <p class="bk-sub">${t.duration} min${t.location?` \xB7 ${c(t.location)}`:""}</p>
    <p class="bk-step-label">\xC9tape 2 \u2014 Choisissez une date et un cr\xE9neau</p>
    <div class="bk-calendar">
      <div class="bk-cal-header">
        <button id="bk-prev">\u2190</button>
        <h3>${k[r-1]} ${n}</h3>
        <button id="bk-next">\u2192</button>
      </div>
      <div class="bk-cal-grid">${u}</div>
    </div>
    ${e.selectedDate?`
      <p style="margin-top:16px;font-size:.85rem;font-weight:600">Cr\xE9neaux pour le ${g(e.selectedDate)}</p>
      ${e.loadingSlots?'<p class="bk-loading">Chargement des cr\xE9neaux...</p>':e.slots.length===0?'<p style="color:rgba(247,239,217,.5);font-size:.85rem">Aucun cr\xE9neau disponible ce jour.</p>':`
        <div class="bk-slots">
          ${e.slots.map((o,s)=>`
            <div class="bk-slot${e.selectedSlot?.start===o.start?" active":""}" data-idx="${s}">
              ${o.start.slice(11,16)}
            </div>
          `).join("")}
        </div>
      `}
      ${e.selectedSlot?'<div style="margin-top:20px;text-align:center"><button class="bk-btn" id="bk-continue">Continuer \u2192</button></div>':""}
    `:""}
  `,document.getElementById("bk-back")?.addEventListener("click",()=>{e.step="types",e.selectedType=null,e.selectedDate="",e.selectedSlot=null,a()}),document.getElementById("bk-prev")?.addEventListener("click",()=>{e.selectedDate=`${x}-01`,e.selectedSlot=null,e.slots=[],a()}),document.getElementById("bk-next")?.addEventListener("click",()=>{e.selectedDate=`${v}-01`,e.selectedSlot=null,e.slots=[],a()}),l.querySelectorAll(".bk-cal-cell:not(.disabled):not(.empty)").forEach(o=>{o.addEventListener("click",()=>{let s=o.dataset.date;e.selectedDate=s,e.selectedSlot=null,y(t.slug,s)})}),l.querySelectorAll(".bk-slot").forEach(o=>{o.addEventListener("click",()=>{let s=parseInt(o.dataset.idx||"0");e.selectedSlot=e.slots[s],a()})}),document.getElementById("bk-continue")?.addEventListener("click",()=>{e.step="form",a()})}function D(){let t=e.selectedType,n=e.selectedSlot;l.innerHTML=`
    <button class="bk-back" id="bk-back">\u2190 Changer de cr\xE9neau</button>
    <h1 class="bk-title">Vos coordonn\xE9es</h1>
    <p class="bk-sub">${c(t.title)} \u2014 ${g(e.selectedDate)} \xE0 ${n.start.slice(11,16)}</p>
    <p class="bk-step-label">\xC9tape 3 \u2014 Informations de contact</p>
    <div class="bk-form">
      <div>
        <label for="bk-name">Nom complet *</label>
        <input id="bk-name" type="text" placeholder="Votre nom" required>
      </div>
      <div>
        <label for="bk-phone">T\xE9l\xE9phone *</label>
        <input id="bk-phone" type="tel" placeholder="+237 6XX XXX XXX" required>
      </div>
      <div>
        <label for="bk-email">Email</label>
        <input id="bk-email" type="email" placeholder="vous@exemple.com">
      </div>
      <div>
        <label for="bk-company">Entreprise</label>
        <input id="bk-company" type="text" placeholder="Nom de votre entreprise">
      </div>
      <div>
        <label for="bk-notes">Notes (optionnel)</label>
        <textarea id="bk-notes" rows="3" placeholder="D\xE9crivez bri\xE8vement votre besoin..."></textarea>
      </div>
      ${e.error?`<p class="bk-err">${e.error}</p>`:""}
      <div style="display:flex;gap:12px;margin-top:8px">
        <button class="bk-btn" id="bk-submit" ${e.booking?"disabled":""}>${e.booking?"R\xE9servation...":"Confirmer le RDV"}</button>
      </div>
    </div>
  `,document.getElementById("bk-back")?.addEventListener("click",()=>{e.step="calendar",e.error="",a()}),document.getElementById("bk-submit")?.addEventListener("click",async()=>{let r=document.getElementById("bk-name").value.trim(),i=document.getElementById("bk-phone").value.trim(),b=document.getElementById("bk-email").value.trim(),m=document.getElementById("bk-company").value.trim(),d=document.getElementById("bk-notes").value.trim();if(!r||!i){e.error="Le nom et le t\xE9l\xE9phone sont obligatoires.",a();return}e.booking=!0,e.error="",a();try{let p=await(await fetch("/api/appointments/book",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({typeSlug:t.slug,startTime:n.start,clientName:r,clientEmail:b||void 0,clientPhone:i,clientCompany:m||void 0,notes:d||void 0})})).json();p.ok?(e.result={...p.appointment,clientName:r},e.step="success"):e.error=p.error||"Erreur lors de la r\xE9servation."}catch{e.error="Erreur r\xE9seau. V\xE9rifiez votre connexion."}e.booking=!1,a()})}function z(){let t=e.result;l.innerHTML=`
    <div class="bk-success">
      <h2>Rendez-vous confirm\xE9 \u2713</h2>
      <p>Nous avons bien enregistr\xE9 votre r\xE9servation.</p>
      <div class="info">
        <p><span>Type</span> ${c(t.typeName)}</p>
        <p><span>Date</span> ${g(t.startTime.slice(0,10))}</p>
        <p><span>Heure</span> ${t.startTime.slice(11,16)}</p>
        <p><span>Dur\xE9e</span> ${t.duration} min</p>
      </div>
      <p>Vous recevrez un email de confirmation si vous avez fourni votre adresse email.</p>
      <div style="margin-top:24px;display:flex;gap:12px;justify-content:center">
        <a href="/" class="bk-btn">Retour \xE0 l'accueil</a>
        <button class="bk-btn bk-btn-ghost" id="bk-another">Nouveau RDV</button>
      </div>
    </div>
  `,document.getElementById("bk-another")?.addEventListener("click",()=>{e={step:"types",types:e.types,selectedType:null,selectedDate:"",slots:[],selectedSlot:null,loadingSlots:!1,booking:!1,error:"",result:null},a()})}function g(t){return new Date(t+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}function c(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}(async()=>(await E(),a()))();
