/* Composants d'interface partagés du portail. */
import { h, ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { t } from "./i18n";

/* ── Icônes (traits 2px, 24x24) ── */
const P: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  check: "M20 6 9 17l-5-5",
  todo: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  files: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  doc: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8",
  pen: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  chat: "M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4-.9L3 20l1.1-4A8.4 8.4 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z",
  site: "M3 5h18v12H3zM8 21h8M12 17v4",
  money: "M2 7h20v12H2zM2 11h20M6 15h4",
  gift: "M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  help: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  mic: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3",
  clip: "M21.4 11.1l-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4z",
  x: "M18 6 6 18M6 6l12 12",
  back: "M19 12H5M12 19l-7-7 7-7",
  ext: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  key: "M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4",
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z",
  cal: "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18",
  star: "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
  laptop: "M4 5h16v11H4zM2 19h20",
  tablet: "M6 2h12v20H6zM11 18h2",
  mobile: "M8 2h8v20H8zM11 18h2",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  image: "M3 3h18v18H3zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21",
  video: "M23 7l-7 5 7 5zM1 5h15v14H1z",
  music: "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  trash: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  plus: "M12 5v14M5 12h14",
  alert: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v4M12 16h.01",
  play: "M5 3l14 9-14 9z",
  pause: "M6 4h4v16H6zM14 4h4v16h-4z",
};

export function Icon({ name, size = 20, class: cls = "" }: { name: string; size?: number; class?: string }) {
  return (
    <svg class={`pt-icon ${cls}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d={P[name] || P.more} />
    </svg>
  );
}

type BtnProps = {
  children?: ComponentChildren;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  icon?: string;
  loading?: boolean;
  block?: boolean;
  href?: string;
  target?: string;
  [k: string]: any;
};

export function Button({ children, variant = "primary", size = "md", icon, loading, block, href, class: cls = "", ...rest }: BtnProps) {
  const className = `pt-btn pt-btn--${variant} pt-btn--${size} ${block ? "pt-btn--block" : ""} ${cls}`;
  const inner = (
    <>
      {loading ? <span class="pt-spinner" aria-hidden="true" /> : icon && <Icon name={icon} size={size === "sm" ? 16 : 18} />}
      {children && <span>{children}</span>}
    </>
  );
  if (href) {
    return (
      <a class={className} href={href} target={rest.target} rel={rest.target === "_blank" ? "noopener noreferrer" : undefined} {...rest}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" class={className} disabled={rest.disabled || loading} aria-busy={loading ? "true" : undefined} {...rest}>
      {inner}
    </button>
  );
}

export function Card({ children, class: cls = "", tone }: { children: ComponentChildren; class?: string; tone?: "accent" | "success" | "warn" }) {
  return <section class={`pt-card ${tone ? `pt-card--${tone}` : ""} ${cls}`}>{children}</section>;
}

export function Badge({ children, tone = "default" }: { children: ComponentChildren; tone?: "default" | "red" | "green" | "amber" | "blue" }) {
  return <span class={`pt-badge pt-badge--${tone}`}>{children}</span>;
}

export function Progress({ value, label }: { value: number; label?: string }) {
  return (
    <div class="pt-progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div class="pt-progress__bar" style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div class="pt-loading" role="status">
      <span class="pt-spinner pt-spinner--lg" aria-hidden="true" />
      <span>{label || t("loading")}</span>
    </div>
  );
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div aria-busy="true" aria-label={t("loading")}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} class="pt-skel" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}

export function Empty({ icon = "files", title, children }: { icon?: string; title: string; children?: ComponentChildren }) {
  return (
    <div class="pt-empty" role="status">
      <div class="pt-empty__icon">
        <Icon name={icon} size={28} />
      </div>
      <p class="pt-empty__title">{title}</p>
      {children}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div class="pt-error" role="alert">
      <Icon name="alert" />
      <span>{message}</span>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          {t("retry")}
        </Button>
      )}
    </div>
  );
}

/* Fenêtre modale (plein écran sur mobile) avec piège du focus simple. */
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ComponentChildren; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.classList.add("pt-noscroll");
    setTimeout(() => ref.current?.querySelector<HTMLElement>("input,textarea,button,[tabindex]")?.focus(), 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("pt-noscroll");
      prev?.focus?.();
    };
  }, [open]);
  if (!open) return null;
  return (
    <div class="pt-modal" onClick={onClose}>
      <div class={`pt-modal__panel ${wide ? "pt-modal__panel--wide" : ""}`} role="dialog" aria-modal="true" aria-label={title} ref={ref} onClick={(e) => e.stopPropagation()}>
        <header class="pt-modal__head">
          <h2>{title}</h2>
          <button type="button" class="pt-iconbtn" onClick={onClose} aria-label={t("close")}>
            <Icon name="x" />
          </button>
        </header>
        <div class="pt-modal__body">{children}</div>
      </div>
    </div>
  );
}

/* Notifications éphémères (« C'est envoyé ✓ »). */
type ToastItem = { id: number; text: string; tone: "ok" | "error" };
let pushToast: (text: string, tone?: "ok" | "error") => void = () => {};
export const toast = (text: string, tone: "ok" | "error" = "ok") => pushToast(text, tone);

export function Toasts() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    pushToast = (text, tone = "ok") => {
      const id = Date.now() + Math.random();
      setItems((l) => [...l, { id, text, tone }]);
      setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), tone === "error" ? 6000 : 3200);
    };
  }, []);
  return (
    <div class="pt-toasts" aria-live="polite">
      {items.map((i) => (
        <div key={i.id} class={`pt-toast pt-toast--${i.tone}`}>
          {i.text}
        </div>
      ))}
    </div>
  );
}

export function Field({ label, hint, children, id }: { label: string; hint?: string; children: ComponentChildren; id?: string }) {
  return (
    <div class="pt-field">
      <label for={id}>{label}</label>
      {hint && <p class="pt-field__hint">{hint}</p>}
      {children}
    </div>
  );
}

export function fileIcon(mime?: string) {
  const m = mime || "";
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "music";
  return "doc";
}
