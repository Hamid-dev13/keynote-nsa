# keynote-nsa — site statique derrière Traefik (Coolify)

Sert une page HTML statique en **HTTPS** via le reverse proxy **Traefik v3.6**
(`coolify-proxy`) déjà présent sur le VPS, sans toucher à l'UI Coolify.

- **URL cible :** https://keynote-nsa.51.178.54.74.nip.io
- **DNS :** [nip.io](https://nip.io) résout `*.51.178.54.74.nip.io` → `51.178.54.74` (rien à configurer).
- **Réseau Docker :** `coolify` (externe, déjà créé).

## Contenu du repo
```
.
├── docker-compose.yml   # service nginx + labels Traefik (HTTPS + redirection)
├── Dockerfile           # variante "image baked" (optionnelle)
├── site/
│   └── index.html       # la page servie (remplace-la par la tienne)
└── README.md
```
> Pour publier autre chose (ex. la keynote) : dépose `index.html` **et** ses dossiers
> (`assets/`, images…) dans `site/`. Tout `site/` est servi à la racine du site.

---

## Déploiement sur le VPS (variante A — bind volume, recommandée)

```bash
# 1. Récupérer le repo
git clone https://github.com/<TON_USER>/keynote-nsa.git
cd keynote-nsa

# 2. Lancer (Traefik détecte les labels automatiquement)
docker compose up -d

# 3. Vérifier que le conteneur tourne
docker compose ps
```

Le certificat Let's Encrypt est émis **à la première requête HTTPS**. Patiente
~10–30 s puis ouvre : **https://keynote-nsa.51.178.54.74.nip.io**

### Vérifier l'émission du certificat / debug
```bash
docker logs coolify-proxy 2>&1 | grep -i "keynote-nsa\|acme\|error" | tail -20
```

### Mettre à jour le contenu
```bash
git pull
docker compose restart keynote-nsa   # le bind volume relit site/ directement
```

---

## Variante B — image baked (sans dépendre du dossier sur le VPS)

Utilise le `Dockerfile` (le contenu est copié dans l'image). Remplace, dans
`docker-compose.yml`, la ligne `image: nginx:alpine` et le bloc `volumes:` par :

```yaml
    build: .
    # (supprime la section volumes)
```
Puis :
```bash
docker compose up -d --build
```

---

## Variante C — repli HTTP-only (si rate-limit Let's Encrypt)

nip.io est un domaine **partagé** : Let's Encrypt peut renvoyer
`too many certificates already issued for nip.io`. Dans ce cas, déploie **sans TLS**
le temps que la limite se réinitialise (≈ 1 semaine).

Dans `docker-compose.yml`, garde uniquement ces labels (supprime les routeurs
`...-http`, le middleware redirect, et les 3 lignes `tls*`) :

```yaml
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=coolify"
      - "traefik.http.services.keynote-nsa.loadbalancer.server.port=80"
      - "traefik.http.routers.keynote-nsa.rule=Host(`keynote-nsa.51.178.54.74.nip.io`)"
      - "traefik.http.routers.keynote-nsa.entrypoints=http"
      - "traefik.http.routers.keynote-nsa.service=keynote-nsa"
```
```bash
docker compose up -d
# Accès : http://keynote-nsa.51.178.54.74.nip.io   (HTTP, sans cadenas)
```

> Astuce anti rate-limit : tu peux changer le sous-domaine (`keynote-nsa` → un autre
> préfixe) ; Let's Encrypt limite par domaine enregistré, mais ça aide à éviter
> un certif déjà grillé pour le même hostname.

---

## Notes / pièges gérés
- Réseau `coolify` déclaré `external: true` → **non recréé**.
- **Aucun `ports:`** sur l'hôte en HTTPS : tout passe par Traefik (ports 80/443
  déjà tenus par `coolify-proxy`). Un mapping ne servirait qu'à un accès direct de
  secours — éviter les ports déjà occupés : `80, 443, 8081, 8000, 6001, 6002,
  3014, 3012, 3013, 3057, 3001, 5678, 8002, 8080, 4242, 5432, 3306, 6379`.
- Identifiants routeur/service/middleware tous préfixés `keynote-nsa` → pas de
  collision avec les autres apps Coolify.

## Pousser le repo (depuis ta machine)
```bash
cd keynote-nsa
git init && git add . && git commit -m "deploy: site statique via Traefik"
git branch -M main
git remote add origin https://github.com/<TON_USER>/keynote-nsa.git
git push -u origin main
```
