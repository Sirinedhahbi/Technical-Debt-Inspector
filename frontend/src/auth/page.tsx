'use client';

import { useState } from "react";
import { useRouter } from "next/navigation"; // Pour pouvoir revenir en arrière

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
    outline: none;
    padding: 12px 14px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px; color: #EAE6DF;
    caret-color: #E8A020;
    transition: border-color 0.2s;
    width: 100%;
  }
  .field input:focus { border-color: #E8A020; }
  .field input::placeholder { color: #3D4552; }

  .submit {
    background: #E8A020; color: #000;
    border: none; cursor: pointer; width: 100%;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px; font-weight: 600;
    padding: 14px; letter-spacing: 0.1em; text-transform: uppercase;
    transition: opacity 0.2s, transform 0.15s;
    margin-top: 4px;
  }
  .submit:hover { opacity: 0.85; transform: translateY(-1px); }

  .switch {
    text-align: center;
    font-size: 12px; color: #3D4552;
    padding-top: 4px;
    border-top: 1px solid #1C2128;
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

export default function AuthPage({
  onBack,
}: {
  onBack?: () => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
  if (!email || !password || (mode === "signup" && !name)) {
    setError("Veuillez remplir tous les champs.");
    return;
  }

  if (mode === "signup") {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.");
      return;
    }
  }
  setError("");
  // → brancher votre logique d'auth ici
};

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <div className="grid-bg" />
        <div className="glow" />

        <div className="card">

          <div>
            <div className="logo">
              Technical<em>Debt</em>Inspector
            </div>
            <div className="card-title">
              {mode === "signin" ? "Connexion" : "Inscription"}
            </div>
          </div>

          {mode === "signup" && (
            <div className="field">
              <label>Nom complet</label>
              <input
                type="text"
                placeholder="Nom complet"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}

          <div className="field">
            <label>Adresse e-mail</label>
            <input
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button className="submit" onClick={handleSubmit}>
            {mode === "signin" ? "Se connecter →" : "Créer mon compte →"}
          </button>

          <div className="switch">
            {mode === "signin" ? (
              <>Pas encore de compte ?
                <button onClick={() => { setMode("signup"); setError(""); }}>s'inscrire</button>
              </>
            ) : (
              <>Déjà un compte ?
                <button onClick={() => { setMode("signin"); setError(""); }}>Se connecter</button>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
