import asyncio
import json
from datetime import timedelta, datetime
from typing import Annotated
import re
import uuid
import httpx
from sqlalchemy import func
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Response, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from starlette import status
import os
from models import Utilisateur, Branche, Projet, ResultatPush
from database import SessionLocal
from models import Utilisateur, Branche, Projet
from passlib.context import CryptContext
from jose import jwt, JWTError
import asyncpg
from fastapi.responses import StreamingResponse
from fastapi.responses import RedirectResponse


router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = "dfghjksdfghjkdfghjxcvbnm985175527855fghj952753uhgf851"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 300

# ── Clé API Anthropic ─────────────────────────────────────────────────────────
ANTHROPIC_API_KEY = "sk-ant-METTEZ_VOTRE_VRAIE_CLE_ICI"

bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class CheckEmailRequest(BaseModel):
    email: str


class ProjetCreate(BaseModel):
    nom_projet: str
    sonar_project_key: str
    url_projet: str


class GithubRepoRequest(BaseModel):
    url: str


# ── Nouveau modèle pour l'analyse IA ─────────────────────────────────────────
class AiAnalyseRequest(BaseModel):
    prompt: str


# ── Modèle pour la prédiction ML ─────────────────────────────────────────────
class PredictRequest(BaseModel):
    ncloc: float
    complexity: float
    bugs: float
    vulnerabilities: float
    code_smells: float
    sqale_index: float
    sqale_debt_ratio: float


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]


# ── Helpers ────────────────────────────────────────────────────────────────────

def authenticate_user(email: str, password: str, db: Session):
    user = db.query(Utilisateur).filter(Utilisateur.email == email).first()
    if not user or not bcrypt_context.verify(password, user.mot_de_passe):
        return None
    return user


def create_access_token(user_id: int, email: str, nom_utilisateur: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": email, "id": user_id, "nom": nom_utilisateur, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,  # set to True in production (HTTPS)
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Non authentifié",
        )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("id")
        email: str = payload.get("sub")
        nom_utilisateur: str = payload.get("nom")
        if not email or not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")
        return {"id_user": user_id, "email": email, "nom_utilisateur": nom_utilisateur}
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/check-email")
async def check_email(body: CheckEmailRequest, db: db_dependency):
    exists = db.query(Utilisateur).filter(Utilisateur.email == body.email).first() is not None
    return {"exists": exists}


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, response: Response, db: db_dependency):
    existing = db.query(Utilisateur).filter(Utilisateur.email == body.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email déjà utilisé")

    user = Utilisateur(
        nom_utilisateur=body.username,
        email=body.email,
        mot_de_passe=bcrypt_context.hash(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id_user, user.email, user.nom_utilisateur)
    set_auth_cookie(response, token)

    return {"id_user": user.id_user, "nom_utilisateur": user.nom_utilisateur, "email": user.email}


@router.post("/login")
async def login(body: LoginRequest, response: Response, db: db_dependency):
    user = authenticate_user(body.email, body.password, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")

    token = create_access_token(user.id_user, user.email, user.nom_utilisateur)
    set_auth_cookie(response, token)

    return {"id_user": user.id_user, "nom_utilisateur": user.nom_utilisateur, "email": user.email}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Déconnecté"}


@router.get("/me")
async def me(current_user: Annotated[dict, Depends(get_current_user)]):
    """Renvoie les infos de l'utilisateur connecté (utile côté client)."""
    return current_user


@router.get("/projets/user/{id_user}")
async def get_projets(id_user: int, db: db_dependency, current_user: Annotated[dict, Depends(get_current_user)]):
    if current_user["id_user"] != id_user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès interdit")
    projets = db.query(Projet).filter(Projet.id_user == id_user).all()
    return projets


@router.get("/projets/{id_projet}/branches")
async def get_branches_by_projet(
        id_projet: int,
        db: db_dependency,
        current_user: Annotated[dict, Depends(get_current_user)]
):
    projet = db.query(Projet).filter(
        Projet.id_projet == id_projet,
        Projet.id_user == current_user["id_user"]
    ).first()

    if not projet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet introuvable ou accès non autorisé"
        )

    branches = db.query(Branche).filter(Branche.id_projet == id_projet).all()
    return branches


@router.post("/projets/init", status_code=status.HTTP_201_CREATED)
async def init_projet(
        nom_projet: str,
        url_projet: str,
        h_value: float,
        k_value: float,
        db: db_dependency,
        current_user: Annotated[dict, Depends(get_current_user)],
):
    id_user = current_user["id_user"]

    # ── 1. Extraire owner/repo ─────────────────────────────────────────────
    match = re.search(r"github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$", url_projet.strip())
    if not match:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="URL GitHub invalide. Format attendu : https://github.com/owner/repo",
        )
    owner, repo = match.group(1), match.group(2)

    # ── 2. Vérifier les doublons en DB ────────────────────────────────────
    if db.query(Projet).filter(Projet.id_user == id_user, Projet.url_projet == url_projet).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vous avez déjà un projet avec cette URL.",
        )
    if db.query(Projet).filter(Projet.id_user == id_user, Projet.nom_projet == nom_projet).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Vous avez déjà un projet nommé '{nom_projet}'.",
        )

    # ── 3. Préparer les headers GitHub ────────────────────────────────────
    github_token = "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"
    headers = {"Authorization": f"Bearer {github_token}"}

    async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:

        # ── 4. Vérifier que le dépôt existe et est public ─────────────────
        repo_resp = await client.get(f"https://api.github.com/repos/{owner}/{repo}")
        if repo_resp.status_code == 404:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dépôt GitHub introuvable.")

        repo_data = repo_resp.json()
        if repo_data.get("private"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Le dépôt est privé.")

        # ── 5. Vérifier le langage majoritaire ────────────────────────────
        lang_resp = await client.get(f"https://api.github.com/repos/{owner}/{repo}/languages")
        languages = lang_resp.json()
        if not languages:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Impossible de vérifier le langage.")

        dominant_language = max(languages, key=languages.get).lower()
        if dominant_language not in {"python", "java"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Langage '{dominant_language}' non supporté. Seuls Python et Java le sont.",
            )

        # ── 6. Récupérer TOUTES les branches ──────────────────────────────
        branch_names = []
        page = 1
        while True:
            branches_resp = await client.get(
                f"https://api.github.com/repos/{owner}/{repo}/branches",
                params={"per_page": 100, "page": page},
            )
            batch = branches_resp.json()
            if not batch:
                break
            branch_names.extend(b["name"] for b in batch)
            page += 1

    if not branch_names:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Le dépôt est vide.")

    # ── 7. Insérer le projet avec H_Value et K_Value ──────────────────────
    nouveau_projet = Projet(
        id_user=id_user,
        nom_projet=nom_projet,
        url_projet=url_projet,
        H_Value=h_value,
        K_Value=k_value
    )
    db.add(nouveau_projet)
    db.flush()

    # ── 8. Insérer les branches ───────────────────────────────────────────
    for name in branch_names:
        base_key = f"{owner}_{repo}_{name}".lower().replace("-", "_").replace("/", "_")
        sonar_key = base_key
        while db.query(Branche).filter(Branche.sonar_project_key == sonar_key).first():
            sonar_key = f"{base_key}_{uuid.uuid4().hex[:6]}"

        db.add(Branche(
            id_projet=nouveau_projet.id_projet,
            nom_branche=name,
            sonar_project_key=sonar_key,
        ))

    db.commit()
    db.refresh(nouveau_projet)

    return {
        "projet": {
            "id_projet": nouveau_projet.id_projet,
            "nom_projet": nouveau_projet.nom_projet,
            "url_projet": nouveau_projet.url_projet,
            "H_Value": nouveau_projet.H_Value,
            "K_Value": nouveau_projet.K_Value,
        },
        "branches": branch_names,
        "branches_count": len(branch_names),
    }


# pour effacer un projet
@router.delete("/projets/supprimer/{nom_projet}", status_code=status.HTTP_200_OK)
async def supprimer_projet(
        nom_projet: str,
        db: db_dependency,
        current_user: Annotated[dict, Depends(get_current_user)],
):
    projet = db.query(Projet).filter(
        Projet.nom_projet == nom_projet,
        Projet.id_user == current_user["id_user"],
    ).first()

    if not projet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Projet '{nom_projet}' introuvable ou accès non autorisé.",
        )

    db.delete(projet)
    db.commit()

    return {"message": f"Projet '{nom_projet}' supprimé avec succès."}


# le reload des branches
@router.post("/projets/sync-branches/{nom_projet}")
async def synchroniser_branches_projet(
        nom_projet: str,
        db: db_dependency,
        current_user: Annotated[dict, Depends(get_current_user)]
):
    # 1. Récupérer le projet appartenant à l'utilisateur
    projet = db.query(Projet).filter(
        Projet.nom_projet == nom_projet,
        Projet.id_user == current_user["id_user"]
    ).first()

    if not projet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé ou accès refusé."
        )

    # 2. Extraire owner et repo de l'URL
    match = re.search(r"github\.com/([^/]+)/([^/]+)", projet.url_projet)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format d'URL GitHub invalide en base."
        )

    owner, repo = match.groups()

    # 3. Interroger l'API GitHub pour récupérer les noms des branches (avec pagination)
    GITHUB_TOKEN = "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"
    branch_names = []
    page = 1
    async with httpx.AsyncClient() as client:
        while True:
            try:
                response = await client.get(
                    f"https://api.github.com/repos/{owner}/{repo}/branches",
                    params={"per_page": 100, "page": page},
                    headers={
                        "Authorization": f"Bearer {GITHUB_TOKEN}",
                        "Accept": "application/vnd.github.v3+json",
                    }
                )
                response.raise_for_status()
                batch = response.json()
                if not batch:
                    break
                branch_names.extend(b["name"] for b in batch)
                page += 1
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Erreur lors de la communication avec GitHub: {str(e)}"
                )

    noms_github = set(branch_names)

    # 4. Récupérer les branches actuelles en base de données
    branches_existantes = db.query(Branche).filter(Branche.id_projet == projet.id_projet).all()
    noms_en_base = {b.nom_branche for b in branches_existantes}

    # 5. Logique de mise à jour (Suppression et Ajout)
    mouvements = {"ajoutees": [], "supprimees": []}

    # A. Supprimer les branches qui ne sont plus sur GitHub
    for branche_db in branches_existantes:
        if branche_db.nom_branche not in noms_github:
            mouvements["supprimees"].append(branche_db.nom_branche)
            db.delete(branche_db)

    # B. Ajouter les nouvelles branches de GitHub
    for nom_br in noms_github:
        if nom_br not in noms_en_base:
            base_key = f"{projet.nom_projet}_{nom_br}"
            sonar_key = base_key

            while db.query(Branche).filter(Branche.sonar_project_key == sonar_key).first():
                sonar_key = f"{base_key}_{uuid.uuid4().hex[:6]}"

            nouvelle_branche = Branche(
                id_projet=projet.id_projet,
                nom_branche=nom_br,
                sonar_project_key=sonar_key
            )
            db.add(nouvelle_branche)
            mouvements["ajoutees"].append(nom_br)

    if mouvements["ajoutees"] or mouvements["supprimees"]:
        db.commit()
        return {
            "status": "updated",
            "message": "Synchronisation terminée.",
            "details": {
                "ajoutees": mouvements["ajoutees"],
                "supprimees": mouvements["supprimees"]
            }
        }

    return {"status": "up_to_date", "message": "La base de données est déjà synchronisée avec GitHub."}


class DemarrerSurveillanceRequest(BaseModel):
    url_projet: str
    nom_branche: str


async def _pipeline_surveillance(url_projet: str, K_value: float, Somme: float, somme_dis, nom_branche: str,
                                 id_branche: int, sonar_project_key: str, depuis_date):
    """
    Tâche de fond lancée par l'endpoint.
    Phase 1 : GuetteurHistorique remplit la queue entièrement, PUIS
              SonarManager vide la queue (séquentiel).
    Phase 2 : SonarManager (même instance) + Interrogeur_Github en parallèle.
    """

    github_token = "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"
    sonar_token  = "squ_2b25788caf1de173bd77fe80dedee7b518be883a"
    poll_delay   = 5

    queue = asyncio.Queue()

    from historique import GuetteurHistorique
    from Sonar_Manager import SonarManager
    from Interrogeur_Github import Interrogeur_Github
    guetteur = GuetteurHistorique(
        branch=nom_branche,
        url=url_projet,
        queue=queue,
        token=github_token,
        depuis_date=depuis_date,
    )
    sonar_manager = SonarManager(
        queue=queue,
        sonar_token=sonar_token,
        id_projet_Sonar=sonar_project_key,
        somme=Somme,
        K_value=K_value,
        somme_dis=somme_dis,
        id_branche=id_branche,
    )
    # ── Phase 1 : historique complet puis analyse ────────────────────────────
    print("Phase 1 : Récupération de l'historique complet...")
    await guetteur.recuperer_historique()
    print(f"Historique récupéré et mis en file d'attente ({queue.qsize()} commits).")
    print("Phase 1 : Lancement du SonarManager...")
    worker_task = asyncio.create_task(sonar_manager.deriger_le_code_vers_sonnar())
    await queue.join()
    print("Phase 1 terminée — tous les commits historiques ont été analysés.")
    # ── Phase 2 : temps réel (même worker_task, on ajoute l'interrogeur) ─────
    print("Phase 2 : Démarrage de la surveillance en temps réel...")
    interrogeur = Interrogeur_Github(
        token=github_token,
        delay=poll_delay,
        url=url_projet,
        queue=queue,
        branche=nom_branche,
    )
    interrogeur_task = asyncio.create_task(interrogeur.Interroger_Github())
    print("Système prêt — en attente de nouveaux pushs GitHub...")
    try:
        await asyncio.gather(worker_task, interrogeur_task)
    except asyncio.CancelledError:
        raise
    finally:
        worker_task.cancel()
        interrogeur_task.cancel()
        await asyncio.gather(worker_task, interrogeur_task, return_exceptions=True)
        print("Pipeline arrêté proprement.")


# ── SSE : Stream des résultats d'une branche ───────────────────────────────────
#
# Phase 1 : envoie tous les résultats existants en DB (historique)
# Phase 2 : écoute PostgreSQL LISTEN/NOTIFY → envoie chaque nouveau résultat
#           dès qu'il est inséré par le SonarManager (temps réel, 0 polling)
#
@router.get("/stream/{id_branche}")
async def stream_resultats(
    id_branche: int,
    request: Request,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: db_dependency,
):
    from models import ResultatPush, Branche, Projet

    # ── Vérification d'accès ──────────────────────────────────────────────────
    branche = (
        db.query(Branche)
        .join(Projet)
        .filter(
            Branche.id_branche == id_branche,
            Projet.id_user == current_user["id_user"],
        )
        .first()
    )
    if not branche:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Branche introuvable ou accès non autorisé.",
        )
    K_value = branche.projet.K_Value

    # ── depuis_date ───────────────────────────────────────────────────────────
    dernier_resultat = (
        db.query(ResultatPush)
        .filter(ResultatPush.id_branche == id_branche)
        .order_by(ResultatPush.date_push.desc())
        .first()
    )
    depuis_date = dernier_resultat.date_push if dernier_resultat else None
    Somme = dernier_resultat.Somme if dernier_resultat else 0.0
    somme_dis = dernier_resultat.somme_dis if dernier_resultat else 0.0

    # ── infos branche ─────────────────────────────────────────────────────────
    url_projet        = branche.projet.url_projet
    nom_branche       = branche.nom_branche
    sonar_project_key = branche.sonar_project_key

    # ── config DB asyncpg ─────────────────────────────────────────────────────
    DB_HOST     = os.getenv("DB_HOST", "localhost")
    DB_PORT     = os.getenv("DB_PORT", "5432")
    DB_NAME     = os.getenv("DB_NAME", "technical_debt_db")
    DB_USER     = os.getenv("DB_USER", "user")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
    ASYNCPG_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

    def resultat_to_dict(r: ResultatPush) -> dict:
        return {
            "id_push":                              r.id_push,
            "id_branche":                           r.id_branche,
            "date_push":                            r.date_push.isoformat() if r.date_push else None,
            "bugs":                                 r.bugs,
            "reliability_remediation_effort":       r.reliability_remediation_effort,
            "vulnerabilities":                      r.vulnerabilities,
            "security_remediation_effort":          r.security_remediation_effort,
            "code_smells":                          r.code_smells,
            "sqale_index":                          r.sqale_index,
            "sqale_debt_ratio":                     float(r.sqale_debt_ratio) if r.sqale_debt_ratio is not None else None,
            "complexity":                           r.complexity,
            "cognitive_complexity":                 r.cognitive_complexity,
            "lines":                                r.lines,
            "ncloc":                                r.ncloc,
            "duplicated_lines":                     r.duplicated_lines,
            "duplicated_lines_density":             float(r.duplicated_lines_density) if r.duplicated_lines_density is not None else None,
            "new_technical_debt":                   r.new_technical_debt,
            "new_reliability_remediation_effort":   r.new_reliability_remediation_effort,
            "new_security_remediation_effort":      r.new_security_remediation_effort,
            "top_debt_files":                       r.top_debt_files,
            "Somme":                                float(r.Somme),
            "somme_dis":                            float(r.somme_dis),
        }

    async def generate():
        # ── PHASE 1 : historique déjà en base ────────────────────────────────
        historique = (
            db.query(ResultatPush)
            .filter(ResultatPush.id_branche == id_branche)
            .order_by(ResultatPush.date_push.asc())
            .all()
        )
        for r in historique:
            yield f"data: {json.dumps(resultat_to_dict(r))}\n\n"

        # ── Ouvrir LISTEN avant de lancer le pipeline (0 notify perdu) ───────
        conn = await asyncpg.connect(ASYNCPG_URL)
        notify_queue: asyncio.Queue = asyncio.Queue()

        def on_notify(connection, pid, channel, payload):
            notify_queue.put_nowait(payload)

        await conn.add_listener("nouveau_resultat", on_notify)

        # ── PHASE 2 : lancement du pipeline de surveillance ───────────────────
        pipeline_task = asyncio.create_task(
            _pipeline_surveillance(
                url_projet=url_projet,
                K_value=K_value,
                Somme=Somme,
                somme_dis=somme_dis,
                nom_branche=nom_branche,
                id_branche=id_branche,
                sonar_project_key=sonar_project_key,
                depuis_date=depuis_date,
            )
        )

        # ── PHASE 3 : écoute des NOTIFYs et envoi au frontend ────────────────
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    payload = await asyncio.wait_for(notify_queue.get(), timeout=30.0)
                    data = json.loads(payload)
                    if data.get("id_branche") == id_branche:
                        yield f"data: {json.dumps(data)}\n\n"
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"

        finally:
            pipeline_task.cancel()
            await conn.remove_listener("nouveau_resultat", on_notify)
            await conn.close()
            await asyncio.gather(pipeline_task, return_exceptions=True)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ══════════════════════════════════════════════════════════════════════════════
# ── ENDPOINT IA · PROXY ANTHROPIC ────────────────────────────────────────────
# Reçoit le prompt du frontend, appelle l'API Anthropic côté serveur,
# renvoie le texte. Protégé par le cookie JWT existant.
# ══════════════════════════════════════════════════════════════════════════════
@router.post("/ai/analyse")
async def ai_analyse(
    body: AiAnalyseRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
):
    if not ANTHROPIC_API_KEY or ANTHROPIC_API_KEY == "sk-ant-METTEZ_VOTRE_VRAIE_CLE_ICI":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Clé API Anthropic non configurée. Remplacez ANTHROPIC_API_KEY dans auth.py.",
        )

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 1000,
                    "messages": [{"role": "user", "content": body.prompt}],
                },
            )
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="L'API Anthropic n'a pas répondu dans les délais (60s).",
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Erreur de connexion vers Anthropic : {str(e)}",
            )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"Erreur Anthropic API : {resp.text}",
        )

    data = resp.json()
    text = "".join(
        block["text"]
        for block in data.get("content", [])
        if block.get("type") == "text"
    )
    return {"text": text}


# ══════════════════════════════════════════════════════════════════════════════
# ── ENDPOINT ML · PRÉDICTION M+1 / M+2 / M+3 ────────────────────────────────
# Charge les 3 modèles LightGBM .pkl et retourne les prédictions de
# sqale_debt_ratio pour les 3 prochains mois à partir du dernier push.
# Placez model_m1.pkl, model_m2.pkl, model_m3.pkl dans le même dossier
# que auth.py avant de démarrer le serveur.
# ══════════════════════════════════════════════════════════════════════════════

_ML_MODELS: dict = {}


def _load_models():
    """Chargement lazy des 3 modèles pkl (une seule fois en mémoire)."""
    global _ML_MODELS
    if _ML_MODELS:
        return _ML_MODELS
    import pickle
    base_dir = os.path.dirname(os.path.abspath(__file__))
    for h in [1, 2, 3]:
        model_path = os.path.join(base_dir, f"model_m{h}.pkl")
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Modèle introuvable : {model_path}. "
                f"Placez model_m1.pkl, model_m2.pkl, model_m3.pkl "
                f"dans le même dossier que auth.py."
            )
        with open(model_path, "rb") as f:
            _ML_MODELS[h] = pickle.load(f)
    return _ML_MODELS


def _alert_level(ratio_pct: float) -> str:
    if ratio_pct < 5:
        return "ok"
    if ratio_pct < 10:
        return "warn"
    return "danger"


@router.post("/ai/predict")
async def ai_predict(
    body: PredictRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
):
    """
    Prédit sqale_debt_ratio pour M+1, M+2, M+3 via les modèles LightGBM pkl.
    Reçoit les métriques du dernier push envoyées par le composant AiBeeCard.
    """
    try:
        models = _load_models()
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )

    import pandas as pd

    # Ordre des features identique à l'entraînement (voir notebook)
    FEATURES = [
        "ncloc", "complexity", "bugs", "vulnerabilities",
        "code_smells", "sqale_index", "sqale_debt_ratio",
    ]

    X_input = pd.DataFrame([{
        "ncloc":            body.ncloc,
        "complexity":       body.complexity,
        "bugs":             body.bugs,
        "vulnerabilities":  body.vulnerabilities,
        "code_smells":      body.code_smells,
        "sqale_index":      body.sqale_index,
        "sqale_debt_ratio": body.sqale_debt_ratio,
    }])[FEATURES]

    current_pct = body.sqale_debt_ratio * 100

    predictions = {}
    for h in [1, 2, 3]:
        raw = float(models[h].predict(X_input)[0])
        pct = raw * 100
        delta = pct - current_pct
        predictions[f"m{h}"] = {
            "value":     round(pct, 4),
            "raw":       round(raw, 6),
            "delta_pct": round(delta, 4),
            "alert":     _alert_level(pct),
        }

    # Tendance globale M+1 → M+3
    p3 = predictions["m3"]["value"]
    if p3 > current_pct + 0.5:
        trend = "increasing"
        trend_label = "📈 Dette en hausse"
    elif p3 < current_pct - 0.5:
        trend = "decreasing"
        trend_label = "📉 Dette en baisse"
    else:
        trend = "stable"
        trend_label = "➡️ Dette stable"

    return {
        "current":      round(current_pct, 4),
        "predictions":  predictions,
        "trend":        trend,
        "trend_label":  trend_label,
    }


# ── Statistiques Utilisateur ──────────────────────────────────────────────────

@router.get("/projets/count/{id_user}")
async def get_projets_count(
        id_user: int,
        db: db_dependency,
        current_user: Annotated[dict, Depends(get_current_user)]
):
    if current_user["id_user"] != id_user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès interdit")

    count = db.query(func.count(Projet.id_projet)).filter(Projet.id_user == id_user).scalar()
    return {"total_projets": count or 0}


@router.get("/resultats-push/total-count/{id_user}")
async def get_total_resultats_push_count(
        id_user: int,
        db: db_dependency,
        current_user: Annotated[dict, Depends(get_current_user)]
):
    if current_user["id_user"] != id_user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès interdit")

    total_push_count = (
        db.query(func.count(ResultatPush.id_push))
        .join(Branche, ResultatPush.id_branche == Branche.id_branche)
        .join(Projet, Branche.id_projet == Projet.id_projet)
        .filter(Projet.id_user == id_user)
        .scalar()
    )

    return {"total_resultats_push": total_push_count or 0}


@router.get("/branches/{id_branche}/h-value")
async def get_h_value(
    id_branche: int,
    db: db_dependency,
    current_user: Annotated[dict, Depends(get_current_user)],
):
    branche = (
        db.query(Branche)
        .join(Projet)
        .filter(
            Branche.id_branche == id_branche,
            Projet.id_user == current_user["id_user"],
        )
        .first()
    )
    if not branche:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Branche introuvable ou accès non autorisé.",
        )
    return {"H_Value": float(branche.projet.H_Value) if branche.projet.H_Value is not None else None}


@router.get("/branches/{id_branche}/moyenne-somme-dis")
def get_moyenne_somme_dis(
    id_branche: int,
    db: db_dependency,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    # Vérifier que la branche appartient bien à un projet du current user
    branche = (
        db.query(Branche)
        .join(Projet, Branche.id_projet == Projet.id_projet)
        .filter(Branche.id_branche == id_branche)
        .filter(Projet.id_user == current_user["id_user"])
        .first()
    )

    if not branche:
        raise HTTPException(status_code=404, detail="Branche non trouvée ou accès non autorisé")

    resultats = (
        db.query(ResultatPush.somme_dis)
        .filter(ResultatPush.id_branche == id_branche)
        .order_by(ResultatPush.date_push.desc())
        .limit(8)
        .all()
    )

    if not resultats:
        raise HTTPException(status_code=404, detail="Aucun résultat trouvé pour cette branche")

    valeurs = [r.somme_dis for r in resultats if r.somme_dis is not None]

    if not valeurs:
        raise HTTPException(status_code=404, detail="Aucune valeur somme_dis disponible")

    moyenne = sum(valeurs) / len(valeurs)

    return {
        "id_branche": id_branche,
        "nombre_pushs_utilises": len(valeurs),
        "moyenne_somme_dis": round(float(moyenne), 4)
    }










