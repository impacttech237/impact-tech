import ArrowIcon from "./ArrowIcon";
import { DEFAULTS } from "../lib/defaults";

function toCard(p) {
  return { img: p.image, cat: p.category, date: p.date, read: p.readTime, title: p.title, excerpt: p.excerpt };
}

export default function BlogList({ posts }) {
  const all = posts?.length ? posts : DEFAULTS.posts;
  const featuredPost = all.find((p) => p.featured) ?? all[0];
  const FEATURED = toCard(featuredPost);
  const POSTS = all.filter((p) => p !== featuredPost).map(toCard);

  return (
    <section className="bloglist section-pad" data-anim="bloglist">
      <div className="container-it">
        <article className="blog-featured">
          <a href="/contact" className="blog-featured__inner">
            <div className="blog-featured__media">
              <img src={FEATURED.img} alt="" loading="lazy" draggable="false" />
              <span className="blog-card__cat">À la une</span>
            </div>
            <div className="blog-featured__body">
              <p className="blog-card__meta">{FEATURED.cat} · {FEATURED.date} · {FEATURED.read} de lecture</p>
              <h2>{FEATURED.title}</h2>
              <p className="blog-featured__excerpt">{FEATURED.excerpt}</p>
              <span className="blog-card__link">Lire l'article <ArrowIcon /></span>
            </div>
          </a>
        </article>

        <div className="bl-grid">
          {POSTS.map((p) => (
            <article key={p.title} className="bl-card">
              <a href="/contact" className="blog-card__inner">
                <div className="blog-card__media">
                  <img src={p.img} alt="" loading="lazy" draggable="false" />
                  <span className="blog-card__cat">{p.cat}</span>
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
    </section>
  );
}
