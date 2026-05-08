import { useRouter } from "next/router";
import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import ProtectedRoute from "@/ui/components/ProtectedRoute";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
declare const Chart: any;

interface Resultat {
  id_push: string;
  id_branche: number;
  date_push: string;
  bugs: number;
  reliability_remediation_effort: number;
  vulnerabilities: number;
  security_remediation_effort: number;
  code_smells: number;
  sqale_index: number;
  sqale_debt_ratio: number;
  complexity: number;
  cognitive_complexity: number;
  lines: number;
  ncloc: number;
  duplicated_lines: number;
  duplicated_lines_density: number;
  new_technical_debt: number;
  new_reliability_remediation_effort: number;
  new_security_remediation_effort: number;
  top_debt_files: Array<{ file: string; debt: number }> | null;
  Somme: number | null;
  somme_dis: number | null;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=IBM+Plex+Mono:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#060709;--bg2:#0A0C10;--bg3:#0F1116;
  --border:#1A1F2E;--border2:#242938;
  --gold:#E8A020;--gold2:#F5C048;
  --red:#E24B4A;--green:#2ECC87;
  --blue:#4C9EFF;--purple:#A78BFA;
  --text:#EAE6DF;--muted:#525C70;--muted2:#8892A4;
  --glass:rgba(10,12,16,0.7);
}
body{background:var(--bg);color:var(--text);font-family:'IBM Plex Mono',monospace;min-height:100vh;overflow-x:hidden}
.bg-fx{position:fixed;inset:0;z-index:0;pointer-events:none}
.bg-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(232,160,32,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(232,160,32,.018) 1px,transparent 1px);background-size:52px 52px}
.bg-glow1{position:absolute;top:-20%;left:-10%;width:60%;height:60%;background:radial-gradient(ellipse,rgba(232,160,32,.06) 0%,transparent 70%)}
.bg-glow2{position:absolute;bottom:-10%;right:-5%;width:50%;height:50%;background:radial-gradient(ellipse,rgba(76,158,255,.05) 0%,transparent 70%)}
.page{position:relative;z-index:1;min-height:100vh;display:flex;flex-direction:column}
.hdr{display:flex;align-items:center;justify-content:space-between;padding:16px 36px;border-bottom:1px solid var(--border);background:rgba(6,7,9,0.85);backdrop-filter:blur(16px);position:sticky;top:0;z-index:100}
.hdr-logo{font-family:'DM Serif Display',serif;font-size:15px;letter-spacing:-.02em;color:var(--text)}
.hdr-logo em{color:var(--gold);font-style:italic}
.hdr-crumbs{display:flex;align-items:center;gap:8px;font-size:10px;color:var(--muted);letter-spacing:.08em}
.hdr-crumbs b{color:var(--gold2)}
.hdr-right{display:flex;align-items:center;gap:12px}
.live-pill{display:flex;align-items:center;gap:6px;font-size:9px;letter-spacing:.14em;text-transform:uppercase;padding:5px 12px;border-radius:20px;border:1px solid rgba(46,204,135,.25);color:var(--green);background:rgba(46,204,135,.06)}
.live-dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:blink 1.6s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}
.count-pill{font-size:9px;letter-spacing:.1em;padding:5px 12px;border:1px solid var(--border2);color:var(--muted2);border-radius:20px}
.hero{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid var(--border);background:var(--border)}
.hero-card{background:var(--bg2);padding:28px 32px;position:relative;overflow:hidden;border-right:1px solid var(--border)}
.hero-card:last-child{border-right:none}
.hero-accent{position:absolute;top:0;left:0;right:0;height:2px}
.hero-card.bugs .hero-accent{background:linear-gradient(90deg,transparent,var(--red),transparent)}
.hero-card.smells .hero-accent{background:linear-gradient(90deg,transparent,var(--gold),transparent)}
.hero-card.vulns .hero-accent{background:linear-gradient(90deg,transparent,var(--purple),transparent)}
.hero-label{font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin-bottom:14px;display:flex;align-items:center;gap:7px}
.hero-dot{width:5px;height:5px;border-radius:50%}
.hero-card.bugs .hero-dot{background:var(--red)}
.hero-card.smells .hero-dot{background:var(--gold)}
.hero-card.vulns .hero-dot{background:var(--purple)}
.hero-n{font-size:58px;line-height:1;font-weight:600;letter-spacing:-.04em}
.hero-card.bugs .hero-n{color:var(--red)}
.hero-card.smells .hero-n{color:var(--gold)}
.hero-card.vulns .hero-n{color:var(--purple)}
.hero-effort{margin-top:10px;font-size:12px;font-weight:500}
.hero-card.bugs .hero-effort{color:rgba(226,75,74,.65)}
.hero-card.smells .hero-effort{color:rgba(232,160,32,.65)}
.hero-card.vulns .hero-effort{color:rgba(167,139,250,.65)}
.hero-sub{font-size:10px;color:var(--muted);margin-top:3px}
.hero-bg-letter{position:absolute;right:16px;bottom:-8px;font-size:88px;font-weight:700;line-height:1;opacity:.03;font-family:'DM Serif Display',serif}
.mini-row{display:grid;grid-template-columns:repeat(3,1fr);background:var(--border);border-bottom:1px solid var(--border)}
.mini-stat{background:var(--bg2);padding:22px 28px;position:relative;overflow:hidden;border-right:1px solid var(--border);transition:background .2s;}
.mini-stat:last-child{border-right:none}
.mini-stat:hover{background:#0D1017}
.mini-stat::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}
.mini-stat.cyclo::before{background:linear-gradient(90deg,transparent,var(--blue),transparent)}
.mini-stat.cogn::before{background:linear-gradient(90deg,transparent,var(--purple),transparent)}
.mini-stat.dup::before{background:linear-gradient(90deg,transparent,var(--gold),transparent)}
.mini-stat.ncloc::before{background:linear-gradient(90deg,transparent,var(--green),transparent)}
.mini-stat.cyclo:hover{box-shadow:inset 0 0 60px rgba(76,158,255,.04)}
.mini-stat.cogn:hover{box-shadow:inset 0 0 60px rgba(167,139,250,.04)}
.mini-stat.dup:hover{box-shadow:inset 0 0 60px rgba(232,160,32,.04)}
.mini-stat.ncloc:hover{box-shadow:inset 0 0 60px rgba(46,204,135,.04)}
.mini-label{font-size:9px;letter-spacing:.18em;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:6px;}
.mini-stat.cyclo .mini-label{color:var(--blue)}
.mini-stat.cogn .mini-label{color:var(--purple)}
.mini-stat.dup .mini-label{color:var(--gold)}
.mini-stat.ncloc .mini-label{color:var(--green)}
.mini-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.mini-stat.cyclo .mini-dot{background:var(--blue)}
.mini-stat.cogn .mini-dot{background:var(--purple)}
.mini-stat.dup .mini-dot{background:var(--gold)}
.mini-stat.ncloc .mini-dot{background:var(--green)}
.mini-val{font-size:36px;font-weight:600;line-height:1;letter-spacing:-.04em;margin-bottom:6px;}
.mini-val.ok{color:var(--green)}
.mini-val.warn{color:var(--gold)}
.mini-val.danger{color:var(--red)}
.mini-val.neutral{color:var(--text)}
.mini-sub{font-size:10px;color:var(--muted);margin-top:4px;letter-spacing:.03em}
.mini-badge{display:inline-flex;align-items:center;font-size:8px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;padding:2px 8px;border-radius:20px;margin-top:8px;}
.mini-badge.ok{color:var(--green);background:rgba(46,204,135,.08);border:1px solid rgba(46,204,135,.2)}
.mini-badge.warn{color:var(--gold);background:rgba(232,160,32,.08);border:1px solid rgba(232,160,32,.2)}
.mini-badge.danger{color:var(--red);background:rgba(226,75,74,.08);border:1px solid rgba(226,75,74,.2)}
.mini-badge.neutral{color:var(--muted2);background:rgba(136,146,164,.06);border:1px solid rgba(136,146,164,.15)}
.content{padding:28px 36px;display:flex;flex-direction:column;gap:22px}
.row{display:grid;gap:22px}
.row.c2{grid-template-columns:1fr 1fr}
.row.c60{grid-template-columns:3fr 2fr}
.card{background:var(--glass);border:1px solid var(--border);border-radius:3px;backdrop-filter:blur(12px);overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.3)}
.card-hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid var(--border)}
.card-title{font-family:'DM Serif Display',serif;font-size:15px;letter-spacing:-.01em;color:var(--text)}
.card-title em{color:var(--gold);font-style:italic}
.card-tag{font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);border:1px solid var(--border2);padding:3px 9px}
.card-body{padding:20px}
.mini-spark{height:52px;margin-top:10px;position:relative}
canvas{display:block;width:100%!important}
.gauge-wrap{display:flex;flex-direction:column;align-items:center;padding:24px 20px;gap:16px}
.gauge-rel{position:relative;width:200px;height:104px}
.gauge-val{position:absolute;bottom:2px;left:50%;transform:translateX(-50%);text-align:center}
.gauge-num{font-size:38px;font-weight:600;line-height:1;letter-spacing:-.04em}
.gauge-unit{font-size:11px;color:var(--muted);margin-top:2px}
.prof-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
.pcard{border:1px solid var(--border);border-radius:4px;padding:10px 12px;cursor:pointer;background:var(--bg);transition:border-color .2s}
.pcard:hover{border-color:var(--border2)}
.pcard.on{border:1.5px solid #2ECC87;background:rgba(46,204,135,.05)}
.pcard.con{border:1.5px solid var(--purple);background:rgba(167,139,250,.05)}
.ph{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.pn{font-size:10px;font-weight:600;color:var(--text);letter-spacing:.04em}
.pc{font-size:9px;color:var(--muted);margin-bottom:7px;line-height:1.4}
.pbars{display:flex;flex-direction:column;gap:3px}
.pb-row{display:flex;align-items:center;gap:5px}
.pb-l{font-size:8px;color:var(--muted);width:10px;flex-shrink:0}
.pb-t{flex:1;height:3px;background:var(--border);border-radius:2px;overflow:hidden}
.pb-f{height:100%;border-radius:2px}
.pb-v{font-size:8px;color:var(--muted);min-width:24px;text-align:right}
.chk{width:13px;height:13px;border-radius:50%;border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;font-size:7px;flex-shrink:0;color:transparent}
.pcard.on .chk{background:#2ECC87;border-color:#2ECC87;color:#000}
.pcard.con .chk{background:var(--purple);border-color:var(--purple);color:#fff}
.cpanel{background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:12px 14px;margin-bottom:12px;display:none}
.cpanel.show{display:block}
.cpt{font-size:8px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px}
.crow-w{display:flex;align-items:center;gap:8px;margin-bottom:5px}
.crow-w:last-child{margin-bottom:0}
.clbl{font-size:10px;color:var(--text);width:90px;flex-shrink:0}
.cbtns{display:flex;gap:3px}
.cb{font-size:9px;padding:2px 8px;border-radius:3px;border:1px solid var(--border2);background:var(--bg);cursor:pointer;color:var(--muted)}
.cb.on{background:var(--purple);color:#fff;border-color:var(--purple)}
.cw{font-size:11px;font-weight:600;color:var(--purple);margin-left:4px;min-width:28px;text-align:right}
.wdisplay{display:flex;background:rgba(46,204,135,.05);border:1px solid rgba(46,204,135,.2);border-radius:4px;overflow:hidden;margin-bottom:12px}
.wdi{flex:1;text-align:center;padding:8px 4px;border-right:1px solid rgba(46,204,135,.2)}
.wdi:last-child{border-right:none}
.wdv{font-size:14px;font-weight:600;color:#2ECC87;letter-spacing:-.02em}
.wdl{font-size:8px;color:rgba(46,204,135,.7);text-transform:uppercase;letter-spacing:.08em;margin-top:2px}
.fbox{font-size:9px;color:var(--muted);font-family:'IBM Plex Mono',monospace;padding:8px 12px;background:var(--bg3);border-radius:4px;border-left:2px solid #2ECC87;line-height:1.8}
.fv{color:#2ECC87;font-weight:600}
.loading{position:fixed;inset:0;background:var(--bg);z-index:999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px}
.loading-logo{font-family:'DM Serif Display',serif;font-size:32px;color:var(--text);letter-spacing:-.03em}
.loading-logo em{color:var(--gold);font-style:italic}
.loading-bar{width:180px;height:1px;background:var(--border2);position:relative;overflow:hidden}
.loading-bar::after{content:'';position:absolute;inset:0;background:var(--gold);animation:scan 1.6s ease-in-out infinite}
@keyframes scan{0%{transform:scaleX(0)}50%{transform:scaleX(1)}100%{transform:scaleX(0) translateX(200%)}}
.loading-txt{font-size:10px;color:var(--muted);letter-spacing:.14em;text-transform:uppercase}
@media(max-width:900px){
  .hero{grid-template-columns:1fr}
  .mini-row{grid-template-columns:repeat(2,1fr)}
  .row.c2,.row.c60{grid-template-columns:1fr}
  .content{padding:16px}
  .hdr{padding:14px 16px}
}
/* ── CUSUM CARD ── */
.cusum-meta{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;gap:12px;flex-wrap:wrap}
.cusum-kpi{display:flex;flex-direction:column;align-items:center;padding:10px 18px;border-radius:4px;border:1px solid var(--border2);background:var(--bg3);min-width:80px}
.cusum-kpi-val{font-size:22px;font-weight:600;letter-spacing:-.03em;line-height:1}
.cusum-kpi-lbl{font-size:8px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin-top:4px}
.cusum-zones-legend{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.cusum-zone-item{display:flex;align-items:center;gap:5px;font-size:9px;color:var(--muted);letter-spacing:.06em}
.cusum-zone-swatch{width:10px;height:3px;border-radius:2px}
.cusum-alarm{display:flex;align-items:center;gap:7px;padding:8px 14px;border-radius:4px;font-size:10px;font-weight:600;letter-spacing:.06em;margin-top:12px}
.cusum-alarm.ok{color:#2ECC87;background:rgba(46,204,135,.08);border:1px solid rgba(46,204,135,.2)}
.cusum-alarm.warn{color:#F59E42;background:rgba(245,158,66,.08);border:1px solid rgba(245,158,66,.2)}
.cusum-alarm.danger{color:#E24B4A;background:rgba(226,75,74,.08);border:1px solid rgba(226,75,74,.2)}
/* ── RUPTURE WIDGET ── */
.rupt-card{position:relative;overflow:hidden;background:var(--bg2);border:1px solid var(--border);border-radius:3px;backdrop-filter:blur(12px);box-shadow:0 4px 24px rgba(0,0,0,.3);}
.rupt-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#FF4B6E,transparent);}
.rupt-stable::before{background:linear-gradient(90deg,transparent,#2ECC87,transparent);}
.rupt-inner{padding:28px 32px;display:flex;gap:40px;align-items:stretch;flex-wrap:wrap}
.rupt-left{flex:1;min-width:220px;display:flex;flex-direction:column;justify-content:center;gap:14px}
.rupt-eyebrow{font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:8px}
.rupt-eyebrow-dot{width:5px;height:5px;border-radius:50%;background:#FF4B6E;flex-shrink:0}
.rupt-stable .rupt-eyebrow-dot{background:#2ECC87}
.rupt-headline{font-family:'DM Serif Display',serif;font-size:18px;color:var(--text);line-height:1.3;letter-spacing:-.02em}
.rupt-headline em{color:#FF4B6E;font-style:italic}
.rupt-stable .rupt-headline em{color:#2ECC87}
.rupt-formula{font-size:9px;color:var(--muted);padding:7px 12px;background:var(--bg3);border-radius:3px;border-left:2px solid #FF4B6E;line-height:1.8;letter-spacing:.02em}
.rupt-stable .rupt-formula{border-left-color:#2ECC87}
.rupt-center{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:0 24px;border-left:1px solid var(--border);border-right:1px solid var(--border);flex-shrink:0}
.rupt-n-label{font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
.rupt-n-value{font-size:72px;font-weight:600;line-height:1;letter-spacing:-.06em;font-variant-numeric:tabular-nums}
.rupt-n-unit{font-size:10px;color:var(--muted2);letter-spacing:.08em}
.rupt-n-value.safe{color:#2ECC87}
.rupt-n-value.warn{color:#FF4B6E;text-shadow:0 0 40px rgba(255,75,110,.25);}
.rupt-n-value.imm{color:#FF4B6E;animation:rupt-pulse 1.4s ease-in-out infinite;}
@keyframes rupt-pulse{0%,100%{opacity:1;text-shadow:0 0 20px rgba(255,75,110,.3)}50%{opacity:.75;text-shadow:0 0 50px rgba(255,75,110,.5)}}
.rupt-right{flex:1;min-width:200px;display:flex;flex-direction:column;justify-content:space-between;gap:14px}
.rupt-kpis{display:flex;flex-direction:column;gap:8px}
.rupt-kpi{display:flex;justify-content:space-between;align-items:center;padding:8px 14px;background:var(--bg3);border-radius:3px;border:1px solid var(--border)}
.rupt-kpi-label{font-size:9px;color:var(--muted);letter-spacing:.08em;text-transform:uppercase}
.rupt-kpi-val{font-size:13px;font-weight:600;letter-spacing:-.02em}
.rupt-bar-wrap{display:flex;flex-direction:column;gap:5px}
.rupt-bar-lbl{display:flex;justify-content:space-between;font-size:8px;color:var(--muted);letter-spacing:.06em}
.rupt-bar-track{width:100%;height:6px;background:var(--border);border-radius:3px;overflow:hidden}
.rupt-bar-fill{height:100%;border-radius:3px;transition:width .8s cubic-bezier(.4,0,.2,1)}
.rupt-stable-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:40px 32px;text-align:center;}
.rupt-stable-icon{font-size:48px;animation:float 3s ease-in-out infinite;}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.rupt-stable-title{font-family:'DM Serif Display',serif;font-size:26px;color:#2ECC87;letter-spacing:-.03em}
.rupt-stable-sub{font-size:11px;color:var(--muted);letter-spacing:.04em;line-height:1.7;max-width:380px}
.rupt-stable-badge{display:inline-flex;align-items:center;gap:8px;padding:8px 20px;border-radius:50px;background:rgba(46,204,135,.08);border:1px solid rgba(46,204,135,.2);font-size:9px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#2ECC87;}

/* ══════════════════════════════════════════════════════════
   ── COMPOSANT IA · ABEILLE ─────────────────────────────
   ══════════════════════════════════════════════════════════ */
.ai-card{
  position:relative;overflow:hidden;
  background:linear-gradient(135deg,rgba(232,160,32,.04) 0%,rgba(10,12,16,0.95) 40%);
  border:1px solid rgba(232,160,32,.25);
  border-radius:3px;
  box-shadow:0 0 40px rgba(232,160,32,.06), 0 4px 24px rgba(0,0,0,.4);
}
.ai-card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent,#E8A020,#F5C048,#E8A020,transparent);
}
.ai-card-hdr{
  display:flex;align-items:center;justify-content:space-between;
  padding:14px 20px;border-bottom:1px solid rgba(232,160,32,.12);
}
.ai-hdr-left{display:flex;align-items:center;gap:12px}
.ai-bee-btn{
  position:relative;width:38px;height:38px;border-radius:50%;
  background:linear-gradient(135deg,#E8A020,#F5C048);
  border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;
  font-size:20px;transition:transform .2s,box-shadow .2s;
  box-shadow:0 0 0 0 rgba(232,160,32,.4);
  flex-shrink:0;
}
.ai-bee-btn:hover{transform:scale(1.08);box-shadow:0 0 16px rgba(232,160,32,.35)}
.ai-bee-btn.loading-bee{
  animation:bee-pulse 1.2s ease-in-out infinite;
}
@keyframes bee-pulse{
  0%,100%{box-shadow:0 0 0 0 rgba(232,160,32,.5);transform:scale(1)}
  50%{box-shadow:0 0 0 10px rgba(232,160,32,0);transform:scale(1.05)}
}
.ai-title-block{}
.ai-title{font-family:'DM Serif Display',serif;font-size:15px;letter-spacing:-.01em;color:var(--text)}
.ai-title em{color:var(--gold);font-style:italic}
.ai-subtitle{font-size:9px;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-top:2px}
.ai-status-row{display:flex;align-items:center;gap:8px}
.ai-commit-badge{
  font-size:8px;letter-spacing:.1em;padding:3px 9px;
  border:1px solid var(--border2);color:var(--muted2);border-radius:20px;
  font-family:'IBM Plex Mono',monospace;
}
.ai-tag{font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:rgba(232,160,32,.6);border:1px solid rgba(232,160,32,.2);padding:3px 9px;border-radius:2px}
/* Body zone */
.ai-body{padding:20px}
/* Empty / initial state */
.ai-empty{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:14px;padding:36px 20px;text-align:center;
}
.ai-empty-bee{font-size:40px;opacity:.55;animation:float 3.5s ease-in-out infinite}
.ai-empty-title{font-family:'DM Serif Display',serif;font-size:16px;color:var(--muted2);letter-spacing:-.01em}
.ai-empty-sub{font-size:10px;color:var(--muted);letter-spacing:.04em;line-height:1.7;max-width:320px}
.ai-launch-btn{
  display:inline-flex;align-items:center;gap:8px;
  padding:9px 20px;border-radius:3px;
  background:linear-gradient(135deg,#E8A020,#F5C048);
  color:#0A0C10;font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;
  border:none;cursor:pointer;font-family:'IBM Plex Mono',monospace;
  transition:opacity .2s,transform .2s;
}
.ai-launch-btn:hover{opacity:.88;transform:translateY(-1px)}
.ai-launch-btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
/* Loading state */
.ai-loading-zone{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:12px;padding:36px 20px;
}
.ai-spinner{
  width:32px;height:32px;border-radius:50%;
  border:2px solid rgba(232,160,32,.15);
  border-top-color:#E8A020;
  animation:spin 0.9s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg)}}
.ai-loading-txt{font-size:10px;color:var(--muted);letter-spacing:.12em;text-transform:uppercase}
.ai-loading-commit{font-size:9px;color:rgba(232,160,32,.5);font-family:'IBM Plex Mono',monospace}
/* Result state */
.ai-result-zone{display:flex;flex-direction:column;gap:16px}
/* Commit info bar */
.ai-commit-bar{
  display:flex;align-items:center;gap:8px;flex-wrap:wrap;
  padding:8px 12px;background:var(--bg3);border-radius:3px;
  border:1px solid var(--border);font-size:9px;
}
.ai-commit-sha{color:var(--gold2);font-weight:600;letter-spacing:.06em}
.ai-commit-sep{color:var(--border2)}
.ai-commit-date{color:var(--muted)}
.ai-commit-ratio{
  margin-left:auto;font-size:10px;font-weight:600;
  padding:2px 8px;border-radius:12px;
}
.ai-commit-ratio.ok{color:var(--green);background:rgba(46,204,135,.1);border:1px solid rgba(46,204,135,.2)}
.ai-commit-ratio.warn{color:var(--gold);background:rgba(232,160,32,.1);border:1px solid rgba(232,160,32,.2)}
.ai-commit-ratio.danger{color:var(--red);background:rgba(226,75,74,.1);border:1px solid rgba(226,75,74,.2)}
/* Markdown rendered output */
.ai-text{
  font-size:12px;line-height:1.85;color:var(--text);
  font-family:'IBM Plex Mono',monospace;
  white-space:pre-wrap;word-break:break-word;
}
.ai-text h2{
  font-family:'DM Serif Display',serif;font-size:15px;color:var(--gold);
  letter-spacing:-.01em;margin:14px 0 6px;
}
.ai-text h3{
  font-size:11px;font-weight:600;color:var(--gold2);
  text-transform:uppercase;letter-spacing:.1em;margin:10px 0 4px;
}
.ai-text strong{color:var(--gold2);font-weight:600}
.ai-text em{color:var(--purple);font-style:italic}
.ai-text code{
  background:var(--bg3);border:1px solid var(--border2);
  padding:1px 5px;border-radius:3px;font-size:10px;color:var(--green);
}
.ai-text ul,.ai-text ol{padding-left:16px;margin:4px 0}
.ai-text li{margin-bottom:3px}
.ai-text blockquote{
  border-left:2px solid var(--gold);padding:6px 12px;margin:8px 0;
  background:rgba(232,160,32,.04);color:var(--muted2);
}
.ai-text hr{border:none;border-top:1px solid var(--border);margin:12px 0}
/* Metrics snapshot */
.ai-metrics-snap{
  display:grid;grid-template-columns:repeat(4,1fr);gap:6px;
}
.ai-metric-chip{
  display:flex;flex-direction:column;align-items:center;
  padding:8px 6px;background:var(--bg3);border:1px solid var(--border);
  border-radius:3px;
}
.ai-metric-val{font-size:16px;font-weight:600;letter-spacing:-.02em}
.ai-metric-lbl{font-size:7px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-top:3px;text-align:center}
/* Refresh button */
.ai-refresh-row{display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:4px}
.ai-refresh-btn{
  display:inline-flex;align-items:center;gap:6px;
  padding:6px 14px;border-radius:3px;border:1px solid rgba(232,160,32,.25);
  background:rgba(232,160,32,.06);color:var(--gold);
  font-size:9px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;
  cursor:pointer;font-family:'IBM Plex Mono',monospace;
  transition:background .2s,border-color .2s;
}
.ai-refresh-btn:hover{background:rgba(232,160,32,.12);border-color:rgba(232,160,32,.4)}
.ai-refresh-btn:disabled{opacity:.35;cursor:not-allowed}
.ai-analyzed-at{font-size:8px;color:var(--muted);letter-spacing:.06em}
/* Error state */
.ai-error-zone{
  display:flex;flex-direction:column;align-items:center;gap:10px;
  padding:28px 20px;text-align:center;
}
.ai-error-icon{font-size:28px;opacity:.6}
.ai-error-msg{font-size:10px;color:var(--red);letter-spacing:.04em;max-width:340px;line-height:1.6}
.ai-retry-btn{
  padding:6px 16px;border-radius:3px;border:1px solid rgba(226,75,74,.3);
  background:rgba(226,75,74,.06);color:var(--red);
  font-size:9px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;
  cursor:pointer;font-family:'IBM Plex Mono',monospace;
  transition:background .2s;
}
.ai-retry-btn:hover{background:rgba(226,75,74,.14)}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONO = "'IBM Plex Mono',monospace";
const TOOLTIP_CFG = {
  backgroundColor:"#0A0C10",borderColor:"#1A1F2E",borderWidth:1,
  titleColor:"#EAE6DF",bodyColor:"#525C70",padding:10,
  titleFont:{family:MONO,size:11},bodyFont:{family:MONO,size:10}
};
const LEGEND_CFG = {
  labels:{color:"#525C70",font:{family:MONO,size:9},boxWidth:10,boxHeight:10,padding:14}
};
const TICK_CFG = {color:"#2D3444",font:{family:MONO,size:9}};
const GRID_CFG = {color:"#1A1F2E"};

function fmtMin(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 480) return `${(n/480).toFixed(1)}d`;
  if (n >= 60)  return `${(n/60).toFixed(1)}h`;
  return `${n}m`;
}
function getLabel(r: Resultat): string {
  if (!r.date_push) return r.id_push.slice(0,7);
  const d = new Date(r.date_push);
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,"0")}`;
}
function getDebtColor(ratio: number): string {
  const pct = ratio * 100;
  if (pct < 5)  return "#2ECC87";
  if (pct < 10) return "#E8A020";
  return "#E24B4A";
}
function calcRepay(
  arr: Resultat[],
  getVal: (r: Resultat) => number,
  getNew: (r: Resultat) => number
): Array<number | null> {
  return arr.map((r, i) => {
    if (i === 0) return null;
    const prev = getVal(arr[i - 1]);
    if (!prev) return null;
    return (prev - getVal(r) + getNew(r)) / prev;
  });
}

// ─── Simple markdown renderer ─────────────────────────────────────────────────
function renderMarkdown(text: string): string {
  return text
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
    .replace(/((?:<li>[\s\S]*?<\/li>\n?)+)/g, '<ul>$1</ul>')
    .replace(/\n\n/g, '<br/><br/>');
}

// ─── AI Bee Component ─────────────────────────────────────────────────────────
type AiState = "idle" | "loading" | "done" | "error";

interface PredResult {
  current: number;
  predictions: {
    m1: { value: number; delta_pct: number; alert: string };
    m2: { value: number; delta_pct: number; alert: string };
    m3: { value: number; delta_pct: number; alert: string };
  };
  trend: string;
  trend_label: string;
}

function AiBeeCard({
  lastResult,
  allResults,
  hValue,
  nomProjet,
  nomBranche,
}: {
  lastResult: Resultat | undefined;
  allResults: Resultat[];
  hValue: number | null;
  nomProjet: string;
  nomBranche: string;
}) {
  const [state, setAiState]           = useState<AiState>("idle");
  const [predData, setPredData]       = useState<PredResult | null>(null);
  const [error, setError]             = useState<string>("");
  const [showResults, setShowResults] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<"m1"|"m2"|"m3">("m1");
  const lastAnalyzedSha               = useRef<string>("");

  // ── auto-refresh quand un NOUVEAU push arrive ─────────────────────────────
  useEffect(() => {
    if (!lastResult) return;
    if (lastResult.id_push === lastAnalyzedSha.current) return;
    if (predData !== null) runPredict(lastResult);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastResult?.id_push]);

  const runPredict = useCallback(async (r: Resultat) => {
    if (!r) return;
    setAiState("loading");
    setShowResults(true);
    setError("");
    lastAnalyzedSha.current = r.id_push;

    try {
      const response = await fetch(`${API}/auth/ai/predict`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ncloc:            r.ncloc            ?? 0,
          complexity:       r.complexity       ?? 0,
          bugs:             r.bugs             ?? 0,
          vulnerabilities:  r.vulnerabilities  ?? 0,
          code_smells:      r.code_smells      ?? 0,
          sqale_index:      r.sqale_index      ?? 0,
          sqale_debt_ratio: r.sqale_debt_ratio ?? 0,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.detail ?? `HTTP ${response.status}`);
      }

      const data: PredResult = await response.json();
      setPredData(data);
      setAiState("done");
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue");
      setAiState("error");
    }
  }, []);

  // Clic sur l'abeille : lance la prédiction si idle, sinon toggle l'affichage
  const handleBeeClick = () => {
    if (!lastResult || state === "loading") return;
    if (state === "idle") {
      runPredict(lastResult);
    } else {
      setShowResults(v => !v);
    }
  };

  const ratio      = lastResult ? lastResult.sqale_debt_ratio * 100 : 0;
  const ratioClass = ratio < 5 ? "ok" : ratio < 10 ? "warn" : "danger";

  // couleur par niveau d'alerte
  const alertColor = (a: string) => a === "ok" ? "var(--green)" : a === "warn" ? "var(--gold)" : "var(--red)";
  const alertClass = (a: string) => a === "ok" ? "ok" : a === "warn" ? "warn" : "danger";

  return (
    <div className="ai-card">

      {/* ── Abeille fixe en haut de l'écran ── */}
      <div style={{
        position:"fixed", top:80, right:28,
        zIndex:200, display:"flex", flexDirection:"column", alignItems:"center", gap:6,
        pointerEvents:"none",
      }}>
        <button
          className={`ai-bee-btn${state === "loading" ? " loading-bee" : ""}`}
          onClick={handleBeeClick}
          disabled={state === "loading" || !lastResult}
          title="Cliquez pour afficher / masquer les prédictions IA"
          style={{
            width:56, height:56, fontSize:28, pointerEvents:"all",
            boxShadow:"0 0 0 4px rgba(232,160,32,.25), 0 4px 20px rgba(232,160,32,.35)",
          }}
        >
          🐝
        </button>
        {state === "loading" && (
          <div style={{
            fontSize:8, letterSpacing:".12em", textTransform:"uppercase",
            color:"var(--gold)", background:"rgba(6,7,9,.9)", padding:"2px 8px",
            borderRadius:10, border:"1px solid rgba(232,160,32,.2)", pointerEvents:"none",
          }}>Calcul…</div>
        )}
      </div>

      {/* ── Titre de la carte ── */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"14px 20px", borderBottom:"1px solid rgba(232,160,32,.12)",
      }}>
        <div>
          <div className="ai-title">Prédiction <em>IA</em> · M+1 / M+2 / M+3</div>
          <div className="ai-subtitle">LightGBM · sqale_debt_ratio</div>
        </div>
        <div className="ai-tag">ML Models</div>
      </div>

      {/* ── Corps : visible uniquement après clic sur l'abeille ── */}
      {showResults && (
        <div className="ai-body">

          {/* État loading */}
          {state === "loading" && (
            <div className="ai-loading-zone">
              <div className="ai-spinner"/>
              <div className="ai-loading-txt">Calcul des prédictions…</div>
              {lastResult && (
                <div className="ai-loading-commit">
                  commit {lastResult.id_push.slice(0,10)} · dette actuelle {ratio.toFixed(2)}%
                </div>
              )}
            </div>
          )}

          {/* État erreur */}
          {state === "error" && (
            <div className="ai-error-zone">
              <div className="ai-error-icon">⚠️</div>
              <div className="ai-error-msg">{error}</div>
              <button className="ai-retry-btn" onClick={() => lastResult && runPredict(lastResult)}>
                Réessayer
              </button>
            </div>
          )}

          {/* État done → sélecteur de mois + affichage */}
          {state === "done" && predData && (
            <div className="ai-result-zone">

              {/* Barre date + dette actuelle */}
              <div className="ai-commit-bar">
                <span className="ai-commit-date">
                  {lastResult?.date_push ? new Date(lastResult.date_push).toLocaleString("fr-FR") : ""}
                </span>
                <span className={`ai-commit-ratio ${ratioClass}`}>
                  Actuel {(predData.current / 100).toFixed(4)}
                </span>
              </div>

              {/* Onglets M+1 / M+2 / M+3 */}
              <div style={{display:"flex",gap:6}}>
                {(["m1","m2","m3"] as const).map((key, idx) => {
                  const active = selectedMonth === key;
                  const p = predData.predictions[key];
                  const ac = alertColor(p.alert);
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedMonth(key)}
                      style={{
                        flex:1, padding:"9px 0",
                        background: active ? "rgba(232,160,32,.12)" : "var(--bg3)",
                        color: active ? "var(--gold2)" : "var(--muted)",
                        border: active ? "1px solid rgba(232,160,32,.45)" : "1px solid var(--border)",
                        borderRadius:3, cursor:"pointer",
                        fontSize:10, fontWeight:600, letterSpacing:".12em",
                        textTransform:"uppercase", fontFamily:"'IBM Plex Mono',monospace",
                        transition:"all .18s",
                      }}
                    >
                      M+{idx+1}
                    </button>
                  );
                })}
              </div>

              {/* Carte du mois sélectionné */}
              {(() => {
                const p = predData.predictions[selectedMonth];
                const mIdx = selectedMonth === "m1" ? 1 : selectedMonth === "m2" ? 2 : 3;
                const deltaSign = p.delta_pct >= 0 ? "+" : "";
                const ac = alertColor(p.alert);
                return (
                  <div style={{
                    display:"flex", flexDirection:"column", alignItems:"center",
                    padding:"28px 20px",
                    background:"var(--bg3)",
                    border:`1px solid ${p.alert==="ok"?"rgba(46,204,135,.25)":p.alert==="warn"?"rgba(232,160,32,.25)":"rgba(226,75,74,.25)"}`,
                    borderRadius:4, position:"relative", overflow:"hidden", gap:10,
                  }}>
                    {/* Accent haut */}
                    <div style={{
                      position:"absolute",top:0,left:0,right:0,height:2,
                      background:`linear-gradient(90deg,transparent,${ac},transparent)`
                    }}/>
                    <div style={{fontSize:9,letterSpacing:".2em",textTransform:"uppercase",color:"var(--muted)"}}>
                      Prédiction · Mois +{mIdx}
                    </div>
                    <div style={{fontSize:52,fontWeight:600,lineHeight:1,letterSpacing:"-.05em",color:ac}}>
                      {(p.value / 100).toFixed(4)}
                    </div>
                    <span className={`mini-badge ${alertClass(p.alert)}`} style={{fontSize:11,padding:"4px 14px"}}>
                      {deltaSign}{(p.delta_pct / 100).toFixed(4)} vs actuel
                    </span>
                    <div style={{fontSize:10,color:ac,fontWeight:600,letterSpacing:".06em"}}>
                      {p.alert === "ok" ? "✓ Dette saine" : p.alert === "warn" ? "⚠ Zone d'alerte" : "✖ Critique"}
                    </div>
                  </div>
                );
              })()}

              {/* Tendance globale */}
              <div style={{
                display:"flex",alignItems:"center",gap:10,
                padding:"10px 16px",borderRadius:4,
                background: predData.trend==="decreasing"?"rgba(46,204,135,.06)":predData.trend==="stable"?"rgba(232,160,32,.06)":"rgba(226,75,74,.06)",
                border: predData.trend==="decreasing"?"1px solid rgba(46,204,135,.2)":predData.trend==="stable"?"1px solid rgba(232,160,32,.2)":"1px solid rgba(226,75,74,.2)",
                fontSize:11,fontWeight:600,letterSpacing:".04em",
                color: predData.trend==="decreasing"?"var(--green)":predData.trend==="stable"?"var(--gold)":"var(--red)",
              }}>
                <span style={{fontSize:16}}>{predData.trend==="decreasing"?"📉":predData.trend==="stable"?"➡️":"📈"}</span>
                <span>{predData.trend_label}</span>
                <span style={{marginLeft:"auto",fontSize:8,opacity:.6,color:"var(--muted)"}}>
                  Δ M+3 vs actuel : {(predData.predictions.m3.delta_pct >= 0 ? "+" : "")}{(predData.predictions.m3.delta_pct / 100).toFixed(4)}
                </span>
              </div>

              {/* Bouton refresh */}
              <div className="ai-refresh-row">
                <button
                  className="ai-refresh-btn"
                  onClick={() => lastResult && runPredict(lastResult)}
                >
                  ↻ Recalculer
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
function DashboardContent() {
  const router = useRouter();
  const { id_branche, nom_branche, nom_projet } = router.query as Record<string,string>;

  const [results, setResults]     = useState<Resultat[]>([]);
  const [chartReady, setChartReady] = useState(false);
  const [live, setLive]           = useState(false);
  const [hValue, setHValue]       = useState<number | null>(null);
  const [moy, setMoy]             = useState<number | null>(null);

  const PROFS: Record<string,{name:string;w:{q:number;p:number;d:number}}> = {
    balanced: {name:"Équilibré",     w:{q:.40,p:.35,d:.25}},
    quality:  {name:"Qualité first", w:{q:.60,p:.25,d:.15}},
    startup:  {name:"Startup",       w:{q:.25,p:.60,d:.15}},
    cleanup:  {name:"Assainissement",w:{q:.30,p:.15,d:.55}},
    custom:   {name:"Personnalisé",  w:{q:.40,p:.35,d:.25}},
  };
  const [activeProf, setActiveProf] = useState("balanced");
  const [weights, setWeights]       = useState({q:.40,p:.35,d:.25});
  const [cprios, setCprios]         = useState({q:1,p:2,d:3});
  const cwMap: Record<number,number> = {1:.50,2:.30,3:.20};

  const refArea   = useRef<HTMLCanvasElement>(null);
  const refRepay  = useRef<HTMLCanvasElement>(null);
  const refVelo   = useRef<HTMLCanvasElement>(null);
  const refGauge  = useRef<HTMLCanvasElement>(null);
  const refDebt   = useRef<HTMLCanvasElement>(null);
  const refDupBar = useRef<HTMLCanvasElement>(null);
  const refCusum  = useRef<HTMLCanvasElement>(null);

  const chArea    = useRef<any>(null);
  const chRepay   = useRef<any>(null);
  const chVelo    = useRef<any>(null);
  const chGauge   = useRef<any>(null);
  const chDebt    = useRef<any>(null);
  const chDupBar  = useRef<any>(null);
  const chCusum   = useRef<any>(null);

  const srcRef = useRef<EventSource | null>(null);

  /* ── SSE ── */
  useEffect(() => {
    if (!id_branche) return;
    const src = new EventSource(`${API}/auth/stream/${id_branche}`, { withCredentials: true });
    srcRef.current = src;
    src.onopen  = () => setLive(true);
    src.onerror = () => setLive(false);
    src.onmessage = (e: MessageEvent) => {
      try {
        const pt: Resultat = JSON.parse(e.data);
        setResults(prev => {
          if (prev.find(r => r.id_push === pt.id_push)) return prev;
          return [...prev, pt].sort((a,b) =>
            new Date(a.date_push).getTime() - new Date(b.date_push).getTime()
          );
        });
      } catch {}
    };
    const destroyCharts = () => {
      [chArea,chRepay,chVelo,chGauge,chDebt,chDupBar,chCusum].forEach(ref => {
        if (ref.current) { ref.current.destroy(); ref.current = null; }
      });
    };
    const cleanup = () => { src.close(); srcRef.current = null; setLive(false); destroyCharts(); };
    window.addEventListener("beforeunload", cleanup);
    router.events.on("routeChangeStart", cleanup);
    return () => { cleanup(); window.removeEventListener("beforeunload", cleanup); router.events.off("routeChangeStart", cleanup); };
  }, [id_branche]);

  /* ── FETCH H_VALUE ── */
  useEffect(() => {
    if (!id_branche) return;
    fetch(`${API}/auth/branches/${id_branche}/h-value`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.H_Value != null) setHValue(d.H_Value); })
      .catch(() => {});
  }, [id_branche]);

  /* ── FETCH MOY — se redéclenche à chaque nouveau push SSE ── */
  useEffect(() => {
    if (!id_branche || results.length === 0) return;
    fetch(`${API}/auth/branches/${id_branche}/moyenne-somme-dis`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.moyenne_somme_dis != null) setMoy(d.moyenne_somme_dis); })
      .catch(() => {});
  }, [id_branche, results.length]);

  /* ── CHARTS ── */
  useEffect(() => {
    if (!chartReady || results.length === 0 || typeof Chart === "undefined") return;
    const labels = results.map(getLabel);
    const lastPt = results[results.length - 1];

    /* 1 — Area */
    const areaData = { labels, datasets: [
      { label:"Dette (sqale_index)", data:results.map(r=>r.sqale_index), borderColor:"#E8A020", backgroundColor:"rgba(232,160,32,.13)", fill:true, tension:.4, pointRadius:2, borderWidth:2 },
      { label:"Bugs (reliability effort)", data:results.map(r=>r.reliability_remediation_effort), borderColor:"#E24B4A", backgroundColor:"rgba(226,75,74,.10)", fill:true, tension:.4, pointRadius:2, borderWidth:2 },
      { label:"Vulnérabilités (security effort)", data:results.map(r=>r.security_remediation_effort), borderColor:"#A78BFA", backgroundColor:"rgba(167,139,250,.08)", fill:true, tension:.4, pointRadius:2, borderWidth:2 },
    ]};
    const areaOpts = {
      responsive:true, maintainAspectRatio:false,
      interaction:{mode:"index",intersect:false},
      plugins:{legend:LEGEND_CFG, tooltip:TOOLTIP_CFG},
      scales:{x:{ticks:{...TICK_CFG,maxTicksLimit:8,maxRotation:0},grid:GRID_CFG},y:{ticks:TICK_CFG,grid:GRID_CFG,title:{display:true,text:"minutes",color:"#2D3444",font:{family:MONO,size:9}}}}
    };
    if (!chArea.current) chArea.current = new Chart(refArea.current, {type:"line",data:areaData,options:areaOpts});
    else { chArea.current.data = areaData; chArea.current.update("none"); }

    /* 2 — Repayment */
    const repayData = { labels, datasets: [
      { label:"D_repay (Dette)", data:calcRepay(results,r=>r.sqale_index,r=>r.new_technical_debt), borderColor:"#E8A020", backgroundColor:"transparent", tension:.4, pointRadius:2, borderWidth:2, spanGaps:true },
      { label:"R_repay (Fiabilité)", data:calcRepay(results,r=>r.reliability_remediation_effort,r=>r.new_reliability_remediation_effort), borderColor:"#E24B4A", backgroundColor:"transparent", tension:.4, pointRadius:2, borderWidth:2, spanGaps:true },
      { label:"S_repay (Sécurité)", data:calcRepay(results,r=>r.security_remediation_effort,r=>r.new_security_remediation_effort), borderColor:"#A78BFA", backgroundColor:"transparent", tension:.4, pointRadius:2, borderWidth:2, spanGaps:true },
    ]};
    const repayOpts = { responsive:true, maintainAspectRatio:false, interaction:{mode:"index",intersect:false}, plugins:{legend:LEGEND_CFG,tooltip:TOOLTIP_CFG}, scales:{x:{ticks:{...TICK_CFG,maxTicksLimit:8,maxRotation:0},grid:GRID_CFG},y:{ticks:TICK_CFG,grid:GRID_CFG,title:{display:true,text:"ratio",color:"#2D3444",font:{family:MONO,size:9}}}} };
    if (!chRepay.current) chRepay.current = new Chart(refRepay.current, {type:"line",data:repayData,options:repayOpts});
    else { chRepay.current.data = repayData; chRepay.current.update("none"); }

    /* 3 — Velocity */
    function computeVelos(w:{q:number;p:number;d:number}): number[] {
      return results.map((r,i) => {
        const tot = (r.bugs??0)+(r.vulnerabilities??0)+(r.code_smells??0);
        const Q   = r.ncloc ? Math.max(0,1-(tot/r.ncloc)*1000) : 0;
        const prev: Resultat|null = i>0?results[i-1]:null;
        const dt  = prev?(new Date(r.date_push).getTime()-new Date(prev.date_push).getTime())/3600000:1;
        const P   = dt>0?((r.ncloc??0)-(prev?.ncloc??0))/dt:0;
        const D   = (r.sqale_debt_ratio??0);
        return +(w.q*Q+w.p*Math.tanh(P/200)-w.d*D).toFixed(3);
      });
    }
    const velos = computeVelos(weights);
    const dv: number[] = velos.map((v,i)=>i===0?0:+(v-velos[i-1]).toFixed(3));
    const veloData = { labels, datasets: [
      { type:"bar", label:"ΔV variation", data:dv, backgroundColor:dv.map((v:number)=>v>=0?"rgba(46,204,135,.6)":"rgba(226,75,74,.6)"), borderWidth:0, borderRadius:3, yAxisID:"yD", order:2 },
      { type:"line", label:"V(t) Vélocité", data:velos, borderColor:"#2ECC87", backgroundColor:"rgba(46,204,135,.07)", fill:true, tension:.4, pointRadius:3, pointBackgroundColor:"#2ECC87", borderWidth:2, yAxisID:"yV", order:1 },
    ]};
    const veloOpts = { responsive:true, maintainAspectRatio:false, interaction:{mode:"index",intersect:false}, plugins:{legend:LEGEND_CFG,tooltip:TOOLTIP_CFG}, scales:{x:{ticks:{...TICK_CFG,maxTicksLimit:8,maxRotation:0},grid:GRID_CFG},yV:{position:"left",ticks:{color:"#2ECC87",font:{family:MONO,size:9}},grid:GRID_CFG,title:{display:true,text:"V(t)",color:"#2ECC87",font:{family:MONO,size:9}}},yD:{position:"right",ticks:{color:"#6A7585",font:{family:MONO,size:9}},grid:{display:false},title:{display:true,text:"ΔV",color:"#6A7585",font:{family:MONO,size:9}}}} };
    if (!chVelo.current) chVelo.current = new Chart(refVelo.current, {type:"bar",data:veloData,options:veloOpts});
    else { chVelo.current.data = veloData; chVelo.current.update("none"); }

    /* 4 — Gauge */
    const rawRatio   = lastPt.sqale_debt_ratio ?? 0;
    const gaugeRatio = Math.min(rawRatio*100,100);
    const gaugeColor = getDebtColor(rawRatio);
    const gaugeData  = { datasets:[{data:[gaugeRatio,100-gaugeRatio],backgroundColor:[gaugeColor,"#1A1F2E"],borderWidth:0,circumference:180,rotation:270}]};
    if (!chGauge.current) chGauge.current = new Chart(refGauge.current, {type:"doughnut",data:gaugeData,options:{responsive:false,cutout:"78%",plugins:{legend:{display:false},tooltip:{enabled:false}}}});
    else { chGauge.current.data.datasets[0].data=[gaugeRatio,100-gaugeRatio]; chGauge.current.data.datasets[0].backgroundColor=[gaugeColor,"#1A1F2E"]; chGauge.current.update("none"); }

    /* 5 — f(t) = Complexité cyclomatique */
    const cycloData = results.map(r => r.complexity ?? 0);
    const cycloChartData = { labels, datasets:[{label:"f(t) = Complexité cyclomatique",data:cycloData,borderColor:"#4C9EFF",backgroundColor:"rgba(76,158,255,.10)",fill:true,tension:.4,pointRadius:3,pointBackgroundColor:cycloData.map((v:number)=>v>50?"#E24B4A":v>20?"#E8A020":"#4C9EFF"),pointBorderColor:"transparent",borderWidth:2}]};
    const cycloOpts = { responsive:true,maintainAspectRatio:false,interaction:{mode:"index" as const,intersect:false},plugins:{legend:{display:false},tooltip:{...TOOLTIP_CFG,callbacks:{label:(ctx:any)=>{const v=ctx.raw as number;const zone=v>50?"🔴 Critique":v>20?"⚠ Élevée":"✓ Saine";return ` f(t) = ${v}  ${zone}`;}}}},scales:{x:{ticks:{...TICK_CFG,maxTicksLimit:8,maxRotation:0},grid:GRID_CFG},y:{ticks:TICK_CFG,grid:GRID_CFG,beginAtZero:true,title:{display:true,text:"f(t)",color:"#4C9EFF",font:{family:MONO,size:9}}}} };
    if (!chDebt.current) chDebt.current = new Chart(refDebt.current, {type:"line",data:cycloChartData,options:cycloOpts});
    else { chDebt.current.data=cycloChartData; chDebt.current.update("none"); }

    /* 6 — Dup bar */
    const dupRates = results.map(r=>(r.lines??0)>0?+((r.duplicated_lines??0)/r.lines*100).toFixed(2):(r.duplicated_lines_density??0));
    const dupBarData = { labels, datasets:[{label:"Taux de duplication (%)",data:dupRates,backgroundColor:dupRates.map((v:number)=>v>10?"rgba(226,75,74,.75)":v>4?"rgba(232,160,32,.75)":"rgba(46,204,135,.75)"),borderColor:dupRates.map((v:number)=>v>10?"#E24B4A":v>4?"#E8A020":"#2ECC87"),borderWidth:1,borderRadius:3}]};
    const dupBarOpts = { responsive:true,maintainAspectRatio:false,interaction:{mode:"index" as const,intersect:false},plugins:{legend:{display:false},tooltip:{...TOOLTIP_CFG,callbacks:{label:(ctx:any)=>` ${Number(ctx.raw).toFixed(1)}%`}}},scales:{x:{ticks:{...TICK_CFG,maxTicksLimit:8,maxRotation:0},grid:GRID_CFG},y:{ticks:TICK_CFG,grid:GRID_CFG,beginAtZero:true,title:{display:true,text:"dup. / LOC (%)",color:"#2D3444",font:{family:MONO,size:9}}}} };
    if (!chDupBar.current) chDupBar.current = new Chart(refDupBar.current, {type:"bar",data:dupBarData,options:dupBarOpts});
    else { chDupBar.current.data=dupBarData; chDupBar.current.update("none"); }

    /* 7 — CUSUM */
    if (hValue != null) {
      const sommes = results.map(r=>r.Somme??0);
      const H=hValue, H2=H/2;
      const cusumPointColors = sommes.map(s=>s<H2?"#2ECC87":s<H?"#F59E42":"#E24B4A");
      const cusumData = { labels, datasets:[
        {label:"S(t) CUSUM",data:sommes,borderColor:cusumPointColors,segment:{borderColor:(ctx:any)=>{const s=sommes[ctx.p1DataIndex]??0;return s<H2?"#2ECC87":s<H?"#F59E42":"#E24B4A";}},backgroundColor:"transparent",fill:false,tension:0.35,pointRadius:4,pointBackgroundColor:cusumPointColors,pointBorderColor:cusumPointColors,pointHoverRadius:6,borderWidth:2,order:1},
        {label:"Zone saine (S < H/2)",data:results.map(()=>H2),borderColor:"transparent",backgroundColor:"rgba(46,204,135,.06)",fill:{target:{value:0},above:"rgba(46,204,135,.06)"},pointRadius:0,borderWidth:0,tension:0,order:4},
        {label:"Zone alerte (H/2 < S < H)",data:results.map(()=>H),borderColor:"transparent",backgroundColor:"rgba(245,158,66,.06)",fill:{target:{value:H2},above:"rgba(245,158,66,.06)"},pointRadius:0,borderWidth:0,tension:0,order:5},
        {label:`Seuil H = ${H}`,data:results.map(()=>H),borderColor:"#E24B4A",backgroundColor:"transparent",borderWidth:1.5,borderDash:[6,4],pointRadius:0,tension:0,order:2},
        {label:`H/2 = ${H2.toFixed(2)}`,data:results.map(()=>H2),borderColor:"#F59E42",backgroundColor:"transparent",borderWidth:1,borderDash:[4,4],pointRadius:0,tension:0,order:3},
      ]};
      const cusumOpts = { responsive:true,maintainAspectRatio:false,interaction:{mode:"index" as const,intersect:false},plugins:{legend:{labels:{color:"#525C70",font:{family:MONO,size:9},boxWidth:10,boxHeight:2,padding:14,filter:(item:any)=>item.datasetIndex<=3}},tooltip:{...TOOLTIP_CFG,callbacks:{label:(ctx:any)=>{if(ctx.datasetIndex===0){const s=ctx.raw as number;const zone=s<H2?"✓ Saine":s<H?"⚠ Alerte":"✖ Dérive";return ` S(t) = ${s.toFixed(4)}  ${zone}`;}return null;},afterBody:(items:any[])=>{const s=items[0]?.raw as number??0;const pct=H>0?((s/H)*100).toFixed(1):"—";return[`Ratio S/H : ${pct}%`];}}}},scales:{x:{ticks:{...TICK_CFG,maxTicksLimit:8,maxRotation:0},grid:GRID_CFG},y:{ticks:TICK_CFG,grid:GRID_CFG,min:0,suggestedMax:H*1.2,title:{display:true,text:"S(t)",color:"#2D3444",font:{family:MONO,size:9}}}} };
      if (!chCusum.current) chCusum.current = new Chart(refCusum.current, {type:"line",data:cusumData,options:cusumOpts});
      else { chCusum.current.data=cusumData; chCusum.current.update("none"); }
    }
  }, [results, chartReady, weights, hValue]);

  const lastResult   = results[results.length - 1];
  const currentRatio = lastResult?.sqale_debt_ratio ?? 0;

  if (results.length === 0) return (
    <>
      <style>{CSS}</style>
      <div className="loading">
        <div className="loading-logo">Technical<em>Debt</em>Inspector</div>
        <div className="loading-bar"/>
        <div className="loading-txt">Connexion au stream SSE…</div>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <Script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js" onLoad={() => setChartReady(true)} />
      <div className="bg-fx">
        <div className="bg-grid"/><div className="bg-glow1"/><div className="bg-glow2"/>
      </div>
      <div className="page">

        <header className="hdr">
          <div className="hdr-logo">Technical<em>Debt</em>Inspector</div>
          <div className="hdr-crumbs">
            {nom_projet && <><b>{nom_projet}</b><span style={{color:"var(--border2)"}}>›</span></>}
            {nom_branche && <><span>{nom_branche}</span><span style={{color:"var(--border2)"}}>›</span></>}
            <span>Dashboard</span>
          </div>
          <div className="hdr-right">
            <div className="count-pill">{results.length} commits</div>
            <div className="live-pill"><div className="live-dot"/>{live ? "Live" : "Reconnexion…"}</div>
          </div>
        </header>

        <div className="hero">
          {[
            {cls:"bugs",  label:"Bugs",          n:lastResult?.bugs??0,             sub:"effort de correction", effort:lastResult?.reliability_remediation_effort, letter:"B"},
            {cls:"smells",label:"Code Smells",    n:lastResult?.code_smells??0,      sub:"dette technique",      effort:lastResult?.sqale_index,                   letter:"S"},
            {cls:"vulns", label:"Vulnérabilités", n:lastResult?.vulnerabilities??0,  sub:"effort de sécurité",   effort:lastResult?.security_remediation_effort,   letter:"V"},
          ].map(({cls,label,n,sub,effort,letter}) => (
            <div key={cls} className={`hero-card ${cls}`}>
              <div className="hero-accent"/>
              <div className="hero-label"><span className="hero-dot"/>{label}</div>
              <div className="hero-n">{n}</div>
              <div className="hero-sub">{sub}</div>
              <div className="hero-effort">{fmtMin(effort)}</div>
              <div className="hero-bg-letter">{letter}</div>
            </div>
          ))}
        </div>

        <div className="mini-row">
          {(() => {
            const v=lastResult?.complexity??0;
            const lvl=v>50?"danger":v>20?"warn":"ok";
            return (<div className="mini-stat cyclo"><div className="mini-label"><span className="mini-dot"/>Cyclomatique</div><div className={`mini-val ${lvl}`}>{v}</div><div className="mini-sub">complexité totale</div><div className={`mini-badge ${lvl}`}>{v>50?"Critique":v>20?"Élevée":"Saine"}</div></div>);
          })()}
          {(() => {
            const v=lastResult?.cognitive_complexity??0;
            const lvl=v>100?"danger":v>40?"warn":"ok";
            return (<div className="mini-stat cogn"><div className="mini-label"><span className="mini-dot"/>Cognitive</div><div className={`mini-val ${lvl}`}>{v}</div><div className="mini-sub">complexité cognitive</div><div className={`mini-badge ${lvl}`}>{v>100?"Critique":v>40?"Élevée":"Saine"}</div></div>);
          })()}
          {(() => {
            const ncloc=lastResult?.ncloc??0;
            const lines=lastResult?.lines??0;
            const display=ncloc>=1000?`${(ncloc/1000).toFixed(1)}k`:String(ncloc);
            return (<div className="mini-stat ncloc"><div className="mini-label"><span className="mini-dot"/>NCLOC</div><div className="mini-val neutral">{display}</div><div className="mini-sub">{lines.toLocaleString()} lignes totales</div><div className="mini-badge neutral">Actif</div></div>);
          })()}
        </div>

        <div className="content">

          {/* ── COMPOSANT IA · ABEILLE ── */}
          <AiBeeCard
            lastResult={lastResult}
            allResults={results}
            hValue={hValue}
            nomProjet={nom_projet ?? ""}
            nomBranche={nom_branche ?? ""}
          />

          <div className="row c60">
            <div className="card">
              <div className="card-hdr">
                <div className="card-title">Évolution de la <em>dette</em></div>
                <div className="card-tag">aire · temps</div>
              </div>
              <div className="card-body" style={{height:300}}><canvas ref={refArea}/></div>
            </div>
            <div className="card">
              <div className="card-hdr">
                <div className="card-title">Ratio de <em>dette</em></div>
                <div className="card-tag">sqale_debt_ratio</div>
              </div>
              <div className="gauge-wrap">
                <div className="gauge-rel">
                  <canvas ref={refGauge} width={200} height={104}/>
                  <div className="gauge-val">
                    <div className="gauge-num" style={{color:getDebtColor(currentRatio)}}>{currentRatio.toFixed(4)}</div>
                    <div className="gauge-unit">ratio</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-hdr">
              <div className="card-title">Taux de <em>remboursement</em></div>
              <div className="card-tag">D_repay · R_repay · S_repay</div>
            </div>
            <div className="card-body" style={{height:230}}><canvas ref={refRepay}/></div>
          </div>

          <div className="row c2" style={{alignItems:"stretch"}}>
            <div className="card">
              <div className="card-hdr">
                <div className="card-title">Vélocité de <em>l'équipe</em></div>
                <div className="card-tag">{PROFS[activeProf].name}</div>
              </div>
              <div className="card-body">
                <div className="prof-grid">
                  {Object.entries(PROFS).map(([key,prof]) => (
                    <div key={key} className={`pcard${activeProf===key?(key==="custom"?" con":" on"):""}`} onClick={() => { setActiveProf(key); if(key!=="custom") setWeights(prof.w); }}>
                      <div className="ph"><span className="pn">{prof.name}</span><span className="chk">{activeProf===key?"✓":""}</span></div>
                      <div className="pbars">
                        {[["Q","#2ECC87"],[" P","#E8A020"],["D","#A78BFA"]].map(([lbl,col],li) => {
                          const k=lbl.trim().toLowerCase() as "q"|"p"|"d";
                          const val=key==="custom"?weights[k]:prof.w[k];
                          return (<div key={lbl} className="pb-row"><span className="pb-l">{lbl}</span><div className="pb-t"><div className="pb-f" style={{width:`${val*100/0.6*100}%`,background:col}}/></div><span className="pb-v">{val.toFixed(2)}</span></div>);
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                {activeProf==="custom" && (
                  <div className="cpanel show">
                    <div className="cpt">Classez vos priorités (1 = plus important)</div>
                    {([["Qualité (Q)","q"],["Productivité (P)","p"],["Dette (D)","d"]] as [string,"q"|"p"|"d"][]).map(([lbl,k]) => (
                      <div key={k} className="crow-w">
                        <span className="clbl">{lbl}</span>
                        <div className="cbtns">
                          {[1,2,3].map(rank => (
                            <button key={rank} className={`cb${cprios[k]===rank?" on":""}`} onClick={() => {
                              const old=cprios[k];
                              const conflict=(Object.keys(cprios) as ("q"|"p"|"d")[]).find(x=>x!==k&&cprios[x]===rank);
                              const newP={...cprios,[k]:rank};
                              if(conflict) newP[conflict]=old;
                              setCprios(newP);
                              setWeights({q:cwMap[newP.q],p:cwMap[newP.p],d:cwMap[newP.d]});
                            }}>{rank}</button>
                          ))}
                        </div>
                        <span className="cw">{cwMap[cprios[k]].toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="wdisplay">
                  {([["w₁","Qualité","q"],["w₂","Productivité","p"],["w₃","Dette","d"]] as [string,string,"q"|"p"|"d"][]).map(([sym,lbl,k]) => (
                    <div key={k} className="wdi"><div className="wdv">{weights[k].toFixed(2)}</div><div className="wdl">{sym} {lbl}</div></div>
                  ))}
                </div>
                <div className="fbox">
                  <span className="fv">V(t)</span> = w₁·Q + w₂·P − w₃·D &nbsp;·&nbsp;
                  <span className="fv">ΔV(t)</span> = V(t)−V(t−1)<br/>
                  <span style={{color:"var(--muted)"}}>Q = score qualité · P = productivité Δncloc/Δt · D = sqale_debt_ratio/100</span>
                </div>
                <div style={{height:200,marginTop:12}}><canvas ref={refVelo}/></div>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:22,flex:1}}>
              <div className="card" style={{flex:1}}>
                <div className="card-hdr">
                  <div className="card-title"><em>f(t)</em> = Complexité cyclomatique</div>
                  <div className="card-tag">complexity · t</div>
                </div>
                <div className="card-body" style={{height:"calc(50% - 22px)",minHeight:140}}><canvas ref={refDebt}/></div>
              </div>
              <div className="card" style={{flex:1}}>
                <div className="card-hdr">
                  <div className="card-title">Taux de <em>duplication</em></div>
                  <div className="card-tag">dup_lines / LOC</div>
                </div>
                <div className="card-body" style={{height:"calc(50% - 22px)",minHeight:140}}><canvas ref={refDupBar}/></div>
              </div>
            </div>
          </div>

          {/* ── CUSUM CARD ── */}
          {hValue != null && (() => {
            const lastS = lastResult?.Somme ?? 0;
            const H = hValue, H2 = H / 2;
            const pct = H > 0 ? (lastS / H) * 100 : 0;

            // ── Nouvelle logique 4 cas ──────────────────────────────────
            let zone: string;
            let zoneLabel: string;
            let zoneIcon: string;
            let sColor: string;

            if (lastS < H) {
              if (moy != null && moy > 0) {
                const nStar = Math.ceil((H - lastS) / moy);
                zone      = lastS < H2 ? "warn" : "danger";
                zoneIcon  = "⚠";
                zoneLabel = `Alerte prévue dans ${nStar} push${nStar > 1 ? "s" : ""} — n* = ⌈(H − S) / Moy⌉`;
                sColor    = lastS < H2 ? "#F59E42" : "#E24B4A";
              } else {
                zone      = "ok";
                zoneIcon  = "✓";
                zoneLabel = "Système stable — Moy ≤ 0, aucune dérive en cours";
                sColor    = "#2ECC87";
              }
            } else {
              // lastS >= H
              if (moy == null || moy >= 0) {
                zone      = "danger";
                zoneIcon  = "✖";
                zoneLabel = "⚠ Alerte critique — la dette s'aggrave sans fin";
                sColor    = "#E24B4A";
              } else {
                // moy < 0 → sortie de crise
                const nRecov = Math.ceil((H - lastS) / moy);
                zone      = "ok";
                zoneIcon  = "↗";
                zoneLabel = `Sortie de crise prévue dans ${nRecov} push${nRecov > 1 ? "s" : ""}`;
                sColor    = "#2ECC87";
              }
            }
            // ────────────────────────────────────────────────────────────

            return (
              <div className="card">
                <div className="card-hdr">
                  <div className="card-title">Carte de contrôle <em>CUSUM</em></div>
                  <div className="card-tag">S(t) · H={H} · H/2={H2.toFixed(2)}</div>
                </div>
                <div className="card-body">
                  <div className="cusum-meta">
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {[
                        {v:lastS.toFixed(4),          l:"S(t) actuel", c:sColor},
                        {v:String(H),                  l:"Seuil H",     c:"#E24B4A"},
                        {v:H2.toFixed(2),              l:"H / 2",       c:"#F59E42"},
                        {v:`${pct.toFixed(1)}%`,       l:"S / H",       c:sColor},
                        {v:moy != null ? moy.toFixed(4) : "—", l:"Moy", c:"var(--muted2)"},
                      ].map(({v,l,c}) => (
                        <div key={l} className="cusum-kpi"><div className="cusum-kpi-val" style={{color:c}}>{v}</div><div className="cusum-kpi-lbl">{l}</div></div>
                      ))}
                    </div>
                    <div className="cusum-zones-legend">
                      {([
                        ["#2ECC87", "Moy ≤ 0  Stable"],
                        ["#F59E42", "Moy > 0, S < H  Alerte prévue"],
                        ["#E24B4A", "S ≥ H, Moy ≥ 0  Critique"],
                      ] as [string,string][]).map(([c,l],i) => (
                        <div key={i} className="cusum-zone-item"><div className="cusum-zone-swatch" style={{background:c}}/><span>{l}</span></div>
                      ))}
                    </div>
                  </div>
                  <div style={{height:240}}><canvas ref={refCusum}/></div>
                  <div className={`cusum-alarm ${zone}`}>
                    <span style={{fontSize:14}}>{zoneIcon}</span>
                    <span>{zoneLabel}</span>
                    <span style={{marginLeft:"auto",opacity:.6,fontSize:9}}>{results.length} points analysés</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── POINT DE RUPTURE ── */}
          {hValue != null && results.length > 0 && (() => {
            const lastR = results[results.length - 1];
            const S     = lastR?.Somme ?? 0;
            const H     = hValue;
            const Moy   = moy;
            const pct   = H > 0 ? Math.min(100, (S / H) * 100) : 0;

            /* ── CAS 1 : Somme < H ───────────────────────────────────── */
            if (S < H) {

              /* CAS 1a : Moy > 0 → alerte prévue */
              if (Moy != null && Moy > 0) {
                const nStar    = Math.ceil((H - S) / Moy);
                const urgency  = nStar <= 3 ? "imm" : nStar <= 10 ? "warn" : "safe";
                const barColor = urgency === "safe" ? "#2ECC87" : urgency === "warn" ? "#F59E42" : "#FF4B6E";
                return (
                  <div className="rupt-card">
                    <div className="rupt-inner">
                      <div className="rupt-left">
                        <div className="rupt-eyebrow"><span className="rupt-eyebrow-dot"/>Prédiction · Point de rupture</div>
                        <div className="rupt-headline">Dans <em>{nStar > 999 ? "999+" : nStar}</em> commit{nStar !== 1 ? "s" : ""},<br/>le seuil critique sera atteint.</div>
                        <div className="rupt-formula">
                          n* = ⌈(H − S) / Moy⌉<br/>
                          <span style={{color:"var(--text)"}}>= ⌈({H.toFixed(2)} − {S.toFixed(4)}) / {Moy.toFixed(4)}⌉ = {nStar}</span>
                        </div>
                      </div>
                      <div className="rupt-center">
                        <div className="rupt-n-label">n* commits restants</div>
                        <div className={`rupt-n-value ${urgency}`}>{nStar > 999 ? "999+" : nStar}</div>
                        <div className="rupt-n-unit">avant H = {H}</div>
                      </div>
                      <div className="rupt-right">
                        <div className="rupt-kpis">
                          {[
                            {l:"S(t) actuel",   v:S.toFixed(4),           c:barColor},
                            {l:"Seuil H",        v:String(H),              c:"#FF4B6E"},
                            {l:"Moy (Σ_dis)",    v:Moy.toFixed(4),         c:"var(--muted2)"},
                            {l:"Pushs analysés", v:String(results.length), c:"var(--muted2)"},
                          ].map(({l,v,c}) => (
                            <div key={l} className="rupt-kpi"><span className="rupt-kpi-label">{l}</span><span className="rupt-kpi-val" style={{color:c}}>{v}</span></div>
                          ))}
                        </div>
                        <div className="rupt-bar-wrap">
                          <div className="rupt-bar-lbl"><span>Progression S → H</span><span style={{color:barColor}}>{pct.toFixed(1)}%</span></div>
                          <div className="rupt-bar-track"><div className="rupt-bar-fill" style={{width:`${pct}%`,background:barColor}}/></div>
                          <div className="rupt-bar-lbl"><span>0</span><span>H/2 = {(H/2).toFixed(2)}</span><span>H = {H}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              /* CAS 1b : Moy ≤ 0 → stabilité */
              return (
                <div className="rupt-card rupt-stable">
                  <div className="rupt-stable-screen">
                    <div className="rupt-stable-icon">🛡️</div>
                    <div className="rupt-stable-title">État de stabilité totale</div>
                    <div className="rupt-stable-sub">
                      S(t) &lt; H et Moy ≤ 0 — Aucune accumulation de dérive détectée.<br/>
                      Le projet évolue dans les limites de tolérance définies.
                    </div>
                    <div className="rupt-stable-badge"><span>●</span> Aucun point de rupture prévisible</div>
                  </div>
                </div>
              );
            }

            /* ── CAS 2 : Somme ≥ H ───────────────────────────────────── */

            /* CAS 2a : Moy ≥ 0 → alerte critique, dette s'aggrave sans fin */
            if (Moy == null || Moy >= 0) {
              return (
                <div className="rupt-card">
                  <div className="rupt-inner">
                    <div className="rupt-left">
                      <div className="rupt-eyebrow"><span className="rupt-eyebrow-dot"/>Alerte Critique · Seuil dépassé</div>
                      <div className="rupt-headline">🚨 La dette <em>s'aggrave</em><br/>sans fin détectée.</div>
                      <div className="rupt-formula">
                        S(t) ≥ H  et  Moy ≥ 0<br/>
                        <span style={{color:"var(--text)"}}>S = {S.toFixed(4)} ≥ H = {H.toFixed(2)} — Dérive non contrôlée</span>
                      </div>
                    </div>
                    <div className="rupt-center">
                      <div className="rupt-n-label">Statut</div>
                      <div className="rupt-n-value imm">∞</div>
                      <div className="rupt-n-unit">Dérive sans limite</div>
                    </div>
                    <div className="rupt-right">
                      <div className="rupt-kpis">
                        {[
                          {l:"S(t) actuel",   v:S.toFixed(4),                               c:"#FF4B6E"},
                          {l:"Seuil H",        v:String(H),                                  c:"#FF4B6E"},
                          {l:"Moy (Σ_dis)",    v:Moy != null ? Moy.toFixed(4) : "—",         c:"var(--muted2)"},
                          {l:"Pushs analysés", v:String(results.length),                     c:"var(--muted2)"},
                        ].map(({l,v,c}) => (
                          <div key={l} className="rupt-kpi"><span className="rupt-kpi-label">{l}</span><span className="rupt-kpi-val" style={{color:c}}>{v}</span></div>
                        ))}
                      </div>
                      <div className="rupt-bar-wrap">
                        <div className="rupt-bar-lbl"><span>Progression S → H</span><span style={{color:"#FF4B6E"}}>{">"} 100%</span></div>
                        <div className="rupt-bar-track"><div className="rupt-bar-fill" style={{width:"100%",background:"#FF4B6E"}}/></div>
                        <div className="rupt-bar-lbl"><span>0</span><span>H/2 = {(H/2).toFixed(2)}</span><span>H = {H}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            /* CAS 2b : Moy < 0 → sortie de crise prévue */
            const nRecov   = Math.ceil((H - S) / Moy);
            const recColor = "#2ECC87";
            return (
              <div className="rupt-card rupt-stable">
                <div className="rupt-inner">
                  <div className="rupt-left">
                    <div className="rupt-eyebrow"><span className="rupt-eyebrow-dot" style={{background:"#2ECC87"}}/>Sortie de crise · En cours</div>
                    <div className="rupt-headline" style={{color:"var(--text)"}}>
                      Dans <em style={{color:"#2ECC87"}}>{nRecov > 999 ? "999+" : nRecov}</em> commit{nRecov !== 1 ? "s" : ""},<br/>
                      le système sortira de crise.
                    </div>
                    <div className="rupt-formula" style={{borderLeftColor:"#2ECC87"}}>
                      n* = ⌈(H − S) / Moy⌉<br/>
                      <span style={{color:"var(--text)"}}>= ⌈({H.toFixed(2)} − {S.toFixed(4)}) / {Moy.toFixed(4)}⌉ = {nRecov}</span>
                    </div>
                  </div>
                  <div className="rupt-center">
                    <div className="rupt-n-label">n* commits restants</div>
                    <div className="rupt-n-value safe">{nRecov > 999 ? "999+" : nRecov}</div>
                    <div className="rupt-n-unit" style={{color:"#2ECC87"}}>avant stabilisation</div>
                  </div>
                  <div className="rupt-right">
                    <div className="rupt-kpis">
                      {[
                        {l:"S(t) actuel",   v:S.toFixed(4),           c:recColor},
                        {l:"Seuil H",        v:String(H),              c:"#FF4B6E"},
                        {l:"Moy (Σ_dis)",    v:Moy.toFixed(4),         c:recColor},
                        {l:"Pushs analysés", v:String(results.length), c:"var(--muted2)"},
                      ].map(({l,v,c}) => (
                        <div key={l} className="rupt-kpi"><span className="rupt-kpi-label">{l}</span><span className="rupt-kpi-val" style={{color:c}}>{v}</span></div>
                      ))}
                    </div>
                    <div className="rupt-bar-wrap">
                      <div className="rupt-bar-lbl"><span>Récupération S → H</span><span style={{color:recColor}}>{pct.toFixed(1)}%</span></div>
                      <div className="rupt-bar-track"><div className="rupt-bar-fill" style={{width:`${Math.min(100,Math.abs(pct))}%`,background:recColor}}/></div>
                      <div className="rupt-bar-lbl"><span>0</span><span>H/2 = {(H/2).toFixed(2)}</span><span>H = {H}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="card">
            <div className="card-hdr">
              <div className="card-title">Historique <em>complet</em></div>
              <div className="card-tag">{results.length} entrées · SSE</div>
            </div>
            <div className="card-body">
              <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:180,overflowY:"auto"}}>
                {[...results].reverse().map((r,i) => (
                  <div key={r.id_push} style={{display:"flex",gap:14,padding:"7px 0",borderBottom:"1px solid var(--border)",alignItems:"center",fontSize:11}}>
                    <span style={{color:"var(--muted)",minWidth:20,textAlign:"right"}}>{results.length-i}</span>
                    <span style={{color:"var(--muted2)",minWidth:90}}>{getLabel(r)}</span>
                    <span style={{color:"var(--red)",minWidth:50}}>B:{r.bugs}</span>
                    <span style={{color:"var(--gold)",minWidth:50}}>S:{r.code_smells}</span>
                    <span style={{color:"var(--purple)",minWidth:50}}>V:{r.vulnerabilities}</span>
                    <span style={{color:"var(--muted)",fontSize:10}}>{r.id_push?.slice(0,10)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return <ProtectedRoute><DashboardContent/></ProtectedRoute>;
}