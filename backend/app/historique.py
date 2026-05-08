import httpx
import asyncio
from urllib.parse import urlparse

#cette classe ne doit fonctionner que si la page

class GuetteurHistorique:
    def __init__(self, branch, url, queue, token=None, depuis_date=None):
        self.branch = branch
        self.url = url
        self.queue = queue
        self.token = token
        self.depuis_date = depuis_date
        self.api_url = self.construire_url_api()

    def construire_url_api(self):
        parsed = urlparse(self.url)
        chemins = parsed.path.strip("/").split("/")
        if len(chemins) >= 2:
            owner = chemins[0]
            # On nettoie le nom du repo pour enlever le .git éventuel
            repo = chemins[1].removesuffix(".git")
            return f"https://api.github.com/repos/{owner}/{repo}/commits"
        else:
            raise ValueError(f"L'URL GitHub est invalide : {self.url}")

    async def recuperer_historique(self):

        headers_de_base = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "MonAnalyseurQualite-App"
        }
        if self.token:
            headers_de_base["Authorization"] = f"Bearer {self.token}"
        tous_les_commits = []
        url_page_courante = self.api_url
        parametres = {"sha": self.branch, "per_page": 100}

        if self.depuis_date is not None:
            from datetime import timedelta
            # +1 seconde pour exclure le dernier commit déjà analysé (since est inclusif)
            strictement_apres = self.depuis_date + timedelta(seconds=1)
            parametres["since"] = strictement_apres.strftime("%Y-%m-%dT%H:%M:%SZ")

        print(f"traitement historique {self.url}...")
        async with httpx.AsyncClient(headers=headers_de_base, timeout=20.0) as client:
            while url_page_courante:
                reponse = await client.get(url_page_courante, params=parametres)
                reponse.raise_for_status()
                donnees_page = reponse.json()
                tous_les_commits.extend(donnees_page)
                if "next" in reponse.links:
                    url_page_courante = str(reponse.links["next"]["url"])
                    parametres = None
                else:
                    url_page_courante = None

        print(f" {len(tous_les_commits)} commits lguinehom , tawa besh yestt7attou fel queue")
        tous_les_commits.reverse()
        for c in tous_les_commits:
            date_github = c["commit"]["author"]["date"]
            date_sonar = date_github.replace("Z", "+0000")
            await self.queue.put({
                "url": self.url,
                "commit_sha": c["sha"],
                "commit_date": date_sonar,
            })

        print(f" {len(tous_les_commits)} commits  !")