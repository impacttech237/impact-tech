import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { SETTINGS_FIELDS } from "../lib/constants";
import { Button, Input, Textarea, Card } from "./ui";

function listToText(jsonStr) {
  try { const arr = JSON.parse(jsonStr || "[]"); return Array.isArray(arr) ? arr.join("\n") : ""; } catch { return ""; }
}
function textToList(text) {
  return JSON.stringify((text || "").split("\n").map((l) => l.trim()).filter(Boolean));
}

export default function SettingsPanel({ onUnauthorized }) {
  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api("settings");
        const v = {};
        for (const f of SETTINGS_FIELDS) {
          v[f.name] = f.type === "list" ? listToText(data.settings[f.name]) : (data.settings[f.name] ?? "");
        }
        setValues(v);
      } catch (err) {
        if (err.message === "__unauthorized__") return onUnauthorized();
        setValues({});
        setMessage(err.message);
      }
    })();
  }, [onUnauthorized]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const settings = {};
    for (const f of SETTINGS_FIELDS) {
      settings[f.name] = f.type === "list" ? textToList(values[f.name]) : values[f.name];
    }
    try {
      await api("settings", { method: "PUT", body: JSON.stringify({ settings }) });
      setMessage("ok");
    } catch (err) {
      setMessage(err.message);
    }
    setSaving(false);
  };

  if (values === null) return <p className="text-sm text-adm-text-3">Chargement...</p>;

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="font-head text-lg font-semibold text-adm-text">Réglages du site</h2>
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          {SETTINGS_FIELDS.map((f) =>
            f.type === "list" ? (
              <div key={f.name} className="sm:col-span-2">
                <Textarea label={f.label} rows={4} value={values[f.name]} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} />
              </div>
            ) : (
              <Input key={f.name} label={f.label} value={values[f.name]} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} />
            )
          )}
        </div>
      </Card>
      {message && (
        <p className={`text-sm ${message === "ok" ? "text-emerald-400" : "text-adm-red"}`}>
          {message === "ok" ? "Réglages enregistrés." : message}
        </p>
      )}
      <Button type="submit" loading={saving}>{saving ? "Enregistrement..." : "Enregistrer les réglages"}</Button>
    </form>
  );
}
