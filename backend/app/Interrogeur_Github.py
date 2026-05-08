import httpx
import requests
import asyncio
from urllib.parse import urlparse
from datetime import datetime, timezone




class Interrogeur_Github:
    def __init__(self, token, delay, url, queue, branche, last_etag=None):
        self.token = token
        self.delay = delay
        self.queue = queue
        self.last_etag = last_etag
        self.branch = branche
        self.url = self._construire_url_api(url)
        self.heure_demarrage = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    def _construire_url_api(self, url):
        parsed = urlparse(url)
        path = parsed.path.strip("/")
        return f"https://api.github.com/repos/{path.removesuffix('.git')}/events"

    async def Interroger_Github(self):
        headers_de_base = {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/vnd.github.v3+json"
        }
        async with httpx.AsyncClient(headers=headers_de_base) as client:
            while True :
                requete_headers = {}
                if self.last_etag :
                    requete_headers['If-None-match'] = self.last_etag
                try:
                    response= await client.get(self.url, headers=requete_headers)
                    if response.status_code == 200:
                        self.last_etag = response.headers.get("Etag")
                        data = response.json()
                        for event in data:
                            if event["type"] == "PushEvent" and event["payload"]["ref"] == f"refs/heads/{self.branch}":
                                date_raw = event.get("created_at")
                                if date_raw and date_raw <= self.heure_demarrage:
                                    continue
                                print(" famma Push 3al branche mteeee3naaa")

                                try:
                                    payload = event.get("payload", {})
                                    commits = payload.get("commits", [])

                                    if commits:
                                        dernier_sha = commits[-1].get("sha")
                                    else:
                                        dernier_sha = payload.get("head")

                                    if not dernier_sha:
                                        print(" Impossible de trouver le SHA dans le payload GitHub.")
                                        continue

                                    date_raw = event.get("created_at")
                                    date_pour_sonar = date_raw.replace("Z", "+0000") if date_raw else None

                                    print(f" Envoi du commit {dernier_sha} vers le SonarManager...")
                                    await self.queue.put({
                                        "url": self.url,
                                        "commit_sha": dernier_sha,
                                        "commit_date": date_pour_sonar
                                    })

                                except Exception as e:
                                    print(f" Erreur lors de l'extraction des données du Push : {e}")
                    elif response.status_code == 304 :
                        print("[Interrogeur] 304: Aucun changement depuis la dernière fois.")
                    else :
                        print (f"Erreur inattendue : Code {response.status_code}")
                except Exception as e :
                    print(e)

                await asyncio.sleep(self.delay)#matet3adda lel boucle eli mba3d'ha ella maykounou e 5 seconde adhoukom wfeew