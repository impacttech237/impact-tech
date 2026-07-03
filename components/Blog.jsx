"use client";

/* ------------------------------------------------------------------
   12. BLOG / RESSOURCES — titre révélé au scroll + 3 articles
------------------------------------------------------------------- */
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PillButton from "./PillButton";
import ArrowIcon from "./ArrowIcon";

gsap.registerPlugin(ScrollTrigger);

import { DEFAULTS } from "@/lib/defaults";

/* Mappe un article (BD ou défaut) vers la forme carte */
function toCard(p) {
  return { img: p.image, cat: p.category, date: p.date, read: p.readTime, title: p.title, excerpt: p.excerpt };
}

export default function Blog({ posts }) {
  const rootRef = useRef(null);
  /* 3 derniers articles — gérés depuis le dashboard admin (table posts) */
  const POSTS = (posts?.length ? posts : DEFAULTS.posts).slice(0, 3).map(toCard);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set(".blog-title-word", { opacity: 1 });
        return;
      }

      /* Titre révélé mot par mot au scroll (scrub) */
      gsap.fromTo(
        ".blog-title-word",
        { opacity: 0.16 },
        {
          opacity: 1,
          stagger: 0.08,
          ease: "none",
          scrollTrigger: {
            trigger: ".blog-head",
            start: "top 80%",
            end: "top 45%",
            scrub: true,
          },
        }
      );

      /* Cartes articles */
      gsap.from(".blog-card", {
        y: 60,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: { trigger: ".blog-grid", start: "top 85%" },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const titleWords = ["Stories", "&", "ressources", "du", "terrain"];

  return (
    <section id="blog" ref={rootRef} className="blog section-pad">
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
            Conseils pratiques, guides et histoires d'entrepreneurs qui
            réussissent leur passage au digital.
          </p>
        </div>

        <div className="blog-grid">
          {POSTS.map((p) => (
            <article key={p.title} className="blog-card">
              <a href="#" className="blog-card__inner">
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
                    Lire l'article
                    <ArrowIcon />
                  </span>
                </div>
              </a>
            </article>
          ))}
        </div>

        <div className="blog-cta">
          <PillButton href="/blog" variant="outline">
            Tous les articles
          </PillButton>
        </div>
      </div>
    </section>
  );
}
