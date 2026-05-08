import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const API = "http://localhost:8000";

function parseError(err: any, fallback: string): string {
  if (!err?.detail) return fallback;
  if (typeof err.detail === "string") return err.detail;
  if (Array.isArray(err.detail)) return err.detail.map((e: any) => e.msg).join(", ");
  return fallback;
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=IBM+Plex+Mono:wght@400;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body, #root {
    background: #08090B;
    color: #EAE6DF;
    font-family: 'IBM Plex Mono', monospace;
    min-height: 100vh;
  }

  .page {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    padding: 48px 24px;
    position: relative; overflow: hidden;
  }

  .grid-bg {
    position: absolute; inset: 0; z-index: 0;
    background-image:
      linear-gradient(#1C2128 1px, transparent 1px),
      linear-gradient(90deg, #1C2128 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 100%);
  }

  .glow {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 600px; height: 300px; z-index: 0;
    background: radial-gradient(ellipse, rgba(232,160,32,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .card {
    position: relative; z-index: 1;
    width: 100%; max-width: 400px;
    background: #0E1115;
    border: 1px solid #1C2128;
    padding: 40px 36px;
    display: flex; flex-direction: column; gap: 24px;
  }

  .logo {
    text-align: center;
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: 20px; letter-spacing: -0.02em; color: #EAE6DF;
    margin-bottom: 4px;
  }
  .logo em { font-style: italic; color: #E8A020; }

  .logo-sub {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px; color: #3D4552;
    letter-spacing: 0.08em; margin-top: 6px; text-align: center;
  }

  .card-title {
    text-align: center;
    font-size: 12px; color: #3D4552;
    letter-spacing: 0.1em; text-transform: uppercase;
  }

  .field { display: flex; flex-direction: column; gap: 7px; }

  .field label {
    font-size: 11px; color: #7A8494;
    letter-spacing: 0.08em; text-transform: uppercase;
  }

  .field input {
    background: #08090B;
    border: 1px solid #1C2128;
    outline: none; padding: 12px 14px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px; color: #EAE6DF;
    caret-color: #E8A020;
    transition: border-color 0.2s; width: 100%;
  }
  .field input:focus { border-color: #E8A020; }
  .field input::placeholder { color: #3D4552; }

  .submit {
    background: #E8A020; color: #000;
    border: none; cursor: pointer; width: 100%;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px; font-weight: 600;
    padding: 14px; letter-spacing: 0.1em; text-transform: uppercase;
    transition: opacity 0.2s, transform 0.15s; margin-top: 4px;
  }
  .submit:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
  .submit:disabled { opacity: 0.5; cursor: not-allowed; }

  .switch {
    text-align: center; font-size: 12px; color: #3D4552;
    padding-top: 4px; border-top: 1px solid #1C2128;
  }
  .switch button {
    background: none; border: none; cursor: pointer;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px; color: #E8A020;
    text-decoration: underline; padding: 0; margin-left: 4px;
  }

  .error {
    font-size: 11px; color: #E24B4A;
    background: rgba(226,75,74,0.07);
    border: 1px solid rgba(226,75,74,0.2);
    padding: 8px 12px;
  }
`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PWD_RE   = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function AuthPage() {
  const router          = useRouter();
  const { refreshUser } = useAuth(); // ← clé du fix
  const repoUrl         = router.query.repo as string | undefined;

  const [mode,     setMode]     = useState<"signin" | "signup">("signin");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    setMode(router.query.mode === "signin" ? "signin" : "signup");
  }, [router.isReady, router.query.mode]);

  const switchMode = (next: "signin" | "signup") => {
    setMode(next);
    setError("");
  };

  const handleSubmit = async () => {
    setError("");

    if (!email || !password || (mode === "signup" && !name)) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError("Adresse e-mail invalide.");
      return;
    }
    if (mode === "signup" && !PWD_RE.test(password)) {
      setError("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const checkRes = await fetch(`${API}/auth/check-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email }),
        });
        if (!checkRes.ok) throw new Error("Erreur serveur");
        const { exists } = await checkRes.json();

        if (exists) {
          setError("Cet email est déjà utilisé.");
          setTimeout(() => switchMode("signin"), 4000);
          return;
        }

        const regRes = await fetch(`${API}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ username: name, email, password }),
        });

        if (!regRes.ok) {
          const err = await regRes.json();
          setError(parseError(err, "Erreur lors de l'inscription."));
          return;
        }

      } else {
        const loginRes = await fetch(`${API}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        if (!loginRes.ok) {
          const err = await loginRes.json();
          setError(parseError(err, "Email ou mot de passe incorrect."));
          return;
        }
      }

      // ← Cookie posé par FastAPI, on met à jour le Context AVANT de rediriger
      await refreshUser();
      router.push("/account");

    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <div className="grid-bg" />
        <div className="glow" />

        <div className="card">
          <div>
            <div className="logo">Technical<em>Debt</em>Inspector</div>
            {repoUrl && <div className="logo-sub">→ {repoUrl}</div>}
            <div className="card-title">
              {mode === "signin" ? "Connexion" : "Inscription"}
            </div>
          </div>

          {mode === "signup" && (
            <div className="field">
              <label>Nom complet</label>
              <input type="text" placeholder="Nom complet" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}

          <div className="field">
            <label>Adresse e-mail</label>
            <input type="email" placeholder="vous@exemple.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="field">
            <label>Mot de passe</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          {error && <div className="error">{error}</div>}

          <button className="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? "..." : mode === "signin" ? "Se connecter →" : "Créer mon compte →"}
          </button>

          <div className="switch">
            {mode === "signin" ? (
              <>Pas encore de compte ?<button onClick={() => switchMode("signup")}>S'inscrire</button></>
            ) : (
              <>Déjà un compte ?<button onClick={() => switchMode("signin")}>Se connecter</button></>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
