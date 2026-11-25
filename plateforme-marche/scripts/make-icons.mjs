// Génère site/js/icons.js : icônes Lucide (licence ISC). Reprend celles de la v1, télécharge les autres (version figée).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const racine = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const v1 = fs.readFileSync(path.join(racine, '..', 'olympiades', 'js', 'icons.js'), 'utf8');
const P = eval('(' + v1.match(/const P = (\{[\s\S]*?\});\n/)[1] + ')');
const garder = ['footprints', 'badge-check', 'trophy', 'target', 'calendar-check', 'sprout', 'gem', 'activity', 'medal', 'timer', 'lightbulb', 'spell-check', 'rocket', 'list-ordered', 'award', 'gamepad-2', 'clipboard-check', 'thumbs-up', 'heart', 'layers', 'hand-heart', 'flame', 'meh', 'smile', 'zap', 'message-circle', 'volume-2', 'volume-x', 'library', 'search', 'book-open', 'scale', 'clock', 'shield-check', 'info', 'triangle-alert', 'arrow-left', 'arrow-right', 'check', 'circle-check', 'circle-x', 'x', 'graduation-cap', 'brain-circuit', 'moon', 'bookmark', 'folder-open', 'chevron-right', 'list-checks', 'clipboard-list', 'calendar-days', 'timer', 'hourglass', 'award', 'lock', 'compass', 'target', 'rotate-ccw', 'sparkles', 'lightbulb'];
const aTelecharger = ['download', 'copy', 'external-link', 'sun', 'file-text', 'printer', 'link', 'filter', 'wifi-off', 'landmark', 'users', 'building-2', 'banknote', 'percent', 'menu', 'quote', 'text-size', 'flag', 'scroll-text', 'chevron-down', 'chevron-up'];
const out = {};
for (const n of garder) if (P[n]) out[n] = P[n]; else console.warn('absent de la v1 :', n);
for (const n of aTelecharger) {
  const r = await fetch(`https://unpkg.com/lucide-static@0.468.0/icons/${n}.svg`);
  if (!r.ok) { console.warn('introuvable :', n, r.status); continue; }
  const svg = await r.text();
  out[n] = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s+/g, ' ').trim();
}
const js = `/* Icônes Lucide (ISC) — généré par scripts/make-icons.mjs */\nwindow.ICONS = ${JSON.stringify(out)};\nwindow.ic = (n, cls = '') => \`<svg class="ic \${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\${window.ICONS[n] || ''}</svg>\`;\n`;
fs.writeFileSync(path.join(racine, 'site', 'js', 'icons.js'), js);
console.log(Object.keys(out).length, 'icônes écrites');
