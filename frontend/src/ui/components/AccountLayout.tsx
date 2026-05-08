'use client';
import React, { useState } from "react";
import { useRouter } from "next/router";

type ActivePage = "home" | "projects" | "ia" | "dashboard";

interface AccountLayoutProps {
  userName?: string;
  userInitials?: string;
  onSignOut?: () => Promise<void>;
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body, #root {
    background: #08090B;
    color: #EAE6DF;
    font-family: 'IBM Plex Mono', monospace;
    min-height: 100vh;
  }

  .layout {
    display: flex;
    min-height: 100vh;
  }

  /* ── SIDEBAR ── */
  .sidebar {
    width: 20%;
    min-width: 200px;
    max-width: 260px;
    background: #000;
    border-right: 1px solid #1C2128;
    display: flex;
    flex-direction: column;
    padding: 28px 0;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 50;
  }

  .sidebar-logo {
    padding: 0 24px 24px;
    border-bottom: 1px solid #1C2128;
    margin-bottom: 20px;
  }
  .sidebar-logo-text {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: 15px;
    letter-spacing: -0.02em;
    color: #EAE6DF;
    line-height: 1.3;
  }
  .sidebar-logo-em { font-style: italic; color: #E8A020; }
  .sidebar-logo-sub {
    font-size: 9px;
    color: #3D4552;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-top: 5px;
  }

  .sidebar-section-label {
    font-size: 9px;
    color: #3D4552;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    padding: 0 24px;
    margin-bottom: 6px;
    margin-top: 8px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 24px;
    cursor: pointer;
    font-size: 12px;
    color: #7A8494;
    letter-spacing: 0.04em;
    border-left: 2px solid transparent;
    transition: background 0.15s, color 0.15s;
    user-select: none;
  }
  .nav-item:hover { background: #0E1115; color: #EAE6DF; }
  .nav-item-active {
    background: #0E1115;
    color: #E8A020;
    border-left-color: #E8A020;
  }

  .nav-icon {
    width: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 14px;
  }
  .nav-label { flex: 1; }
  .nav-badge {
    font-size: 9px;
    background: #E8A020;
    color: #000;
    padding: 1px 6px;
    letter-spacing: 0.06em;
    font-weight: 600;
  }
  .nav-badge-neutral {
    font-size: 9px;
    background: #1C2128;
    color: #7A8494;
    padding: 1px 6px;
    letter-spacing: 0.06em;
  }

  .sidebar-divider {
    height: 1px;
    background: #1C2128;
    margin: 12px 24px;
  }

  .sidebar-footer {
    margin-top: auto;
    padding: 16px 24px 0;
    border-top: 1px solid #1C2128;
  }
  .sidebar-user {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .user-avatar {
    width: 32px; height: 32px;
    background: #E8A020;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 600; color: #000;
    flex-shrink: 0; letter-spacing: 0.04em;
  }
  .user-name {
    font-size: 12px; color: #EAE6DF; font-weight: 500;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .user-role {
    font-size: 10px; color: #3D4552;
    letter-spacing: 0.06em; text-transform: uppercase; margin-top: 2px;
  }

  .main {
    margin-left: 20%;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #08090B;
    position: relative;
  }

  .main-grid-bg {
    position: fixed;
    top: 0; left: 20%; right: 0; bottom: 0;
    z-index: 0; pointer-events: none;
    background-image:
      linear-gradient(#1C2128 1px, transparent 1px),
      linear-gradient(90deg, #1C2128 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse 70% 80% at 60% 40%, black 20%, transparent 100%);
    opacity: 0.5;
  }
  .main-glow {
    position: fixed;
    top: 30%; left: 60%;
    transform: translate(-50%, -50%);
    width: 500px; height: 300px;
    z-index: 0; pointer-events: none;
    background: radial-gradient(ellipse, rgba(232,160,32,0.06) 0%, transparent 70%);
  }

  .topbar {
    position: sticky; top: 0; z-index: 40;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 36px; height: 60px;
    background: rgba(8,9,11,0.92);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid #1C2128;
  }
  .topbar-breadcrumb {
    font-size: 13px; font-weight: 500; color: #EAE6DF;
    letter-spacing: 0.04em; display: flex; align-items: center; gap: 8px;
  }
  .breadcrumb-sep { color: #3D4552; }

  .topbar-right { display: flex; align-items: center; gap: 8px; }

  .btn-icon {
    width: 34px; height: 34px;
    background: transparent;
    border: 1px solid #1C2128;
    color: #7A8494; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 14px; font-weight: 600;
    transition: border-color 0.2s, color 0.2s;
  }
  .btn-icon:hover { border-color: #E8A020; color: #E8A020; }

  .btn-logout {
    display: flex; align-items: center; gap: 8px;
    background: transparent;
    border: 1px solid #1C2128;
    color: #7A8494; cursor: pointer;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px; letter-spacing: 0.06em;
    padding: 0 14px; height: 34px;
    transition: border-color 0.2s, color 0.2s;
  }
  .btn-logout:hover { border-color: #E24B4A; color: #E24B4A; }

  /* ── PAGE CONTENT ── */
  .page-content {
    position: relative; z-index: 1;
    padding: 40px 36px;
    flex: 1;
  }

  /* ── HOME ── */
  .home-welcome { margin-bottom: 36px; }
  .home-label {
    font-size: 10px; color: #3D4552;
    letter-spacing: 0.16em; text-transform: uppercase; margin-bottom: 10px;
  }
  .home-title {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: 34px; letter-spacing: -0.02em; color: #EAE6DF; line-height: 1.1;
  }
  .home-title-em { font-style: italic; color: #E8A020; }

  .home-cards {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px; margin-bottom: 32px;
  }
  .home-card {
    background: #0E1115; border: 1px solid #1C2128;
    padding: 22px 20px; cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
  }
  .home-card:hover { border-color: #262D36; background: #13171D; }
  .home-card-icon {
    font-size: 18px; margin-bottom: 14px;
    width: 36px; height: 36px; border: 1px solid #1C2128;
    display: flex; align-items: center; justify-content: center;
  }
  .home-card-title {
    font-size: 12px; font-weight: 600; color: #EAE6DF;
    letter-spacing: 0.04em; margin-bottom: 6px;
  }
  .home-card-desc { font-size: 11px; color: #3D4552; line-height: 1.7; }

  .home-recent-empty {
    background: #0E1115; border: 1px solid #1C2128;
    padding: 48px; text-align: center;
    font-size: 12px; color: #3D4552; letter-spacing: 0.06em; line-height: 2;
  }

  /* ── PLACEHOLDER ── */
  .placeholder {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    min-height: 60vh; gap: 14px; text-align: center;
  }
  .placeholder-icon { font-size: 32px; margin-bottom: 4px; }
  .placeholder-title {
    font-family: 'DM Serif Display', serif;
    font-size: 26px; color: #EAE6DF; letter-spacing: -0.02em;
  }
  .placeholder-sub {
    font-size: 12px; color: #3D4552;
    letter-spacing: 0.04em; max-width: 340px; line-height: 1.9;
  }
  .placeholder-btn {
    margin-top: 6px;
    background: #E8A020; color: #000; border: none; cursor: pointer;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px; font-weight: 600;
    padding: 10px 24px; letter-spacing: 0.08em;
    transition: opacity 0.2s;
  }
  .placeholder-btn:hover { opacity: 0.85; }

  /* ── MODALS ── */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.75);
    display: flex; align-items: center; justify-content: center;
  }
  .modal-box {
    background: #0E1115; border: 1px solid #262D36;
    padding: 36px; width: 360px;
    display: flex; flex-direction: column; gap: 18px;
  }
  .modal-title { font-size: 14px; font-weight: 600; color: #EAE6DF; letter-spacing: 0.04em; }
  .modal-desc { font-size: 12px; color: #7A8494; line-height: 1.8; }
  .modal-actions { display: flex; gap: 10px; }
  .modal-btn-cancel {
    flex: 1; background: transparent; border: 1px solid #1C2128;
    color: #7A8494; cursor: pointer; padding: 10px;
    font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.06em;
    transition: border-color 0.2s, color 0.2s;
  }
  .modal-btn-cancel:hover { border-color: #262D36; color: #EAE6DF; }
  .modal-btn-danger {
    flex: 1; background: #E24B4A; border: none;
    color: #fff; cursor: pointer; padding: 10px;
    font-family: 'IBM Plex Mono', monospace; font-size: 11px;
    font-weight: 600; letter-spacing: 0.06em; transition: opacity 0.2s;
  }
  .modal-btn-danger:hover { opacity: 0.85; }

  .help-item {
    display: flex; gap: 14px; align-items: flex-start;
    padding: 12px 0; border-bottom: 1px solid #1C2128;
  }
  .help-item:last-child { border-bottom: none; padding-bottom: 0; }
  .help-key {
    font-size: 10px; color: #E8A020; border: 1px solid #9B6910;
    padding: 2px 8px; letter-spacing: 0.08em; white-space: nowrap;
    flex-shrink: 0; margin-top: 2px;
  }
  .help-desc { font-size: 11px; color: #7A8494; line-height: 1.7; }
`;

const NAV: Array<{ id: ActivePage; label: string; icon: string; badge?: string; badgeStyle?: string }> = [
  { id: "home",      label: "Home",       icon: "⌂" },
  { id: "projects",  label: "My Projects",icon: "◈", badge: "0", badgeStyle: "neutral" },
  { id: "ia",        label: "Mode IA",    icon: "◉", badge: "BETA" },
  { id: "dashboard", label: "Dashboard",  icon: "▦" },
];

const TITLES: Record<ActivePage, string> = {
  home:      "Home",
  projects:  "My Projects",
  ia:        "Mode IA",
  dashboard: "Dashboard",
};

function HomePage(props: { onNavigate: (p: ActivePage) => void }) {
  return (
    <div>
      <div className="home-welcome">
        <h1 className="home-title">
          Bienvenue sur{" "}
          <span className="home-title-em">TechnicalDebt</span>
          Inspector
        </h1>
      </div>

      <div className="home-cards">
        <div className="home-card" onClick={() => props.onNavigate("projects")}>
          <div className="home-card-icon">◈</div>
          <div className="home-card-title">Mes projets</div>
          <p className="home-card-desc">
            Ajoutez un dépôt GitHub et analysez votre projet commit par commit.
          </p>
        </div>
        <div className="home-card" onClick={() => props.onNavigate("dashboard")}>
          <div className="home-card-icon">▦</div>
          <div className="home-card-title">Dashboard</div>
          <p className="home-card-desc">
            Visualisez vos courbes : dette, vélocité, densité et bien plus.
          </p>
        </div>
        <div className="home-card" onClick={() => props.onNavigate("ia")}>
          <div className="home-card-icon">◉</div>
          <div className="home-card-title">Mode IA</div>
          <p className="home-card-desc">
            Predire le point de repture ave le mode IA avant qu'il est tard
          </p>
        </div>
      </div>

      <div className="home-recent-empty">
        Aucun projet analysé pour l'instant.
        <br />
        Ajoutez votre premier dépôt GitHub pour commencer.
      </div>
    </div>
  );
}

function PlaceholderPage(props: {
  icon: string;
  title: string;
  sub: string;
  btnLabel?: string;
  onBtn?: () => void;
}) {
  return (
    <div className="placeholder">
      <div className="placeholder-icon">{props.icon}</div>
      <div className="placeholder-title">{props.title}</div>
      <p className="placeholder-sub">{props.sub}</p>
      {props.btnLabel && props.onBtn && (
        <button className="placeholder-btn" onClick={props.onBtn}>
          {props.btnLabel}
        </button>
      )}
    </div>
  );
}

export default function AccountLayout(props: AccountLayoutProps) {
  const userName     = props.userName     || "Utilisateur";
  const userInitials = props.userInitials || "U";

  const router = useRouter();
  const [activePage,      setActivePage]      = useState<ActivePage>("home");
  const [showLogout,      setShowLogout]      = useState(false);
  const [showHelp,        setShowHelp]        = useState(false);

  async function handleLogoutConfirm() {
    setShowLogout(false);
    if (props.onSignOut) {
      await props.onSignOut();
    } else {
      router.push("/");
    }
  }

  function renderPage() {
    if (activePage === "home") {
      return <HomePage onNavigate={setActivePage} />;
    }
    if (activePage === "projects") {
      return (
        <PlaceholderPage
          icon="◈"
          title="Mes projets"
          sub="Ajoutez l'URL d'un dépôt GitHub public pour déclencher l'analyse automatique à chaque push."
          btnLabel="+ Ajouter un projet"
          onBtn={() => router.push("/")}
        />
      );
    }
    if (activePage === "ia") {
      return (
        <PlaceholderPage
          icon="◉"
          title="Mode IA"
          sub="Le mode IA analyse vos métriques SonarQube et génère des recommandations de refactoring personnalisées."
          btnLabel="Bientôt disponible"
        />
      );
    }
    if (activePage === "dashboard") {
      return (
        <PlaceholderPage
          icon="▦"
          title="Dashboard"
          sub="Sélectionnez un projet dans My Projects pour visualiser ses courbes de dette technique."
          btnLabel="Voir mes projets"
          onBtn={() => setActivePage("projects")}
        />
      );
    }
    return null;
  }

  return (
    <React.Fragment>
      <style>{styles}</style>
      <div className="layout">

        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-text">
              Technical
              <span className="sidebar-logo-em">Debt</span>
              <br />
              Inspector
            </div>
            <div className="sidebar-logo-sub">v1.0 · beta</div>
          </div>

          <div className="sidebar-section-label">Navigation</div>

          {NAV.map(function(item) {
            const isActive = activePage === item.id;
            return (
              <div
                key={item.id}
                className={"nav-item" + (isActive ? " nav-item-active" : "")}
                onClick={() => setActivePage(item.id)}
              >
                <div className="nav-icon">{item.icon}</div>
                <span className="nav-label">{item.label}</span>
                {item.badge && (
                  <span className={item.badgeStyle === "neutral" ? "nav-badge-neutral" : "nav-badge"}>
                    {item.badge}
                  </span>
                )}
              </div>
            );
          })}

          <div className="sidebar-divider" />

          <div className="sidebar-section-label">Info</div>
          <div className="nav-item" onClick={() => setShowHelp(true)}>
            <div className="nav-icon">?</div>
            <span className="nav-label">About</span>
          </div>

          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="user-avatar">{userInitials}</div>
              <div>
                <div className="user-name">{userName}</div>
                <div className="user-role">Membre</div>
              </div>
            </div>
          </div>
        </aside>

        <main className="main">
          <div className="main-grid-bg" />
          <div className="main-glow" />

          <div className="topbar">
            <div className="topbar-breadcrumb">
              TDI
              <span className="breadcrumb-sep">/</span>
              {TITLES[activePage]}
            </div>
            <div className="topbar-right">
              <button
                className="btn-icon"
                title="Aide"
                onClick={() => setShowHelp(true)}
              >
                ?
              </button>
              <button className="btn-icon" title="Paramètres">
                &#9881;
              </button>
              <button
                className="btn-logout"
                onClick={() => setShowLogout(true)}
              >
                &#8594; Déconnexion
              </button>
            </div>
          </div>

          <div className="page-content">
            {renderPage()}
          </div>
        </main>

        {showLogout && (
          <div className="modal-overlay" onClick={() => setShowLogout(false)}>
            <div className="modal-box" onClick={function(e) { e.stopPropagation(); }}>
              <div className="modal-title">Confirmer la déconnexion</div>
              <p className="modal-desc">
                Vous allez être redirigé vers la page d'accueil.
                Vos données restent sauvegardées.
              </p>
              <div className="modal-actions">
                <button className="modal-btn-cancel" onClick={() => setShowLogout(false)}>
                  Annuler
                </button>
                <button className="modal-btn-danger" onClick={handleLogoutConfirm}>
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        )}

        {showHelp && (
          <div className="modal-overlay" onClick={() => setShowHelp(false)}>
            <div className="modal-box" onClick={function(e) { e.stopPropagation(); }}>
              <div className="modal-title">Guide rapide</div>
              <div>
                <div className="help-item">
                  <div className="help-key">HOME</div>
                  <div className="help-desc">Vue d'ensemble de votre activité et accès rapide aux fonctionnalités.</div>
                </div>
                <div className="help-item">
                  <div className="help-key">PROJECTS</div>
                  <div className="help-desc">Ajoutez un dépôt GitHub public. L'analyse démarre automatiquement à chaque push.</div>
                </div>
                <div className="help-item">
                  <div className="help-key">MODE IA</div>
                  <div className="help-desc">Recommandations de refactoring générées par IA depuis vos métriques SonarQube.</div>
                </div>
                <div className="help-item">
                  <div className="help-key">DASHBOARD</div>
                  <div className="help-desc">7 courbes : dette, vélocité, densité, éradication des défauts, couverture et plus.</div>
                </div>
              </div>
              <button className="modal-btn-cancel" onClick={() => setShowHelp(false)}>
                Fermer
              </button>
            </div>
          </div>
        )}

      </div>
    </React.Fragment>
  );
}
