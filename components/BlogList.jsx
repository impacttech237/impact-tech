"use client";

/* ------------------------------------------------------------------
   BLOG LISTING — page /blog
   Article "à la une" + grille d'articles + newsletter inline.
------------------------------------------------------------------- */
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ArrowIcon from "./ArrowIcon";

gsap.registerPlugin(ScrollTrigger);

import { DEFAULTS } from "@/lib/defaults";

function toCard(p) {
  return { img: p.image, cat: p.category, date: p.date, read: p.readTime, title: p.title, excerpt: p.excerpt };
}

export default function BlogList({ posts }) {
  const rootRef = useRef(null);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  /* Articles gérés depuis le dashboard admin (table posts) */
  const all = posts?.length ? posts : DEFAULTS.posts;
  const featuredPost = all.find((p) => p.featured) ?? all[0];
  const FEATURED = toCard(featuredPost);
  const POSTS = all.filter((p) => p !== featuredPost).map(toCard);

  const onNewsletterSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.querySelector("input[type=email]")?.value;
    setSending(true);
    try {
      await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {}
    setSending(false);
    setSent(true);
  };

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;
      gsap.from(".blog-featured", {
        y: 50,
        opacity: 0,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 85%" },
      });
      gsap.from(".bl-card", {
        y: 60,
        opacity: 0,
        duration: 0.9,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: { trigger: ".bl-grid", start: "top 85%" },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="bloglist section-pad">
      <div className="container-it">
        {/* --- Article à la une --- */}
        <article className="blog-featured">
          <a href="/contact" className="blog-featured__inner">
            <div className="blog-featured__media">
              <img src={FEATURED.img} alt="" loading="lazy" draggable="false" />
              <span className="blog-card__cat">À la une</span>
            </div>
            <div className="blog-featured__body">
              <p className="blog-card__meta">
                {FEATURED.cat} · {FEATURED.date} · {FEATURED.read} de lecture
              </p>
              <h2>{FEATURED.title}</h2>
              <p className="blog-featured__excerpt">{FEATURED.excerpt}</p>
              <span className="blog-card__link">
                Lire l'article <ArrowIcon />
              </span>
            </div>
          </a>
        </article>

        {/* --- Grille --- */}
        <div className="bl-grid">
          {POSTS.map((p) => (
            <article key={p.title} className="bl-card">
              <a href="/contact" className="blog-card__inner">
                <div className="blog-card__media">
                  <img src={p.img} alt="" loading="lazy" draggable="false" />
                  <span className="blog-card__cat">{p.cat}</span>
                </div>
                <div className="blog-card__body">
                  <p className="blog-card__meta">
                    {p.date} · {p.read} de lecture
                  </p>
                  <h3>{p.title}</h3>
                  <p className="blog-card__excerpt">{p.excerpt}</p>
                  <span className="blog-card__link">
                    Lire l'article <ArrowIcon />
                  </span>
                </div>
              </a>
            </article>
          ))}
        </div>

        {/* --- Newsletter inline --- */}
        <div className="bl-newsletter">
          <div>
            <h2>
              Ne ratez pas le prochain <span className="accent">article</span>
            </h2>
            <p>Un email par mois, des conseils actionnables. C'est tout.</p>
          </div>
          {sent ? (
            <p className="newsletter__done">✓ Merci, à très vite !</p>
          ) : (
            <form className="bl-newsletter__form" onSubmit={onNewsletterSubmit}>
              <label htmlFor="bl-email" className="sr-only">
                Votre adresse e-mail
              </label>
              <input id="bl-email" type="email" required placeholder="Votre adresse e-mail" autoComplete="email" />
              <button type="submit" disabled={sending}>
                {sending ? "..." : "S'abonner"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
