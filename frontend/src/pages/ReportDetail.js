import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";
import { styles } from "../styles";

export default function ReportDetail() {
  const location = useLocation();
  const { owner, repo } = location.state || {};
  const [files, setFiles] = useState([]);
  const [commits, setCommits] = useState([]);

  useEffect(() => {
    if (owner && repo) {
      axios.get(`https://api.github.com/repos/${owner}/${repo}/contents`).then(res => setFiles(res.data));
      axios.get(`https://api.github.com/repos/${owner}/${repo}/commits`).then(res => setCommits(res.data.slice(0, 5)));
    }
  }, [owner, repo]);

  return (
    <div style={styles.body}>
      <nav style={styles.navbar}>
        <div style={styles.logoText}>{repo} <span style={{fontSize:'0.8rem', color:'#8b949e', fontWeight: 'normal'}}>by {owner}</span></div>
        <Link to="/account" style={styles.logoutBtn}>Fermer</Link>
      </nav>
      
      <div style={{...styles.dashboardContent, display: 'flex', gap: '20px', marginTop: '120px', className: 'animate-in'}}>
        <div style={styles.reportCard}>
          <h3 style={{color: '#58a6ff', marginBottom: '15px', borderBottom: '1px solid #30363d', paddingBottom: '10px'}}>Structure</h3>
          {files.map((f, i) => (
            <div key={i} style={styles.fileRow}>{f.type === 'dir' ? '📁' : '📄'} {f.name}</div>
          ))}
        </div>
        <div style={styles.reportCard}>
          <h3 style={{color: '#2ea043', marginBottom: '15px', borderBottom: '1px solid #30363d', paddingBottom: '10px'}}>Derniers Pushes</h3>
          {commits.map((c, i) => (
            <div key={i} style={styles.commitRow}>
              <div style={{fontWeight: 'bold'}}>{c.commit.message}</div>
              <div style={{fontSize: '0.7rem', color: '#8b949e'}}>{new Date(c.commit.author.date).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}