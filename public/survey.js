var y=document.getElementById("survey-root"),x=document.getElementById("survey-data"),m=JSON.parse(x.textContent||"{}"),f=null,v=0,u=new Map;function N(){return m.sections.filter(t=>t.condition?u.get(t.condition.question_id)===t.condition.value:!0)}function e(t,n={},...i){let o=document.createElement(t);for(let[s,r]of Object.entries(n))s==="className"?o.className=r:s.startsWith("on")&&typeof r=="function"?o.addEventListener(s.slice(2).toLowerCase(),r):o.setAttribute(s,r);for(let s of i)typeof s=="string"?o.appendChild(document.createTextNode(s)):s&&o.appendChild(s);return o}function w(){y.innerHTML="",y.appendChild(e("div",{className:"survey-container"},e("div",{className:"survey-card"},e("img",{src:"/icon-square.png",alt:"Impact Tech",className:"survey-logo"}),e("h1",{className:"survey-title"},m.title),m.description?e("p",{className:"survey-desc"},m.description):document.createTextNode(""),e("p",{className:"survey-meta"},`${m.sections.length} sections \xB7 ${m.sections.reduce((t,n)=>t+n.questions.length,0)} questions`),e("button",{className:"survey-btn",onClick:k},"Commencer"))))}async function k(){try{let n=await(await fetch(`/api/surveys/${m.slug}/start`,{method:"POST"})).json();if(!n.ok)throw new Error(n.error);f=n.responseId,v=0,b()}catch(t){alert(t.message||"Erreur lors du d\xE9marrage.")}}function C(t){let n=t.length,i=Math.round((v+1)/n*100);return e("div",{className:"survey-progress"},e("div",{className:"survey-progress-bar"},e("div",{className:"survey-progress-fill",style:`width:${i}%`})),e("span",{className:"survey-progress-text"},`Section ${v+1} sur ${n}`))}function E(t){let n=e("div",{className:`survey-question${t.required?" required":""}`},e("label",{className:"survey-label"},t.label),t.description?e("p",{className:"survey-help"},t.description):document.createTextNode("")),i=u.get(t.id)||"";switch(t.type){case"short_text":{let o=e("input",{type:"text",className:"survey-input",value:i,placeholder:"Votre r\xE9ponse..."});o.addEventListener("input",()=>u.set(t.id,o.value)),n.appendChild(o);break}case"long_text":{let o=e("textarea",{className:"survey-textarea",rows:"4",placeholder:"Votre r\xE9ponse..."});o.value=i,o.addEventListener("input",()=>u.set(t.id,o.value)),n.appendChild(o);break}case"single_choice":case"yes_no":{let o=t.type==="yes_no"?["Oui","Non"]:t.config?.options||[],s=e("div",{className:"survey-options"});for(let r of o){let l=`q${t.id}-${r}`,c=e("input",{type:"radio",name:`q${t.id}`,id:l,value:r,...i===r?{checked:"checked"}:{}});c.addEventListener("change",()=>u.set(t.id,r)),s.appendChild(e("div",{className:"survey-option"},c,e("label",{for:l},r)))}n.appendChild(s);break}case"multi_choice":{let o=t.config?.options||[],s=t.config?.max_selections||0,r=i?JSON.parse(i):[],l=e("div",{className:"survey-options"}),c=()=>{l.querySelectorAll("input[type=checkbox]").forEach(d=>{d.disabled=!d.checked&&s>0&&r.length>=s})};for(let a of o){let d=`q${t.id}-${a}`,p=e("input",{type:"checkbox",id:d,value:a,...r.includes(a)?{checked:"checked"}:{}});p.addEventListener("change",()=>{p.checked?r.push(a):r=r.filter(g=>g!==a),u.set(t.id,JSON.stringify(r)),c()}),l.appendChild(e("div",{className:"survey-option"},p,e("label",{for:d},a)))}s>0&&l.appendChild(e("p",{className:"survey-help"},`${s} choix maximum`)),n.appendChild(l),setTimeout(c,0);break}case"scale":{let o=t.config?.min??1,s=t.config?.max??5,r=t.config?.min_label||"",l=t.config?.max_label||"",c=e("div",{className:"survey-scale"});r&&c.appendChild(e("span",{className:"survey-scale-label"},r));for(let a=o;a<=s;a++){let d=`q${t.id}-${a}`,p=e("input",{type:"radio",name:`q${t.id}`,id:d,value:String(a),...i===String(a)?{checked:"checked"}:{}});p.addEventListener("change",()=>u.set(t.id,String(a))),c.appendChild(e("div",{className:"survey-scale-item"},p,e("label",{for:d},String(a))))}l&&c.appendChild(e("span",{className:"survey-scale-label"},l)),n.appendChild(c);break}case"grid":{let o=t.config?.rows||[],s=t.config?.columns||[],r=i?JSON.parse(i):{},l=e("table",{className:"survey-grid"}),c=e("tr",{},e("th",{}));for(let a of s)c.appendChild(e("th",{},a));l.appendChild(c);for(let a of o){let d=e("tr",{},e("td",{className:"survey-grid-row-label"},a));for(let p of s){let g=e("input",{type:"radio",name:`q${t.id}-${a}`,value:p,...r[a]===p?{checked:"checked"}:{}});g.addEventListener("change",()=>{r[a]=p,u.set(t.id,JSON.stringify(r))}),d.appendChild(e("td",{className:"survey-grid-cell"},g))}l.appendChild(d)}n.appendChild(e("div",{className:"survey-grid-wrap"},l));break}}return n}function S(t){for(let n of t.questions){if(!n.required)continue;let i=u.get(n.id);if(!i||i.trim()===""||i==="[]"||i==="{}")return`La question \xAB ${n.label} \xBB est obligatoire.`}return null}async function T(t){let n=t.questions.filter(s=>u.has(s.id)).map(s=>({question_id:s.id,value:u.get(s.id)}));if(!n.length)return;let o=await(await fetch(`/api/surveys/${m.slug}/answer`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({responseId:f,answers:n})})).json();if(!o.ok)throw new Error(o.error)}function b(){let t=N();if(v>=t.length){L();return}let n=t[v];y.innerHTML="";let i=e("div",{className:"survey-container"},C(t),e("div",{className:"survey-card"},e("h2",{className:"survey-section-title"},n.title),n.description?e("p",{className:"survey-desc"},n.description):document.createTextNode(""))),o=i.querySelector(".survey-card");for(let r of n.questions)o.appendChild(E(r));let s=e("div",{className:"survey-nav"});v>0?s.appendChild(e("button",{className:"survey-btn secondary",onClick:()=>{v--,b()}},"\u2190 Pr\xE9c\xE9dent")):s.appendChild(e("span",{})),s.appendChild(e("button",{className:"survey-btn",onClick:async r=>{let l=S(n);if(l){alert(l);return}let c=r.target;c.disabled=!0,c.textContent="Envoi...";try{await T(n),v++,b()}catch(a){alert(a.message||"Erreur d'envoi."),c.disabled=!1,c.textContent="Suivant \u2192"}}},v<t.length-1?"Suivant \u2192":"Terminer \u2192")),o.appendChild(s),y.appendChild(i),window.scrollTo(0,0)}function L(){y.innerHTML="";let t=e("div",{className:"survey-card"},e("h2",{className:"survey-section-title"},"Vos coordonn\xE9es (facultatif)"),e("p",{className:"survey-desc"},"Laissez vos coordonn\xE9es si vous souhaitez \xEAtre recontact\xE9.")),n=[{key:"name",label:"Nom complet",type:"text"},{key:"email",label:"Email",type:"email"},{key:"phone",label:"T\xE9l\xE9phone",type:"tel"},{key:"company",label:"Entreprise",type:"text"}],i={};for(let s of n){let r=e("input",{type:s.type,className:"survey-input",placeholder:s.label});r.addEventListener("input",()=>{i[s.key]=r.value}),t.appendChild(e("div",{className:"survey-question"},e("label",{className:"survey-label"},s.label),r))}let o=e("div",{className:"survey-nav"});o.appendChild(e("button",{className:"survey-btn secondary",onClick:()=>{v--,b()}},"\u2190 Pr\xE9c\xE9dent")),o.appendChild(e("button",{className:"survey-btn",onClick:async s=>{let r=s.target;r.disabled=!0,r.textContent="Envoi...";try{let c=await(await fetch(`/api/surveys/${m.slug}/complete`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({responseId:f,...i})})).json();if(!c.ok)throw new Error(c.error);c.redirect?window.location.href=c.redirect:$()}catch(l){alert(l.message||"Erreur d'envoi."),r.disabled=!1,r.textContent="Envoyer"}}},"Envoyer")),t.appendChild(o),y.appendChild(e("div",{className:"survey-container"},t)),window.scrollTo(0,0)}function $(){y.innerHTML="",y.appendChild(e("div",{className:"survey-container"},e("div",{className:"survey-card survey-success"},e("div",{className:"survey-check"},"\u2713"),e("h2",{className:"survey-section-title"},"Merci pour vos r\xE9ponses !"),e("p",{className:"survey-desc"},"Nous avons bien re\xE7u votre questionnaire. Nous reviendrons vers vous tr\xE8s vite."),e("a",{href:"/",className:"survey-btn"},"Retour \xE0 l'accueil"))))}var h=document.createElement("style");h.textContent=`
  #survey-root { min-height: 100svh; background: #0e0e0c; color: #f7efd9; font-family: 'Inter', system-ui, sans-serif; }
  .survey-container { max-width: 680px; margin: 0 auto; padding: 24px 16px 60px; }
  .survey-card { background: rgba(247,239,217,.06); border: 1px solid rgba(247,239,217,.1); border-radius: 16px; padding: 32px 28px; margin-bottom: 20px; }
  .survey-logo { width: 48px; height: 48px; margin-bottom: 16px; border-radius: 10px; }
  .survey-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.8rem; font-weight: 700; margin: 0 0 12px; }
  .survey-section-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.35rem; font-weight: 600; margin: 0 0 8px; }
  .survey-desc { color: rgba(247,239,217,.65); margin: 0 0 20px; line-height: 1.6; }
  .survey-meta { color: rgba(247,239,217,.4); font-size: .85rem; margin: 0 0 24px; }
  .survey-help { color: rgba(247,239,217,.45); font-size: .82rem; margin: 4px 0 0; }

  .survey-progress { margin-bottom: 20px; }
  .survey-progress-bar { height: 4px; background: rgba(247,239,217,.1); border-radius: 4px; overflow: hidden; }
  .survey-progress-fill { height: 100%; background: #c0202b; border-radius: 4px; transition: width .3s; }
  .survey-progress-text { display: block; text-align: right; font-size: .78rem; color: rgba(247,239,217,.4); margin-top: 6px; }

  .survey-question { margin-bottom: 24px; }
  .survey-question.required .survey-label::after { content: ' *'; color: #c0202b; }
  .survey-label { display: block; font-weight: 500; margin-bottom: 8px; font-size: .95rem; }
  .survey-input, .survey-textarea {
    width: 100%; background: rgba(247,239,217,.06); border: 1px solid rgba(247,239,217,.15);
    border-radius: 10px; padding: 12px 14px; color: #f7efd9; font-size: .95rem; font-family: inherit;
    outline: none; transition: border-color .2s; box-sizing: border-box;
  }
  .survey-input:focus, .survey-textarea:focus { border-color: #c0202b; }
  .survey-textarea { resize: vertical; min-height: 100px; }

  .survey-options { display: flex; flex-direction: column; gap: 8px; }
  .survey-option { display: flex; align-items: center; gap: 10px; padding: 10px 14px;
    background: rgba(247,239,217,.04); border: 1px solid rgba(247,239,217,.1); border-radius: 10px;
    cursor: pointer; transition: border-color .2s; }
  .survey-option:hover { border-color: rgba(247,239,217,.25); }
  .survey-option:has(input:checked) { border-color: #c0202b; background: rgba(192,32,43,.08); }
  .survey-option input { accent-color: #c0202b; }
  .survey-option label { cursor: pointer; flex: 1; font-size: .92rem; }

  .survey-scale { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .survey-scale-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .survey-scale-item input { accent-color: #c0202b; }
  .survey-scale-item label { font-size: .82rem; color: rgba(247,239,217,.5); cursor: pointer; }
  .survey-scale-label { font-size: .78rem; color: rgba(247,239,217,.4); padding: 0 4px; }

  .survey-grid-wrap { overflow-x: auto; }
  .survey-grid { width: 100%; border-collapse: collapse; font-size: .88rem; }
  .survey-grid th, .survey-grid td { padding: 8px 10px; text-align: center; border-bottom: 1px solid rgba(247,239,217,.08); }
  .survey-grid th { color: rgba(247,239,217,.5); font-weight: 500; font-size: .8rem; }
  .survey-grid-row-label { text-align: left !important; font-weight: 500; }
  .survey-grid-cell input { accent-color: #c0202b; }

  .survey-nav { display: flex; justify-content: space-between; align-items: center; margin-top: 32px; gap: 12px; }
  .survey-btn {
    display: inline-block; background: #c0202b; color: #fff; border: none; padding: 14px 32px;
    border-radius: 100px; font-weight: 600; font-size: .95rem; cursor: pointer; text-decoration: none;
    font-family: inherit; transition: opacity .2s;
  }
  .survey-btn:hover { opacity: .88; }
  .survey-btn:disabled { opacity: .5; cursor: not-allowed; }
  .survey-btn.secondary { background: transparent; border: 1px solid rgba(247,239,217,.2); color: #f7efd9; }
  .survey-btn.secondary:hover { border-color: rgba(247,239,217,.4); }

  .survey-success { text-align: center; padding: 48px 28px; }
  .survey-check { width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background: rgba(62,207,110,.12);
    color: #3ecf6e; font-size: 1.6rem; margin: 0 auto 20px; }

  @media (max-width: 600px) {
    .survey-card { padding: 24px 18px; }
    .survey-title { font-size: 1.4rem; }
    .survey-nav { flex-direction: column-reverse; }
    .survey-nav .survey-btn { width: 100%; text-align: center; }
  }
`;document.head.appendChild(h);w();
