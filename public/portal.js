var E="/api/portal",m=document.getElementById("portal-root"),T=m.dataset.token||"",C={cadrage:"Cadrage",devis:"Devis",contrat:"Contrat",en_cours:"En cours",livraison:"Livraison",termine:"Termin\xE9"},h={draft:{label:"Brouillon",color:"#888"},sent:{label:"\xC0 signer",color:"#C0202B"},signed:{label:"Sign\xE9",color:"#3ecf6e"}};function j(){let t=document.createElement("style");t.textContent=`
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
  #portal-root{font-family:'Inter',system-ui,sans-serif;background:#0e0e0c;color:#f7efd9;min-height:100vh;padding:0}
  .portal-header{background:#1a1a17;border-bottom:1px solid #2a2a25;padding:16px 24px;display:flex;justify-content:space-between;align-items:center}
  .portal-logo{font-family:'Space Grotesk',sans-serif;font-size:18px;font-weight:700;color:#f7efd9}
  .portal-logo span{color:#C0202B}
  .portal-user{display:flex;align-items:center;gap:12px;font-size:13px;color:rgba(247,239,217,.6)}
  .portal-container{max-width:900px;margin:0 auto;padding:24px 16px}
  .portal-title{font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700;margin:0 0 24px}
  .portal-card{background:#1a1a17;border:1px solid #2a2a25;border-radius:12px;padding:20px;margin-bottom:16px;cursor:pointer;transition:border-color .2s}
  .portal-card:hover{border-color:#C0202B}
  .portal-card h3{margin:0 0 8px;font-size:16px;font-weight:600}
  .portal-card p{margin:0;font-size:13px;color:rgba(247,239,217,.6)}
  .portal-badge{display:inline-block;padding:2px 10px;border-radius:100px;font-size:11px;font-weight:600;text-transform:uppercase}
  .portal-btn{display:inline-block;background:#C0202B;color:#fff;border:none;padding:10px 24px;border-radius:100px;font-weight:600;font-size:14px;cursor:pointer;font-family:inherit;transition:opacity .2s}
  .portal-btn:hover{opacity:.85}
  .portal-btn:disabled{opacity:.5;cursor:not-allowed}
  .portal-btn-outline{background:transparent;border:1px solid #2a2a25;color:#f7efd9}
  .portal-btn-outline:hover{border-color:#C0202B}
  .portal-input{width:100%;padding:10px 14px;background:#0e0e0c;border:1px solid #2a2a25;border-radius:8px;color:#f7efd9;font-size:14px;font-family:inherit;box-sizing:border-box}
  .portal-input:focus{outline:none;border-color:#C0202B}
  .portal-back{display:inline-flex;align-items:center;gap:6px;color:rgba(247,239,217,.6);text-decoration:none;font-size:13px;margin-bottom:16px;cursor:pointer;border:none;background:none;font-family:inherit}
  .portal-back:hover{color:#f7efd9}
  .portal-doc-content{background:#1a1a17;border:1px solid #2a2a25;border-radius:12px;padding:24px;margin:16px 0;line-height:1.7;white-space:pre-wrap;font-size:14px}
  .portal-sig-section{background:#1a1a17;border:1px solid #2a2a25;border-radius:12px;padding:24px;margin:16px 0}
  .portal-sig-section h3{margin:0 0 16px;font-size:16px}
  .portal-sig-input{margin:12px 0}
  .portal-sig-input label{display:block;font-size:13px;color:rgba(247,239,217,.6);margin-bottom:6px}
  .portal-sig-canvas{border:1px solid #2a2a25;border-radius:8px;cursor:crosshair;touch-action:none;display:block}
  .portal-sig-valid{color:#3ecf6e;font-size:12px;margin-top:4px}
  .portal-sig-invalid{color:#C0202B;font-size:12px;margin-top:4px}
  .portal-empty{text-align:center;padding:48px 24px;color:rgba(247,239,217,.5)}
  .portal-files{display:grid;gap:12px}
  .portal-file{display:flex;align-items:center;gap:12px;background:#1a1a17;border:1px solid #2a2a25;border-radius:8px;padding:12px 16px}
  .portal-file-icon{font-size:24px}
  .portal-file-info{flex:1}
  .portal-file-info strong{font-size:14px;display:block}
  .portal-file-info span{font-size:12px;color:rgba(247,239,217,.5)}
  .portal-auth{max-width:400px;margin:80px auto;text-align:center}
  .portal-auth h2{font-family:'Space Grotesk',sans-serif;font-size:28px;margin:0 0 8px}
  .portal-auth p{color:rgba(247,239,217,.6);margin:0 0 24px;font-size:14px}
  .portal-code-inputs{display:flex;gap:8px;justify-content:center;margin:16px 0}
  .portal-code-input{width:44px;height:52px;text-align:center;font-size:22px;font-weight:700;background:#1a1a17;border:1px solid #2a2a25;border-radius:8px;color:#f7efd9;font-family:inherit}
  .portal-code-input:focus{outline:none;border-color:#C0202B}
  .portal-error{color:#C0202B;font-size:13px;margin:8px 0}
  .portal-success{background:#1a1a17;border:1px solid #3ecf6e;border-radius:12px;padding:24px;text-align:center;margin:16px 0}
  .portal-success h3{color:#3ecf6e;margin:0 0 8px}
  .portal-tabs{display:flex;gap:0;border-bottom:1px solid #2a2a25;margin-bottom:24px}
  .portal-tab{padding:10px 20px;font-size:13px;font-weight:500;color:rgba(247,239,217,.5);cursor:pointer;border:none;background:none;font-family:inherit;border-bottom:2px solid transparent;transition:all .2s}
  .portal-tab.active{color:#f7efd9;border-bottom-color:#C0202B}
  .portal-tab:hover{color:#f7efd9}
  @media(max-width:600px){
    .portal-container{padding:16px 12px}
    .portal-title{font-size:20px}
    .portal-header{padding:12px 16px}
    .portal-code-inputs{gap:6px}
    .portal-code-input{width:38px;height:46px;font-size:18px}
  }
  `,document.head.appendChild(t)}async function p(t,r){return(await fetch(`${E}${t}`,{...r,headers:{"Content-Type":"application/json",...r?.headers||{}}})).json()}var v=null;function z(){m.innerHTML=`
    <div class="portal-auth">
      <p style="font-size:32px;margin-bottom:16px">\u{1F512}</p>
      <h2>Espace Client</h2>
      <p>impact.Tech</p>
      <div id="auth-step-1">
        <p style="margin-bottom:16px">Cliquez ci-dessous pour recevoir votre code d'acc\xE8s par email.</p>
        <button class="portal-btn" id="btn-request-code">Recevoir mon code</button>
        <div id="auth-error" class="portal-error" style="display:none"></div>
      </div>
      <div id="auth-step-2" style="display:none">
        <p id="auth-email-hint" style="margin-bottom:16px"></p>
        <div class="portal-code-inputs" id="code-inputs"></div>
        <div id="auth-error-2" class="portal-error" style="display:none"></div>
        <button class="portal-btn" id="btn-verify-code" disabled>V\xE9rifier</button>
      </div>
    </div>
  `;let t=document.getElementById("btn-request-code");t.addEventListener("click",async()=>{t.textContent="Envoi en cours...",t.disabled=!0;let r=await p("/request-code",{method:"POST",body:JSON.stringify({accessToken:T})});if(!r.ok){let a=document.getElementById("auth-error");a.textContent=r.error||"Erreur",a.style.display="block",t.textContent="Recevoir mon code",t.disabled=!1;return}document.getElementById("auth-step-1").style.display="none",document.getElementById("auth-step-2").style.display="block",document.getElementById("auth-email-hint").textContent=`Un code \xE0 6 chiffres a \xE9t\xE9 envoy\xE9 \xE0 ${r.email}`;let o=document.getElementById("code-inputs");for(let a=0;a<6;a++){let c=document.createElement("input");c.type="text",c.maxLength=1,c.className="portal-code-input",c.inputMode="numeric",c.pattern="[0-9]",c.dataset.idx=String(a),o.appendChild(c)}let e=o.querySelectorAll("input"),n=document.getElementById("btn-verify-code");e.forEach((a,c)=>{a.addEventListener("input",()=>{a.value&&c<5&&e[c+1].focus();let i=Array.from(e).map(d=>d.value).join("");n.disabled=i.length!==6}),a.addEventListener("keydown",i=>{i.key==="Backspace"&&!a.value&&c>0&&e[c-1].focus()}),a.addEventListener("paste",i=>{let d=(i.clipboardData?.getData("text")||"").replace(/\D/g,"").slice(0,6);d.length===6&&(i.preventDefault(),d.split("").forEach((b,f)=>{e[f].value=b}),n.disabled=!1,e[5].focus())})}),e[0].focus(),n.addEventListener("click",async()=>{let a=Array.from(e).map(i=>i.value).join("");n.textContent="V\xE9rification...",n.disabled=!0;let c=await p("/verify-code",{method:"POST",body:JSON.stringify({accessToken:T,code:a})});if(!c.ok){let i=document.getElementById("auth-error-2");i.textContent=c.error||"Code invalide",i.style.display="block",n.textContent="V\xE9rifier",n.disabled=!1;return}v=c.client,k()})})}function $(){return`
    <div class="portal-header">
      <div class="portal-logo">impact<span>.</span>Tech</div>
      <div class="portal-user">
        <span>${v?.name||""}</span>
        <button class="portal-btn-outline portal-btn" style="padding:6px 16px;font-size:12px" id="btn-logout">D\xE9connexion</button>
      </div>
    </div>
  `}function B(){document.getElementById("btn-logout")?.addEventListener("click",async()=>{await p("/logout",{method:"POST"}),v=null,z()})}async function k(){m.innerHTML=$()+`
    <div class="portal-container">
      <h1 class="portal-title">Bonjour, ${v?.name||""} \u{1F44B}</h1>
      <div id="projects-list"><p style="color:rgba(247,239,217,.5)">Chargement...</p></div>
    </div>
  `,B();let t=await p("/projects"),r=document.getElementById("projects-list");if(!t.ok||!t.projects?.length){r.innerHTML='<div class="portal-empty"><p>Aucun projet pour le moment.</p><p>Nous vous contacterons quand votre espace sera pr\xEAt.</p></div>';return}r.innerHTML=t.projects.map(o=>`
      <div class="portal-card" data-project-id="${o.id}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <h3>${u(o.title)}</h3>
          <span class="portal-badge" style="background:${M(o.status)}">${C[o.status]||o.status}</span>
        </div>
        <p>${u(o.description||"")}</p>
        ${o.due_date?`<p style="font-size:12px;margin-top:8px">\xC9ch\xE9ance : ${L(o.due_date)}</p>`:""}
      </div>
    `).join(""),r.querySelectorAll(".portal-card").forEach(o=>{o.addEventListener("click",()=>{let e=parseInt(o.dataset.projectId,10),n=t.projects.find(a=>a.id===e);n&&S(n)})})}async function S(t){m.innerHTML=$()+`
    <div class="portal-container">
      <button class="portal-back" id="btn-back">\u2190 Retour</button>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <h1 class="portal-title" style="margin-bottom:0">${u(t.title)}</h1>
        <span class="portal-badge" style="background:${M(t.status)}">${C[t.status]||t.status}</span>
      </div>
      ${t.description?`<p style="color:rgba(247,239,217,.6);margin-bottom:24px">${u(t.description)}</p>`:""}
      <div class="portal-tabs">
        <button class="portal-tab active" data-tab="documents">Documents</button>
        <button class="portal-tab" data-tab="files">Fichiers</button>
      </div>
      <div id="tab-content"><p style="color:rgba(247,239,217,.5)">Chargement...</p></div>
    </div>
  `,B(),document.getElementById("btn-back").addEventListener("click",k);let r="documents";document.querySelectorAll(".portal-tab").forEach(o=>{o.addEventListener("click",()=>{document.querySelectorAll(".portal-tab").forEach(e=>e.classList.remove("active")),o.classList.add("active"),r=o.dataset.tab,r==="documents"?w(t.id):D(t.id)})}),w(t.id)}async function w(t){let r=document.getElementById("tab-content"),o=await p(`/projects/${t}/documents`);if(!o.ok||!o.documents?.length){r.innerHTML='<div class="portal-empty"><p>Aucun document pour le moment.</p></div>';return}r.innerHTML=o.documents.map(e=>`
      <div class="portal-card" data-doc-id="${e.id}">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h3>${u(e.title)}</h3>
          <span class="portal-badge" style="background:${h[e.status]?.color||"#888"}">${h[e.status]?.label||e.status}</span>
        </div>
        <p>${e.category==="contrat"?"\u{1F4DD} Contrat":"\u{1F4C4} Document"}${e.signed_at?` \u2014 Sign\xE9 le ${L(e.signed_at)}`:""}</p>
      </div>
    `).join(""),r.querySelectorAll(".portal-card").forEach(e=>{e.addEventListener("click",()=>{let n=parseInt(e.dataset.docId,10);A(n,t)})})}async function D(t){let r=document.getElementById("tab-content"),o=await p(`/projects/${t}/files`);if(!o.ok||!o.files?.length){r.innerHTML='<div class="portal-empty"><p>Aucun fichier partag\xE9.</p></div>';return}r.innerHTML=`<div class="portal-files">${o.files.map(e=>`
      <div class="portal-file">
        <div class="portal-file-icon">${F(e.mime_type)}</div>
        <div class="portal-file-info">
          <strong>${u(e.name)}</strong>
          <span>${P(e.size)} \u2014 ${L(e.created_at)}</span>
        </div>
        <a href="${E}/files/${e.id}" class="portal-btn" style="padding:6px 16px;font-size:12px;text-decoration:none">T\xE9l\xE9charger</a>
      </div>
    `).join("")}</div>`}async function A(t,r){m.innerHTML=$()+`
    <div class="portal-container">
      <button class="portal-back" id="btn-back">\u2190 Retour au projet</button>
      <div id="doc-content"><p style="color:rgba(247,239,217,.5)">Chargement...</p></div>
    </div>
  `,B(),document.getElementById("btn-back").addEventListener("click",async()=>{let i=(await p("/projects")).projects?.find(d=>d.id===r);i?S(i):k()});let o=await p(`/documents/${t}`),e=document.getElementById("doc-content");if(!o.ok){e.innerHTML=`<div class="portal-empty"><p>${o.error||"Erreur"}</p></div>`;return}let n=o.document,a=o.signature;e.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h1 class="portal-title" style="margin-bottom:0">${u(n.title)}</h1>
      <span class="portal-badge" style="background:${h[n.status]?.color||"#888"}">${h[n.status]?.label||n.status}</span>
    </div>
    <div class="portal-doc-content">${u(n.content||"Aucun contenu")}</div>
    ${a?R(a,n):n.status==="sent"&&n.category==="contrat"?q(t):""}
  `,!a&&n.status==="sent"&&n.category==="contrat"&&_(t)}function R(t,r){return`
    <div class="portal-success">
      <h3>\u2713 Document sign\xE9</h3>
      <p>Sign\xE9 le ${L(t.signed_at)}</p>
      <p style="margin-top:8px;font-size:13px;color:rgba(247,239,217,.6)">Mention : \xAB ${u(t.approval_text)} \xBB</p>
      ${r.r2_key?`<a href="${E}/documents/${r.id}/pdf" class="portal-btn" style="margin-top:16px;text-decoration:none;display:inline-block">T\xE9l\xE9charger le PDF</a>`:""}
    </div>
  `}function q(t){return`
    <div class="portal-sig-section" id="sig-section">
      <h3>Signature requise</h3>
      <p style="font-size:13px;color:rgba(247,239,217,.6);margin-bottom:16px">
        Pour valider ce contrat, saisissez exactement \xAB Lu et approuv\xE9 \xBB puis signez dans le cadre ci-dessous.
      </p>
      <div class="portal-sig-input">
        <label>Mention obligatoire</label>
        <input type="text" class="portal-input" id="approval-input" placeholder="Tapez : Lu et approuv\xE9" autocomplete="off" />
        <div id="approval-status"></div>
      </div>
      <div class="portal-sig-input" id="canvas-container" style="opacity:0.3;pointer-events:none">
        <label>Votre signature</label>
        <canvas class="portal-sig-canvas" id="sig-canvas" width="400" height="150"></canvas>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="portal-btn-outline portal-btn" style="padding:6px 16px;font-size:12px" id="btn-clear-sig">Effacer</button>
        </div>
      </div>
      <div style="margin-top:16px">
        <button class="portal-btn" id="btn-sign" disabled>Signer le contrat</button>
        <div id="sign-error" class="portal-error" style="display:none"></div>
      </div>
    </div>
  `}function _(t){let r=document.getElementById("approval-input"),o=document.getElementById("approval-status"),e=document.getElementById("canvas-container"),n=document.getElementById("sig-canvas"),a=n.getContext("2d"),c=document.getElementById("btn-clear-sig"),i=document.getElementById("btn-sign"),d=document.getElementById("sign-error"),b=!1,f=!1,g=!1,I=n.parentElement.getBoundingClientRect();n.width=Math.min(400,I.width-32),n.height=150,a.strokeStyle="#f7efd9",a.lineWidth=2,a.lineCap="round",a.lineJoin="round",r.addEventListener("input",()=>{let s=r.value.trim();b=s==="Lu et approuv\xE9",b?(o.innerHTML='<div class="portal-sig-valid">\u2713 Mention correcte</div>',e.style.opacity="1",e.style.pointerEvents="auto"):s.length>0?(o.innerHTML='<div class="portal-sig-invalid">Saisissez exactement \xAB Lu et approuv\xE9 \xBB</div>',e.style.opacity="0.3",e.style.pointerEvents="none"):(o.innerHTML="",e.style.opacity="0.3",e.style.pointerEvents="none"),y()});function x(s){let l=n.getBoundingClientRect();return"touches"in s?{x:s.touches[0].clientX-l.left,y:s.touches[0].clientY-l.top}:{x:s.clientX-l.left,y:s.clientY-l.top}}n.addEventListener("mousedown",s=>{g=!0;let l=x(s);a.beginPath(),a.moveTo(l.x,l.y)}),n.addEventListener("mousemove",s=>{if(!g)return;let l=x(s);a.lineTo(l.x,l.y),a.stroke(),f=!0,y()}),n.addEventListener("mouseup",()=>{g=!1}),n.addEventListener("mouseleave",()=>{g=!1}),n.addEventListener("touchstart",s=>{s.preventDefault(),g=!0;let l=x(s);a.beginPath(),a.moveTo(l.x,l.y)},{passive:!1}),n.addEventListener("touchmove",s=>{if(s.preventDefault(),!g)return;let l=x(s);a.lineTo(l.x,l.y),a.stroke(),f=!0,y()},{passive:!1}),n.addEventListener("touchend",()=>{g=!1}),c.addEventListener("click",()=>{a.clearRect(0,0,n.width,n.height),f=!1,y()});function y(){i.disabled=!(b&&f)}i.addEventListener("click",async()=>{i.textContent="Signature en cours...",i.disabled=!0,d.style.display="none";let s=n.toDataURL("image/png"),l=await p(`/documents/${t}/sign`,{method:"POST",body:JSON.stringify({approvalText:r.value.trim(),signature:s})});if(!l.ok){d.textContent=l.error||"Erreur lors de la signature",d.style.display="block",i.textContent="Signer le contrat",i.disabled=!1;return}let H=document.getElementById("sig-section");H.outerHTML=`
      <div class="portal-success">
        <h3>\u2713 Contrat sign\xE9 avec succ\xE8s</h3>
        <p>Merci ! Votre signature a \xE9t\xE9 enregistr\xE9e.</p>
        ${l.pdfAvailable?`<a href="${E}/documents/${t}/pdf" class="portal-btn" style="margin-top:16px;text-decoration:none;display:inline-block">T\xE9l\xE9charger le PDF</a>`:""}
      </div>
    `})}function u(t){let r=document.createElement("div");return r.textContent=t,r.innerHTML}function M(t){return{cadrage:"#6366f1",devis:"#f59e0b",contrat:"#C0202B",en_cours:"#3b82f6",livraison:"#8b5cf6",termine:"#3ecf6e"}[t]||"#888"}function L(t){try{return new Date(t).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}catch{return t}}function P(t){return t<1024?t+" o":t<1024*1024?(t/1024).toFixed(1)+" Ko":(t/(1024*1024)).toFixed(1)+" Mo"}function F(t){return t?.startsWith("image/")?"\u{1F5BC}\uFE0F":t?.includes("pdf")?"\u{1F4D5}":t?.includes("zip")||t?.includes("rar")?"\u{1F4E6}":t?.includes("sheet")||t?.includes("excel")||t?.includes("csv")?"\u{1F4CA}":t?.includes("document")||t?.includes("word")?"\u{1F4C4}":"\u{1F4CE}"}async function O(){if(j(),!T){m.innerHTML=`<div class="portal-empty"><p>Lien invalide. V\xE9rifiez l'URL envoy\xE9e par email.</p></div>`;return}let t=await p("/me");t.ok?(v=t.client,k()):z()}O();
