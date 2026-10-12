/* ------------------------------------------------------------------
   Guide du portail :
   - Tour : visite guidée au premier accès (et relançable depuis l'Aide),
     une diapositive par page avec son but et ce qu'on y fait ;
   - PageHelp : encart « Comment ça marche ? » en haut de chaque page,
     ouvert à la première visite de la page, replié ensuite ;
   - GuideLibrary : le guide de chaque page + la foire aux questions.
   Contenu : ../guide.ts
------------------------------------------------------------------- */
import { useEffect, useRef, useState } from "preact/hooks";
import { api } from "../api";
import { guide, TOUR_PAGES } from "../guide";
import { store, usePortal } from "../state";
import { Button, Icon } from "../ui";

export function Tour({ onDone }: { onDone: () => void }) {
  const { dash, go } = usePortal();
  const g = guide();
  const pages = TOUR_PAGES(!!dash?.project?.delivered_at).map((k) => ({ key: k, ...g.pages[k] }));
  const slides = [
    ...g.intro.map((s) => ({ key: "", icon: s.icon, title: s.title, text: s.text, bullets: s.bullets, where: "" })),
    ...pages.map((p) => ({ key: p.key, icon: p.icon, title: p.title, text: p.purpose, bullets: p.steps.slice(0, 3), where: p.where || "" })),
    { key: "home", icon: g.outro.icon, title: g.outro.title, text: g.outro.text, bullets: g.outro.bullets, where: "" },
  ];
  const [i, setI] = useState(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const s = slides[i];
  const last = i === slides.length - 1;

  useEffect(() => {
    document.body.classList.add("pt-noscroll");
    return () => document.body.classList.remove("pt-noscroll");
  }, []);
  useEffect(() => titleRef.current?.focus(), [i]);

  const finish = () => {
    api("/me/onboarded", { body: {} }).catch(() => {});
    // Les encarts d'aide ont été vus pendant la visite : on les replie.
    TOUR_PAGES(!!dash?.project?.delivered_at).forEach((k) => store.set(`guide-${k}`, "seen"));
    window.dispatchEvent(new Event("pt-guide-seen"));
    go("home");
    onDone();
  };

  return (
    <div
      class="pt-onb"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pt-tour-title"
      onKeyDown={(e: any) => {
        if (e.key === "Escape") finish();
        if (e.key === "ArrowRight" && !last) setI(i + 1);
        if (e.key === "ArrowLeft" && i > 0) setI(i - 1);
      }}
    >
      <div class="pt-onb__card pt-tour" key={i}>
        <div class="pt-tour__top">
          <span class="pt-tour__count">{g.tourStep(i + 1, slides.length)}</span>
          {!last && (
            <button type="button" class="pt-link" onClick={finish}>
              {g.tourSkip}
            </button>
          )}
        </div>
        <div class="pt-onb__icon">
          <Icon name={s.icon} size={34} />
        </div>
        <h2 id="pt-tour-title" ref={titleRef} tabIndex={-1}>
          {s.title}
        </h2>
        <p>{s.text}</p>
        {s.bullets.length > 0 && (
          <ul class="pt-tour__list">
            {s.bullets.map((b, k) => (
              <li key={k}>
                <Icon name="check" size={16} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
        {s.where && <p class="pt-tour__where">{s.where}</p>}
        <div class="pt-onb__dots" aria-hidden="true">
          {slides.map((_, k) => (
            <span key={k} class={k === i ? "is-on" : ""} />
          ))}
        </div>
        <div class="pt-tour__nav">
          {i > 0 && (
            <Button variant="secondary" size="lg" onClick={() => setI(i - 1)}>
              {g.tourPrev}
            </Button>
          )}
          <Button size="lg" block onClick={() => (last ? finish() : setI(i + 1))}>
            {last ? g.tourStart : g.tourNext}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* Encart « Comment ça marche ? » : ouvert la première fois, puis replié. */
export function PageHelp({ page }: { page: string }) {
  const g = guide();
  const info = g.pages[page];
  const [open, setOpen] = useState(() => store.get(`guide-${page}`) !== "seen");
  useEffect(() => {
    const sync = () => setOpen(store.get(`guide-${page}`) !== "seen");
    sync();
    window.addEventListener("pt-guide-seen", sync);
    return () => window.removeEventListener("pt-guide-seen", sync);
  }, [page]);
  if (!info) return null;
  const close = () => {
    store.set(`guide-${page}`, "seen");
    setOpen(false);
  };

  if (!open)
    return (
      <div class="pt-guide-toggle">
        <button type="button" class="pt-guide-btn" onClick={() => setOpen(true)} aria-expanded="false">
          <Icon name="help" size={16} />
          <span>{g.howItWorks}</span>
        </button>
      </div>
    );

  return (
    <section class="pt-guide" aria-label={g.howItWorks}>
      <div class="pt-guide__head">
        <span class="pt-guide__icon">
          <Icon name="help" size={18} />
        </span>
        <div>
          <p class="pt-guide__eyebrow">
            {g.howItWorks} · {info.title}
          </p>
          <p class="pt-guide__purpose">{info.purpose}</p>
        </div>
      </div>
      <p class="pt-guide__label">{g.youDo}</p>
      <ol class="pt-guide__steps">
        {info.steps.map((s, k) => (
          <li key={k}>{s}</li>
        ))}
      </ol>
      <p class="pt-guide__label">{g.then}</p>
      <p class="pt-guide__next">{info.next}</p>
      <div class="pt-guide__foot">
        <Button size="sm" variant="secondary" icon="check" onClick={close}>
          {g.gotIt}
        </Button>
      </div>
    </section>
  );
}

/* Page Aide : relancer la visite, guide de chaque page, questions fréquentes. */
export function GuideLibrary() {
  const { dash, startTour } = usePortal();
  const g = guide();
  const pages = TOUR_PAGES(!!dash?.project?.delivered_at);
  return (
    <>
      <section class="pt-card pt-guide-replay">
        <div>
          <h2 class="pt-h3">{g.tourReplay}</h2>
          <p class="pt-muted pt-small">{g.tourReplaySub}</p>
        </div>
        <Button icon="play" onClick={startTour}>
          {g.tourReplay}
        </Button>
      </section>

      <section>
        <h2 class="pt-h2">{g.pagesTitle}</h2>
        <p class="pt-muted pt-small">{g.pagesSub}</p>
        <div class="pt-acc">
          {pages.map((k) => {
            const p = g.pages[k];
            return (
              <details key={k} class="pt-acc__item">
                <summary>
                  <Icon name={p.icon} size={18} />
                  <span>{p.title}</span>
                </summary>
                <div class="pt-acc__body">
                  <p>{p.purpose}</p>
                  <p class="pt-guide__label">{g.youDo}</p>
                  <ol class="pt-guide__steps">
                    {p.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                  <p class="pt-guide__label">{g.then}</p>
                  <p class="pt-guide__next">{p.next}</p>
                  {p.where && <p class="pt-tour__where">{p.where}</p>}
                </div>
              </details>
            );
          })}
        </div>
      </section>

      <section>
        <h2 class="pt-h2">{g.faqTitle}</h2>
        <div class="pt-acc">
          {g.faq.map((f, k) => (
            <details key={k} class="pt-acc__item">
              <summary>
                <span>{f.q}</span>
              </summary>
              <div class="pt-acc__body">
                <p>{f.a}</p>
              </div>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
