# SUP des RH — Quiz d'orientation RH

> Trouve ton métier RH idéal en 3 minutes — par l'école SUP des RH depuis 1998.

---

## Architecture

```
Sup2Rh/
├── apps/
│   ├── landing/        # Site vitrine (Astro) — pages publiques
│   ├── web/            # Application quiz (React + Vite) — utilisateurs
│   └── admin/          # Back-office (React + Vite) — administrateurs
├── backend/
│   └── api/            # API REST (Symfony 7 / PHP 8.4 + Postgres)
├── packages/
│   ├── types/          # Types TypeScript partagés
│   ├── ui/             # Composants UI partagés
│   └── quiz-engine/    # Logique du quiz (algo de scoring)
├── scripts/
│   ├── setup-hooks.sh      # Installe les git hooks (à lancer une fois)
│   ├── pre-push-check.sh   # CI local avant push
│   └── ...
├── docker-compose.yml          # Dev local (backend uniquement)
├── docker-compose.staging.yml  # Staging (réplique prod en local)
└── docker-compose.prod.yml     # Production (VPS)
```

**Stack :**

| Couche          | Technologie                      |
| --------------- | -------------------------------- |
| Landing         | Astro 5, CSS custom, dark mode   |
| Web / Admin     | React 19, Vite, Tailwind CSS 4   |
| Backend         | Symfony 7, PHP 8.4, Doctrine ORM |
| Base de données | Supabase (Postgres)              |
| Auth            | Supabase Auth (magic link)       |
| CI/CD           | GitHub Actions                   |
| Déploiement     | Koyeb (API) + Cloudflare Pages   |

---

## Installation rapide

### Prérequis

- [Bun](https://bun.sh) ≥ 1.1
- [PHP](https://php.net) 8.4 + Composer 2
- [Docker](https://docker.com) (optionnel, pour le backend en container)

### 1. Cloner et installer

```bash
git clone https://github.com/<org>/sup2rh.git
cd sup2rh
bun install
```

### 2. Configurer les variables d'environnement

```bash
# Web app
cp apps/web/.env.example apps/web/.env

# Admin
cp apps/admin/.env.example apps/admin/.env

# Backend
cp backend/api/.env.example backend/api/.env
```

Variables à renseigner :

| Variable                 | Description                                         |
| ------------------------ | --------------------------------------------------- |
| `VITE_SUPABASE_URL`      | URL du projet Supabase                              |
| `VITE_SUPABASE_ANON_KEY` | Clé publique Supabase                               |
| `VITE_API_URL`           | URL du backend (ex: `http://127.0.0.1:8000`)        |
| `DATABASE_URL`           | Connexion Postgres (Supabase → Settings → Database) |
| `SUPABASE_PROJECT_URL`   | URL Supabase pour valider les JWT                   |
| `SUPABASE_JWT_AUD`       | Audience JWT (`authenticated`)                      |

### 3. Installer les git hooks

```bash
bash scripts/setup-hooks.sh
```

Installe 3 hooks automatiquement :

- **pre-commit** : ESLint sur les fichiers staged
- **commit-msg** : vérifie le format du message
- **pre-push** : build + typecheck complet (bloque si erreur)

Bypass d'urgence : `git commit --no-verify` / `git push --no-verify`

### 4. Lancer en développement

```bash
# Tout en parallèle (landing + web + admin + backend Docker)
bun run dev

# Ou séparément :
bun run dev:landing   # http://localhost:4321
bun run dev:web       # http://localhost:5173
bun run dev:admin     # http://localhost:5174
bun run dev:api       # http://localhost:8000
```

---

## Stratégie de branches

```
main          ← production stable (protégée)
  └── dev     ← intégration (CI obligatoire avant merge)
       └── feature/xxx  ← développement d'une fonctionnalité
       └── fix/xxx       ← correction de bug
       └── chore/xxx     ← maintenance (deps, config…)
```

**Règles :**

1. Jamais de push direct sur `main`
2. Toute PR vers `main` passe par `dev` d'abord
3. La CI doit être verte pour merger
4. Les releases sont créées depuis `main` via tag `vX.Y.Z`

**Convention des commits (Conventional Commits) :**

```
feat(landing): rework hero section
fix(web): corrige la visibilité des boutons en dark mode
chore: met à jour les dépendances
docs: met à jour le README
```

Types : `feat` `fix` `refactor` `docs` `style` `test` `chore` `ci` `build`

### Version automatique (tags vX.Y.Z)

À chaque **push sur `main`**, la CI crée un tag de version selon les commits depuis le dernier tag :

| Type de commit                                   | Bump      | Exemple         |
| ------------------------------------------------ | --------- | --------------- |
| `fix:` ou autre (sans feat)                      | **patch** | v1.0.0 → v1.0.1 |
| `feat:`                                          | **minor** | v1.0.0 → v1.1.0 |
| `feat!:` ou message contenant `BREAKING CHANGE:` | **major** | v1.1.0 → v2.0.0 |

**Pour la prochaine fois — déclencher un major (ex. v2.0.0) :**

```bash
# Option 1 : feat! dans le message
git commit -m "feat!: grands domaines RH, quiz redesigné, auth sécurisée"

# Option 2 : BREAKING CHANGE en fin de message
git commit -m "feat(web): refonte complète du quiz

BREAKING CHANGE: nouvelle structure des questions et résultats"
```

Ensuite : `git push origin main` → la CI créera automatiquement le tag (ex. `v2.0.0`).

---

## Environnements

### Développement local

```bash
bun run dev
```

Utilise les `.env` locaux. L'API tourne en Docker (`docker-compose.yml`) ou via PHP directement.

### Staging (test pré-production)

Réplique l'environnement de production **localement** pour valider avant de déployer :

```bash
# 1. Configurer
cp .env.staging.example .env.staging
# → remplir .env.staging avec les credentials de staging (base de données dédiée !)

# 2. Builder les frontends
docker compose -f docker-compose.staging.yml --profile build up frontend-builder

# 3. Lancer le stack complet
docker compose -f docker-compose.staging.yml up -d

# Accès :
# http://localhost:8080        → landing
# http://localhost:8080/web/   → web app
# http://localhost:8080/admin/ → admin
# http://localhost:8001/api/   → backend direct
```

### Production

Voir [DEPLOYMENT.md](DEPLOYMENT.md) pour le guide complet.

| Service      | Plateforme          |
| ------------ | ------------------- |
| Backend API  | Koyeb (Docker)      |
| Web App      | Cloudflare Pages    |
| Admin        | Cloudflare Pages    |
| Landing      | Cloudflare Pages    |
| Base données | Supabase (Postgres) |

---

## CI/CD

### Automatique sur GitHub Actions

| Déclencheur       | Pipeline                                                                |
| ----------------- | ----------------------------------------------------------------------- |
| PR → `main`/`dev` | Lint + Typecheck + Build (bloque la PR si KO)                           |
| Push → `main`     | CI + **auto-tag semver** (voir section "Version automatique" ci-dessus) |
| Tag `v*`          | Build Docker + Push GHCR + GitHub Release                               |

### Local (avant push)

```bash
# Vérifier manuellement sans faire de push :
bash scripts/pre-push-check.sh

# Les hooks git le font automatiquement après setup-hooks.sh
```

---

## Sécurité

- **Ne jamais committer** de fichier `.env` (protégé dans `.gitignore`)
- Le hook **pre-commit** bloque les secrets évidents dans le diff
- **Authentification** : Supabase Auth, tokens JWT validés côté API
- **Admin** : protégé par rôle `ADMIN` en base + RequireAdmin guard
- Les **CORS** sont configurés dans `backend/api/config/` (env-dependent)
- **Headers de sécurité** nginx activés en staging et prod (X-Frame-Options, X-Content-Type-Options…)

---

## Connexion Admin

```bash
# Donner le rôle ADMIN (dans la base Supabase) :
UPDATE profiles SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

Puis : `http://localhost:5174/login` (dev) ou URL admin de prod.

---

## Connexion Web (magic link)

1. `http://localhost:5173/login`
2. Entrer son email → lien magique envoyé
3. Cliquer sur le lien **dans le même navigateur**

---

## Documentation

- [**DEPLOYMENT.md**](DEPLOYMENT.md) — Guide déploiement prod (Koyeb + Cloudflare)
- [**docs/FONCTIONNEMENT_PROJET.md**](docs/FONCTIONNEMENT_PROJET.md) — Architecture technique détaillée

---

## Licence

Voir [LICENSE](LICENSE) et [DISTRIBUTION_LICENSE.md](DISTRIBUTION_LICENSE.md).
