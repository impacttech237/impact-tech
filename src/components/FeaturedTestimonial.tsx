import { DEFAULTS } from "../lib/defaults";

/* Témoignage inline pleine largeur — refonte, page Réalisations
   (Copywriting Complet §6 : "après chaque bloc de projets, insérer un
   témoignage client en pleine largeur"). Reprend un vrai témoignage D1
   (jamais un texte fabriqué), affiché une fois entre la grille et le CTA. */
export default function FeaturedTestimonial({ items, locale = "fr" }) {
  const en = locale === "en";
  const TESTIMONIALS = items?.length ? items : DEFAULTS.testimonials;
  if (!TESTIMONIALS.length) return null;
  const t = TESTIMONIALS[Math.min(1, TESTIMONIALS.length - 1)];

  return (
    <section className="featured-testimonial section-pad" data-anim="featured-testimonial">
      <div className="container-it">
        <blockquote className="ft-card">
          <div className="ft-stars" aria-label="5/5">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10 1.5 12.6 7l6 .6-4.5 4 1.3 5.9L10 14.4l-5.4 3.1L5.9 11.6l-4.5-4 6-.6L10 1.5Z" />
              </svg>
            ))}
          </div>
          <p className="ft-text">« {t.text} »</p>
          <footer className="ft-author">
            <span className="ft-avatar" aria-hidden="true">{t.initials}</span>
            <div>
              <strong>{t.name}</strong>
              <span>{t.role}</span>
            </div>
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
