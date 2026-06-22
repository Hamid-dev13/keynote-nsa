# Variante "image baked" : le contenu est copié dans l'image au build,
# au lieu d'être monté en volume. Utile si tu ne veux pas dépendre du
# dossier ./site sur le VPS (voir README -> variante B).
FROM nginx:alpine
COPY site/ /usr/share/nginx/html/
