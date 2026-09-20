import { Button } from "./Button";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import { Plus, Trash2, ArrowUp, ArrowDown } from "../../lib/icons";

export function SectionsEditor({ value, onChange }) {
  const sections = Array.isArray(value) ? value : [];
  const emptySection = () => ({ title: "", paragraphs: "", bullets: "", quote: "", callout: "" });
  const update = (i, key, val) => onChange(sections.map((s, idx) => (idx === i ? { ...s, [key]: val } : s)));
  const add = () => onChange([...sections, emptySection()]);
  const remove = (i) => onChange(sections.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="sm:col-span-2">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-adm-text-3">
        Contenu de l'article (sections)
      </span>
      <div className="space-y-3">
        {sections.map((s, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-adm-border bg-adm-surface-2 p-4">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-adm-text">Section {i + 1}</strong>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="sm" icon={ArrowUp} onClick={() => move(i, -1)} />
                <Button type="button" variant="ghost" size="sm" icon={ArrowDown} onClick={() => move(i, 1)} />
                <Button type="button" variant="danger" size="sm" icon={Trash2} onClick={() => remove(i)} />
              </div>
            </div>
            <Input label="Titre de la section" value={s.title} onChange={(e) => update(i, "title", e.target.value)} />
            <Textarea label="Paragraphes (ligne vide = séparation)" rows={4} value={s.paragraphs} onChange={(e) => update(i, "paragraphs", e.target.value)} />
            <Textarea label="Puces (une par ligne)" rows={3} value={s.bullets} onChange={(e) => update(i, "bullets", e.target.value)} />
            <Input label="Citation (optionnel)" value={s.quote} onChange={(e) => update(i, "quote", e.target.value)} />
            <Textarea label="Encadré « À retenir » (optionnel)" rows={2} value={s.callout} onChange={(e) => update(i, "callout", e.target.value)} />
          </div>
        ))}
      </div>
      <div className="mt-3">
        <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={add}>Ajouter une section</Button>
      </div>
    </div>
  );
}
