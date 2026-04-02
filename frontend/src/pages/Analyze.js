import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { styles } from "../styles";

export default function Analyze({ user, setUser }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [history, setHistory] = useState([]);
  const [loadingRepo, setLoadingRepo] = useState(null);
  const navigate = useNavigate();

  // 1. Chargement de l'historique (Corrigé avec id_user)
  useEffect(() => {
    // ON UTILISE id_user car c'est ce que montre ta console
    if (user && user.id_user) { 
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      // ON UTILISE id_user ici aussi pour construire l'URL
      const response = await axios.get(`http://127.0.0.1:8000/api/projects/${user.id_user}`);
      setHistory(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique:", error);
    }
  };

  // 2. Fonction AJOUTER
  const analyzeRepo = async () => {
    if (!repoUrl) {
      setStatusMsg("❌ Veuillez entrer une URL GitHub.");
      return;
    }
    setLoading(true);
    try {
      const repoName = repoUrl.split('/').pop() || "projet_inconnu";

      // Dans Analyze.js
      const loggedInUser = user?.id_user || user?.id || JSON.parse(localStorage.getItem("user"))?.id_user || JSON.parse(localStorage.getItem("user"))?.id;

      const payload = {
        id_user: loggedInUser, 
        nom_projet: repoName,
        sonar_project_key: `${repoName}_${Date.now()}`
};

      console.log("Payload envoyé au serveur :", payload);

      const response = await axios.post("http://127.0.0.1:8000/api/projects", payload);

      if (response.status === 200 || response.status === 201) {
        setStatusMsg("✅ Projet ajouté avec succès !");
        setRepoUrl("");
        fetchHistory(); // Rafraîchit la liste
      }
    } catch (e) {
      console.error("Détails :", e.response?.data);
      setStatusMsg("❌ Échec de l'ajout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.body}>
      <div style={styles.scanLine}></div>
      <div style={styles.dashboardContent}>
        <div style={styles.searchSection}>
          <h2 style={styles.neonTextBlue}>Ajouter un Projet</h2>
          <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
            <input 
              type="text" 
              style={styles.inputDashboard} 
              value={repoUrl} 
              onChange={e => setRepoUrl(e.target.value)} 
              placeholder="URL GitHub..."
            />
            <button onClick={analyzeRepo} style={styles.buttonAnalyze} disabled={loading}>
              {loading ? "AJOUT..." : "AJOUTER"}
            </button>
          </div>
          {statusMsg && <p style={{ marginTop: '20px', color: statusMsg.includes('❌') ? '#ff4444' : '#00ff00' }}>{statusMsg}</p>}
        </div>

        <div style={{ marginTop: '50px', background: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '10px' }}>
          <h3 style={styles.neonTextBlue}>Historique des Projets</h3>
          <table style={{ width: '100%', color: 'white', marginTop: '20px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #58a6ff', textAlign: 'left' }}>
                <th>Nom</th>
                <th>Clé Sonar</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map((projet, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '10px' }}>{projet.nom_projet}</td>
                  <td style={{ padding: '10px' }}>{projet.sonar_project_key}</td>
                  <td>
                    <button onClick={() => lancerAnalyse(projet.nom_projet)} disabled={loadingRepo === projet.nom_projet}>
                      {loadingRepo === projet.nom_projet ? "..." : "Analyser"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}