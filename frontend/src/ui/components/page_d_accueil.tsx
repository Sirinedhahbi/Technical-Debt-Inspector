import { useEffect } from "react";
import { useRouter } from "next/router";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=IBM+Plex+Mono:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#08090B;--bg2:#0C0E12;--border:#1C2128;--border2:#252C38;
    --gold:#E8A020;--gold2:#F5C048;--text:#EAE6DF;--muted:#7A8494;--muted2:#3D4552;
    --red:#E24B4A;--green:#2ECC87;--blue:#4C9EFF;--purple:#A78BFA;
  }
  html{scroll-behavior:smooth}
  body,#root{background:var(--bg);color:var(--text);font-family:'IBM Plex Mono',monospace;min-height:100vh;overflow-x:hidden}

  /* ── NAVBAR ── */
  .navbar{
    position:fixed;top:0;left:0;right:0;z-index:100;
    display:flex;justify-content:space-between;align-items:center;
    padding:18px 40px;
    background:rgba(8,9,11,0.85);backdrop-filter:blur(16px);
    border-bottom:1px solid var(--border);
  }
  .nav-logo{font-family:'DM Serif Display',serif;font-size:14px;color:var(--text);letter-spacing:-.02em;cursor:pointer}
  .nav-logo em{color:var(--gold);font-style:italic}
  .nav-right{display:flex;gap:12px}
  .btn-signin{background:transparent;border:1px solid var(--border2);color:var(--muted);cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;padding:8px 20px;letter-spacing:.08em;text-transform:uppercase;transition:border-color .2s,color .2s}
  .btn-signin:hover{border-color:var(--gold);color:var(--text)}
  .btn-signup{background:var(--gold);border:1px solid var(--gold);color:#000;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;padding:8px 20px;letter-spacing:.08em;text-transform:uppercase;transition:opacity .2s,transform .15s}
  .btn-signup:hover{opacity:.85;transform:translateY(-1px)}

  /* ── TICKER ── */
  .ticker-wrap{margin-top:61px;background:#0A0B0E;border-bottom:1px solid var(--border);padding:12px 0;overflow:hidden;white-space:nowrap}
  .ticker-track{display:inline-flex;animation:ticker 30s linear infinite}
  @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  .ticker-item{display:inline-flex;align-items:center;gap:10px;padding:0 40px;font-size:11px;color:var(--muted2);letter-spacing:.1em}
  .ticker-dot{width:4px;height:4px;border-radius:50%;background:var(--gold)}
  .ticker-val{color:var(--gold);font-weight:600}
  .ticker-red{color:var(--red);font-weight:600}
  .ticker-green{color:var(--green);font-weight:600}

  /* ── SECTIONS ── */
  section{position:relative;overflow:hidden}
  .section-eyebrow{font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:16px;display:flex;align-items:center;gap:10px}
  .section-eyebrow::before{content:'';width:24px;height:1px;background:var(--gold)}
  .section-title{font-family:'DM Serif Display',serif;font-size:clamp(28px,4vw,52px);line-height:1.1;letter-spacing:-.02em;color:var(--text);max-width:480px;margin-bottom:72px}
  .section-title em{font-style:italic;color:var(--gold)}

  /* ── HOW IT WORKS ── */
  .how-section{padding:120px 40px;background:var(--bg)}
  .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border);border:1px solid var(--border)}
  .step{background:var(--bg2);padding:40px 32px;position:relative;overflow:hidden;transition:background .3s}
  .step:hover{background:#0F1218}
  .step-num{font-size:11px;color:var(--muted2);letter-spacing:.12em;margin-bottom:28px;font-weight:600}
  .step-icon{width:44px;height:44px;border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:20px;background:#13171D}
  .step-title{font-family:'DM Serif Display',serif;font-size:20px;color:var(--text);margin-bottom:12px;letter-spacing:-.01em}
  .step-title em{color:var(--gold);font-style:italic}
  .step-desc{font-size:12px;color:var(--muted);line-height:1.8}
  .step-glow{position:absolute;bottom:-40px;right:-40px;width:120px;height:120px;background:radial-gradient(ellipse,rgba(232,160,32,.06) 0%,transparent 70%);pointer-events:none}

  /* ── METRICS ── */
  .metrics-section{padding:120px 40px;background:#070809;border-top:1px solid var(--border)}
  .metrics-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:64px}
  .metric-card-ai{
    grid-column:1/-1;position:relative;overflow:hidden;
    background:#07080A;border:1px solid rgba(167,139,250,.15);
    padding:56px 40px;cursor:default;
    transition:border-color .5s;
    display:flex;align-items:center;gap:48px;
  }
  .metric-card-ai:hover{border-color:rgba(167,139,250,.35)}
  .metric-card-ai::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent 5%,rgba(167,139,250,.7) 50%,transparent 95%)}
  .ai-glow-bg{
    position:absolute;left:-60px;top:50%;transform:translateY(-50%);
    width:280px;height:280px;border-radius:50%;
    background:radial-gradient(ellipse,rgba(167,139,250,.09) 0%,transparent 65%);
    pointer-events:none;animation:aiGlow 5s ease-in-out infinite;
  }
  @keyframes aiGlow{0%,100%{opacity:.7;transform:translateY(-50%) scale(1)}50%{opacity:1;transform:translateY(-50%) scale(1.08)}}
  .ai-logo-wrap{
    position:relative;flex-shrink:0;
    width:72px;height:72px;
    border:1px solid rgba(167,139,250,.25);
    display:flex;align-items:center;justify-content:center;
    background:rgba(167,139,250,.04);
  }
  .ai-logo-wrap::before{
    content:'';position:absolute;inset:-1px;
    background:linear-gradient(135deg,rgba(167,139,250,.4),transparent 60%);
    pointer-events:none;
  }
  .ai-logo-ring{
    position:absolute;inset:-8px;border-radius:50%;
    border:1px solid rgba(167,139,250,.12);
    animation:aiSpin 12s linear infinite;
  }
  @keyframes aiSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  .ai-logo-ring::after{
    content:'';position:absolute;top:-3px;left:50%;transform:translateX(-50%);
    width:5px;height:5px;border-radius:50%;background:var(--purple);
    box-shadow:0 0 8px 2px rgba(167,139,250,.6);
  }
  .ai-content{position:relative;z-index:1;flex:1}
  .ai-eyebrow{font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:var(--purple);margin-bottom:14px;display:flex;align-items:center;gap:8px}
  .ai-eyebrow-dot{width:4px;height:4px;border-radius:50%;background:var(--purple);animation:aipulse 2.5s ease-in-out infinite}
  @keyframes aipulse{0%,100%{opacity:1}50%{opacity:.3}}
  .ai-heading{font-family:'DM Serif Display',serif;font-size:28px;line-height:1.15;letter-spacing:-.02em;color:var(--text);margin-bottom:12px}
  .ai-heading em{color:var(--purple);font-style:italic}
  .ai-sub{font-size:12px;color:var(--muted);line-height:1.8;max-width:420px}
  .metric-card{background:var(--bg2);border:1px solid var(--border);padding:28px;position:relative;overflow:hidden;transition:border-color .3s,transform .3s;cursor:default}
  .metric-card:hover{border-color:var(--border2);transform:translateY(-2px)}
  .metric-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px}
  .metric-card.red::before{background:linear-gradient(90deg,transparent,var(--red),transparent)}
  .metric-card.gold::before{background:linear-gradient(90deg,transparent,var(--gold),transparent)}
  .metric-card.blue::before{background:linear-gradient(90deg,transparent,var(--blue),transparent)}
  .metric-card.green::before{background:linear-gradient(90deg,transparent,var(--green),transparent)}
  .metric-card.purple::before{background:linear-gradient(90deg,transparent,var(--purple),transparent)}
  .metric-label{font-size:9px;letter-spacing:.18em;text-transform:uppercase;margin-bottom:16px;display:flex;align-items:center;gap:7px}
  .metric-card.red .metric-label{color:var(--red)}
  .metric-card.gold .metric-label{color:var(--gold)}
  .metric-card.blue .metric-label{color:var(--blue)}
  .metric-card.green .metric-label{color:var(--green)}
  .metric-card.purple .metric-label{color:var(--purple)}
  .metric-big{font-size:40px;font-weight:600;letter-spacing:-.04em;color:var(--text)}
  .metric-unit{font-size:12px;color:var(--muted);margin-top:4px}
  .metric-bar-wrap{margin-top:20px;height:3px;background:var(--border)}
  .metric-bar{height:100%}
  .metric-card.red .metric-bar{background:linear-gradient(90deg,var(--red),rgba(226,75,74,.3))}
  .metric-card.gold .metric-bar{background:linear-gradient(90deg,var(--gold),rgba(232,160,32,.3))}
  .metric-card.blue .metric-bar{background:linear-gradient(90deg,var(--blue),rgba(76,158,255,.3))}
  .metric-card.green .metric-bar{background:linear-gradient(90deg,var(--green),rgba(46,204,135,.3))}
  .metric-card.purple .metric-bar{background:linear-gradient(90deg,var(--purple),rgba(167,139,250,.3))}
  .metric-sparkline{margin-top:16px;height:40px;display:flex;align-items:flex-end;gap:3px}
  .spark-bar{flex:1;border-radius:1px;opacity:.5}
  .metric-card.red .spark-bar{background:var(--red)}
  .metric-card.gold .spark-bar{background:var(--gold)}
  .metric-card.blue .spark-bar{background:var(--blue)}
  .metric-card.green .spark-bar{background:var(--green)}
  .metric-card.purple .spark-bar{background:var(--purple)}
  .spark-bar.highlight{opacity:1}

  /* ── LIVE FEED ── */
  .feed-section{padding:120px 40px;background:var(--bg);border-top:1px solid var(--border)}
  .feed-layout{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:start;margin-top:64px}
  .feed-desc{font-size:13px;color:var(--muted);line-height:1.9;margin-bottom:32px}
  .feature-list{display:flex;flex-direction:column;gap:16px}
  .feature-item{display:flex;align-items:flex-start;gap:14px}
  .feature-check{width:20px;height:20px;border:1px solid rgba(46,204,135,.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;background:rgba(46,204,135,.06)}
  .feature-check svg{color:var(--green)}
  .feature-text{font-size:12px;color:var(--muted);line-height:1.6}
  .feature-text strong{color:var(--text);font-weight:500}
  .feed-terminal{background:#060708;border:1px solid var(--border);font-size:11px;overflow:hidden}
  .terminal-bar{background:#0C0D10;border-bottom:1px solid var(--border);padding:10px 14px;display:flex;align-items:center;gap:8px}
  .terminal-dot{width:10px;height:10px;border-radius:50%}
  .terminal-title{font-size:10px;color:var(--muted2);letter-spacing:.08em;margin-left:6px}
  .terminal-body{padding:20px;display:flex;flex-direction:column;gap:10px}
  .t-line{display:flex;gap:12px;align-items:center;font-size:10px}
  .t-time{color:var(--muted2);min-width:48px}
  .t-tag{font-size:8px;letter-spacing:.12em;text-transform:uppercase;padding:2px 7px;border-radius:2px}
  .t-tag.push{background:rgba(76,158,255,.12);color:var(--blue);border:1px solid rgba(76,158,255,.2)}
  .t-tag.ok{background:rgba(46,204,135,.10);color:var(--green);border:1px solid rgba(46,204,135,.2)}
  .t-tag.warn{background:rgba(232,160,32,.10);color:var(--gold);border:1px solid rgba(232,160,32,.2)}
  .t-tag.crit{background:rgba(226,75,74,.10);color:var(--red);border:1px solid rgba(226,75,74,.2)}
  .t-msg{color:var(--muted);flex:1}
  .t-val{font-weight:600}
  .t-val.gold{color:var(--gold)}
  .t-val.red{color:var(--red)}
  .t-val.green{color:var(--green)}
  .t-cursor{display:inline-block;width:7px;height:11px;background:var(--gold);animation:blink 1s step-end infinite}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}

  /* ── SSE EXPLAINER ── */
  .sse-section{padding:120px 40px;background:#070809;border-top:1px solid var(--border)}
  .sse-layout{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;margin-top:64px}
  .sse-diagram{display:flex;flex-direction:column;gap:0;border:1px solid var(--border)}
  .sse-row{display:flex;align-items:center;padding:16px 20px;border-bottom:1px solid var(--border);gap:16px;background:var(--bg2);transition:background .2s}
  .sse-row:last-child{border-bottom:none}
  .sse-row:hover{background:#0F1218}
  .sse-icon{font-size:18px;flex-shrink:0;width:28px;text-align:center}
  .sse-arrow{font-size:14px;color:var(--muted2);flex-shrink:0}
  .sse-label{font-size:11px;color:var(--text);font-weight:500}
  .sse-sub{font-size:10px;color:var(--muted);margin-top:2px}
  .sse-right{display:flex;flex-direction:column;gap:24px}
  .sse-stat{display:flex;align-items:flex-start;gap:20px;padding:24px;border:1px solid var(--border);background:var(--bg2)}
  .sse-stat-num{font-family:'DM Serif Display',serif;font-size:40px;color:var(--gold);line-height:1;letter-spacing:-.03em;flex-shrink:0;min-width:60px}
  .sse-stat-label{font-size:12px;color:var(--text);font-weight:500;margin-bottom:4px}
  .sse-stat-desc{font-size:11px;color:var(--muted);line-height:1.7}

  /* ── CTA ── */
  .cta-section{padding:140px 40px;text-align:center;border-top:1px solid var(--border);background:var(--bg);position:relative;overflow:hidden}
  .cta-glow{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:600px;height:300px;background:radial-gradient(ellipse,rgba(232,160,32,.07) 0%,transparent 70%);pointer-events:none;animation:glowPulse 4s ease-in-out infinite alternate}
  @keyframes glowPulse{from{opacity:.6;transform:translate(-50%,-50%) scale(1)}to{opacity:1;transform:translate(-50%,-50%) scale(1.08)}}
  .cta-title{font-family:'DM Serif Display',serif;font-size:clamp(32px,5vw,64px);line-height:1.1;letter-spacing:-.02em;color:var(--text);position:relative;margin-bottom:20px}
  .cta-title em{font-style:italic;color:var(--gold)}
  .cta-sub{font-size:13px;color:var(--muted);margin-bottom:40px;position:relative}
  .cta-btn{display:inline-flex;align-items:center;gap:12px;background:var(--gold);color:#000;border:none;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;padding:18px 40px;letter-spacing:.1em;text-transform:uppercase;transition:opacity .2s,transform .2s,box-shadow .2s;position:relative}
  .cta-btn:hover{opacity:.9;transform:translateY(-2px);box-shadow:0 12px 40px rgba(232,160,32,.25)}

  /* ── FOOTER ── */
  .footer{padding:32px 40px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;font-size:10px;color:var(--muted2);letter-spacing:.08em}
  .footer-logo{font-family:'DM Serif Display',serif;font-size:13px;color:var(--muted)}
  .footer-logo em{color:var(--gold);font-style:italic}

  /* ── REVEAL ── */
  .reveal{opacity:0;transform:translateY(24px);transition:opacity .7s ease,transform .7s ease}
  .reveal.visible{opacity:1;transform:translateY(0)}

  @media(max-width:768px){
    .steps{grid-template-columns:1fr}
    .metrics-grid{grid-template-columns:1fr}
    .feed-layout,.sse-layout{grid-template-columns:1fr}
    .footer{flex-direction:column;gap:12px;text-align:center}
    .how-section,.metrics-section,.feed-section,.sse-section,.cta-section{padding:80px 20px}
    .navbar{padding:14px 20px}
  }
`;

const TICKER_ITEMS = [
  { label:"SQALE_DEBT_RATIO", val:"3.2%", cls:"ticker-green" },
  { label:"BUGS", val:"12", cls:"ticker-red" },
  { label:"CODE_SMELLS", val:"248", cls:"ticker-val" },
  { label:"VULNERABILITIES", val:"3", cls:"ticker-red" },
  { label:"COVERAGE", val:"74.2%", cls:"ticker-green" },
  { label:"COGNITIVE_COMPLEXITY", val:"890", cls:"ticker-val" },
  { label:"DUPLICATED_LINES", val:"1.8%", cls:"ticker-val" },
  { label:"RELIABILITY_RATING", val:"B", cls:"ticker-val" },
  { label:"SECURITY_HOTSPOTS", val:"5", cls:"ticker-red" },
  { label:"NCLOC", val:"42 381", cls:"ticker-val" },
];

export default function TechnicalDebtInspector() {
  const router = useRouter();

  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <style>{styles}</style>

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-logo" onClick={() => router.push("/")}>
          Technical<em>Debt</em>Inspector
        </div>
        <div className="nav-right">
          
        </div>
      </nav>

      {/* TICKER */}
      <div className="ticker-wrap">
        <div className="ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="ticker-item">
              <span className="ticker-dot" />
              {item.label} <span className={item.cls}>{item.val}</span>
            </span>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="how-section">
        <div className="reveal section-eyebrow">Comment ça marche</div>
        <h2 className="reveal section-title">Trois étapes pour<br /><em>maîtriser</em> votre dette</h2>
        <div className="steps reveal">
          {[
            { num:"01", icon:"🔗", title:<>Connectez votre <em>dépôt</em></>, desc:"Collez l'URL de votre projet GitHub. Nous récupérons automatiquement la liste des branches et l'historique des commits." },
            { num:"02", icon:"⚡", title:<>Analyse <em>SonarQube</em></>, desc:"Chaque commit est analysé. Bugs, vulnérabilités, code smells, couverture de tests — tout est mesuré." },
            { num:"03", icon:"📡", title:<>Dashboard <em>temps réel</em></>, desc:"Vos résultats s'affichent en direct . Les nouveaux commits sont captés et analysés automatiquement sans rechargement." },
          ].map(({ num, icon, title, desc }) => (
            <div key={num} className="step">
              <div className="step-num">{num}</div>
              <div className="step-icon">{icon}</div>
              <div className="step-title">{title}</div>
              <p className="step-desc">{desc}</p>
              <div className="step-glow" />
            </div>
          ))}
        </div>
      </section>

      {/* METRICS */}
      <section className="metrics-section">
        <div className="reveal section-eyebrow">Métriques suivies</div>
        <h2 className="reveal section-title">Tout ce qui compte,<br /><em>mesuré</em> à chaque push</h2>
        <div className="metrics-grid">
          {[
            { cls:"red",   label:"Fiabilité",     big:"A→D",  unit:"Bugs & effort de correction", bar:72, sparks:[3,5,8,6,9,7,11,9,8,12,10,9,11,8,10] },
            { cls:"gold",  label:"Maintenabilité", big:"sqale",unit:"Index & ratio de dette",       bar:58, sparks:[6,9,12,10,14,11,13,10,12,9,11,8,10,7,9] },
            { cls:"blue",  label:"Sécurité",       big:"CVEs", unit:"Vulnérabilités & hotspots",    bar:45, sparks:[2,4,3,5,4,6,5,7,6,8,7,9,8,10,9] },
            { cls:"green", label:"Vélocité",       big:"V(t)", unit:"Score composite d'équipe",     bar:83, sparks:[8,11,9,13,10,12,9,11,8,10,12,11,13,10,12] },
          ].map(({ cls, label, big, unit, bar, sparks }) => (
            <div key={cls} className={`metric-card ${cls} reveal`}>
              <div className="metric-label">{label}</div>
              <div className="metric-big">{big}</div>
              <div className="metric-unit">{unit}</div>
              <div className="metric-bar-wrap">
                <div className="metric-bar" style={{ width:`${bar}%` }} />
              </div>
              <div className="metric-sparkline">
                {sparks.map((h, i) => (
                  <div key={i} className={`spark-bar${i===sparks.length-1?" highlight":""}`}
                    style={{ height:`${(h/Math.max(...sparks))*100}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* AI PREDICTION CARD */}
        <div className="metric-card-ai reveal" style={{marginTop:24}}>
          <div className="ai-glow-bg"/>

          {/* Logo */}
          <div className="ai-logo-wrap">
            <div className="ai-logo-ring"/>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="6" stroke="rgba(167,139,250,.9)" strokeWidth="1"/>
              <circle cx="16" cy="16" r="2.5" fill="rgba(167,139,250,.9)"/>
              <line x1="16" y1="2" x2="16" y2="8" stroke="rgba(167,139,250,.5)" strokeWidth="1" strokeLinecap="round"/>
              <line x1="16" y1="24" x2="16" y2="30" stroke="rgba(167,139,250,.5)" strokeWidth="1" strokeLinecap="round"/>
              <line x1="2" y1="16" x2="8" y2="16" stroke="rgba(167,139,250,.5)" strokeWidth="1" strokeLinecap="round"/>
              <line x1="24" y1="16" x2="30" y2="16" stroke="rgba(167,139,250,.5)" strokeWidth="1" strokeLinecap="round"/>
              <line x1="6.1" y1="6.1" x2="10.3" y2="10.3" stroke="rgba(167,139,250,.3)" strokeWidth="1" strokeLinecap="round"/>
              <line x1="21.7" y1="21.7" x2="25.9" y2="25.9" stroke="rgba(167,139,250,.3)" strokeWidth="1" strokeLinecap="round"/>
              <line x1="25.9" y1="6.1" x2="21.7" y2="10.3" stroke="rgba(167,139,250,.3)" strokeWidth="1" strokeLinecap="round"/>
              <line x1="10.3" y1="21.7" x2="6.1" y2="25.9" stroke="rgba(167,139,250,.3)" strokeWidth="1" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Text */}
          <div className="ai-content">
            <div className="ai-eyebrow">
              <span className="ai-eyebrow-dot"/>
              Prédiction IA
            </div>
            <div className="ai-heading">Anticipez votre <em>dette technique</em></div>
            <p className="ai-sub">Notre modèle prédit l'évolution de votre dette à chaque push — avant qu'elle ne s'accumule.</p>
          </div>
        </div>
      </section>

      {/* LIVE FEED */}
      <section className="feed-section">
        <div className="reveal section-eyebrow">Temps réel</div>
        <div className="feed-layout">
          <div>
            <h2 className="reveal section-title" style={{marginBottom:24}}>Vos commits,<br /><em>analysés</em> à la volée</h2>
            <p className="feed-desc reveal">Dès qu'un push est détecté sur votre branche, SonarQube l'analyse et les résultats apparaissent sur votre dashboard sans aucune action de votre part.</p>
            
          </div>
          <div className="reveal">
            <div className="feed-terminal">
              <div className="terminal-bar">
                <div className="terminal-dot" style={{background:"#E24B4A"}}/>
                <div className="terminal-dot" style={{background:"#E8A020"}}/>
                <div className="terminal-dot" style={{background:"#2ECC87"}}/>
                <div className="terminal-title">SSE STREAM — main</div>
              </div>
              <div className="terminal-body">
                {[
                  { time:"14:02:11", tag:"push", cls:"push", msg:"Commit détecté", val:"a3f9c2d", valCls:"" },
                  { time:"14:02:14", tag:"ok",   cls:"ok",   msg:"SonarQube analyse…", val:"", valCls:"" },
                  { time:"14:02:31", tag:"ok",   cls:"ok",   msg:"bugs →", val:"12", valCls:"gold" },
                  { time:"14:02:31", tag:"warn", cls:"warn", msg:"sqale_index →", val:"+340 min", valCls:"gold" },
                  { time:"14:02:31", tag:"crit", cls:"crit", msg:"vulnerabilities →", val:"+2", valCls:"red" },
                  { time:"14:02:32", tag:"ok",   cls:"ok",   msg:"Dashboard mis à jour", val:"✓", valCls:"green" },
                ].map((l, i) => (
                  <div key={i} className="t-line">
                    <span className="t-time">{l.time}</span>
                    <span className={`t-tag ${l.cls}`}>{l.tag}</span>
                    <span className="t-msg">{l.msg} <span className={`t-val ${l.valCls}`}>{l.val}</span></span>
                  </div>
                ))}
                <div className="t-line">
                  <span className="t-time">14:02:33</span>
                  <span className="t-tag push">live</span>
                  <span className="t-msg">En écoute… <span className="t-cursor"/></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SSE EXPLAINER */}
      <section className="sse-section">
        <div className="reveal section-eyebrow">Architecture SSE</div>
        <div className="sse-layout">
          <div className="sse-diagram reveal">
            {[
              { icon:"⬡", label:"GitHub", sub:"Nouveau push détecté sur votre branche" },
              { icon:"⚙️", label:"SonarQube", sub:"Analyse du code source, génération des métriques" },
              { icon:"📊", label:"Votre Dashboard", sub:"Les graphiques se mettent à jour instantanément" },
            ].map(({ icon, label, sub }) => (
              <div key={label} className="sse-row">
                <div className="sse-icon">{icon}</div>
                <div className="sse-arrow">→</div>
                <div>
                  <div className="sse-label">{label}</div>
                  <div className="sse-sub">{sub}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="sse-right">
            {[
              { num:"~0ms", label:"Délai de notification", desc:"PostgreSQL LISTEN/NOTIFY est instantané. Pas de polling, pas d'attente." },
              { num:"1", label:"Connexion HTTP unique", desc:"EventSource maintient une seule connexion persistante pour tous les commits." },
              { num:"∞", label:"Commits en temps réel", desc:"Autant de commits que vous voulez, le stream reste ouvert indéfiniment." },
            ].map(({ num, label, desc }) => (
              <div key={label} className="sse-stat reveal">
                <div className="sse-stat-num">{num}</div>
                <div>
                  <div className="sse-stat-label">{label}</div>
                  <div className="sse-stat-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-glow"/>
        <h2 className="cta-title reveal">Prêt à inspecter votre<br /><em>dette technique</em> ?</h2>
        <p className="cta-sub reveal">Gratuit. Aucune configuration. Résultats en moins de 2 minutes.</p>
        <button className="cta-btn reveal" onClick={() => router.push("/analyser")}>
          Commencer maintenant
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-logo">Technical<em>Debt</em>Inspector</div>
        <div>© 2025/2026</div>
      </footer>
    </>
  );
}