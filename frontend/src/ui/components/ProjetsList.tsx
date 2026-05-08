import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useState, useRef, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Projet {
  id_projet: number;
  nom_projet: string;
  url_projet: string;
  sonar_project_key: string | null;
}

interface Branche {
  id_branche: number;
  id_projet: number;
  nom_branche: string;
  sonar_project_key: string | null;
}

interface Props {
  id_user: number;
}

async function fetchProjets(id_user: number): Promise<Projet[]> {
  const res = await fetch(`${API}/auth/projets/user/${id_user}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Erreur lors du chargement des projets");
  return res.json();
}

async function fetchBranches(id_projet: number): Promise<Branche[]> {
  const res = await fetch(`${API}/auth/projets/${id_projet}/branches`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Erreur lors du chargement des branches");
  return res.json();
}

async function supprimerProjet(nom_projet: string): Promise<void> {
  const res = await fetch(
    `${API}/auth/projets/supprimer/${encodeURIComponent(nom_projet)}`,
    { method: "DELETE", credentials: "include" }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail ?? "Erreur lors de la suppression");
  }
}
async function syncBranches(nom_projet: string): Promise<void> {
  const res = await fetch(
    `${API}/auth/projets/sync-branches/${encodeURIComponent(nom_projet)}`,
    { method: "POST", credentials: "include" }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail ?? "Erreur lors de la synchronisation des branches");
  }
}



/** Returns the default branch label: "main", "master", or first branch name */
function getDefaultBranchLabel(branches: Branche[]): string {
  const names = branches.map((b) => b.nom_branche.toLowerCase());
  if (names.includes("main")) return "main";
  if (names.includes("master")) return "master";
  return branches[0]?.nom_branche ?? "branch";
}

const styles = `
  .pl-wrapper {
    margin-top: 28px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .pl-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .pl-count {
    font-size: 11px;
    color: #3D4552;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .pl-count span {
    color: #E8A020;
    font-weight: 600;
  }

  /* ── CARDS ── */
  .pl-card {
    display: flex;
    align-items: center;
    gap: 20px;
    background: #0E1115;
    border: 1px solid #1C2128;
    padding: 18px 22px;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
    position: relative;
    overflow: visible;
    cursor: default;
  }

  .pl-card::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, #E8A020, #b87300);
    opacity: 0;
    transition: opacity 0.2s;
  }

  .pl-card:hover {
    border-color: #2C3540;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  }

  .pl-card:hover::before {
    opacity: 1;
  }

  /* index badge */
  .pl-index {
    width: 32px;
    height: 32px;
    background: #13171D;
    border: 1px solid #1C2128;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: #3D4552;
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 600;
    flex-shrink: 0;
    border-radius: 4px;
  }

  /* info */
  .pl-info {
    flex: 1;
    min-width: 0;
  }

  .pl-name {
    font-size: 14px;
    font-weight: 600;
    color: #EAE6DF;
    font-family: 'IBM Plex Mono', monospace;
    letter-spacing: 0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pl-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 6px;
    flex-wrap: wrap;
  }

  .pl-url {
    font-size: 11px;
    color: #5A6575;
    text-decoration: none;
    letter-spacing: 0.03em;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: color 0.2s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 260px;
  }

  .pl-url:hover { color: #E8A020; }

  .pl-sonar {
    font-size: 10px;
    color: #3D4552;
    background: #13171D;
    border: 1px solid #1C2128;
    padding: 2px 8px;
    border-radius: 3px;
    letter-spacing: 0.06em;
    white-space: nowrap;
  }

  /* ── RELOAD BUTTON ── */
  .pl-reload-btn {
    width: 32px;
    height: 32px;
    background: #13171D;
    border: 1px solid #2C3540;
    border-radius: 50%;
    color: #5A6575;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s;
    padding: 0;
  }

  .pl-reload-btn:hover {
    background: rgba(232,160,32,0.08);
    border-color: rgba(232,160,32,0.4);
    color: #E8A020;
    box-shadow: 0 0 10px rgba(232,160,32,0.15);
  }

  .pl-reload-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .pl-reload-btn svg {
    transition: transform 0.6s ease;
  }

  .pl-reload-btn.spinning svg {
    animation: fullSpin 0.7s linear infinite;
  }

  @keyframes fullSpin {
    to { transform: rotate(360deg); }
  }

  /* ── ACTIONS ROW ── */
  .pl-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  /* ── DELETE BUTTON ── */
    .pl-delete-btn {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 18px;
    height: 18px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #3D4552;
    transition: all 0.2s;
    padding: 0;
    z-index: 2;
  }

  .pl-delete-btn:hover {
    color: #E24B4A;
    border-color: rgba(226, 75, 74, 0.35);
    background: rgba(226, 75, 74, 0.08);
  }

  /* ── BRANCH SELECTOR ── */
  .pl-branch-wrap {
    position: relative;
  }

  .pl-branch-btn {
    background: #13171D;
    border: 1px solid #2C3540;
    color: #9BAAB8;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    padding: 8px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 7px;
    white-space: nowrap;
    transition: background 0.2s, border-color 0.2s, color 0.2s;
    border-radius: 4px;
    width: 120px;
  }

  .pl-branch-btn:hover,
  .pl-branch-btn.open {
    background: rgba(232,160,32,0.08);
    border-color: rgba(232,160,32,0.4);
    color: #E8A020;
  }

  .pl-branch-btn .branch-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #3D7A3F;
    flex-shrink: 0;
  }

  .pl-branch-btn .branch-chevron {
    margin-left: auto;
    transition: transform 0.2s;
    color: #5A6575;
  }

  .pl-branch-btn.open .branch-chevron {
    transform: rotate(180deg);
    color: #E8A020;
  }

  .pl-branch-btn .branch-loading {
    width: 10px;
    height: 10px;
    border: 1.5px solid #3D4552;
    border-top-color: #E8A020;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    margin-left: auto;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ── DROPDOWN ── */
  .pl-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    background: #0D1117;
    border: 1px solid #2C3540;
    border-radius: 6px;
    min-width: 200px;
    max-height: 220px;
    overflow-y: auto;
    z-index: 999;
    box-shadow: 0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(232,160,32,0.05);
    animation: dropIn 0.15s ease;
  }

  @keyframes dropIn {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .pl-dropdown::-webkit-scrollbar { width: 4px; }
  .pl-dropdown::-webkit-scrollbar-track { background: transparent; }
  .pl-dropdown::-webkit-scrollbar-thumb { background: #2C3540; border-radius: 2px; }

  .pl-dropdown-header {
    padding: 8px 14px 6px;
    font-size: 9px;
    color: #3D4552;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    border-bottom: 1px solid #1C2128;
    font-family: 'IBM Plex Mono', monospace;
  }

  .pl-dropdown-item {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 9px 14px;
    font-size: 12px;
    font-family: 'IBM Plex Mono', monospace;
    color: #7A8898;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    border-bottom: 1px solid rgba(28,33,40,0.5);
  }

  .pl-dropdown-item:last-child { border-bottom: none; }

  .pl-dropdown-item:hover {
    background: rgba(232,160,32,0.07);
    color: #E8A020;
  }

  .pl-dropdown-item.selected {
    color: #E8A020;
    background: rgba(232,160,32,0.05);
  }

  .pl-dropdown-item .item-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #2C3540;
    flex-shrink: 0;
  }

  .pl-dropdown-item.selected .item-dot,
  .pl-dropdown-item:hover .item-dot {
    background: #E8A020;
  }

  .pl-dropdown-empty {
    padding: 18px 14px;
    font-size: 11px;
    color: #3D4552;
    font-family: 'IBM Plex Mono', monospace;
    text-align: center;
  }

  /* dashboard button */
  .pl-btn {
    background: transparent;
    border: 1px solid #2C3540;
    color: #7A8494;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 9px 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    flex-shrink: 0;
    transition: all 0.2s;
    border-radius: 4px;
  }

  .pl-btn:hover {
    background: #E8A020;
    border-color: #E8A020;
    color: #000;
    box-shadow: 0 4px 16px rgba(232,160,32,0.25);
  }

  .pl-btn svg { transition: transform 0.2s; }
  .pl-btn:hover svg { transform: translateX(3px); }

  /* ── STATES ── */
  .pl-state {
    padding: 64px 0;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .pl-state-icon { font-size: 48px; opacity: 0.4; }

  .pl-state-text {
    font-size: 13px;
    color: #5A6575;
    letter-spacing: 0.08em;
  }

  .pl-state-error { color: #E24B4A; }

  /* skeleton loader */
  .pl-skeleton {
    background: #0E1115;
    border: 1px solid #1C2128;
    padding: 18px 22px;
    display: flex;
    align-items: center;
    gap: 20px;
    border-radius: 0;
  }

  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }

  .pl-skel-box {
    background: linear-gradient(90deg, #13171D 25%, #1C2128 50%, #13171D 75%);
    background-size: 800px 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 3px;
  }

  /* ── DELETE CONFIRM MODAL ── */
  .pl-confirm-overlay {
    position: fixed; inset: 0; z-index: 500;
    background: rgba(5,7,9,0.88);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    animation: pl-fadeIn 0.2s ease forwards;
  }

  @keyframes pl-fadeIn { to { opacity: 1; } }

  .pl-confirm-modal {
    background: #0D0F13;
    border: 1px solid #2A3340;
    width: 100%;
    max-width: 440px;
    padding: 36px 40px 32px;
    border-radius: 14px;
    box-shadow: 0 24px 50px rgba(0,0,0,0.7), 0 0 0 1px rgba(226,75,74,0.12);
    transform: scale(0.97);
    animation: pl-scaleIn 0.2s ease forwards;
    position: relative;
    font-family: 'IBM Plex Mono', monospace;
  }

  @keyframes pl-scaleIn { to { transform: scale(1); } }

  .pl-confirm-icon {
    width: 48px; height: 48px;
    background: rgba(226,75,74,0.1);
    border: 1px solid rgba(226,75,74,0.25);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px;
    color: #E24B4A;
  }

  .pl-confirm-title {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: 22px;
    color: #EAE6DF;
    margin-bottom: 10px;
    letter-spacing: -0.01em;
  }

  .pl-confirm-desc {
    font-size: 12px;
    color: #6A788B;
    line-height: 1.7;
    letter-spacing: 0.03em;
    margin-bottom: 8px;
  }

  .pl-confirm-name {
    display: inline-block;
    color: #E8A020;
    background: rgba(232,160,32,0.08);
    border: 1px solid rgba(232,160,32,0.2);
    border-radius: 4px;
    padding: 2px 10px;
    font-size: 13px;
    font-weight: 600;
    margin: 8px 0 20px;
    letter-spacing: 0.04em;
  }

  .pl-confirm-warning {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(226,75,74,0.06);
    border: 1px solid rgba(226,75,74,0.2);
    border-radius: 6px;
    padding: 10px 14px;
    font-size: 11px;
    color: #E24B4A;
    letter-spacing: 0.03em;
    margin-bottom: 28px;
  }

  .pl-confirm-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .pl-confirm-cancel {
    background: transparent;
    border: 1.5px solid #2A3340;
    color: #8A94A6;
    cursor: pointer;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    padding: 10px 22px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .pl-confirm-cancel:hover {
    border-color: #5A6575;
    color: #EAE6DF;
    background: rgba(255,255,255,0.02);
  }

  .pl-confirm-delete {
    background: #E24B4A;
    border: none;
    color: #fff;
    cursor: pointer;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    padding: 10px 26px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border-radius: 6px;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(226,75,74,0.25);
    display: flex; align-items: center; gap: 8px;
  }

  .pl-confirm-delete:hover:not(:disabled) {
    background: #f05c5b;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(226,75,74,0.35);
  }

  .pl-confirm-delete:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .pl-confirm-spinner {
    width: 12px; height: 12px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  .pl-confirm-error {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(226,75,74,0.08);
    border: 1px solid rgba(226,75,74,0.3);
    border-radius: 6px;
    padding: 10px 14px;
    font-size: 11px;
    color: #E24B4A;
    margin-bottom: 16px;
    letter-spacing: 0.03em;
  }
    
`;

// ── Delete Confirmation Modal ─────────────────────────────────────────────────

interface DeleteModalProps {
  nomProjet: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

function DeleteConfirmModal({ nomProjet, onCancel, onConfirm }: DeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");
    try {
      await onConfirm();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="pl-confirm-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="pl-confirm-modal">
        <div className="pl-confirm-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </div>

        <div className="pl-confirm-title">Supprimer le projet</div>
        <div className="pl-confirm-desc">Vous êtes sur le point de supprimer le projet :</div>
        <div className="pl-confirm-name">{nomProjet}</div>

        <div className="pl-confirm-warning">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Cette action est irréversible. Toutes les branches associées seront supprimées.
        </div>

        {error && (
          <div className="pl-confirm-error">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <div className="pl-confirm-actions">
          <button className="pl-confirm-cancel" onClick={onCancel} disabled={isDeleting}>
            Annuler
          </button>
          <button className="pl-confirm-delete" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <span className="pl-confirm-spinner" />
                Suppression…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                </svg>
                Supprimer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Branch dropdown for a single project ──────────────────────────────────────

function BranchSelector({ id_projet, onSelect }: { id_projet: number; onSelect: (nom: string, id: number) => void }) {
  const [open, setOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { data: branches, isLoading } = useQuery<Branche[]>({
    queryKey: ["branches", id_projet],
    queryFn: () => fetchBranches(id_projet),
    staleTime: 60_000,
  });

  const defaultLabel =
    selectedBranch ??
    (branches ? getDefaultBranchLabel(branches) : "branch");

  useEffect(() => {
    if (!branches || branches.length === 0 || selectedBranch) return;
    const priority = ["main", "master"];
    const found = priority
      .map(name => branches.find((b: Branche) => b.nom_branche.toLowerCase() === name))
      .find(Boolean) ?? branches[0];
    if (found) {
      setSelectedBranch(found.nom_branche);
      onSelect(found.nom_branche, found.id_branche);
    }
  }, [branches]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="pl-branch-wrap" ref={wrapRef}>
      <button
        className={`pl-branch-btn${open ? " open" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="branch-dot" />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{defaultLabel}</span>
        {isLoading ? (
          <span className="branch-loading" />
        ) : (
          <svg
            className="branch-chevron"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>

      {open && (
        <div className="pl-dropdown">
          <div className="pl-dropdown-header">Branches</div>

          {isLoading && (
            <div className="pl-dropdown-empty">Chargement…</div>
          )}

          {!isLoading && (!branches || branches.length === 0) && (
            <div className="pl-dropdown-empty">Aucune branche trouvée</div>
          )}

          {branches?.map((b: Branche) => (
            <div
              key={b.id_branche}
              className={`pl-dropdown-item${
                (selectedBranch ?? getDefaultBranchLabel(branches)) === b.nom_branche
                  ? " selected"
                  : ""
              }`}
              onClick={() => {
                setSelectedBranch(b.nom_branche);
                onSelect(b.nom_branche, b.id_branche);
                setOpen(false);
              }}
            >
              <span className="item-dot" />
              {b.nom_branche}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function ReloadButton({ nom_projet, id_projet }: { nom_projet: string; id_projet: number }) {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await syncBranches(nom_projet);
      queryClient.invalidateQueries({ queryKey: ["branches", id_projet] });
    } catch {
      // silently ignore — user can retry
    } finally {
      setSyncing(false);
    }
  };

  return (
    <button
      className={`pl-reload-btn${syncing ? " spinning" : ""}`}
      title="Synchroniser les branches avec GitHub"
      disabled={syncing}
      onClick={handleSync}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
    </button>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="pl-skeleton">
      <div className="pl-skel-box" style={{ width: 32, height: 32, flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="pl-skel-box" style={{ width: "40%", height: 14 }} />
        <div className="pl-skel-box" style={{ width: "60%", height: 11 }} />
      </div>
      <div className="pl-skel-box" style={{ width: 90, height: 34, borderRadius: 4 }} />
      <div className="pl-skel-box" style={{ width: 110, height: 36, borderRadius: 4 }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProjetsList({ id_user }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [deleteTarget, setDeleteTarget] = useState<Projet | null>(null);
  const [selectedBranches, setSelectedBranches] = useState<Record<number, {nom: string; id: number}>>({});

  const {
    data: projets,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["projets", id_user],
    queryFn: () => fetchProjets(id_user),
  });

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await supprimerProjet(deleteTarget.nom_projet);
    setDeleteTarget(null);
    queryClient.invalidateQueries({ queryKey: ["projets", id_user] });
  };

  return (
    <>
      <style>{styles}</style>

      <div className="pl-wrapper">
        {/* Loading skeletons */}
        {isLoading && [1, 2, 3].map((k) => <SkeletonRow key={k} />)}

        {/* Error */}
        {isError && (
          <div className="pl-state">
            <div className="pl-state-icon">⚠️</div>
            <div className="pl-state-text pl-state-error">
              Impossible de charger les projets.
            </div>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && !projets?.length && (
          <div className="pl-state">
            <div className="pl-state-icon">🗂️</div>
            <div className="pl-state-text">Aucun projet pour l'instant.</div>
          </div>
        )}

        {/* Header count */}
        {projets?.length ? (
          <div className="pl-header">
            <div className="pl-count">
              <span>{projets.length}</span> projet
              {projets.length > 1 ? "s" : ""}
            </div>
          </div>
        ) : null}

        {/* Cards */}
        {projets?.map((p: Projet, i: number) => (
          <div key={p.id_projet} className="pl-card">

            {/* ── Bouton supprimer (croix en haut à droite) ── */}
            <button
              className="pl-delete-btn"
              title={`Supprimer ${p.nom_projet}`}
              onClick={() => setDeleteTarget(p)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="pl-index">{String(i + 1).padStart(2, "0")}</div>

            <div className="pl-info">
              <div className="pl-name">{p.nom_projet}</div>
              <div className="pl-meta">
                <a
                  className="pl-url"
                  href={p.url_projet}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                  {p.url_projet}
                </a>
                {p.sonar_project_key && (
                  <span className="pl-sonar">⬡ {p.sonar_project_key}</span>
                )}
              </div>
            </div>

            {/* ── Actions: reload + branch selector + dashboard button ── */}
            <div className="pl-actions">
              <ReloadButton nom_projet={p.nom_projet} id_projet={p.id_projet} />
              <BranchSelector
                id_projet={p.id_projet}
                onSelect={(nom, id) => setSelectedBranches(prev => ({ ...prev, [p.id_projet]: { nom, id } }))}
              />
              <button
                className="pl-btn"
                onClick={() => {
                  const selected = selectedBranches[p.id_projet];
                  if (!selected) { alert("Sélectionnez une branche d'abord."); return; }
                  // ── Redirection directe vers le stream SSE ──────────────
                  router.push(
                    `/dashboard/${p.id_projet}?id_branche=${selected.id}&nom_branche=${encodeURIComponent(selected.nom)}&nom_projet=${encodeURIComponent(p.nom_projet)}`
                  );
                }}
              >
                Dashboard
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Modal de confirmation de suppression ── */}
      {deleteTarget && (
        <DeleteConfirmModal
          nomProjet={deleteTarget.nom_projet}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
}
