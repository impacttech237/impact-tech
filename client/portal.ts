/* ------------------------------------------------------------------
   Portail client — vanilla TypeScript (pas de React).
   Auth : lien unique → code email → cookie session.
   Vues : auth, dashboard projets, documents, signature contrat.
------------------------------------------------------------------- */

const API = "/api/portal";
const root = document.getElementById("portal-root")!;
const accessToken = root.dataset.token || "";

const STATUS_LABELS: Record<string, string> = {
  cadrage: "Cadrage",
  devis: "Devis",
  contrat: "Contrat",
  en_cours: "En cours",
  livraison: "Livraison",
  termine: "Terminé",
};

const DOC_STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "#888" },
  sent: { label: "À signer", color: "#C0202B" },
  signed: { label: "Signé", color: "#3ecf6e" },
};

/* ── Styles ── */
function injectStyles() {
  const s = document.createElement("style");
  s.textContent = `
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
  `;
  document.head.appendChild(s);
}

/* ── API helpers ── */
async function api(path: string, opts?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts?.headers || {}) },
  });
  return res.json();
}

/* ── State ── */
let clientData: any = null;

/* ── Auth screen ── */
function renderAuth() {
  root.innerHTML = `
    <div class="portal-auth">
      <p style="font-size:32px;margin-bottom:16px">🔒</p>
      <h2>Espace Client</h2>
      <p>impact.Tech</p>
      <div id="auth-step-1">
        <p style="margin-bottom:16px">Cliquez ci-dessous pour recevoir votre code d'accès par email.</p>
        <button class="portal-btn" id="btn-request-code">Recevoir mon code</button>
        <div id="auth-error" class="portal-error" style="display:none"></div>
      </div>
      <div id="auth-step-2" style="display:none">
        <p id="auth-email-hint" style="margin-bottom:16px"></p>
        <div class="portal-code-inputs" id="code-inputs"></div>
        <div id="auth-error-2" class="portal-error" style="display:none"></div>
        <button class="portal-btn" id="btn-verify-code" disabled>Vérifier</button>
      </div>
    </div>
  `;

  const btnRequest = document.getElementById("btn-request-code")!;
  btnRequest.addEventListener("click", async () => {
    btnRequest.textContent = "Envoi en cours...";
    (btnRequest as HTMLButtonElement).disabled = true;

    const data = await api("/request-code", {
      method: "POST",
      body: JSON.stringify({ accessToken }),
    });

    if (!data.ok) {
      const err = document.getElementById("auth-error")!;
      err.textContent = data.error || "Erreur";
      err.style.display = "block";
      btnRequest.textContent = "Recevoir mon code";
      (btnRequest as HTMLButtonElement).disabled = false;
      return;
    }

    document.getElementById("auth-step-1")!.style.display = "none";
    document.getElementById("auth-step-2")!.style.display = "block";
    document.getElementById("auth-email-hint")!.textContent =
      `Un code à 6 chiffres a été envoyé à ${data.email}`;

    // Render 6 code inputs
    const container = document.getElementById("code-inputs")!;
    for (let i = 0; i < 6; i++) {
      const inp = document.createElement("input");
      inp.type = "text";
      inp.maxLength = 1;
      inp.className = "portal-code-input";
      inp.inputMode = "numeric";
      inp.pattern = "[0-9]";
      inp.dataset.idx = String(i);
      container.appendChild(inp);
    }

    const inputs = container.querySelectorAll<HTMLInputElement>("input");
    const btnVerify = document.getElementById("btn-verify-code") as HTMLButtonElement;

    inputs.forEach((inp, i) => {
      inp.addEventListener("input", () => {
        if (inp.value && i < 5) inputs[i + 1].focus();
        const code = Array.from(inputs).map((x) => x.value).join("");
        btnVerify.disabled = code.length !== 6;
      });
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !inp.value && i > 0) inputs[i - 1].focus();
      });
      inp.addEventListener("paste", (e) => {
        const paste = (e.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, 6);
        if (paste.length === 6) {
          e.preventDefault();
          paste.split("").forEach((ch, j) => { inputs[j].value = ch; });
          btnVerify.disabled = false;
          inputs[5].focus();
        }
      });
    });
    inputs[0].focus();

    btnVerify.addEventListener("click", async () => {
      const code = Array.from(inputs).map((x) => x.value).join("");
      btnVerify.textContent = "Vérification...";
      btnVerify.disabled = true;

      const res = await api("/verify-code", {
        method: "POST",
        body: JSON.stringify({ accessToken, code }),
      });

      if (!res.ok) {
        const err = document.getElementById("auth-error-2")!;
        err.textContent = res.error || "Code invalide";
        err.style.display = "block";
        btnVerify.textContent = "Vérifier";
        btnVerify.disabled = false;
        return;
      }

      clientData = res.client;
      renderDashboard();
    });
  });
}

/* ── Header ── */
function renderHeader() {
  return `
    <div class="portal-header">
      <div class="portal-logo">impact<span>.</span>Tech</div>
      <div class="portal-user">
        <span>${clientData?.name || ""}</span>
        <button class="portal-btn-outline portal-btn" style="padding:6px 16px;font-size:12px" id="btn-logout">Déconnexion</button>
      </div>
    </div>
  `;
}

function bindLogout() {
  document.getElementById("btn-logout")?.addEventListener("click", async () => {
    await api("/logout", { method: "POST" });
    clientData = null;
    renderAuth();
  });
}

/* ── Dashboard ── */
async function renderDashboard() {
  root.innerHTML = renderHeader() + `
    <div class="portal-container">
      <h1 class="portal-title">Bonjour, ${clientData?.name || ""} 👋</h1>
      <div id="projects-list"><p style="color:rgba(247,239,217,.5)">Chargement...</p></div>
    </div>
  `;
  bindLogout();

  const data = await api("/projects");
  const container = document.getElementById("projects-list")!;

  if (!data.ok || !data.projects?.length) {
    container.innerHTML = `<div class="portal-empty"><p>Aucun projet pour le moment.</p><p>Nous vous contacterons quand votre espace sera prêt.</p></div>`;
    return;
  }

  container.innerHTML = data.projects
    .map(
      (p: any) => `
      <div class="portal-card" data-project-id="${p.id}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <h3>${esc(p.title)}</h3>
          <span class="portal-badge" style="background:${statusColor(p.status)}">${STATUS_LABELS[p.status] || p.status}</span>
        </div>
        <p>${esc(p.description || "")}</p>
        ${p.due_date ? `<p style="font-size:12px;margin-top:8px">Échéance : ${formatDate(p.due_date)}</p>` : ""}
      </div>
    `
    )
    .join("");

  container.querySelectorAll<HTMLElement>(".portal-card").forEach((card) => {
    card.addEventListener("click", () => {
      const projectId = parseInt(card.dataset.projectId!, 10);
      const project = data.projects.find((p: any) => p.id === projectId);
      if (project) renderProject(project);
    });
  });
}

/* ── Project detail ── */
async function renderProject(project: any) {
  root.innerHTML = renderHeader() + `
    <div class="portal-container">
      <button class="portal-back" id="btn-back">← Retour</button>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <h1 class="portal-title" style="margin-bottom:0">${esc(project.title)}</h1>
        <span class="portal-badge" style="background:${statusColor(project.status)}">${STATUS_LABELS[project.status] || project.status}</span>
      </div>
      ${project.description ? `<p style="color:rgba(247,239,217,.6);margin-bottom:24px">${esc(project.description)}</p>` : ""}
      <div class="portal-tabs">
        <button class="portal-tab active" data-tab="documents">Documents</button>
        <button class="portal-tab" data-tab="files">Fichiers</button>
      </div>
      <div id="tab-content"><p style="color:rgba(247,239,217,.5)">Chargement...</p></div>
    </div>
  `;
  bindLogout();

  document.getElementById("btn-back")!.addEventListener("click", renderDashboard);

  let currentTab = "documents";
  document.querySelectorAll<HTMLElement>(".portal-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".portal-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentTab = tab.dataset.tab!;
      if (currentTab === "documents") loadDocuments(project.id);
      else loadFiles(project.id);
    });
  });

  loadDocuments(project.id);
}

async function loadDocuments(projectId: number) {
  const container = document.getElementById("tab-content")!;
  const data = await api(`/projects/${projectId}/documents`);

  if (!data.ok || !data.documents?.length) {
    container.innerHTML = `<div class="portal-empty"><p>Aucun document pour le moment.</p></div>`;
    return;
  }

  container.innerHTML = data.documents
    .map(
      (d: any) => `
      <div class="portal-card" data-doc-id="${d.id}">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h3>${esc(d.title)}</h3>
          <span class="portal-badge" style="background:${DOC_STATUS[d.status]?.color || "#888"}">${DOC_STATUS[d.status]?.label || d.status}</span>
        </div>
        <p>${d.category === "contrat" ? "📝 Contrat" : "📄 Document"}${d.signed_at ? ` — Signé le ${formatDate(d.signed_at)}` : ""}</p>
      </div>
    `
    )
    .join("");

  container.querySelectorAll<HTMLElement>(".portal-card").forEach((card) => {
    card.addEventListener("click", () => {
      const docId = parseInt(card.dataset.docId!, 10);
      renderDocument(docId, projectId);
    });
  });
}

async function loadFiles(projectId: number) {
  const container = document.getElementById("tab-content")!;
  const data = await api(`/projects/${projectId}/files`);

  if (!data.ok || !data.files?.length) {
    container.innerHTML = `<div class="portal-empty"><p>Aucun fichier partagé.</p></div>`;
    return;
  }

  container.innerHTML = `<div class="portal-files">${data.files
    .map(
      (f: any) => `
      <div class="portal-file">
        <div class="portal-file-icon">${fileIcon(f.mime_type)}</div>
        <div class="portal-file-info">
          <strong>${esc(f.name)}</strong>
          <span>${formatSize(f.size)} — ${formatDate(f.created_at)}</span>
        </div>
        <a href="${API}/files/${f.id}" class="portal-btn" style="padding:6px 16px;font-size:12px;text-decoration:none">Télécharger</a>
      </div>
    `
    )
    .join("")}</div>`;
}

/* ── Document view + signature ── */
async function renderDocument(docId: number, projectId: number) {
  root.innerHTML = renderHeader() + `
    <div class="portal-container">
      <button class="portal-back" id="btn-back">← Retour au projet</button>
      <div id="doc-content"><p style="color:rgba(247,239,217,.5)">Chargement...</p></div>
    </div>
  `;
  bindLogout();

  document.getElementById("btn-back")!.addEventListener("click", async () => {
    const projData = await api("/projects");
    const project = projData.projects?.find((p: any) => p.id === projectId);
    if (project) renderProject(project);
    else renderDashboard();
  });

  const data = await api(`/documents/${docId}`);
  const container = document.getElementById("doc-content")!;

  if (!data.ok) {
    container.innerHTML = `<div class="portal-empty"><p>${data.error || "Erreur"}</p></div>`;
    return;
  }

  const doc = data.document;
  const sig = data.signature;

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h1 class="portal-title" style="margin-bottom:0">${esc(doc.title)}</h1>
      <span class="portal-badge" style="background:${DOC_STATUS[doc.status]?.color || "#888"}">${DOC_STATUS[doc.status]?.label || doc.status}</span>
    </div>
    <div class="portal-doc-content">${esc(doc.content || "Aucun contenu")}</div>
    ${sig ? renderSignedBlock(sig, doc) : doc.status === "sent" && doc.category === "contrat" ? renderSignatureForm(docId) : ""}
  `;

  if (!sig && doc.status === "sent" && doc.category === "contrat") {
    setupSignature(docId);
  }
}

function renderSignedBlock(sig: any, doc: any) {
  return `
    <div class="portal-success">
      <h3>✓ Document signé</h3>
      <p>Signé le ${formatDate(sig.signed_at)}</p>
      <p style="margin-top:8px;font-size:13px;color:rgba(247,239,217,.6)">Mention : « ${esc(sig.approval_text)} »</p>
      ${doc.r2_key ? `<a href="${API}/documents/${doc.id}/pdf" class="portal-btn" style="margin-top:16px;text-decoration:none;display:inline-block">Télécharger le PDF</a>` : ""}
    </div>
  `;
}

function renderSignatureForm(docId: number) {
  return `
    <div class="portal-sig-section" id="sig-section">
      <h3>Signature requise</h3>
      <p style="font-size:13px;color:rgba(247,239,217,.6);margin-bottom:16px">
        Pour valider ce contrat, saisissez exactement « Lu et approuvé » puis signez dans le cadre ci-dessous.
      </p>
      <div class="portal-sig-input">
        <label>Mention obligatoire</label>
        <input type="text" class="portal-input" id="approval-input" placeholder="Tapez : Lu et approuvé" autocomplete="off" />
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
  `;
}

function setupSignature(docId: number) {
  const approvalInput = document.getElementById("approval-input") as HTMLInputElement;
  const approvalStatus = document.getElementById("approval-status")!;
  const canvasContainer = document.getElementById("canvas-container")!;
  const canvas = document.getElementById("sig-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  const btnClear = document.getElementById("btn-clear-sig")!;
  const btnSign = document.getElementById("btn-sign") as HTMLButtonElement;
  const signError = document.getElementById("sign-error")!;

  let approvalValid = false;
  let hasDrawn = false;
  let drawing = false;

  // Responsive canvas
  const rect = canvas.parentElement!.getBoundingClientRect();
  canvas.width = Math.min(400, rect.width - 32);
  canvas.height = 150;
  ctx.strokeStyle = "#f7efd9";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Approval check
  approvalInput.addEventListener("input", () => {
    const val = approvalInput.value.trim();
    approvalValid = val === "Lu et approuvé";
    if (approvalValid) {
      approvalStatus.innerHTML = '<div class="portal-sig-valid">✓ Mention correcte</div>';
      canvasContainer.style.opacity = "1";
      canvasContainer.style.pointerEvents = "auto";
    } else if (val.length > 0) {
      approvalStatus.innerHTML = '<div class="portal-sig-invalid">Saisissez exactement « Lu et approuvé »</div>';
      canvasContainer.style.opacity = "0.3";
      canvasContainer.style.pointerEvents = "none";
    } else {
      approvalStatus.innerHTML = "";
      canvasContainer.style.opacity = "0.3";
      canvasContainer.style.pointerEvents = "none";
    }
    updateSignBtn();
  });

  // Drawing
  function getPos(e: MouseEvent | TouchEvent) {
    const r = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    }
    return { x: (e as MouseEvent).clientX - r.left, y: (e as MouseEvent).clientY - r.top };
  }

  canvas.addEventListener("mousedown", (e) => { drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); });
  canvas.addEventListener("mousemove", (e) => { if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); hasDrawn = true; updateSignBtn(); });
  canvas.addEventListener("mouseup", () => { drawing = false; });
  canvas.addEventListener("mouseleave", () => { drawing = false; });

  canvas.addEventListener("touchstart", (e) => { e.preventDefault(); drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }, { passive: false });
  canvas.addEventListener("touchmove", (e) => { e.preventDefault(); if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); hasDrawn = true; updateSignBtn(); }, { passive: false });
  canvas.addEventListener("touchend", () => { drawing = false; });

  btnClear.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn = false;
    updateSignBtn();
  });

  function updateSignBtn() {
    btnSign.disabled = !(approvalValid && hasDrawn);
  }

  btnSign.addEventListener("click", async () => {
    btnSign.textContent = "Signature en cours...";
    btnSign.disabled = true;
    signError.style.display = "none";

    const signatureData = canvas.toDataURL("image/png");

    const res = await api(`/documents/${docId}/sign`, {
      method: "POST",
      body: JSON.stringify({
        approvalText: approvalInput.value.trim(),
        signature: signatureData,
      }),
    });

    if (!res.ok) {
      signError.textContent = res.error || "Erreur lors de la signature";
      signError.style.display = "block";
      btnSign.textContent = "Signer le contrat";
      btnSign.disabled = false;
      return;
    }

    // Remplacer le formulaire par le bloc de succès
    const section = document.getElementById("sig-section")!;
    section.outerHTML = `
      <div class="portal-success">
        <h3>✓ Contrat signé avec succès</h3>
        <p>Merci ! Votre signature a été enregistrée.</p>
        ${res.pdfAvailable ? `<a href="${API}/documents/${docId}/pdf" class="portal-btn" style="margin-top:16px;text-decoration:none;display:inline-block">Télécharger le PDF</a>` : ""}
      </div>
    `;
  });
}

/* ── Helpers ── */
function esc(s: string): string {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function statusColor(status: string): string {
  const colors: Record<string, string> = {
    cadrage: "#6366f1",
    devis: "#f59e0b",
    contrat: "#C0202B",
    en_cours: "#3b82f6",
    livraison: "#8b5cf6",
    termine: "#3ecf6e",
  };
  return colors[status] || "#888";
}

function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " o";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " Ko";
  return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
}

function fileIcon(mime: string): string {
  if (mime?.startsWith("image/")) return "🖼️";
  if (mime?.includes("pdf")) return "📕";
  if (mime?.includes("zip") || mime?.includes("rar")) return "📦";
  if (mime?.includes("sheet") || mime?.includes("excel") || mime?.includes("csv")) return "📊";
  if (mime?.includes("document") || mime?.includes("word")) return "📄";
  return "📎";
}

/* ── Init ── */
async function init() {
  injectStyles();

  if (!accessToken) {
    root.innerHTML = `<div class="portal-empty"><p>Lien invalide. Vérifiez l'URL envoyée par email.</p></div>`;
    return;
  }

  // Tester la session existante
  const me = await api("/me");
  if (me.ok) {
    clientData = me.client;
    renderDashboard();
  } else {
    renderAuth();
  }
}

init();
