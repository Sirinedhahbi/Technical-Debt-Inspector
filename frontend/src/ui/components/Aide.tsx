const styles = `
  .aide-wrap { display: flex; flex-direction: column; gap: 32px; max-width: 780px; }

  .aide-section-title {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: 32px; letter-spacing: -0.02em; color: #EAE6DF;
    margin-bottom: 8px;
  }
  .aide-section-title em { color: #E8A020; font-style: italic; }
  .aide-subtitle { font-size: 11px; color: #5A6575; letter-spacing: 0.08em; margin-bottom: 32px; }

  /* ── STEP CARD ── */
  .aide-card {
    background: #0C0E12; border: 1px solid #1C2128;
    padding: 28px 28px 24px;
    position: relative; overflow: hidden;
  }
  .aide-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, #E8A020, transparent);
    opacity: 0.5;
  }
  .aide-step-row {
    display: flex; align-items: flex-start; gap: 20px;
  }
  .aide-step-num {
    font-size: 10px; color: #3D4552; letter-spacing: 0.14em;
    font-weight: 600; min-width: 24px; margin-top: 3px;
  }
  .aide-step-body { flex: 1; }
  .aide-step-title {
    font-size: 13px; font-weight: 600; color: #EAE6DF;
    letter-spacing: 0.04em; margin-bottom: 8px;
  }
  .aide-step-desc { font-size: 11px; color: #6A7585; line-height: 1.8; }
  .aide-step-desc strong { color: #E8A020; font-weight: 600; }

  /* ── REQUIREMENTS ── */
  .aide-reqs { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 14px; }
  .aide-req {
    display: flex; align-items: center; gap: 7px;
    font-size: 10px; letter-spacing: 0.08em;
    border: 1px solid; padding: 5px 12px;
  }
  .aide-req.ok   { color: #2ECC87; border-color: rgba(46,204,135,0.25); background: rgba(46,204,135,0.06); }
  .aide-req.warn { color: #E8A020; border-color: rgba(232,160,32,0.25);  background: rgba(232,160,32,0.06); }
  .aide-req-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
  .aide-req.ok   .aide-req-dot { background: #2ECC87; }
  .aide-req.warn .aide-req-dot { background: #E8A020; }

  /* ── BUTTON EXPLAINER ── */
  .aide-btns { display: flex; flex-direction: column; gap: 12px; margin-top: 14px; }
  .aide-btn-row { display: flex; align-items: flex-start; gap: 16px; }
  .aide-btn-mock {
    font-size: 9px; font-family: 'IBM Plex Mono', monospace;
    letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600;
    padding: 6px 14px; border: 1px solid; flex-shrink: 0;
    white-space: nowrap;
  }
  .aide-btn-mock.gold  { color: #E8A020; border-color: rgba(232,160,32,0.3); background: rgba(232,160,32,0.06); }
  .aide-btn-mock.ghost { color: #6A7585; border-color: #1C2128; background: #0A0C0F; }
  .aide-btn-mock.blue  { color: #4C9EFF; border-color: rgba(76,158,255,0.3); background: rgba(76,158,255,0.06); }
  .aide-btn-desc { font-size: 11px; color: #6A7585; line-height: 1.7; }
  .aide-btn-desc strong { color: #EAE6DF; font-weight: 500; }

  /* ── TIP ── */
  .aide-tip {
    display: flex; gap: 14px; align-items: flex-start;
    background: rgba(232,160,32,0.04); border: 1px solid rgba(232,160,32,0.15);
    padding: 16px 18px;
  }
  .aide-tip-icon { font-size: 16px; flex-shrink: 0; }
  .aide-tip-text { font-size: 11px; color: #7A8494; line-height: 1.8; }
  .aide-tip-text strong { color: #E8A020; font-weight: 500; }

  /* ── DIVIDER ── */
  .aide-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #1C2128, transparent);
  }
`;

export default function Aide() {
  return (
    <>
      <style>{styles}</style>
      <div className="aide-wrap">

        <div>
          <h1 className="aide-section-title">Centre d'<em>aide</em></h1>
          <div className="aide-subtitle">GUIDE D'UTILISATION · TECHNICAL DEBT INSPECTOR</div>
        </div>

        {/* STEP 1 — Créer un projet */}
        <div className="aide-card">
          <div className="aide-step-row">
            <div className="aide-step-num">01</div>
            <div className="aide-step-body">
              <div className="aide-step-title">Créer un projet</div>
              <div className="aide-step-desc">
                Depuis la page <strong>Accueil</strong>, cliquez sur le bouton <strong>+ Nouveau projet</strong>.
                Renseignez deux informations :
                <br/><br/>
                · <strong>URL du dépôt GitHub</strong> — ex: <strong>https://github.com/user/mon-projet</strong><br/>
                · <strong>Nom du projet</strong> — un nom court pour l'identifier dans votre liste
              </div>
              <div className="aide-reqs">
                <div className="aide-req ok"><div className="aide-req-dot"/>Python · Java</div>
                <div className="aide-req ok"><div className="aide-req-dot"/>Dépôt public</div>
                <div className="aide-req warn"><div className="aide-req-dot"/>Privé non supporté</div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 2 — Choisir une branche */}
        <div className="aide-card">
          <div className="aide-step-row">
            <div className="aide-step-num">02</div>
            <div className="aide-step-body">
              <div className="aide-step-title">Sélectionner une branche</div>
              <div className="aide-step-desc">
                Une fois votre projet créé, il apparaît dans <strong>Mes projets</strong>.
                Chaque carte projet contient un <strong>sélecteur de branche</strong> — cliquez dessus
                pour choisir la branche à analyser.<br/><br/>
                Par défaut, <strong>main</strong> ou <strong>master</strong> est sélectionné automatiquement
                si elle existe.
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3 — Boutons */}
        <div className="aide-card">
          <div className="aide-step-row">
            <div className="aide-step-num">03</div>
            <div className="aide-step-body">
              <div className="aide-step-title">Actions disponibles sur chaque projet</div>
              <div className="aide-btns">
                <div className="aide-btn-row">
                  <div className="aide-btn-mock gold">⟳ Reload</div>
                  <div className="aide-btn-desc">
                    <strong>Mise à jour des branches</strong> — synchronise la liste des branches
                    depuis GitHub. À utiliser si vous avez créé une nouvelle branche récemment.
                  </div>
                </div>
                <div className="aide-btn-row">
                  <div className="aide-btn-mock blue">Dashboard ›</div>
                  <div className="aide-btn-desc">
                    <strong>Ouvre le dashboard d'analyse</strong> — lance l'analyse de tous les commits
                    manquants sur la branche sélectionnée, puis ouvre le dashboard en temps réel.
                    Les graphiques se mettent à jour automatiquement à chaque nouveau push.
                  </div>
                </div>
                <div className="aide-btn-row">
                  <div className="aide-btn-mock ghost">✕ Supprimer</div>
                  <div className="aide-btn-desc">
                    <strong>Supprime le projet</strong> — supprime le projet et tous ses résultats
                    d'analyse. Cette action est irréversible.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="aide-divider"/>

        {/* STEP 4 — Dashboard */}
        <div className="aide-card">
          <div className="aide-step-row">
            <div className="aide-step-num">04</div>
            <div className="aide-step-body">
              <div className="aide-step-title">Comprendre le Dashboard</div>
              <div className="aide-step-desc">
                Le dashboard affiche l'évolution de la dette technique de votre projet commit par commit.
                Les données arrivent en <strong>deux phases</strong> :
                <br/><br/>
                · <strong>Phase 1 — Historique</strong> : tous les commits déjà analysés et stockés
                en base de données s'affichent immédiatement.<br/>
                · <strong>Phase 2 — Temps réel</strong> : dès qu'un nouveau push est détecté et analysé,
                les graphiques se mettent à jour automatiquement sans recharger la page.
              </div>
            </div>
          </div>
        </div>

        {/* TIP */}
        <div className="aide-tip">
          <div className="aide-tip-icon">💡</div>
          <div className="aide-tip-text">
            <strong>Conseil</strong> — Le dashboard reste actif tant que la page est ouverte.
            Laissez-le ouvert pendant que votre équipe pousse des commits : chaque analyse
            apparaîtra automatiquement sur les graphiques en quelques secondes.
          </div>
        </div>

      </div>
    </>
  );
}
