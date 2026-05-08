import { useState } from "react";
import { useRouter } from "next/router";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=IBM+Plex+Mono:wght@400;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body, #root {
    background: #08090B;
    color: #f0d8af;
    font-family: 'IBM Plex Mono', monospace;
    min-height: 100vh;
  }

  .page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    position: relative;
    overflow: hidden;
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
    background: radial-gradient(ellipse, rgba(232,160,32,0.09) 0%, transparent 70%);
    pointer-events: none;
  }

  /* ── NAVBAR ── */
  .navbar {
    position: absolute; top: 0; left: 0; right: 0;
    display: flex; justify-content: flex-end; align-items: center;
    padding: 20px 40px; gap: 12px; z-index: 10;
    opacity: 0;
    animation: fadeUp 0.7s ease 0.1s forwards;
  }

  .btn-signin {
    background: transparent;
    border: 1px solid #262D36;
    color: #7A8494; cursor: pointer;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px; font-weight: 600;
    padding: 8px 20px; letter-spacing: 0.08em;
    text-transform: uppercase;
    transition: border-color 0.2s, color 0.2s;
  }
  .btn-signin:hover { border-color: #E8A020; color: #EAE6DF; }

  .btn-signup {
    background: #E8A020;
    border: 1px solid #E8A020;
    color: #000; cursor: pointer;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px; font-weight: 600;
    padding: 8px 20px; letter-spacing: 0.08em;
    text-transform: uppercase;
    transition: opacity 0.2s, transform 0.15s;
  }
  .btn-signup:hover { opacity: 0.85; transform: translateY(-1px); }

  /* ── CONTENT ── */
  .content {
    position: relative; z-index: 1;
    display: flex; flex-direction: column;
    align-items: center; text-align: center;
    gap: 32px;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .title {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: clamp(40px, 8vw, 88px);
    line-height: 1.02;
    letter-spacing: -0.03em;
    color: #EAE6DF;
    opacity: 0;
    animation: fadeUp 0.9s ease 0.3s forwards;
  }
  .title em { font-style: italic; color: #E8A020; }

  .sub {
    font-size: 14px; color: #7A8494;
    line-height: 1.8; max-width: 420px;
    font-family: 'IBM Plex Mono', monospace;
    opacity: 0;
    animation: fadeUp 0.7s ease 0.55s forwards;
  }

  .input-row {
    display: flex; width: 100%; max-width: 520px;
    border: 1px solid #262D36;
    transition: border-color 0.2s;
    opacity: 0;
    animation: fadeUp 0.7s ease 0.75s forwards;
  }
  .input-row:focus-within { border-color: #E8A020; }

  .prefix {
    background: #13171D; padding: 0 14px;
    display: flex; align-items: center;
    font-size: 12px; color: #3D4552;
    border-right: 1px solid #262D36;
    white-space: nowrap;
  }

  .url-input {
    flex: 1; background: #0E1115; border: none; outline: none;
    padding: 14px 16px; font-family: 'IBM Plex Mono', monospace;
    font-size: 13px; color: #EAE6DF; caret-color: #E8A020;
  }
  .url-input::placeholder { color: #3D4552; }

  .btn-analyser {
    background: #E8A020; color: #000; border: none; cursor: pointer;
    font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 600;
    padding: 0 24px; letter-spacing: 0.06em; white-space: nowrap;
    transition: opacity 0.2s, transform 0.15s;
  }
  .btn-analyser:hover { opacity: 0.85; transform: translateY(-1px); }

  .footer-note {
    font-size: 11px; color: #3D4552; letter-spacing: 0.05em;
    opacity: 0;
    animation: fadeUp 0.7s ease 0.9s forwards;
  }
`;

export default function Ana() {
  const [url, setUrl] = useState("");
  const router = useRouter();

  const handleAnalyse = () => {
    if (url.trim() === "") {
      alert("Veuillez entrer une URL de dépôt GitHub !");
      return;
    }
    router.push(`/auth?repo=${encodeURIComponent(url)}&mode=signup`);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <div className="grid-bg" />
        <div className="glow" />

        <nav className="navbar">
          <button
            className="btn-signin"
            onClick={() => router.push("/auth?mode=signin")}
          >
            Se connecter
          </button>
          <button
            className="btn-signup"
            onClick={() => router.push("/auth?mode=signup")}
          >
            S'inscrire →
          </button>
        </nav>

        <div className="content">

          <h1 className="title">
            Technical<br /><em>Debt</em>Inspector
          </h1>

          <p className="sub">
            Collez l'URL de votre dépôt GitHub
          </p>

          <div className="input-row">
            <div className="prefix">github.com/</div>
            <input
              className="url-input"
              placeholder="url du projet"
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
            <button className="btn-analyser" onClick={handleAnalyse}>
              ANALYSER →
            </button>
          </div>

          <p className="footer-note">Gratuit · Dépôts publics</p>

        </div>
      </div>
    </>
  );
}