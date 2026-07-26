import Layout from "../layout";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ArrowIcon from "../components/ArrowIcon";
import PillButton from "../components/PillButton";
import { breadcrumbJsonLd, SITE_URL } from "../lib/seo";

export default function ArticlePage({ article, related, settings }) {
  const canonical = `/blog/${article.slug}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt,
    image: `${SITE_URL}${article.image}`,
    datePublished: article.date,
    dateModified: article.date,
    inLanguage: "fr",
    mainEntityOfPage: `${SITE_URL}${canonical}`,
    author: { "@type": "Organization", name: "IMPACT TECH", url: SITE_URL },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };

  return (
    <Layout
      title={`${article.title} — Blog IMPACT TECH`}
      description={article.excerpt}
      canonical={canonical}
      ogImage={article.image}
      jsonLd={[
        articleJsonLd,
        breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: article.title, path: canonical },
        ]),
      ]}
    >
      <Header />
      <main className="article-page" data-article-page>
        <section className="article-hero">
          <div className="article-hero__grid" aria-hidden="true" />
          <svg className="article-hero__route" viewBox="0 0 1440 760" fill="none" aria-hidden="true">
            <path d="M-30 636C250 401 396 555 618 304 828 67 1104 395 1482 126" />
            <circle className="article-hero__runner" r="9" />
          </svg>

          <div className="container-it article-hero__inner">
            <nav className="article-hero__crumb article-hero__fade" aria-label="Fil d’Ariane">
              <a href="/">Accueil</a><span>·</span><a href="/blog">Blog</a><span>·</span><span>{article.category}</span>
            </nav>

            <div className="article-hero__meta article-hero__fade">
              <span>{article.category}</span>
              <span>{article.date}</span>
              <span>{article.readTime} de lecture</span>
            </div>

            <h1>{article.title.replace(/ :/g, ":")}</h1>

            <div className="article-hero__footer article-hero__fade">
              <p>{article.lead}</p>
              <div className="article-hero__author">
                <span className="article-hero__avatar"><img src="/images/icone-transparent.png" alt="" /></span>
                <span><strong>{article.author}</strong><small>Studio digital · Douala</small></span>
              </div>
            </div>
          </div>

          <figure className="article-hero__media">
            <img src={article.image} alt="" draggable="false" />
            <figcaption>{article.eyebrow}</figcaption>
          </figure>

          <div className="article-hero__scroll" aria-hidden="true"><span>COMMENCER LA LECTURE</span><i /></div>
        </section>

        <section className="article-reading" data-article-reading>
          <div className="article-progress" aria-hidden="true"><span /></div>
          <div className="container-it article-reading__layout">
            <aside className="article-aside">
              <a href="/blog" className="article-aside__back">← Tous les articles</a>

              <div className="article-aside__progress" aria-hidden="true">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" />
                  <circle className="article-aside__progress-value" cx="50" cy="50" r="44" />
                </svg>
                <strong>0%</strong>
              </div>

              <nav className="article-toc" aria-label="Sommaire de l’article">
                <span>DANS CET ARTICLE</span>
                {article.sections.map((section, index) => (
                  <a key={section.title} href={`#chapter-${index + 1}`} data-article-toc={index + 1}>
                    <small>{String(index + 1).padStart(2, "0")}</small>{section.title}
                  </a>
                ))}
              </nav>

              <div className="article-reading__tools">
                <span>CONFORT DE LECTURE</span>
                <button type="button" data-font-size="down" aria-label="Réduire la taille du texte">A−</button>
                <button type="button" data-font-size="up" aria-label="Augmenter la taille du texte">A+</button>
                <button type="button" data-share-article>Partager</button>
              </div>
            </aside>

            <article className="article-content">
              <p className="article-content__lead">{article.lead}</p>

              {article.sections.map((section, index) => (
                <section key={section.title} id={`chapter-${index + 1}`} className="article-chapter" data-article-chapter={index + 1}>
                  <div className="article-chapter__head">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <h2>{section.title}</h2>
                  </div>

                  {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}

                  {section.bullets?.length ? (
                    <ul>
                      {section.bullets.map((bullet) => <li key={bullet}><span>↗</span>{bullet}</li>)}
                    </ul>
                  ) : null}

                  {section.quote ? (
                    <blockquote>
                      <span>“</span>
                      <p>{section.quote}</p>
                    </blockquote>
                  ) : null}

                  {index === 1 ? (
                    <figure className="article-content__image">
                      <img src={article.secondaryImage} alt="" loading="lazy" draggable="false" />
                      <figcaption>Une solution utile commence toujours par le contexte réel de ses utilisateurs.</figcaption>
                    </figure>
                  ) : null}

                  {section.callout ? (
                    <div className="article-callout">
                      <span>À RETENIR</span>
                      <p>{section.callout}</p>
                    </div>
                  ) : null}
                </section>
              ))}

              <footer className="article-content__footer">
                <span>UNE IDÉE À TRANSFORMER ?</span>
                <h2>Parlons de votre prochain <em>impact.</em></h2>
                <PillButton href="/contact" variant="dark">Démarrer un projet</PillButton>
              </footer>
            </article>
          </div>
        </section>

        <section className="article-related">
          <div className="container-it">
            <header className="article-related__head">
              <span>CONTINUER À EXPLORER</span>
              <h2>À lire <em>ensuite</em></h2>
            </header>

            <div className="article-related__grid">
              {related.map((item, index) => (
                <article key={item.slug} className="article-related__card">
                  <a href={`/blog/${item.slug}`}>
                    <div className="article-related__media">
                      <img src={item.image} alt="" loading="lazy" draggable="false" />
                      <span>{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <div className="article-related__body">
                      <small>{item.category} · {item.readTime}</small>
                      <h3>{item.title}</h3>
                      <span className="article-related__link">Lire l’article <ArrowIcon /></span>
                    </div>
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer settings={settings} />
    </Layout>
  );
}
