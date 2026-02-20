from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI(title="Technical Debt Inspector API")

# --- CONFIGURATION CORS ---
# Cela permet à ton Frontend (port 3000) de parler à ton Backend (port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Autorise ton interface React
    allow_credentials=True,
    allow_methods=["*"], # Autorise GET, POST, etc.
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Le Backend est opérationnel !"}

@app.get("/branches")
def get_github_branches(repo_url: str):
    """
    Récupère la liste des branches d'un dépôt GitHub public.
    Exemple d'URL : https://github.com/user/repo
    """
    try:
        # Nettoyage de l'URL pour obtenir 'user/repo'
        # On enlève le domaine et le dernier slash si présent
        repo_path = repo_url.replace("https://github.com/", "").rstrip("/")
        
        # Appel à l'API officielle de GitHub
        github_api_url = f"https://api.github.com/repos/{repo_path}/branches"
        
        response = requests.get(github_api_url)
        
        if response.status_code == 200:
            # Succès : on renvoie la liste des branches au format JSON
            return response.json()
        elif response.status_code == 404:
            raise HTTPException(status_code=404, detail="Dépôt GitHub introuvable")
        else:
            raise HTTPException(status_code=response.status_code, detail="Erreur API GitHub")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur lors du traitement : {str(e)}")

# Cet endpoint sera utile pour ta prochaine étape : la base de données
@app.post("/sauvegarder-projet")
def save_project(name: str, url: str):
    # Logique pour PostgreSQL à venir ici
    return {"status": "Projet enregistré", "nom": name}