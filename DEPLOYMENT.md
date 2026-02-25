# Déploiement Sup2Rh

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Landing Page   │     │    Web App       │     │   Admin App     │
│  (Astro SSG)    │     │  (React/Vite)    │     │  (React/Vite)   │
│  Cloudflare     │     │  Cloudflare      │     │  Cloudflare     │
│  Pages          │     │  Pages           │     │  Pages          │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                         │
         └───────────────────────┼─────────────────────────┘
                                 │ HTTPS /api/*
                        ┌────────▼─────────┐
                        │  Backend Symfony  │
                        │  (PHP 8.4)       │
                        │  Koyeb / VPS     │
                        └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │    Supabase      │
                        │  (Postgres +     │
                        │   Auth + JWT)    │
                        └──────────────────┘
```

## Stratégie de branches

```
main ← (merge quand validé) ← dev ← (merge feature) ← feature/xxx
 │
 └── tag v1.0.0 → Release → Build Docker → Deploy
```

- `feature/*` : créée depuis `main`, dev dessus
- `dev` : merge des features pour validation
- `main` : code stable, prêt à release
- `vX.Y.Z` : tags de release sur `main`

## Déploiement gratuit (recommandé V1)

### 1. Backend → Koyeb (Free Instance)

**Prérequis :** Compte [Koyeb](https://koyeb.com) + image Docker sur GHCR.

```bash
# L'image est buildée automatiquement par GitHub Actions sur chaque tag
# Image: ghcr.io/abdedev/sup2rh/backend:v1.0.0
```

**Configuration Koyeb :**

| Paramètre    | Valeur                                               |
| ------------ | ---------------------------------------------------- |
| Source       | Docker image `ghcr.io/abdedev/sup2rh/backend:latest` |
| Port         | 80                                                   |
| Health check | `/api/health`                                        |
| Instance     | Free (512MB RAM)                                     |

**Variables d'environnement (Koyeb UI) :**

| Variable               | Exemple                                          | Secret ? |
| ---------------------- | ------------------------------------------------ | -------- |
| `APP_ENV`              | `prod`                                           | Non      |
| `APP_DEBUG`            | `0`                                              | Non      |
| `APP_SECRET`           | `a1b2c3d4...`                                    | **Oui**  |
| `DATABASE_URL`         | `postgresql://...`                               | **Oui**  |
| `SUPABASE_PROJECT_URL` | `https://xxx.supabase.co`                        | Non      |
| `SUPABASE_JWT_AUD`     | `authenticated`                                  | Non      |
| `GROQ_API_KEY`         | `gsk_...`                                        | **Oui**  |
| `CORS_ALLOW_ORIGIN`    | `^https://(web\.pages\.dev\|admin\.pages\.dev)$` | Non      |
| `DEFAULT_URI`          | `https://xxx.koyeb.app`                          | Non      |
| `RUN_MIGRATIONS`       | `true`                                           | Non      |

### 2. Frontends → Cloudflare Pages

**Prérequis :** Compte [Cloudflare](https://dash.cloudflare.com).

Crée **3 projets** Cloudflare Pages :

#### Web App

| Paramètre        | Valeur                                        |
| ---------------- | --------------------------------------------- |
| Repository       | `AbdeDev/Sup2Rh`                              |
| Build command    | `cd apps/web && npm install && npm run build` |
| Output directory | `apps/web/dist`                               |
| Root directory   | `/`                                           |
| Branch           | `main`                                        |

**Variables d'environnement (Cloudflare UI) :**

| Variable                 | Valeur prod               |
| ------------------------ | ------------------------- |
| `VITE_SUPABASE_URL`      | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...`                  |
| `VITE_API_URL`           | `https://xxx.koyeb.app`   |

#### Admin App

| Paramètre        | Valeur                                          |
| ---------------- | ----------------------------------------------- |
| Build command    | `cd apps/admin && npm install && npm run build` |
| Output directory | `apps/admin/dist`                               |

**Variables d'environnement :**

| Variable                 | Valeur prod                 |
| ------------------------ | --------------------------- |
| `VITE_SUPABASE_URL`      | `https://xxx.supabase.co`   |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...`                    |
| `VITE_API_URL`           | `https://xxx.koyeb.app`     |
| `VITE_WEB_URL`           | `https://ton-web.pages.dev` |

#### Landing Page

| Paramètre        | Valeur                                            |
| ---------------- | ------------------------------------------------- |
| Build command    | `cd apps/landing && npm install && npm run build` |
| Output directory | `apps/landing/dist`                               |

**Variables d'environnement :**

| Variable         | Valeur prod                 |
| ---------------- | --------------------------- |
| `PUBLIC_API_URL` | `https://xxx.koyeb.app`     |
| `PUBLIC_WEB_URL` | `https://ton-web.pages.dev` |

### 3. Supabase

Déjà configuré. Vérifie :

- **Authentication > URL Configuration** : ajoute les URLs Cloudflare Pages dans "Redirect URLs"
- **Authentication > Email Templates** : le lien de callback pointe vers `https://ton-web.pages.dev/auth/callback`

## Déploiement VPS (alternative)

Si tu préfères tout sur un VPS :

```bash
# Sur le serveur
mkdir -p /opt/sup2rh
cd /opt/sup2rh

# Copier les fichiers
scp docker-compose.prod.yml .env.prod.example docker/nginx/prod.conf user@server:/opt/sup2rh/

# Configurer
cp .env.prod.example .env.prod
nano .env.prod  # Remplir les vraies valeurs

# Login au registry
docker login ghcr.io -u AbdeDev

# Déployer
TAG=v1.0.0 docker compose -f docker-compose.prod.yml pull
TAG=v1.0.0 docker compose -f docker-compose.prod.yml up -d

# Vérifier
docker compose -f docker-compose.prod.yml logs -f backend
curl http://localhost/api/health
```

## CI/CD

### CI (automatique sur PR / push)

Le workflow `.github/workflows/ci.yml` exécute :

- **Frontend** : `bun install` → `lint` → `typecheck` → `build`
- **Backend** : `composer validate` → `install` → `lint:yaml` → `lint:container` → `phpunit`

### CD (automatique sur tag)

Le workflow `.github/workflows/release.yml` exécute :

1. Build de l'image Docker backend
2. Push vers GHCR avec les tags : `vX.Y.Z`, `sha-xxxxx`, `latest`
3. Build des 3 frontends (vérification)
4. Création d'une GitHub Release avec release notes auto-générées

### Créer une release

```bash
# Depuis main, après avoir validé dans dev
git checkout main
git pull
git merge dev

# Tag + push
git tag v1.0.0
git push origin v1.0.0

# → GitHub Actions build + push automatiquement
# → Koyeb auto-redeploy si configuré sur :latest
```

## Secrets GitHub Actions

Aller dans : **Settings > Secrets and variables > Actions**

| Secret         | Utilisation                         |
| -------------- | ----------------------------------- |
| `GITHUB_TOKEN` | Auto-fourni, utilisé pour push GHCR |

> Les secrets applicatifs (DATABASE_URL, etc.) sont configurés directement
> dans Koyeb et Cloudflare Pages, pas dans GitHub Actions.

## Variables d'environnement — Résumé

### Où trouver chaque fichier .env.example

```
.env.prod.example              → Variables PROD (VPS uniquement)
backend/api/.env.example        → Backend Symfony (toutes les vars)
apps/web/.env.example           → Web app (Supabase + API URL)
apps/admin/.env.example         → Admin app (Supabase + API URL + Web URL)
apps/landing/.env.example       → Landing page (API URL + Web URL)
```

### Checklist pré-déploiement

- [ ] `APP_SECRET` généré (min 32 chars aléatoires)
- [ ] `DATABASE_URL` pointe vers Supabase Postgres
- [ ] `SUPABASE_PROJECT_URL` correct
- [ ] `CORS_ALLOW_ORIGIN` inclut les URLs des 3 frontends
- [ ] `VITE_API_URL` / `PUBLIC_API_URL` pointe vers le backend Koyeb
- [ ] URLs Cloudflare Pages ajoutées dans Supabase > Redirect URLs
- [ ] Au moins une clé AI (GROQ recommandé) configurée
- [ ] `RUN_MIGRATIONS=true` sur le premier déploiement

## Tags Docker

| Tag                               | Description                          |
| --------------------------------- | ------------------------------------ |
| `ghcr.io/.../backend:v1.0.0`      | Release spécifique (rollback facile) |
| `ghcr.io/.../backend:sha-abc1234` | Commit exact (traçabilité)           |
| `ghcr.io/.../backend:latest`      | Dernière release (auto-deploy Koyeb) |
