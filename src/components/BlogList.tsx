import ArrowIcon from "./ArrowIcon";
import { DEFAULTS } from "../lib/defaults";
import { articleSlug } from "../lib/articles";

function toCard(p) {
  return { img: p.image, cat: p.category, date: p.date, read: p.readTime, title: p.title, excerpt: p.excerpt, slug: articleSlug(p.title) };
}

export default function BlogList({ posts }) {
  const all = posts?.length ? posts : DEFAULTS.posts;
  const featuredPost = all.find((p) => p.featured) ?? all[0];
  const FEATURED = toCard(featuredPost);
  const POSTS = all.filter((p) => p !== featuredPost).map(toCard);

  return (
    <section className="bloglist section-pad" data-anim="bloglist">
      <div className="bl-backdrop" aria-hidden="true"><span /><span /><span /></div>
      <div className="container-it">
        <header className="bl-intro">
          <span>02 — JOURNAL D’IMPACT</span>
          <h2>Des idées à lire. Des déclics à <em>appliquer.</em></h2>
          <div className="bl-intro__rail">
            <span>STRATÉGIE</span><span>DESIGN</span><span>BUSINESS</span><span>TECH</span><span>CAMEROUN</span>
          </div>
        </header>

        <article className="blog-featured">
          <a href={`/blog/${FEATURED.slug}`} className="blog-featured__inner">
            <div className="blog-featured__media">
              <img src={FEATURED.img} alt="" loading="lazy" draggable="false" />
              <span className="blog-card__cat">À la une</span>
              <span className="blog-featured__index">01</span>
            </div>
            <div className="blog-featured__body">
              <span className="blog-featured__eyebrow">ARTICLE MANIFESTE</span>
              <p className="blog-card__meta">{FEATURED.cat} · {FEATURED.date} · {FEATURED.read} de lecture</p>
              <h2>{FEATURED.title}</h2>
              <p className="blog-featured__excerpt">{FEATURED.excerpt}</p>
              <span className="blog-card__link">Lire l'article <ArrowIcon /></span>
            </div>
          </a>
        </article>

        <div className="bl-grid">
          {POSTS.map((p, index) => (
            <article key={p.title} className="bl-card" data-bl-title={p.title}>
              <a href={`/blog/${p.slug}`} className="blog-card__inner">
                <div className="blog-card__media">
                  <img src={p.img} alt="" loading="lazy" draggable="false" />
                  <span className="blog-card__cat">{p.cat}</span>
                  <span className="bl-card__index">{String(index + 2).padStart(2, "0")}</span>
                </div>
                <div className="blog-card__body">
                  <p className="blog-card__meta">{p.date} · {p.read} de lecture</p>
                  <h3>{p.title}</h3>
                  <p className="blog-card__excerpt">{p.excerpt}</p>
                  <span className="blog-card__link">Lire l'article <ArrowIcon /></span>
                </div>
              </a>
            </article>
          ))}
        </div>

        <div className="bl-newsletter">
          <span className="bl-newsletter__pulse" aria-hidden="true" />
          <div>
            <h2>Ne ratez pas le prochain <span className="accent">article</span></h2>
            <p>Un email par mois, des conseils actionnables. C'est tout.</p>
          </div>
          <form className="bl-newsletter__form" data-ajax-form="newsletter" action="/api/newsletter" method="post">
            <label htmlFor="bl-email" className="sr-only">Votre adresse e-mail</label>
            <input id="bl-email" name="email" type="email" required placeholder="Votre adresse e-mail" autoComplete="email" />
            <button type="submit" data-form-submit>S'abonner</button>
          </form>
          <p className="newsletter__done" data-form-done style={{ display: "none" }}>✓ Merci, à très vite !</p>
        </div>
      </div>
      <div className="bl-reader" aria-hidden="true"><span>LIRE</span><strong>ARTICLE</strong></div>
      <div className="bl-scroll-count" aria-hidden="true"><strong>01</strong><span>/ {String(all.length).padStart(2, "0")}</span></div>
    </section>
  );
}
