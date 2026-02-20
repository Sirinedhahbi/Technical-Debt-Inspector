import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [url, setUrl] = useState('');
  const [branches, setBranches] = useState([]);

  const fetchBranches = async () => {
    try {
      // Appel à ton API FastAPI sur le port 8000
      const response = await axios.get(`http://localhost:8000/branches?repo_url=${url}`);
      setBranches(response.data);
    } catch (error) {
      console.error("Erreur:", error);
      alert("Impossible de récupérer les branches. Vérifiez que le Backend est lancé.");
    }
  };

  return (
    <div style={{ padding: '40px', backgroundColor: '#ecf0ee', minHeight: '100vh', fontFamily: 'Arial' }}>
      <h1>Technical Debt Inspector</h1>
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Lien du projet GitHub..." 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ width: '400px', padding: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button 
          onClick={fetchBranches}
          style={{ padding: '12px 20px', marginLeft: '10px', backgroundColor: '#7fb5cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Lister les branches
        </button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3>Branches détectées :</h3>
        <ul>
          {branches.map((branch, index) => (
            <li key={index} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
              📂 <strong>{branch.name}</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;