import { useState } from "react";
import { Button, Input } from "./ui";

export default function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Connexion impossible");
      if (data.usingDefaultPassword) setWarning(true);
      onLogin();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-adm-bg p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-adm-red/5 blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-adm-red/3 blur-[100px]" />
      </div>
      <form onSubmit={submit} className="relative z-10 w-full max-w-sm space-y-6 rounded-2xl border border-adm-border bg-adm-surface p-8 shadow-xl">
        <div className="text-center">
          <p className="font-head text-2xl font-bold text-adm-text">
            impact<span className="text-adm-red">.</span>Tech
          </p>
          <p className="mt-1 text-sm text-adm-text-3">Dashboard d'administration</p>
        </div>
        <Input
          label="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
          placeholder="Entrez votre mot de passe"
        />
        {error && <p className="text-sm text-adm-red">{error}</p>}
        {warning && (
          <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            Vous utilisez le mot de passe par defaut. Definissez ADMIN_PASSWORD dans Cloudflare.
          </p>
        )}
        <Button type="submit" loading={loading} className="w-full">
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
      </form>
    </div>
  );
}
