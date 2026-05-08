import { useState, useEffect } from "react";
import ProtectedRoute from "@/ui/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { Home, FolderGit2, User, Globe, HelpCircle } from "lucide-react";
import ProjetsList from "@/ui/components/ProjetsList";
import Aide from "@/ui/components/Aide";
const API_BASE = "http://localhost:8000";
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=IBM+Plex+Mono:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body, #root {
    background: #08090B;
    color: #f0d8af;
    font-family: 'IBM Plex Mono', monospace;
    min-height: 100vh;
  }

  /* ── LAYOUT ── */
  .dashboard-shell {
    display: flex;
    min-height: 100vh;
    position: relative;
    overflow: hidden;
  }

  /* ── BACKGROUND ── */
  .grid-bg {
    position: fixed; inset: 0; z-index: 0;
    background-image:
      linear-gradient(#1C2128 1px, transparent 1px),
      linear-gradient(90deg, #1C2128 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%);
    pointer-events: none;
  }

  .glow {
    position: fixed; top: 30%; left: 50%;
    transform: translate(-50%, -50%);
    width: 900px; height: 500px; z-index: 0;
    background: radial-gradient(ellipse, rgba(232,160,32,0.08) 0%, transparent 70%);
    pointer-events: none;
    filter: blur(40px);
  }

  /* ── SIDEBAR ── */
  .sidebar {
    position: fixed; top: 0; left: 0; bottom: 0;
    width: 260px;
    background: rgba(10, 12, 16, 0.95);
    border-right: 1px solid #1C2128;
    backdrop-filter: blur(16px);
    z-index: 50;
    display: flex;
    flex-direction: column;
    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 0;
    box-shadow: 8px 0 30px rgba(0,0,0,0.3);
  }

  .sidebar.collapsed {
    transform: translateX(-260px);
  }

  .sidebar-logo {
    padding: 28px 24px 20px;
    border-bottom: 1px solid #1C2128;
    position: relative;
  }

  .sidebar-logo::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 24px; right: 24px;
    height: 1px;
    background: linear-gradient(90deg, transparent, #E8A02040, transparent);
  }

  .sidebar-logo-text {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: 18px;
    color: #EAE6DF;
    line-height: 1.2;
    letter-spacing: -0.01em;
  }

  .sidebar-logo-text em {
    font-style: italic;
    color: #E8A020;
  }

  .sidebar-logo-sub {
    font-size: 9px;
    color: #3D4552;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-top: 6px;
  }

  .sidebar-nav {
    flex: 1;
    padding: 20px 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .nav-section-label {
    font-size: 9px;
    color: #3D4552;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    padding: 16px 24px 8px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 24px;
    margin: 0 8px;
    font-size: 13px;
    color: #8A94A6;
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 500;
    letter-spacing: 0.03em;
    cursor: default;
    border-radius: 4px;
    border-left: none;
    transition: all 0.2s cubic-bezier(0.23, 1, 0.32, 1);
    user-select: none;
    position: relative;
  }

  .nav-item::before {
    content: '';
    position: absolute;
    left: 0; top: 50%; transform: translateY(-50%);
    width: 3px; height: 0;
    background: #E8A020;
    border-radius: 0 3px 3px 0;
    transition: height 0.2s ease;
  }

  .nav-item:hover {
    color: #EAE6DF;
    background: rgba(232,160,32,0.06);
    transform: translateX(2px);
  }

  .nav-item:hover::before {
    height: 60%;
  }

  .nav-item.active {
    color: #E8A020;
    background: rgba(232,160,32,0.1);
    box-shadow: inset 0 0 0 1px rgba(232,160,32,0.1);
  }

  .nav-item.active::before {
    height: 70%;
  }

  .nav-icon {
    width: 18px;
    height: 18px;
    opacity: 0.7;
    flex-shrink: 0;
    transition: opacity 0.2s;
  }

  .nav-item:hover .nav-icon,
  .nav-item.active .nav-icon { opacity: 1; }

  .sidebar-bottom {
    padding: 20px 20px 24px;
    border-top: 1px solid #1C2128;
    position: relative;
  }

  .sidebar-bottom::before {
    content: '';
    position: absolute;
    top: -1px; left: 20px; right: 20px;
    height: 1px;
    background: linear-gradient(90deg, transparent, #E8A02040, transparent);
  }

  .user-chip {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: #0F1319;
    border: 1px solid #232A33;
    border-radius: 6px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .user-chip:hover {
    border-color: #3D4A5C;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }

  .user-avatar {
    width: 36px; height: 36px;
    background: linear-gradient(145deg, #E8A020, #b87300);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    color: #0A0C10;
    font-family: 'IBM Plex Mono', monospace;
    flex-shrink: 0;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(232,160,32,0.2);
  }

  .user-info { flex: 1; min-width: 0; }

  .user-name {
    font-size: 12px;
    color: #EAE6DF;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.02em;
  }

  .user-role {
    font-size: 9px;
    color: #5A6575;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-top: 2px;
  }

  .logout-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #5A6575;
    padding: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;
  }
  .logout-btn:hover {
    color: #E8A020;
    background: rgba(232,160,32,0.08);
    transform: scale(1.05);
  }

  /* ── TOGGLE BUTTON ── */
  .sidebar-toggle {
    position: fixed;
    top: 24px;
    left: 24px;
    z-index: 100;
    width: 40px;
    height: 40px;
    background: #0E1115;
    border: 1px solid #262D36;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    border-radius: 6px;
    transition: left 0.35s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s, box-shadow 0.2s;
  }

  .sidebar-toggle:hover {
    border-color: #E8A020;
    box-shadow: 0 0 15px rgba(232,160,32,0.2);
  }

  .sidebar-toggle.open {
    left: 280px;
  }

  .toggle-line {
    width: 18px;
    height: 2px;
    background: #8A94A6;
    border-radius: 1px;
    transition: all 0.25s;
  }

  .sidebar-toggle:hover .toggle-line {
    background: #E8A020;
  }

  /* ── MAIN CONTENT ── */
  .main {
    flex: 1;
    min-height: 100vh;
    margin-left: 0;
    transition: margin-left 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
  }

  .main.shifted {
    margin-left: 260px;
  }

  /* ── TOPBAR ── */
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 48px 18px 84px;
    border-bottom: 1px solid #1C2128;
    background: rgba(8,9,11,0.8);
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .topbar-left { display: flex; align-items: center; gap: 12px; }

  .breadcrumb {
    font-size: 11px;
    color: #4E5B6C;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .breadcrumb span {
    color: #E8A020;
    position: relative;
    padding: 2px 8px;
    background: rgba(232,160,32,0.08);
    border-radius: 4px;
  }

  .topbar-right { display: flex; align-items: center; gap: 20px; }

  .topbar-greeting {
    font-size: 13px;
    color: #A0AAB8;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .topbar-greeting strong {
    color: #EAE6DF;
    font-weight: 600;
    background: linear-gradient(135deg, #EAE6DF, #E8A020);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* ── PAGE BODY ── */
  .page-body {
    padding: 48px 48px 64px;
    flex: 1;
  }

  /* ── SECTION HEADER ── */
  .section-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 40px;
    opacity: 0;
    animation: fadeUp 0.6s ease 0.1s forwards;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .section-title {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: 44px;
    color: #EAE6DF;
    line-height: 1;
    letter-spacing: -0.02em;
    text-shadow: 0 2px 5px rgba(0,0,0,0.3);
  }

  .section-title em {
    font-style: italic;
    color: #E8A020;
    position: relative;
    display: inline-block;
  }

  .section-title em::after {
    content: '';
    position: absolute;
    bottom: 2px; left: 0; right: 0;
    height: 2px;
    background: #E8A020;
    opacity: 0.3;
  }

  .section-sub {
    font-size: 12px;
    color: #5A6575;
    margin-top: 8px;
    letter-spacing: 0.06em;
  }

  .btn-add {
    display: flex;
    align-items: center;
    gap: 10px;
    background: transparent;
    border: 1.5px solid #E8A020;
    color: #E8A020;
    cursor: pointer;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    padding: 12px 28px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border-radius: 4px;
    transition: all 0.25s cubic-bezier(0.23, 1, 0.32, 1);
    position: relative;
    overflow: hidden;
  }

  .btn-add::before {
    content: '';
    position: absolute;
    top: 0; left: -100%; width: 100%; height: 100%;
    background: #E8A020;
    transition: left 0.3s ease;
    z-index: -1;
  }

  .btn-add:hover {
    color: #0A0C10;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(232,160,32,0.25);
  }

  .btn-add:hover::before {
    left: 0;
  }

  .btn-add-icon {
    font-size: 20px;
    line-height: 1;
    font-weight: 400;
    transition: transform 0.2s;
  }

  .btn-add:hover .btn-add-icon {
    transform: rotate(90deg);
  }

  /* ── STATS ROW ── */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 48px;
    opacity: 0;
    animation: fadeUp 0.6s ease 0.2s forwards;
  }

  .stat-card {
    background: #0D0F13;
    border: 1px solid #1C2128;
    padding: 24px 28px;
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
  }

  .stat-card:hover {
    transform: translateY(-4px);
    border-color: #E8A02030;
    box-shadow: 0 12px 24px -8px rgba(0,0,0,0.5), 0 0 0 1px rgba(232,160,32,0.1) inset;
  }

  .stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 4px; height: 100%;
    background: #E8A020;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .stat-card:hover::before { opacity: 1; }

  .stat-label {
    font-size: 10px;
    color: #4E5B6C;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .stat-value {
    font-family: 'DM Serif Display', serif;
    font-size: 40px;
    color: #EAE6DF;
    line-height: 1;
  }

  .stat-unit {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: #7A8494;
    margin-top: 6px;
  }

  /* ── PROJECTS GRID ── */
  .projects-label {
    font-size: 11px;
    color: #4E5B6C;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-bottom: 24px;
    opacity: 0;
    animation: fadeUp 0.6s ease 0.3s forwards;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .projects-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, #1C2128, transparent);
  }

  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
    opacity: 0;
    animation: fadeUp 0.6s ease 0.35s forwards;
  }

  .project-card {
    background: #0D0F13;
    border: 1px solid #1C2128;
    padding: 28px;
    cursor: default;
    position: relative;
    overflow: hidden;
    border-radius: 10px;
    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .project-card:hover {
    border-color: #3D4A5C;
    transform: translateY(-5px);
    box-shadow: 0 20px 30px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(232,160,32,0.1) inset;
  }

  .project-card::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, #E8A020, #b87300, transparent);
    opacity: 0;
    transition: opacity 0.4s;
  }

  .project-card:hover::after { opacity: 1; }

  .project-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .project-icon {
    width: 44px; height: 44px;
    background: #13171D;
    border: 1px solid #262D36;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .project-card:hover .project-icon {
    border-color: #E8A02040;
    background: #1A1F26;
  }

  .project-badge {
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 5px 12px;
    border: 1px solid;
    border-radius: 30px;
    font-weight: 600;
    backdrop-filter: blur(4px);
  }

  .badge-high { color: #ff8a8a; border-color: rgba(255,100,100,0.4); background: rgba(255,80,80,0.1); }
  .badge-med  { color: #E8A020; border-color: rgba(232,160,32,0.4); background: rgba(232,160,32,0.1); }
  .badge-low  { color: #6fcf97; border-color: rgba(111,207,151,0.4); background: rgba(111,207,151,0.08); }

  .project-name {
    font-size: 16px;
    color: #EAE6DF;
    font-weight: 700;
    margin-bottom: 6px;
    letter-spacing: -0.01em;
  }

  .project-repo {
    font-size: 11px;
    color: #5A6575;
    letter-spacing: 0.04em;
    font-family: 'IBM Plex Mono', monospace;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .project-repo::before {
    content: '↳';
    color: #E8A020;
    opacity: 0.6;
  }

  /* Dette indicator (graphique mini) */
  .debt-indicator {
    margin: 20px 0 18px;
    height: 6px;
    background: #1C2128;
    border-radius: 10px;
    overflow: hidden;
    position: relative;
  }

  .debt-fill {
    height: 100%;
    border-radius: 10px;
    background: linear-gradient(90deg, #E8A020, #ffbe4d);
    box-shadow: 0 0 8px #E8A02080;
    transition: width 0.6s ease;
    position: relative;
  }

  .debt-fill.high { width: 85%; background: linear-gradient(90deg, #e05252, #ff8a8a); }
  .debt-fill.med  { width: 50%; }
  .debt-fill.low  { width: 20%; background: linear-gradient(90deg, #6fcf97, #9bdead); }

  .debt-text {
    font-size: 9px;
    color: #7A8494;
    margin-top: 6px;
    display: flex;
    justify-content: space-between;
  }

  .project-stats {
    display: flex;
    gap: 24px;
    margin-top: 20px;
    padding-top: 18px;
    border-top: 1px solid #1C2128;
  }

  .proj-stat { flex: 1; }

  .proj-stat-val {
    font-family: 'DM Serif Display', serif;
    font-size: 24px;
    color: #EAE6DF;
  }

  .proj-stat-key {
    font-size: 9px;
    color: #4E5B6C;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-top: 4px;
  }

  .add-project-card {
    background: transparent;
    border: 1.5px dashed #2A3340;
    padding: 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    cursor: pointer;
    min-height: 200px;
    border-radius: 10px;
    transition: all 0.3s ease;
  }

  .add-project-card:hover {
    border-color: #E8A020;
    background: rgba(232,160,32,0.04);
    transform: scale(1.02);
    box-shadow: 0 8px 25px rgba(232,160,32,0.1);
  }

  .add-circle {
    width: 52px; height: 52px;
    border: 2px solid #3D4A5C;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    color: #5A6575;
    font-weight: 300;
    transition: all 0.3s;
  }

  .add-project-card:hover .add-circle {
    border-color: #E8A020;
    color: #E8A020;
    transform: rotate(90deg);
  }

  .add-label {
    font-size: 12px;
    color: #6A788B;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-weight: 500;
    transition: color 0.2s;
  }

  .add-project-card:hover .add-label { color: #E8A020; }

  .modal-error {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(226, 75, 74, 0.08);
    border: 1px solid rgba(226, 75, 74, 0.35);
    border-radius: 6px;
    padding: 11px 16px;
    margin-bottom: 20px;
    font-size: 12px;
    color: #E24B4A;
    letter-spacing: 0.03em;
    animation: shakeIn 0.3s ease;
  }

  @keyframes shakeIn {
    0%   { transform: translateX(-6px); opacity: 0; }
    40%  { transform: translateX(4px); }
    70%  { transform: translateX(-2px); }
    100% { transform: translateX(0);   opacity: 1; }
  }

  .modal-error svg { flex-shrink: 0; }

  /* ── MODAL ── */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(5,7,9,0.9);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    animation: fadeIn 0.25s ease forwards;
  }

  @keyframes fadeIn { to { opacity: 1; } }

  .modal {
    background: #0D0F13;
    border: 1px solid #2A3340;
    width: 100%;
    max-width: 500px;
    padding: 40px;
    position: relative;
    border-radius: 16px;
    box-shadow: 0 30px 50px rgba(0,0,0,0.7), 0 0 0 1px rgba(232,160,32,0.1);
    transform: scale(0.98);
    animation: scaleIn 0.25s ease forwards;
  }

  @keyframes scaleIn { to { transform: scale(1); } }

  .modal-title {
    font-family: 'DM Serif Display', serif;
    font-size: 28px;
    color: #EAE6DF;
    margin-bottom: 8px;
  }

  .modal-sub {
    font-size: 12px;
    color: #6A788B;
    margin-bottom: 32px;
    letter-spacing: 0.04em;
  }

  .field-label {
    font-size: 10px;
    color: #8A94A6;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .input-row {
    display: flex;
    border: 1.5px solid #2A3340;
    margin-bottom: 28px;
    border-radius: 8px;
    overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
    background: #0A0C10;
  }

  .input-row:focus-within {
    border-color: #E8A020;
    box-shadow: 0 0 0 3px rgba(232,160,32,0.15);
  }

  .prefix {
    background: #13171D;
    padding: 0 18px;
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #5A6575;
    border-right: 1px solid #2A3340;
    white-space: nowrap;
    font-family: 'IBM Plex Mono', monospace;
  }

  .url-input {
    flex: 1;
    background: #0A0C10;
    border: none;
    outline: none;
    padding: 15px 18px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    color: #EAE6DF;
    caret-color: #E8A020;
  }

  .url-input::placeholder { color: #3D4552; }

  .modal-actions {
    display: flex;
    gap: 14px;
    justify-content: flex-end;
    margin-top: 12px;
  }

  .btn-cancel {
    background: transparent;
    border: 1.5px solid #2A3340;
    color: #8A94A6;
    cursor: pointer;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    padding: 11px 26px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .btn-cancel:hover {
    border-color: #5A6575;
    color: #EAE6DF;
    background: rgba(255,255,255,0.02);
  }

  .btn-confirm {
    background: #E8A020;
    border: none;
    color: #0A0C10;
    cursor: pointer;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    font-weight: 700;
    padding: 11px 32px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border-radius: 6px;
    transition: all 0.25s;
    box-shadow: 0 4px 12px rgba(232,160,32,0.3);
  }

  .btn-confirm:hover {
    background: #f0b030;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(232,160,32,0.4);
  }

  .modal-close {
    position: absolute;
    top: 20px; right: 24px;
    background: none;
    border: none;
    color: #5A6575;
    font-size: 22px;
    cursor: pointer;
    line-height: 1;
    transition: all 0.2s;
    width: 32px; height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
  }

  .modal-close:hover {
    color: #EAE6DF;
    background: #1C2128;
  }
    .projets-table-wrapper {
  overflow-x: auto;
  border: 1px solid #1C2128;
  border-radius: 4px;
  margin-top: 24px;
}
.projets-table {
  width: 100%; border-collapse: collapse;
  font-family: 'IBM Plex Mono', monospace; font-size: 12px;
}
.projets-table th {
  background: #0E1115; color: #3D4552;
  text-transform: uppercase; letter-spacing: 0.1em;
  padding: 12px 16px; text-align: left;
  border-bottom: 1px solid #1C2128; font-weight: 500;
}
.projets-table td {
  padding: 12px 16px; color: #EAE6DF;
  border-bottom: 1px solid #0E1115;
}
.projets-table tr:last-child td { border-bottom: none; }
.projets-table tr:hover td { background: rgba(232,160,32,0.04); }
.projets-index { color: #3D4552; width: 40px; }
.projets-nom   { color: #E8A020; font-weight: 600; }
.projets-url   { color: #7A8494; text-decoration: none; }
.projets-url:hover { color: #EAE6DF; text-decoration: underline; }
.projets-key   { color: #5A6575; font-size: 11px; }
.projets-state { padding: 48px; text-align: center; color: #5A6575; font-size: 13px; }
.projets-error { color: #E24B4A; }

/* ── QUESTIONNAIRE ── */
.quiz-overlay {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(5,7,9,0.95);
  backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  animation: fadeIn 0.3s ease forwards;
}

.quiz-modal {
  background: #0D0F13;
  border: 1px solid #2A3340;
  width: 100%;
  max-width: 620px;
  padding: 48px;
  position: relative;
  border-radius: 20px;
  box-shadow: 0 40px 70px rgba(0,0,0,0.8), 0 0 0 1px rgba(232,160,32,0.12);
  transform: scale(0.97);
  animation: scaleIn 0.3s ease forwards;
  overflow: hidden;
}

.quiz-modal::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, #E8A020, transparent);
}

.quiz-progress-bar-track {
  width: 100%;
  height: 3px;
  background: #1C2128;
  border-radius: 2px;
  margin-bottom: 36px;
  overflow: hidden;
}

.quiz-progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #E8A020, #ffbe4d);
  border-radius: 2px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 8px rgba(232,160,32,0.5);
}

.quiz-step-label {
  font-size: 10px;
  color: #5A6575;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.quiz-step-label span {
  color: #E8A020;
  font-weight: 700;
}

.quiz-question {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 26px;
  color: #EAE6DF;
  line-height: 1.3;
  margin-bottom: 32px;
  letter-spacing: -0.01em;
  opacity: 0;
  animation: fadeUp 0.35s ease forwards;
}

.quiz-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  opacity: 0;
  animation: fadeUp 0.35s ease 0.05s forwards;
}

.quiz-option {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 20px;
  background: #0A0C10;
  border: 1.5px solid #1C2128;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.23, 1, 0.32, 1);
  text-align: left;
  width: 100%;
  font-family: 'IBM Plex Mono', monospace;
}

.quiz-option:hover {
  border-color: #E8A02060;
  background: rgba(232,160,32,0.04);
  transform: translateX(4px);
}

.quiz-option.selected {
  border-color: #E8A020;
  background: rgba(232,160,32,0.08);
  box-shadow: 0 0 0 1px rgba(232,160,32,0.2) inset;
}

.quiz-option-letter {
  width: 28px; height: 28px;
  border: 1.5px solid #2A3340;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #5A6575;
  flex-shrink: 0;
  transition: all 0.2s;
  margin-top: 1px;
}

.quiz-option.selected .quiz-option-letter {
  background: #E8A020;
  border-color: #E8A020;
  color: #0A0C10;
}

.quiz-option-text {
  font-size: 13px;
  color: #A0AAB8;
  line-height: 1.55;
  letter-spacing: 0.01em;
  transition: color 0.2s;
}

.quiz-option.selected .quiz-option-text { color: #EAE6DF; }

.quiz-option-score {
  font-size: 10px;
  color: #4E5B6C;
  margin-top: 4px;
  letter-spacing: 0.08em;
  transition: color 0.2s;
}

.quiz-option.selected .quiz-option-score { color: #E8A02090; }

.quiz-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 36px;
  padding-top: 24px;
  border-top: 1px solid #1C2128;
}

.quiz-dots {
  display: flex;
  gap: 8px;
}

.quiz-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #1C2128;
  transition: all 0.3s;
}

.quiz-dot.done { background: #E8A020; }
.quiz-dot.current { background: #E8A020; box-shadow: 0 0 8px rgba(232,160,32,0.6); transform: scale(1.25); }

.quiz-next-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #E8A020;
  border: none;
  color: #0A0C10;
  cursor: pointer;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  padding: 12px 28px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-radius: 8px;
  transition: all 0.25s;
  box-shadow: 0 4px 14px rgba(232,160,32,0.3);
}

.quiz-next-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none;
}

.quiz-next-btn:not(:disabled):hover {
  background: #f0b030;
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(232,160,32,0.4);
}

.quiz-result-screen {
  text-align: center;
  padding: 20px 0;
  opacity: 0;
  animation: fadeUp 0.4s ease forwards;
}

.quiz-result-icon {
  font-size: 52px;
  margin-bottom: 20px;
}

.quiz-result-title {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 32px;
  color: #EAE6DF;
  margin-bottom: 10px;
}

.quiz-result-sub {
  font-size: 12px;
  color: #6A788B;
  margin-bottom: 28px;
  letter-spacing: 0.04em;
  line-height: 1.6;
}

.quiz-result-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: rgba(232,160,32,0.1);
  border: 1px solid rgba(232,160,32,0.3);
  border-radius: 50px;
  padding: 10px 24px;
  font-size: 13px;
  color: #E8A020;
  font-weight: 600;
  letter-spacing: 0.06em;
  margin-bottom: 32px;
}

.quiz-slide-enter {
  animation: slideFromRight 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes slideFromRight {
  from { opacity: 0; transform: translateX(30px); }
  to   { opacity: 1; transform: translateX(0); }
}
`;

/* ── MOCK DATA ─────────────────────────────────────────── */
const MOCK_PROJECTS = [
  { id: 1, name: "next-commerce", repo: "github.com/user/next-commerce", debt: "Élevée", badge: "badge-high", icon: "🛒", commits: 342, files: 87, debtLevel: "high" },
  { id: 2, name: "api-gateway",  repo: "github.com/user/api-gateway",  debt: "Moyenne", badge: "badge-med",  icon: "⚡", commits: 128, files: 34, debtLevel: "med" },
  { id: 3, name: "design-system",repo: "github.com/user/design-system",debt: "Faible",  badge: "badge-low",  icon: "🎨", commits: 56,  files: 21, debtLevel: "low" },
];

const NAV_ITEMS = [
  { id: "accueil",    label: "Accueil",     icon: <Home size={20} /> },
  { id: "mes_projets", label: "Mes projets",  icon: <FolderGit2 size={20} /> },
  { id: "a_propos",    label: "À propos",    icon: <User size={20} /> },
  { id: "aide",        label: "Aide",        icon: <HelpCircle size={20} /> }
];


function AccountContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav]     = useState("accueil");
  const [showModal, setShowModal]     = useState(false);
  const [newUrl, setNewUrl]           = useState("");
  const [newNom, setNewNom]           = useState("");
  const [fieldError, setFieldError]   = useState("");
  const [isLoading,   setIsLoading]   = useState(false);
  const [refreshKey,  setRefreshKey]  = useState(0);

  // ── QUESTIONNAIRE STATE ──
  const [showQuiz, setShowQuiz]             = useState(false);
  const [quizStep, setQuizStep]             = useState(0);
  const [quizAnswers, setQuizAnswers]       = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizDone, setQuizDone]             = useState(false);
  const [pendingNom, setPendingNom]         = useState("");
  const [pendingUrl, setPendingUrl]         = useState("");

  const QUIZ_QUESTIONS = [
    {
      question: "Quelle est la criticité du projet ?",
      options: [
        { letter: "A", text: "Critique (Santé, Finance, Sécurité)", sub: "Aucune erreur structurelle n'est tolérée.", score: 1 },
        { letter: "B", text: "Standard", sub: "Un bon équilibre entre qualité et rapidité de mise sur le marché.", score: 2 },
        { letter: "C", text: "Exploratoire / Prototype", sub: "L'important est de valider une idée, pas la pureté du code.", score: 3 },
      ],
    },
    {
      question: "Comment décririez-vous l'expertise technique de l'équipe ?",
      options: [
        { letter: "A", text: "Élite / Seniors", sub: "Maîtrisent les Design Patterns et le Clean Code sur le bout des doigts.", score: 1 },
        { letter: "B", text: "Mixte", sub: "Des développeurs autonomes encadrés par quelques leads.", score: 2 },
        { letter: "C", text: "Junior / Apprentissage", sub: "Équipe en formation avec beaucoup de roulement ou de stagiaires.", score: 3 },
      ],
    },
    {
      question: "Quel est l'état actuel de la base de code ?",
      options: [
        { letter: "A", text: "Nouveau projet (Greenfield)", sub: "On part sur des bases saines.", score: 1 },
        { letter: "B", text: "Projet mature", sub: "Quelques zones d'ombre mais globalement bien tenu.", score: 2 },
        { letter: "C", text: "Vieux projet Legacy", sub: "Code très complexe, accumulé sur plusieurs années sans audit.", score: 3 },
      ],
    },
    {
      question: "Quelle est votre politique de refactoring ?",
      options: [
        { letter: "A", text: "Systématique", sub: "On ne push jamais sans avoir réduit la dette existante.", score: 1 },
        { letter: "B", text: "Pragmatique", sub: "On nettoie ce qu'on touche quand on a le temps.", score: 2 },
        { letter: "C", text: "Ponctuelle", sub: "On ne refactorise que si le système risque de s'effondrer.", score: 3 },
      ],
    },
  ];

  const computeHK = (moyenne: number) => {
    if (moyenne >= 1 && moyenne < 1.5)  return { h: 2,  k: -1.6 };
    if (moyenne >= 1.5 && moyenne < 2.5) return { h: 5,  k:  -0.35 };
    return                                      { h: 7,  k: 0.7 };
  };

  const [totalProjets, setTotalProjets] = useState<number | null>(null);
  const [totalCommits, setTotalCommits] = useState<number | null>(null);
  const [totalBranches, setTotalBranches] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const id = user.id_user;

    fetch(`${API_BASE}/auth/projets/count/${id}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setTotalProjets(d.total_projets))
      .catch(() => {});

    fetch(`${API_BASE}/auth/resultats-push/total-count/${id}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setTotalCommits(d.total_resultats_push))
      .catch(() => {});

    fetch(`${API_BASE}/auth/branches/count/${id}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setTotalBranches(d.total_branches))
      .catch(() => {});
  }, [user, refreshKey]);

  const closeModal = () => {
    setShowModal(false);
    setNewUrl("");
    setNewNom("");
    setFieldError("");
    setIsLoading(false);
  };

  const handleAnalyser = () => {
    if (!newNom.trim() || !newUrl.trim()) {
      setFieldError("Veuillez remplir les deux champs avant de continuer.");
      return;
    }
    const fullUrl = newUrl.trim().startsWith("http")
      ? newUrl.trim()
      : `https://github.com/${newUrl.trim()}`;
    setFieldError("");
    setShowModal(false);
    // Launch profiling questionnaire
    setPendingNom(newNom.trim());
    setPendingUrl(fullUrl);
    setQuizStep(0);
    setQuizAnswers([]);
    setSelectedOption(null);
    setQuizDone(false);
    setShowQuiz(true);
  };

  const handleQuizNext = () => {
    if (selectedOption === null) return;
    const score = QUIZ_QUESTIONS[quizStep].options[selectedOption].score;
    const newAnswers = [...quizAnswers, score];
    setQuizAnswers(newAnswers);
    setSelectedOption(null);
    if (quizStep + 1 < QUIZ_QUESTIONS.length) {
      setQuizStep(s => s + 1);
    } else {
      setQuizDone(true);
    }
  };

  const handleQuizSubmit = async () => {
    const allAnswers = [...quizAnswers];
    // last answer already appended via handleQuizNext before quizDone=true
    const sum = allAnswers.reduce((a, b) => a + b, 0);
    const moy = sum / allAnswers.length;
    const { h, k } = computeHK(moy);
    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/auth/projets/init?nom_projet=${encodeURIComponent(pendingNom)}&url_projet=${encodeURIComponent(pendingUrl)}&h_value=${h}&k_value=${k}`,
        { method: "POST", credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) {
        setShowQuiz(false);
        setShowModal(true);
        setFieldError(data.detail ?? "Une erreur est survenue.");
        return;
      }
      setRefreshKey(kk => kk + 1);
      setShowQuiz(false);
      closeModal();
    } catch {
      setShowQuiz(false);
      setShowModal(true);
      setFieldError("Impossible de contacter le serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  const closeQuiz = () => {
    setShowQuiz(false);
    setShowModal(true);
  };

  const displayName = user!.nom_utilisateur;
  const initials    = user!.nom_utilisateur.slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await logout();
    router.push("/auth?mode=signin");
  };

  return (
    <>
      <style>{styles}</style>

      <div className="grid-bg" />
      <div className="glow" />

      <div className="dashboard-shell">

        <button
          className={`sidebar-toggle ${sidebarOpen ? "open" : ""}`}
          onClick={() => setSidebarOpen(v => !v)}
          aria-label="Toggle sidebar"
        >
          <span className="toggle-line" />
          <span className="toggle-line" style={{ width: "12px" }} />
          <span className="toggle-line" />
        </button>

        <aside className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
          <div className="sidebar-logo">
            <div className="sidebar-logo-text">
              Technical<br /><em>Debt</em>Inspector
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section-label">Navigation</div>
            {NAV_ITEMS.map(item => (
              <div
                key={item.id}
                className={`nav-item ${activeNav === item.id ? "active" : ""}`}
                onClick={() => setActiveNav(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <div className="user-chip">
              <div className="user-avatar">{initials}</div>
              <div className="user-info">
                <div className="user-name">{displayName}</div>
              </div>
              <button className="logout-btn" onClick={handleLogout} title="Se déconnecter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </aside>

        <main className={`main ${sidebarOpen ? "shifted" : ""}`}>
          <div className="topbar">
            <div className="topbar-left">
              
            </div>
            <div className="topbar-right">
              <div className="topbar-greeting">
                <span>👤</span> Bienvenue, <strong>{displayName}</strong>
              </div>
            </div>
          </div>

          <div className="page-body">

            {/* ── PAGE : ACCUEIL ── */}
            {activeNav === "accueil" && (
              <>
                <div className="section-header">
                  <div>
                    <h1 className="section-title">Mes <em>projets</em></h1>
                  </div>
                  
                </div>

                <div className="stats-row">
                  <div className="stat-card">
                    <div className="stat-label">📁 Projets analysés</div>
                    <div className="stat-value">{totalProjets ?? "—"}</div>
                    <div className="stat-unit">dépôts GitHub</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">🔄 Commits scannés</div>
                    <div className="stat-value">{totalCommits ?? "—"}</div>
                    <div className="stat-unit">au total</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">🌿 Branches analysées</div>
                    <div className="stat-value">{totalBranches ?? "—"}</div>
                    <div className="stat-unit">toutes branches</div>
                  </div>
                </div>

                <div className="projects-label">Dépôts récents</div>
                <div className="projects-grid">
                  {MOCK_PROJECTS.map(p => (
                    <div key={p.id} className="project-card">
                      <div className="project-header">
                        <div className="project-icon">{p.icon}</div>
                        <span className={`project-badge ${p.badge}`}>{p.debt}</span>
                      </div>
                      <div className="project-name">{p.name}</div>
                      <div className="project-repo">{p.repo}</div>

                      <div className="debt-indicator">
                        <div className={`debt-fill ${p.debtLevel}`} />
                      </div>
                      <div className="debt-text">
                        <span>Dette technique</span>
                        <span>{p.debt === "Élevée" ? "85%" : p.debt === "Moyenne" ? "50%" : "20%"}</span>
                      </div>

                      <div className="project-stats">
                        <div className="proj-stat">
                          <div className="proj-stat-val">{p.commits}</div>
                          <div className="proj-stat-key">commits</div>
                        </div>
                        <div className="proj-stat">
                          <div className="proj-stat-val">{p.files}</div>
                          <div className="proj-stat-key">fichiers</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  
                </div>
              </>
            )}

            {/* ── PAGE : MES PROJETS ── */}
            {activeNav === "mes_projets" && (
              <>
                <div className="section-header">
                  <div>
                    <h1 className="section-title">Mes <em>projets</em></h1>
                  </div>
                </div>
                <ProjetsList key={refreshKey} id_user={user!.id_user} />
                <div className="projects-grid" style={{ marginTop: "24px" }}>
                  <div className="add-project-card" onClick={() => setShowModal(true)}>
                    <div className="add-circle">+</div>
                    <div className="add-label">Nouveau projet</div>
                  </div>
                </div>
              </>
            )}

            {/* ── PAGES VIDES (placeholders) ── */}
            {/* ── AIDE ── */}
            {activeNav === "aide" && <Aide />}

            {/* ── PLACEHOLDERS ── */}
            {(activeNav === "a_propos") && (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", minHeight: "60vh", gap: "20px",
                opacity: 0, animation: "fadeUp 0.5s ease 0.05s forwards"
              }}>
                <div style={{ fontSize: "56px", lineHeight: 1 }}>
                  {activeNav === "a_propos"  && "👤"}
                </div>
                <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "36px", color: "#EAE6DF", letterSpacing: "-0.02em" }}>
                  {activeNav === "a_propos"  && <>À <em style={{ color: "#E8A020", fontStyle: "italic" }}>propos</em></>}
                </h2>
                <div style={{ width: "60px", height: "2px", background: "linear-gradient(90deg, transparent, #E8A020, transparent)", marginTop: "8px" }} />
              </div>
            )}

          </div>
        </main>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal">
            <button className="modal-close" onClick={closeModal}>✕</button>
            <div className="modal-title">Nouveau projet</div>
            <div className="modal-sub">Renseignez le nom et l'URL de votre dépôt GitHub public</div>

            {/* ── Error alert ── */}
            {fieldError && (
              <div className="modal-error">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {fieldError}
              </div>
            )}

            {/* ── Champ Nom du projet ── */}
            <div className="field-label">Nom du projet</div>
            <div className="input-row" style={{ marginBottom: "20px" }}>
              <input
                className="url-input"
                placeholder="ex: mon-projet"
                value={newNom}
                onChange={e => { setNewNom(e.target.value); setFieldError(""); }}
                autoFocus
              />
            </div>

            {/* ── Champ URL ── */}
            <div className="field-label">URL du dépôt</div>
            <div className="input-row">
              <div className="prefix">github.com/</div>
              <input
                className="url-input"
                placeholder="utilisateur/mon-projet"
                value={newUrl}
                onChange={e => { setNewUrl(e.target.value); setFieldError(""); }}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={closeModal}>Annuler</button>
              <button
                className="btn-confirm"
                onClick={handleAnalyser}
                disabled={isLoading}
                style={{ opacity: isLoading ? 0.6 : 1, cursor: isLoading ? "not-allowed" : "pointer" }}
              >
                {isLoading ? "Création en cours..." : "Créer →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QUESTIONNAIRE DE PROFILAGE ── */}
      {showQuiz && (
        <div className="quiz-overlay" onClick={e => { if (e.target === e.currentTarget) closeQuiz(); }}>
          <div className="quiz-modal">
            <button className="modal-close" onClick={closeQuiz}>✕</button>

            {/* Progress bar */}
            <div className="quiz-progress-bar-track">
              <div
                className="quiz-progress-bar-fill"
                style={{ width: `${quizDone ? 100 : ((quizStep) / QUIZ_QUESTIONS.length) * 100}%` }}
              />
            </div>

            {!quizDone ? (
              <div key={quizStep} className="quiz-slide-enter">
                <div className="quiz-step-label">
                  Question <span>{quizStep + 1}</span> / {QUIZ_QUESTIONS.length}
                </div>
                <div className="quiz-question">{QUIZ_QUESTIONS[quizStep].question}</div>
                <div className="quiz-options">
                  {QUIZ_QUESTIONS[quizStep].options.map((opt, i) => (
                    <button
                      key={i}
                      className={`quiz-option ${selectedOption === i ? "selected" : ""}`}
                      onClick={() => setSelectedOption(i)}
                    >
                      <div className="quiz-option-letter">{opt.letter}</div>
                      <div>
                        <div className="quiz-option-text">{opt.text}</div>
                        <div className="quiz-option-score">{opt.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="quiz-footer">
                  <div className="quiz-dots">
                    {QUIZ_QUESTIONS.map((_, i) => (
                      <div
                        key={i}
                        className={`quiz-dot ${i < quizStep ? "done" : i === quizStep ? "current" : ""}`}
                      />
                    ))}
                  </div>
                  <button
                    className="quiz-next-btn"
                    disabled={selectedOption === null}
                    onClick={handleQuizNext}
                  >
                    {quizStep + 1 < QUIZ_QUESTIONS.length ? "Suivant →" : "Terminer →"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="quiz-result-screen">
                <div className="quiz-result-icon">✅</div>
                <div className="quiz-result-title">Questionnaire terminé</div>
                <div className="quiz-result-sub">
                  Si vous avez répondu honnêtement au formulaire,<br />
                  commencez à analyser votre projet.
                </div>
                <div className="modal-actions" style={{ justifyContent: "center", marginTop: 0 }}>
                  <button className="btn-cancel" onClick={closeQuiz}>← Retour</button>
                  <button
                    className="btn-confirm"
                    onClick={handleQuizSubmit}
                    disabled={isLoading}
                    style={{ opacity: isLoading ? 0.6 : 1, cursor: isLoading ? "not-allowed" : "pointer" }}
                  >
                    {isLoading ? "Création..." : "Créer le projet →"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <AccountContent />
    </ProtectedRoute>
  );
}