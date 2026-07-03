import PillButton from "./PillButton";
import ArrowIcon from "./ArrowIcon";
import { DEFAULTS } from "../lib/defaults";

function toCard(p) {
  return { img: p.image, cat: p.category, date: p.date, read: p.readTime, title: p.title, excerpt: p.excerpt };
}

export default function Blog({ posts }) {
  const POSTS = (posts?.length ? posts : DEFAULTS.posts).slice(0, 3).map(toCard);
  const titleWords = ["Stories", "&", "ressources", "du", "terrain"];

  return (
    <section id="blog" className="blog section-pad" data-anim="blog">
      <div className="container-it">
        <div className="blog-head">
          <span className="section-badge">
            <span className="dot" /> Blog <span className="dot" />
          </span>
          <h2 aria-label="Stories & ressources du terrain">
            {titleWords.map((w, i) => (
              <span key={i} aria-hidden="true" className={`blog-title-word ${w === "ressources" ? "accent" : ""}`}>
                {w}{" "}
              </span>
            ))}
          </h2>
          <p className="blog-sub">
            Conseils pratiques, guides et histoires d'entrepreneurs qui réussissent leur passage au digital.
          </p>
        </div>

        <div className="blog-grid">
          {POSTS.map((p) => (
            <article key={p.title} className="blog-card">
              <a href="/blog" className="blog-card__inner">
                <div className="blog-card__media">
                  <img src={p.img} alt="" loading="lazy" draggable="false" />
                  <span className="blog-card__cat">{p.cat}</span>
                </div>
                <div className="blog-card__body">
                  <p className="blog-card__meta">{p.date} · {p.read} de lecture</p>
                  <h3>{p.title}</h3>
                  <p className="blog-card__excerpt">{p.excerpt}</p>
                  <span className="blog-card__link">Lire l'article<ArrowIcon /></span>
                </div>
              </a>
            </article>
          ))}
        </div>

        <div className="blog-cta">
          <PillButton href="/blog" variant="outline">Tous les articles</PillButton>
        </div>
      </div>
    </section>
  );
}
