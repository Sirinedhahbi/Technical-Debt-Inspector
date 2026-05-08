import asyncio
import asyncpg


class SuperviseurPush:
    def __init__(self, db_url: str, queue, id_utilisateur: int, nom_projet: str, nom_branche: str):
        self.db_url = db_url
        self.pool = None
        self.queue = queue
        self.id_utilisateur = id_utilisateur
        self.nom_projet = nom_projet
        self.nom_branche = nom_branche

    async def superviser(self, intervalle_sec: int = 5):
        print(
            f"Supervision lancée pour l'utilisateur {self.id_utilisateur} sur le projet '{self.nom_projet}', branche '{self.nom_branche}'...")

        self.pool = await asyncpg.create_pool(self.db_url)
        print("Pool de base de données du superviseur créé avec succès !")

        repere_id = 0

        requete_supervision = """
            SELECT 
                p.id, 
                p.id_push AS commit_sha,
                p.date_push,
                sr.reliability_rating, 
                sr.security_rating, 
                sr.maintainability_rating,
                sr.bugs, 
                sr.reliability_remediation_effort, 
                sr.vulnerabilities, 
                sr.security_remediation_effort, 
                sr.security_hotspots, 
                sr.security_hotspots_reviewed, 
                sr.code_smells, 
                sr.sqale_index AS dette_technique, 
                sr.effort_to_reach_maintainability_rating_a, 
                sr.sqale_debt_ratio, 
                sr.complexity, 
                sr.cognitive_complexity, 
                sr.class_complexity, 
                sr.file_complexity, 
                sr.function_complexity, 
                sr.lines, 
                sr.ncloc, 
                sr.comment_lines, 
                sr.comment_lines_density, 
                sr.directories, 
                sr.files, 
                sr.classes, 
                sr.duplicated_lines, 
                sr.duplicated_lines_density, 
                sr.duplicated_blocks, 
                sr.duplicated_files, 
                sr.tests, 
                sr.coverage, 
                sr.uncovered_lines, 
                sr.uncovered_conditions, 
                sr.test_success_density, 
                sr.skipped_tests, 
                sr.test_failures, 
                sr.test_errors, 
                sr.test_execution_time
            FROM push p
            JOIN utilisateur u ON p.utilisateur_id = u.id
            JOIN branche b ON p.branche_id = b.id
            JOIN projet pr ON b.projet_id = pr.id
            JOIN sonarqube_resultat sr ON sr.id_push = p.id_push
            WHERE u.id = $1 AND pr.nom = $2 AND b.nom = $3 AND p.id > $4
            ORDER BY p.id ASC;
        """

        try:
            while True:
                async with self.pool.acquire() as connexion:
                    resultats = await connexion.fetch(
                        requete_supervision,
                        self.id_utilisateur,
                        self.nom_projet,
                        self.nom_branche,
                        repere_id
                    )

                    for push in resultats:
                        dico_metriques = dict(push)
                        await self.queue.put(dico_metriques)
                        print(f" Nouveau push (ID: {dico_metriques['id']}) détecté et mis en file d'attente !")
                        repere_id = push['id']

                await asyncio.sleep(intervalle_sec)

        except asyncio.CancelledError:
            print("La supervision est terminée.")

        except Exception as e:
            print(f"Erreur inattendue lors de la supervision : {e}")

        finally:
            if self.pool:
                await self.pool.close()
                print("🔌 Connexion à la base de données fermée proprement pour le superviseur.")