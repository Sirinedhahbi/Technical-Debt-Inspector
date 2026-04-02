import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { styles } from "../styles";

export default function Account({ user, setUser }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/projects/${user.id_user}`);
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (err) { console.error(err); }
    };
    if (user?.id_user) fetchProjects();
  }, [user]);

  if (!user) return null;

  return (
    <div style={styles.body}>
      <nav style={styles.navbar}>
        <div style={styles.logoText}>Git<span style={{color: '#238636'}}>Analyzer</span></div>
        <button onClick={() => {localStorage.removeItem("user"); setUser(null); navigate("/");}} style={styles.logoutBtn}>Déconnexion</button>
      </nav>
      
      <div style={styles.dashboardContent}>
        <div style={styles.profileHeader}>
            <div style={styles.avatarBig}>{user.email[0].toUpperCase()}</div>
            <div>
                <h2 style={styles.neonTextBlue}>Agent: {user.email.split('@')[0]}</h2>
                <p style={{color: '#8b949e', fontSize: '0.8rem'}}>Statut: En ligne</p>
            </div>
        </div>

        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: '40px'}}>
            <h3 style={{color: '#c9d1d9'}}>Archives d'audit</h3>
            {/* Redirection vers la page d'ajout */}
            <button onClick={() => navigate("/analyze")} style={styles.btnAdd}>+</button>
        </div>

        <div style={styles.historyList}>
          {projects.length === 0 ? (
            <p style={{color:'#8b949e', textAlign: 'center', marginTop: '20px'}}>Aucun projet archivé.</p>
          ) : (
            projects.map((proj, i) => (
              <div key={i} style={styles.historyItem}>
                <span>{proj.nom_projet}</span>
                <span style={{color: '#238636'}}>({proj.sonar_project_key})</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}