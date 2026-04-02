import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { styles } from "../styles";

export default function Auth({ setUser }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async (e) => { 
    e.preventDefault();
    const endpoint = isLogin ? "/api/login" : "/api/signup";

    try {
      const response = await fetch(`http://localhost:8000${endpoint}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: formData.email, password: formData.password })
});

      const data = await response.json();

      // --- DANS auth.js ---
      if (response.ok) {
        // On vérifie ce que renvoie le serveur (regarde ta console F12)
        console.log("Données reçues du backend:", data);

        const userData = { 
          // On prend l'ID peu importe son nom (id_user ou id)
          id_user: data.id_user ,
          name: data.email.split('@')[0], 
          email: data.email
        };

        // TRÈS IMPORTANT : On enregistre l'objet COMPLET (avec l'ID)
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        
        // Change "/account" par "/analyze" si tu veux aller direct à la page de projet
        navigate("/account"); 
}
      else {
        alert(data.detail || "Une erreur est survenue");
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      alert("Impossible de joindre le serveur backend. Vérifiez que Docker est lancé.");
    }
  };

  return (
    <div style={styles.body}>
      <div style={styles.glassCardAuth} className="animate-in">
        <h2 style={{color: '#58a6ff', marginBottom: '25px'}}>
          {isLogin ? "S'identifier" : "Créer un compte"}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Identifiant (Email)" 
            required 
            style={styles.input} 
            onChange={e => setFormData({...formData, email: e.target.value})} 
          />
          <input 
            type="password" 
            placeholder="Code d'accès" 
            required 
            style={styles.input} 
            onChange={e => setFormData({...formData, password: e.target.value})} 
          />
          <button type="submit" style={styles.buttonGlow} className="hover-scale">
            {isLogin ? "Se connecter" : "S'inscrire"}
          </button>
        </form>

        <p 
          style={{ color: "white", marginTop: "20px", cursor: "pointer", fontSize: "14px", textAlign: "center", textDecoration: "underline" }} 
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
        </p>
      </div>
    </div>
  );
}