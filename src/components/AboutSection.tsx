import PillButton from "./PillButton";

const ICONS = [
  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M14.8 9.2a3.2 3.2 0 1 0 0 5.6M8 10.5h4M8 13.5h4" /></svg>),
  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" /></svg>),
  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 2 2.6 5.5 6 .6-4.5 4 1.3 5.9L12 15l-5.4 3 1.3-5.9-4.5-4 6-.6L12 2Z" /></svg>),
];

/* Les 3 piliers de différenciation (refonte, Copywriting Complet §5) —
   remplacent les 4 "valeurs" génériques par ce qui distingue réellement
   Impact Tech : la garantie, le fondateur, la double culture. */
const VALUES_FR = [
  { title: "Paiement à la livraison", desc: "On ne vous demande pas un centime avant que votre projet soit terminé et validé. C'est notre façon de vous prouver qu'on croit en ce qu'on fait." },
  { title: "Un fondateur, pas un commercial", desc: "Roberto supervise personnellement chaque projet. Pas de sous-traitance cachée, pas de junior anonyme. Vous parlez au décideur." },
  { title: "Double culture, double exigence", desc: "Clients camerounais et européens. On connaît les réalités locales (Mobile Money, coupures réseau, marché CEMAC) ET les standards internationaux." },
];
const VALUES_EN = [
  { title: "Pay on delivery", desc: "We don't ask for a cent before your project is finished and validated. It's how we prove we believe in what we do." },
  { title: "A founder, not a salesperson", desc: "Roberto personally oversees every project. No hidden subcontracting, no anonymous junior. You talk to the decision-maker." },
  { title: "Dual culture, dual standards", desc: "Cameroonian and European clients. We know local realities (Mobile Money, network issues, CEMAC market) AND international standards." },
];

export default function AboutSection({ locale = "fr" }) {
  const en = locale === "en";
  const VALUES = (en ? VALUES_EN : VALUES_FR).map((v, i) => ({ ...v, icon: ICONS[i] }));
  return (
    <section className="about section-pad" data-anim="about">
      <div className="about-orbit" aria-hidden="true">
        <span /><span /><span />
      </div>
      <div className="container-it">
        <header className="about-intro">
          <span>02 — {en ? "OUR MISSION" : "NOTRE MISSION"}</span>
          {en ? (
            <h2>Making digital accessible and reliable for <em>African businesses.</em></h2>
          ) : (
            <h2>Rendre le digital accessible et fiable pour les entreprises <em>africaines.</em></h2>
          )}
          <p>
            {en
              ? "And proving to the world that international-quality work can be delivered from the continent. Every project delivered is one more proof."
              : "Et prouver au monde qu'on peut livrer une qualité internationale depuis le continent. Chaque projet livré est une preuve de plus."}
          </p>
        </header>

        <div className="about-story">
          <div className="about-story__media">
            {/* ⚠️ Placeholder — remplacer par une vraie photo de Roberto MOPOUONG
                WAFO depuis /admin (Réglages) dès qu'elle est disponible. */}
            <img src="/images/about-team.jpg" alt="Roberto MOPOUONG WAFO, fondateur d'Impact Tech, à Douala" loading="lazy" />
            <svg className="about-story__symbol" viewBox="0 0 160 120" aria-hidden="true">
              <path className="about-symbol__shape" d="M20 22H76c8 0 13 9 8 16L59 77c-5 8-15 8-20 0L14 38c-5-7-1-16 6-16Z" />
              <path className="about-symbol__target" d="M80 8 103 44 148 54 116 84 120 116 80 98 40 116 44 84 12 54 57 44Z" />
              <path className="about-symbol__route" d="M10 96C42 62 53 39 83 52s39 42 69 15" />
            </svg>
            <div className="about-story__badge">
              <strong>{en ? "From Douala" : "Depuis Douala"}</strong>
              <span>{en ? "for Cameroon & Northern Europe" : "pour le Cameroun & l'Europe du Nord"}</span>
            </div>
            <div className="about-story__meter" aria-hidden="true"><i /><span>01 / 03</span></div>
          </div>

          <div className="about-story__content">
            <span className="section-badge">
              <span className="dot" /> {en ? "Behind every project, there's Roberto" : "Derrière chaque projet, il y a Roberto"} <span className="dot" />
            </span>
            <h2>{en ? <>Born from a simple <span className="accent">observation</span></> : <>Née d'un constat <span className="accent">simple</span></>}</h2>
            {en ? (
              <>
                <p data-about-step="1">
                  I started Impact Tech in Douala because I was tired of seeing Cameroonian business owners get
                  burned by "web agencies" that take the deposit and vanish. SMEs paying upfront for a broken
                  website. Project owners waiting 6 months for a deliverable that never comes.
                </p>
                <p data-about-step="2">
                  I decided to do the opposite: we build first, you pay after. If you're not satisfied, you don't
                  pay. Period. This model forced us to be excellent — because when your revenue depends on client
                  satisfaction, not on the deposit, you can't afford to be mediocre.
                </p>
                <p data-about-step="3">
                  Today, Impact Tech delivers websites and applications for businesses in Cameroon and Northern
                  Europe. Same standards. Same rigor. The price reflects value, not geography.
                </p>
                <p className="about-story__signature">— Roberto MOPOUONG WAFO, Founder &amp; Lead Developer</p>
                <div className="about-story__cta">
                  <PillButton href="/en/contact" variant="dark">Let's work together</PillButton>
                </div>
              </>
            ) : (
              <>
                <p data-about-step="1">
                  J'ai créé Impact Tech à Douala parce que j'en avais marre de voir des entrepreneurs camerounais se
                  faire arnaquer par des « agences web » qui encaissent l'avance et disparaissent. Des PME qui paient
                  300 000 FCFA pour un site cassé. Des porteurs de projet qui attendent 6 mois un livrable qui n'arrive
                  jamais.
                </p>
                <p data-about-step="2">
                  J'ai décidé de faire l'inverse : on construit d'abord, vous payez après. Si vous n'êtes pas satisfait,
                  vous ne payez pas. Point. Ce modèle nous a forcés à être excellents — quand votre chiffre d'affaires
                  dépend de la satisfaction du client, pas de l'avance, vous n'avez pas le droit d'être médiocre.
                </p>
                <p data-about-step="3">
                  Aujourd'hui, Impact Tech livre des sites et applications pour des entreprises au Cameroun et en Europe
                  du Nord. Mêmes standards. Même exigence. Le prix reflète la valeur, pas la géographie.
                </p>
                <p className="about-story__signature">— Roberto MOPOUONG WAFO, Fondateur &amp; Développeur principal</p>
                <div className="about-story__cta">
                  <PillButton href="/contact" variant="dark">Travaillons ensemble</PillButton>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="about-values">
          <div className="about-values__head">
            <span className="section-badge">
              <span className="dot" /> {en ? "Our values" : "Nos valeurs"} <span className="dot" />
            </span>
            <h2>{en ? <>What guides <span className="accent">us</span></> : <>Ce qui nous <span className="accent">guide</span></>}</h2>
          </div>
          <div className="about-values__stage">
            <div className="about-values__track">
              {VALUES.map((v, index) => (
                <div key={v.title} className="value-card" data-value-index={index + 1}>
                  <span className="value-card__index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="value-card__icon">{v.icon}</span>
                  <h3>{v.title}</h3>
                  <p>{v.desc}</p>
                  <span className="value-card__line" aria-hidden="true" />
                </div>
              ))}
            </div>
            <div className="about-values__progress" aria-hidden="true"><span /></div>
          </div>
        </div>
      </div>
    </section>
  );
}
