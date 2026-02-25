# SupdesRH

> Découvre ton métier RH idéal en quelques minutes

---

## C'est quoi SupdesRH ?

SupdesRH est une application qui t’aide à **trouver le métier des Ressources Humaines qui te correspond** le mieux. Tu réponds à un quiz court et personnalisé, et tu reçois une recommandation basée sur tes réponses, avec des fiches métiers et des infos pour t’orienter.

L’objectif : te guider vers les métiers RH (Recrutement, Paie, QVCT, Formation, etc.) et te mettre en relation avec l’équipe SupdesRH pour une alternance ou un stage.

---

## Comment ça marche ?

### 1. Tu te connectes

Tu crées un compte ou tu te connectes avec ton email. Pas besoin de données compliquées.

### 2. Tu fais le quiz

Tu réponds à une quinzaine de questions rapides. À chaque question, tu dis à quel point tu es d’accord (ou pas) avec une affirmation, en déplaçant un curseur de 1 à 5.

Par exemple : _« J’aime travailler en équipe »_ → tu choisis entre « Pas du tout d’accord » et « Tout à fait d’accord ».

### 3. Tu découvres ton résultat

À la fin du quiz, tu obtiens :

- **Un métier RH recommandé** pour toi (ex : HR Business Partner, Recruteur, etc.)
- **Un pourcentage de correspondance** avec ton profil
- **Une fiche détaillée** : description du métier, salaire indicatif, taux d’embauche, etc.
- **Une explication personnalisée** pour comprendre pourquoi ce métier te va bien

### 4. Tu peux prendre contact

Si un métier t’intéresse, tu peux demander à être contacté par l’équipe SupdesRH pour en savoir plus sur les alternances, stages et possibilités d’orientation.

---

## Ce que tu peux faire dans l’app

| Fonctionnalité     | Description                                                  |
| ------------------ | ------------------------------------------------------------ |
| **Quiz**           | Répondre aux questions et obtenir une recommandation         |
| **Résultats**      | Voir le métier recommandé, la fiche et l’explication         |
| **Mes sessions**   | Consulter tes anciens quiz et reprendre une session en cours |
| **Fiches métiers** | Découvrir tous les métiers RH sans être connecté             |
| **Profil**         | Gérer ton compte et tes infos de connexion                   |

---

## Pour qui c’est fait ?

- Les étudiants qui hésitent sur une orientation dans les RH
- Les personnes en reconversion vers les métiers RH
- Tous ceux qui veulent clarifier leur profil et leurs goûts dans ce domaine

---

## Données et base de données

### Backend (API)

Le backend Symfony doit être connecté à la **même base Postgres que Supabase** pour que les données (profiles, jobs, quiz, sessions) soient accessibles.

1. `cd backend/api && composer install` (si `vendor/` n'existe pas)
2. Crée `backend/api/.env` à partir de `backend/api/.env.example`
3. Remplis `DATABASE_URL` avec l’URL de connexion Supabase :
   - Supabase Dashboard → **Settings** → **Database** → **Connection string** (URI)
   - Exemple : `postgresql://postgres.[ref]:[MOT_DE_PASSE]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?serverVersion=15&charset=utf8`
4. Remplis `SUPABASE_PROJECT_URL` et `SUPABASE_JWT_AUD` (Settings → API)
5. Lance les migrations : `cd backend/api && php bin/console doctrine:migrations:migrate`
6. Démarre l’API : `bun run dev:api`

Si tu ne récupères pas les fiches métiers, les questions de quiz ou les sessions : vérifie que `DATABASE_URL` pointe bien vers la base Supabase et que les migrations ont été exécutées.

---

## Connexion Admin

L’admin utilise une **connexion par email uniquement** (pas de magic link) :

1. Va sur `http://localhost:5174/login` (ou l’URL de l’app admin)
2. Saisis ton **email**
3. Clique sur « Accéder au dashboard »

**Conditions :**

- Ton email doit exister dans la table `profiles` (créée automatiquement à la première connexion web via Supabase)
- La colonne `role` de ton profil doit être `ADMIN`

**Pour donner les droits admin à un utilisateur :**

```sql
-- Dans la base Supabase (ou celle utilisée par le backend)
UPDATE profiles SET role = 'ADMIN' WHERE email = 'ton@email.com';
```

Le backend doit utiliser la même base que Supabase (`DATABASE_URL` dans `backend/api/.env`).

**Si "Failed to fetch" ou "L'API ne répond pas"** : exécute `cd backend/api && composer install` puis `bun run dev:api`.

---

## Connexion Web (magic link)

1. Va sur `http://localhost:5173/login`
2. Saisis ton email
3. Clique sur le lien reçu par mail (dans le même navigateur)
4. Tu es redirigé vers la page quiz

Si tu vois « Une erreur s'est produite » après le clic, vérifie que les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont bien configurées dans `apps/web/.env`, et que les URLs de redirection Supabase incluent `http://localhost:5173/auth/callback`.

**Si la page résultat affiche une erreur** : vérifie que `VITE_API_URL` pointe vers l'API (ex. `http://127.0.0.1:8000`), que l'API est démarrée (`bun run dev:api`), et que tu es bien connecté avec le compte qui a passé le quiz. Dans l'onglet **Network** (F12), regarde les requêtes vers ton API (`/api/quiz/session/...`) — ignore les 404 vers `trustpilot.com` (provenant de l'extension Trustpilot du navigateur).

---

## Admin – Sessions de quiz

L'admin peut consulter **Sessions de quiz** pour voir :

- Quels utilisateurs ont fait des quiz
- Combien de quiz par utilisateur
- Les dates et résultats (métier recommandé)
- Le détail complet d'une session (bouton « Voir le résultat »)

---

## Déploiement (prod)

Voir le guide complet : **[DEPLOYMENT.md](DEPLOYMENT.md)**

**Résumé rapide :**

| Service         | Plateforme          | Coût    |
| --------------- | ------------------- | ------- |
| Backend API     | Koyeb (Docker)      | Gratuit |
| Web App         | Cloudflare Pages    | Gratuit |
| Admin App       | Cloudflare Pages    | Gratuit |
| Landing Page    | Cloudflare Pages    | Gratuit |
| Base de données | Supabase (Postgres) | Gratuit |

**CI/CD automatisé :**

- Push sur `dev`/`main` → CI (lint, typecheck, build, tests)
- Tag `vX.Y.Z` → Build Docker + Push GHCR + GitHub Release

```bash
# Créer une release
git tag v1.0.0 && git push origin v1.0.0
```

---

## Documentation

- [**Fonctionnement technique**](docs/FONCTIONNEMENT_PROJET.md) : architecture, mécanismes, flux des données (pour développeurs / contributeurs).

---

## Licence

Ce projet est sous licence. Voir le fichier [LICENSE](LICENSE) pour les détails.

Voir également [DISTRIBUTION_LICENSE.md](DISTRIBUTION_LICENSE.md).
