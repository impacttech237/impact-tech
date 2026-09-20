import { useState } from "react";
import { uploadImage } from "../../lib/api";
import { Upload } from "../../lib/icons";

export function ImageField({ label, value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr("");
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (er) {
      setErr(er.message === "__unauthorized__" ? "Session expirée — reconnectez-vous." : er.message);
    }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-adm-text-3">{label}</span>}
      <div className="flex gap-2">
        <input
          type="text"
          value={value || ""}
          placeholder="/images/… ou uploadez"
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-adm-border-2 bg-adm-surface-3 px-3 py-2 text-sm text-adm-text outline-none focus:border-adm-red"
        />
        <label className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-adm-border-2 bg-adm-surface-2 px-3 py-2 text-sm font-semibold text-adm-text-2 transition-colors hover:border-adm-red hover:text-adm-red">
          {uploading ? "Envoi…" : <><Upload size={14} /> Uploader</>}
          <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
        </label>
      </div>
      {value && <img src={value} alt="" className="mt-2 h-20 rounded-lg border border-adm-border object-cover" />}
      {err && <p className="mt-1 text-xs text-adm-red">{err}</p>}
    </label>
  );
}
