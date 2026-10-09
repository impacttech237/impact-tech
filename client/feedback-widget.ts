/* ------------------------------------------------------------------
   Widget « Commenter » pour les sites clients en développement.
   À coller avant </body> du site en dev :
     <script src="https://impacttech237.com/feedback.js" data-key="CLÉ_DU_PROJET" defer></script>
   (la clé est affichée dans l'admin, onglet du projet > Retours)
   Le client clique sur « Commenter », touche l'élément concerné et
   écrit sa remarque : page, position, appareil et capture d'écran
   arrivent dans le projet, côté admin.
------------------------------------------------------------------- */
(() => {
  const script = document.currentScript as HTMLScriptElement | null;
  const key = script?.dataset.key || "";
  if (!key || (window as any).__itFeedback) return;
  (window as any).__itFeedback = true;
  const API = `${new URL(script!.src).origin}/api/feedback/${key}`;
  const lang = (navigator.language || "fr").startsWith("fr") ? "fr" : "en";
  const T = {
    fr: { btn: "Commenter", hint: "Touchez l'élément à commenter", ph: "Que faut-il changer ici ?", send: "Envoyer", cancel: "Annuler", ok: "Merci, c'est envoyé ✓", err: "Envoi impossible, réessayez.", done: "Terminer" },
    en: { btn: "Comment", hint: "Tap the element you want to comment on", ph: "What should change here?", send: "Send", cancel: "Cancel", ok: "Thanks, sent ✓", err: "Couldn't send, please retry.", done: "Done" },
  }[lang];

  const css = `
  .itfb-btn{position:fixed;z-index:2147483000;right:16px;bottom:16px;display:flex;align-items:center;gap:8px;padding:12px 18px;border-radius:999px;border:0;background:#c0202b;color:#fff;font:600 15px/1 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.3);cursor:pointer}
  .itfb-btn.on{background:#111}
  .itfb-hint{position:fixed;z-index:2147483000;left:50%;top:12px;transform:translateX(-50%);padding:10px 16px;border-radius:999px;background:#111;color:#fff;font:500 14px system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.3)}
  .itfb-hl{outline:3px solid #c0202b!important;outline-offset:2px!important;cursor:crosshair!important}
  .itfb-pop{position:absolute;z-index:2147483001;width:min(320px,calc(100vw - 24px));padding:12px;border-radius:14px;background:#fff;color:#111;box-shadow:0 12px 36px rgba(0,0,0,.3);font:14px system-ui,sans-serif}
  .itfb-pop textarea{width:100%;min-height:90px;box-sizing:border-box;padding:10px;border:1px solid #ccc;border-radius:10px;font:15px system-ui,sans-serif;resize:vertical}
  .itfb-row{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}
  .itfb-row button{min-height:40px;padding:8px 14px;border-radius:999px;border:0;font:600 14px system-ui,sans-serif;cursor:pointer}
  .itfb-send{background:#c0202b;color:#fff}.itfb-cancel{background:#eee;color:#111}
  .itfb-pin{position:absolute;z-index:2147483000;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:#c0202b;color:#fff;display:grid;place-items:center;font:700 12px system-ui;box-shadow:0 2px 8px rgba(0,0,0,.3);pointer-events:none}
  .itfb-toast{position:fixed;z-index:2147483002;left:50%;bottom:80px;transform:translateX(-50%);padding:12px 18px;border-radius:12px;background:#111;color:#fff;font:600 14px system-ui,sans-serif}`;

  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "itfb-btn";
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4-.9L3 20l1.1-4A8.4 8.4 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z"/></svg>`;
  const label = document.createElement("span");
  label.textContent = T.btn;
  btn.appendChild(label);
  document.body.appendChild(btn);

  let active = false;
  let hint: HTMLElement | null = null;
  let hovered: Element | null = null;
  let count = 0;

  const toast = (text: string) => {
    const el = document.createElement("div");
    el.className = "itfb-toast";
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  };

  function selectorOf(el: Element): string {
    const parts: string[] = [];
    let node: Element | null = el;
    while (node && node !== document.body && parts.length < 6) {
      let part = node.tagName.toLowerCase();
      if (node.id) {
        parts.unshift(`${part}#${node.id}`);
        break;
      }
      const parent = node.parentElement;
      if (parent) {
        const same = Array.from(parent.children).filter((c) => c.tagName === node!.tagName);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`;
      }
      parts.unshift(part);
      node = node.parentElement;
    }
    return parts.join(" > ");
  }

  function setActive(on: boolean) {
    active = on;
    btn.classList.toggle("on", on);
    label.textContent = on ? T.done : T.btn;
    if (on) {
      hint = document.createElement("div");
      hint.className = "itfb-hint";
      hint.textContent = T.hint;
      document.body.appendChild(hint);
    } else {
      hint?.remove();
      hovered?.classList.remove("itfb-hl");
      hovered = null;
    }
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    setActive(!active);
  });

  document.addEventListener(
    "mouseover",
    (e) => {
      if (!active) return;
      const el = e.target as Element;
      if (el.closest(".itfb-btn,.itfb-pop,.itfb-hint")) return;
      hovered?.classList.remove("itfb-hl");
      hovered = el;
      el.classList.add("itfb-hl");
    },
    true
  );

  document.addEventListener(
    "click",
    (e) => {
      if (!active) return;
      const el = e.target as Element;
      if (el.closest(".itfb-btn,.itfb-pop,.itfb-hint")) return;
      e.preventDefault();
      e.stopPropagation();
      openPopup(el, e.pageX, e.pageY);
    },
    true
  );

  async function screenshot(): Promise<string | null> {
    try {
      if (!(window as any).html2canvas) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
          s.onload = () => resolve();
          s.onerror = () => reject();
          document.head.appendChild(s);
        });
      }
      const canvas = await (window as any).html2canvas(document.body, {
        x: window.scrollX,
        y: window.scrollY,
        width: window.innerWidth,
        height: window.innerHeight,
        scale: Math.min(1, 1000 / window.innerWidth),
        useCORS: true,
        logging: false,
        ignoreElements: (n: Element) => n.classList?.contains("itfb-btn") || n.classList?.contains("itfb-pop") || n.classList?.contains("itfb-hint"),
      });
      return canvas.toDataURL("image/jpeg", 0.6);
    } catch {
      return null;
    }
  }

  function openPopup(el: Element, x: number, y: number) {
    document.querySelector(".itfb-pop")?.remove();
    const pop = document.createElement("div");
    pop.className = "itfb-pop";
    pop.style.left = `${Math.max(12, Math.min(x - 20, document.documentElement.scrollWidth - 340))}px`;
    pop.style.top = `${y + 14}px`;
    const ta = document.createElement("textarea");
    ta.placeholder = T.ph;
    const row = document.createElement("div");
    row.className = "itfb-row";
    const cancel = document.createElement("button");
    cancel.className = "itfb-cancel";
    cancel.textContent = T.cancel;
    const send = document.createElement("button");
    send.className = "itfb-send";
    send.textContent = T.send;
    row.append(cancel, send);
    pop.append(ta, row);
    document.body.appendChild(pop);
    ta.focus();

    cancel.onclick = () => pop.remove();
    send.onclick = async () => {
      const comment = ta.value.trim();
      if (!comment) return ta.focus();
      send.disabled = true;
      pop.style.visibility = "hidden";
      el.classList.remove("itfb-hl");
      const shot = await screenshot();
      pop.style.visibility = "";
      try {
        const res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comment,
            pageUrl: location.href,
            x: Math.round(x),
            y: Math.round(y),
            selector: selectorOf(el),
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            device: window.innerWidth < 700 ? "mobile" : window.innerWidth < 1024 ? "tablette" : "ordinateur",
            screenshot: shot,
          }),
        });
        if (!res.ok) throw new Error();
        pop.remove();
        const pin = document.createElement("div");
        pin.className = "itfb-pin";
        pin.textContent = String(++count);
        pin.style.left = `${x}px`;
        pin.style.top = `${y}px`;
        document.body.appendChild(pin);
        toast(T.ok);
      } catch {
        send.disabled = false;
        toast(T.err);
      }
    };
  }
})();
