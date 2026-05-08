import asyncio
from datetime import datetime
import os
import shutil
import httpx
import zipfile
import io
import traceback
import asyncpg
import json
import math


class SonarManager:
    def __init__(self, queue, sonar_token, id_projet_Sonar, somme, K_value, somme_dis, id_branche,
                 sonar_host="http://sonarqube:9000"):
        self.queue        = queue
        self.sonar_host   = sonar_host
        self.id_projet    = id_projet_Sonar
        self.sonar_token  = sonar_token
        self.auth_sonar   = (self.sonar_token, "")
        self.id_branche   = id_branche
        self.db_pool      = None
        self.db_url       = "postgresql://user:password@db:5432/technical_debt_db"
        self.K_value      = float(K_value)   # SQLAlchemy renvoie NUMERIC → decimal.Decimal
        self.Somme        = float(somme)
        self.somme_dis    = float(somme_dis)

    # ── Helpers ────────────────────────────────────────────────────────────────

    @staticmethod
    def to_int(val):
        try:
            return int(float(val)) if val is not None else 0
        except Exception:
            return 0

    @staticmethod
    def to_float(val):
        try:
            return float(val) if val is not None else 0.0
        except Exception:
            return 0.0

    @staticmethod
    def get_rating(val):
        return {"1.0": "A", "2.0": "B", "3.0": "C", "4.0": "D", "5.0": "E"}.get(str(val), "A")

    # ── Main loop ──────────────────────────────────────────────────────────────

    async def deriger_le_code_vers_sonnar(self):
        print("SonarManager: démarré et prêt à travailler !")
        self.db_pool = await asyncpg.create_pool(self.db_url)
        print("Pool de base de données créé avec succès !")

        try:
            while True:
                print(f"SonarManager en attente... ({self.queue.qsize()} commit(s) dans la file)")
                tache = await self.queue.get()

                commit_sha    = tache.get("commit_sha")
                date_pour_sonar = tache.get("commit_date")
                repo_url      = tache.get("url")

                print(f"Commit attrapé : {commit_sha}")

                # Normalise la date (GitHub envoie "Z", strptime attend "+0000")
                date_pour_sonar = date_pour_sonar.replace("Z", "+0000")

                # Reconstruit l'URL GitHub propre
                clean_url = repo_url.replace("https://api.github.com/repos/", "https://github.com/")
                clean_url = clean_url.removesuffix(".git").rstrip("/")
                base_url  = clean_url.split('/events')[0].split('/commits')[0]
                zip_url   = f"{base_url}/archive/{commit_sha}.zip"
                dossier_tmp = f"./tmp_{commit_sha}"

                try:
                    print(f"\n── TRAITEMENT COMMIT : {commit_sha} ──")

                    # ── 1. Vérifie si ce commit est déjà en base ──────────────
                    async with self.db_pool.acquire() as conn_check:
                        existe = await conn_check.fetchval(
                            "SELECT 1 FROM resultat_push WHERE id_push = $1", commit_sha
                        )
                    if existe:
                        print(f"Commit {commit_sha} déjà présent en base → ignoré.")
                        continue

                    # ── 2. Télécharge le ZIP du commit ────────────────────────
                    async with httpx.AsyncClient(timeout=60.0) as client:
                        r = await client.get(zip_url, follow_redirects=True)
                        if r.status_code != 200:
                            print(f"Impossible de télécharger le ZIP (HTTP {r.status_code}) → commit ignoré.")
                            continue

                        z = zipfile.ZipFile(io.BytesIO(r.content))
                        z.extractall("./")
                        nom_extrait = z.namelist()[0].split('/')[0]
                        if os.path.exists(dossier_tmp):
                            shutil.rmtree(dossier_tmp)
                        os.rename(nom_extrait, dossier_tmp)

                    chemin_absolu = os.path.abspath(dossier_tmp)

                    # ── 3. Lance SonarScanner ─────────────────────────────────
                    commande = (
                        f"sonar-scanner "
                        f"-Dsonar.projectKey={self.id_projet} "
                        f"-Dsonar.projectVersion={commit_sha} "
                        f"-Dsonar.projectDate={date_pour_sonar} "
                        f"-Dsonar.sources=. "
                        f"-Dsonar.projectBaseDir={chemin_absolu} "
                        f"-Dsonar.host.url={self.sonar_host} "
                        f"-Dsonar.login={self.sonar_token} "
                        f"-Dsonar.analysis.cache.enabled=false "
                        f"-Dsonar.python.version=3"
                    )
                    process = await asyncio.create_subprocess_shell(commande)
                    await process.wait()

                    # ── 4. Récupère le task ID depuis le rapport ──────────────
                    chemin_rapport = os.path.join(dossier_tmp, ".scannerwork", "report-task.txt")
                    task_id = None
                    if os.path.exists(chemin_rapport):
                        with open(chemin_rapport, "r") as f:
                            for ligne in f:
                                if ligne.startswith("ceTaskId="):
                                    task_id = ligne.split("=", 1)[1].strip()
                                    break

                    if not task_id:
                        print(f"Aucun ceTaskId trouvé pour {commit_sha} → commit ignoré.")
                        continue

                    # ── 5. Attend la fin du traitement SonarQube ──────────────
                    print(f"Attente validation tâche SonarQube : {task_id}")
                    url_task = f"{self.sonar_host}/api/ce/task"

                    async with httpx.AsyncClient(timeout=30.0) as client_sonar:
                        while True:
                            resp_task = await client_sonar.get(
                                url_task, params={"id": task_id}, auth=self.auth_sonar
                            )
                            task_info = resp_task.json().get("task", {})
                            statut    = task_info.get("status")

                            if statut == "SUCCESS":
                                print(f"SonarQube : analyse terminée pour {commit_sha}.")

                                # ── 6. Récupère les métriques globales ────────
                                api_url = f"{self.sonar_host}/api/measures/component"
                                mes_metriques = (
                                    "bugs,reliability_rating,vulnerabilities,security_rating,"
                                    "code_smells,sqale_rating,sqale_index,complexity,"
                                    "cognitive_complexity,class_complexity,file_complexity,"
                                    "function_complexity,ncloc,lines,comment_lines,"
                                    "comment_lines_density,classes,files,directories,"
                                    "duplicated_lines,duplicated_lines_density,duplicated_blocks,"
                                    "duplicated_files,reliability_remediation_effort,"
                                    "security_remediation_effort,"
                                    "effort_to_reach_maintainability_rating_a,"
                                    "security_hotspots,security_hotspots_reviewed,"
                                    "sqale_debt_ratio,coverage,uncovered_lines,"
                                    "uncovered_conditions,test_success_density,tests,"
                                    "skipped_tests,test_errors,test_failures,"
                                    "test_execution_time,new_technical_debt,"
                                    "new_reliability_remediation_effort,"
                                    "new_security_remediation_effort"
                                )
                                reponse = await client_sonar.get(
                                    api_url,
                                    params={"component": self.id_projet, "metricKeys": mes_metriques},
                                    auth=self.auth_sonar
                                )

                                # ── GUARD : vérifie que l'API métriques a répondu ──
                                if reponse.status_code != 200:
                                    print(
                                        f"API métriques SonarQube KO "
                                        f"(HTTP {reponse.status_code}) pour {commit_sha} → ignoré."
                                    )
                                    break  # sort du polling, commit perdu proprement

                                donnees_json = reponse.json()
                                mesures = {
                                    item["metric"]: item.get("value")
                                    for item in donnees_json.get("component", {}).get("measures", [])
                                }

                                if not mesures:
                                    print(f"Aucune mesure retournée par SonarQube pour {commit_sha} → ignoré.")
                                    break


                                top_files_data = []
                                url_tree = f"{self.sonar_host}/api/measures/component_tree"
                                resp_tree = await client_sonar.get(
                                    url_tree,
                                    params={
                                        "component": self.id_projet,
                                        "metricKeys": "sqale_index",
                                        "qualifiers": "FIL",
                                        "ps": 10,
                                        "s": "metric",
                                        "asc": "false"
                                    },
                                    auth=self.auth_sonar
                                )
                                if resp_tree.status_code == 200:
                                    for comp in resp_tree.json().get("components", []):
                                        full_path = comp.get("path", comp.get("name", ""))
                                        filename  = full_path.split("/")[-1] if full_path else ""
                                        if filename:
                                            top_files_data.append(filename)
                                else:
                                    print(
                                        f"API component_tree KO "
                                        f"(HTTP {resp_tree.status_code}) — top_files sera vide."
                                    )

                                # ── 8. Calcule CUSUM ──────────────────────────
                                ratio     = self.to_float(mesures.get("sqale_debt_ratio"))
                                S         = max(0.0, math.log(ratio + 0.0000001) - self.K_value + self.Somme)
                                self.Somme = S
                                somme_dis  =  math.log(ratio + 0.0000001) - self.K_value
                                self.somme_dis = somme_dis

                                # ── 9. Insère en base ─────────────────────────
                                async with self.db_pool.acquire() as connection:
                                    date_sonar_objet = datetime.strptime(
                                        date_pour_sonar, "%Y-%m-%dT%H:%M:%S%z"
                                    ).replace(tzinfo=None)

                                    requete_resultat = """
                                        INSERT INTO resultat_push (
                                            id_push, id_branche, date_push,
                                            reliability_rating, security_rating, maintainability_rating,
                                            bugs, reliability_remediation_effort,
                                            vulnerabilities, security_remediation_effort,
                                            security_hotspots, security_hotspots_reviewed,
                                            code_smells, sqale_index,
                                            effort_to_reach_maintainability_rating_a, sqale_debt_ratio,
                                            complexity, cognitive_complexity,
                                            class_complexity, file_complexity, function_complexity,
                                            lines, ncloc, comment_lines, comment_lines_density,
                                            directories, files, classes,
                                            duplicated_lines, duplicated_lines_density,
                                            duplicated_blocks, duplicated_files,
                                            tests, coverage, uncovered_lines, uncovered_conditions,
                                            test_success_density, skipped_tests,
                                            test_failures, test_errors, test_execution_time,
                                            new_technical_debt,
                                            new_reliability_remediation_effort,
                                            new_security_remediation_effort,
                                            top_debt_files, "Somme", somme_dis
                                        )
                                        VALUES (
                                            $1,  $2,  $3,  $4,  $5,  $6,  $7,  $8,  $9,  $10,
                                            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                                            $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
                                            $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
                                            $41, $42, $43, $44, $45, $46, $47
                                        )
                                        ON CONFLICT (id_push) DO NOTHING
                                        RETURNING id_push;
                                    """

                                    inserted = await connection.fetchval(
                                        requete_resultat,
                                        commit_sha,                                              # $1
                                        self.id_branche,                                         # $2
                                        date_sonar_objet,                                        # $3
                                        self.get_rating(mesures.get("reliability_rating")),      # $4
                                        self.get_rating(mesures.get("security_rating")),         # $5
                                        self.get_rating(mesures.get("sqale_rating")),            # $6
                                        self.to_int(mesures.get("bugs")),                        # $7
                                        self.to_int(mesures.get("reliability_remediation_effort")),  # $8
                                        self.to_int(mesures.get("vulnerabilities")),             # $9
                                        self.to_int(mesures.get("security_remediation_effort")), # $10
                                        self.to_int(mesures.get("security_hotspots")),           # $11
                                        self.to_float(mesures.get("security_hotspots_reviewed")),# $12
                                        self.to_int(mesures.get("code_smells")),                 # $13
                                        self.to_int(mesures.get("sqale_index")),                 # $14
                                        self.to_int(mesures.get("effort_to_reach_maintainability_rating_a")),  # $15
                                        ratio,                                                   # $16
                                        self.to_int(mesures.get("complexity")),                  # $17
                                        self.to_int(mesures.get("cognitive_complexity")),        # $18
                                        self.to_float(mesures.get("class_complexity")),          # $19
                                        self.to_float(mesures.get("file_complexity")),           # $20
                                        self.to_float(mesures.get("function_complexity")),       # $21
                                        self.to_int(mesures.get("lines")),                       # $22
                                        self.to_int(mesures.get("ncloc")),                       # $23
                                        self.to_int(mesures.get("comment_lines")),               # $24
                                        self.to_float(mesures.get("comment_lines_density")),     # $25
                                        self.to_int(mesures.get("directories")),                 # $26
                                        self.to_int(mesures.get("files")),                       # $27
                                        self.to_int(mesures.get("classes")),                     # $28
                                        self.to_int(mesures.get("duplicated_lines")),            # $29
                                        self.to_float(mesures.get("duplicated_lines_density")),  # $30
                                        self.to_int(mesures.get("duplicated_blocks")),           # $31
                                        self.to_int(mesures.get("duplicated_files")),            # $32
                                        self.to_int(mesures.get("tests")),                       # $33
                                        self.to_float(mesures.get("coverage")),                  # $34
                                        self.to_int(mesures.get("uncovered_lines")),             # $35
                                        self.to_int(mesures.get("uncovered_conditions")),        # $36
                                        self.to_float(mesures.get("test_success_density")),      # $37
                                        self.to_int(mesures.get("skipped_tests")),               # $38
                                        self.to_int(mesures.get("test_failures")),               # $39
                                        self.to_int(mesures.get("test_errors")),                 # $40
                                        self.to_int(mesures.get("test_execution_time")),         # $41
                                        self.to_int(mesures.get("new_technical_debt")),          # $42
                                        self.to_int(mesures.get("new_reliability_remediation_effort")),  # $43
                                        self.to_int(mesures.get("new_security_remediation_effort")),     # $44
                                        "/".join(top_files_data),                                # $45 — noms séparés par "/"
                                        S,                                                       # $46 CUSUM
                                        somme_dis,                                               # $47
                                    )

                                    # ── RETURNING id_push est None si DO NOTHING a joué ──
                                    if inserted is None:
                                        print(
                                            f"Commit {commit_sha} déjà présent en base "
                                            f"(détecté à l'INSERT) → aucune notification envoyée."
                                        )
                                    else:
                                        print(f"Push {commit_sha} inséré avec Somme={S:.4f} somme_dis={somme_dis:.4f}")

                                        payload_notify = json.dumps({
                                            "id_push":         commit_sha,
                                            "id_branche":      self.id_branche,
                                            "sqale_debt_ratio": ratio,
                                            "cusum_somme":     S,
                                            "status":          "success"
                                        })
                                        await connection.execute(
                                            "SELECT pg_notify('nouveau_push', $1)", payload_notify
                                        )
                                        print(f"Notification pg_notify envoyée pour {commit_sha}")
                                break  # sort du polling (SUCCESS traité)

                            elif statut in ["FAILED", "CANCELED"]:
                                print(f"Tâche SonarQube {task_id} terminée en échec (status={statut}) → commit ignoré.")
                                break

                            else:
                                # IN_PROGRESS ou PENDING → on attend
                                await asyncio.sleep(2)

                except Exception:
                    print(f"Exception non gérée sur le commit {commit_sha} :")
                    traceback.print_exc()

                finally:
                    # Nettoyage dossier temporaire + libération du slot dans la queue
                    if os.path.exists(dossier_tmp):
                        shutil.rmtree(dossier_tmp)
                    self.queue.task_done()

        finally:
            if self.db_pool:
                await self.db_pool.close()