# DebtInspector

## Présentation

DebtInspector est une plateforme d’analyse de dette technique pensée pour centraliser les métriques SonarQube, historiser les résultats de qualité et proposer un tableau de bord interprétable.

Le projet se compose de :
- un backend Python / FastAPI qui gère l’authentification, la synchronisation GitHub/SonarQube, le stockage PostgreSQL et des services IA/ML,
- un frontend Next.js qui offre une interface élégante de gestion de projet et de visualisation des indicateurs.

## Architecture

### Backend

- `backend/app/main.py` : application FastAPI principale.
- `backend/app/auth.py` : routes REST pour l’authentification, la gestion des projets, la synchronisation de branches, le streaming SSE, et les services IA/ML.
- `backend/app/models.py` : définition des entités SQLAlchemy : `Utilisateur`, `Projet`, `Branche`, `ResultatPush`.
- `backend/app/database.py` : configuration de la connexion PostgreSQL.
- `backend/requirements.txt` : dépendances Python.

### Frontend

- `frontend/src/pages/` : pages principales de l’application.
  - `index.tsx` : page d’accueil marketing.
  - `auth.tsx` : page de connexion / inscription.
  - `account.tsx` : espace utilisateur.
  - `dashboard/[id_projet].tsx` : tableau de bord de projet.
  - `analyser.tsx` : page d’analyse et d’inspection.
- `frontend/src/ui/components/` : composants réutilisables.
  - `AuthPage.tsx` : formulaire de connexion et d’inscription.
  - `Dashboard.tsx` : visualisations graphiques et KPIs.
  - `page_d_accueil.tsx` : page d’accueil stylée.

### Orchestration

- `docker-compose.yml` orchestrant :
  - SonarQube (`sonarqube`),
  - API backend (`backend`),
  - application frontend (`frontend`),
  - pgAdmin (`pgadmin`),
  - base de données PostgreSQL (`db`).

## Fonctionnalités clés

- Authentification utilisateur avec token JWT stocké en cookie HTTP-only.
- Inscription et connexion avec validation de l’email.
- Gestion de projets GitHub par utilisateur.
- Synchronisation des branches et récupération de métriques SonarQube.
- Streaming SSE pour l’actualisation en temps réel des résultats de push.
- Service IA via une API Anthropic proxy (endpoint `/auth/ai/analyse`).
- Prédiction de ratio de dette technique future avec modèles LightGBM (endpoint `/auth/ai/predict`).
- Visualisation de KPIs techniques : bugs, vulnérabilités, code smells, couverture, complexité, duplication.

## Flux technique

1. L’utilisateur se connecte / s’inscrit via `frontend/src/ui/components/AuthPage.tsx`.
2. Le backend crée un cookie `access_token` et authentifie les requêtes.
3. L’utilisateur ajoute un projet GitHub.
4. Le backend vérifie l’URL GitHub, enregistre le projet et synchronise les branches.
5. Les métriques SonarQube sont récupérées et historisées dans PostgreSQL.
6. Le frontend affiche l’évolution des indicateurs et propose des analyses IA/ML.

## API principales

Le backend expose les routes suivantes (préfixées par `/auth`) :

- `POST /auth/check-email` : vérifier si un email existe.
- `POST /auth/register` : création de compte.
- `POST /auth/login` : connexion.
- `POST /auth/logout` : déconnexion.
- `GET /auth/me` : récupération des informations de l’utilisateur.
- `GET /auth/projets/user/{id_user}` : liste des projets d’un utilisateur.
- `GET /auth/projets/{id_projet}/branches` : branches d’un projet.
- `POST /auth/projets/init` : création et validation d’un projet GitHub.
- `POST /auth/projets/sync-branches/{nom_projet}` : synchronisation des branches d’un projet.
- `DELETE /auth/projets/supprimer/{nom_projet}` : suppression d’un projet.
- `GET /auth/stream/{id_branche}` : streaming SSE des résultats de branche.
- `POST /auth/ai/analyse` : proxy vers Anthropic pour analyse en langage naturel.
- `POST /auth/ai/predict` : prédiction du `sqale_debt_ratio` pour les 3 prochains mois.
- `GET /auth/projets/count/{id_user}` : compteur de projets.
- `GET /auth/resultats-push/total-count/{id_user}` : compteur de résultats de push.

## Installation

### Avec Docker Compose

```bash
docker compose up --build
```

Une fois démarré, les accès sont :

- Frontend : `http://localhost:3000`
- Backend API : `http://localhost:8000`
- SonarQube : `http://localhost:9000`
- pgAdmin : `http://localhost:5050`

### En local sans Docker

#### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cd app
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Configuration et variables sensibles

- Dans `backend/app/auth.py` : clé API Anthropic (`ANTHROPIC_API_KEY`) est un placeholder.
- Dans `backend/app/auth.py` : le token GitHub est actuellement codé en dur pour la récupération des dépôts.
- Les modèles LightGBM doivent se trouver dans `backend/app/` sous les noms :
  - `model_m1.pkl`
  - `model_m2.pkl`
  - `model_m3.pkl`

### Variables env dans Docker Compose

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `SONAR_HOST`

## Dépendances

### Backend

Liste non exhaustive des dépendances principales :

- `fastapi`
- `uvicorn`
- `sqlalchemy`
- `psycopg2-binary`
- `python-dotenv`
- `python-jose[cryptography]`
- `passlib[bcrypt]`
- `httpx`
- `lightgbm`
- `numpy`
- `pandas`
- `scikit-learn`

### Frontend

Dépendances clés :

- `next`
- `react`
- `react-dom`
- `@tanstack/react-query`
- `chart.js`
- `react-chartjs-2`
- `socket.io`
- `firebase`
- `tailwindcss`

## Points d’attention

- L’authentification utilise des cookies HTTP-only ; vérifiez que le navigateur accepte les cookies pour `localhost`.
- La clé Anthropic doit être remplacée avant utilisation en production.
- Ne laissez aucune clé GitHub ou jeton en clair dans le dépôt public.
- Le backend accepte actuellement uniquement `http://localhost:3000` via CORS.

## Contribution

1. Créez une branche dédiée.
2. Travaillez sur vos modifications.
3. Ouvrez une pull request.

## Licence

Ajoutez ici la licence du projet (par ex. MIT, Apache 2.0, etc.).
