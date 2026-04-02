import React from "react";
import { Link } from "react-router-dom";
import { styles } from "../styles";

export default function Welcome() {
  return (
    <div style={styles.body}>
      <div style={styles.bgBlurBlue}></div>
      <div style={{...styles.heroSection, className: 'animate-in'}}>
        <div style={{...styles.neonLogoLarge, animation: 'float 3s ease-in-out infinite'}}>G</div> 
        <h1 style={styles.heroTitle}>Git<span style={{color: '#238636'}}>Analyzer</span></h1>
        <p style={styles.heroSubtitle}>Audit neuronal de dépôts GitHub en temps réel.</p>
        <Link to="/auth" style={{...styles.buttonHero, animation: 'pulseGlow 2s infinite'}}>Accéder au Terminal</Link>
      </div>
    </div>
  );
}