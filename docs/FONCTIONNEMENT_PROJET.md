# RH&MOI by SUP des RH — Document de présentation technique

> **Public visé** : jury, encadrants, parties prenantes non techniques.
> Ce document présente le fonctionnement du projet de façon claire et accessible.

---

## 1. Qu'est-ce que RH&MOI ?

**RH&MOI** est une plateforme web d'orientation vers les métiers des Ressources Humaines, développée par et pour **SUP des RH**, l'école 100 % spécialisée en RH depuis 1998.

L'outil permet à un utilisateur (étudiant, lycéen, professionnel en reconversion) de :

- Répondre à un **quiz rapide** (~2 minutes, 15 questions)
- Obtenir une **recommandation personnalisée** d'un métier RH
- Consulter des **fiches métiers détaillées** (missions, salaire, taux d'embauche, vidéo)
- Demander à **être contacté** par l'équipe SUP des RH

---

## 2. Architecture générale

Le projet est composé de **4 briques principales** qui communiquent entre elles :

```
┌─────────────────────────────────────────────────────────────┐
│                        UTILISATEURS                         │
└──────────┬──────────────────┬───────────────────┬───────────┘
           │                  │                   │
     ┌─────▼─────┐    ┌──────▼──────┐    ┌───────▼───────┐
     │  Landing   │    │   App Web   │    │  App Admin    │
     │  (Vitrine) │    │   (Quiz)    │    │  (Gestion)    │
     └─────┬─────┘    └──────┬──────┘    └───────┬───────┘
           │                  │                   │
           └──────────┬───────┴───────────────────┘
                      │
               ┌──────▼──────┐
               │ API Backend │
               │  (Symfony)  │
               └──────┬──────┘
                      │
          ┌───────────┼───────────┐
          │           │           │
    ┌─────▼────┐ ┌────▼────┐ ┌───▼────┐
    │ Base de  │ │Supabase │ │  IA    │
    │ données  │ │  Auth   │ │(Groq)  │
    │(Postgres)│ │ (JWT)   │ │        │
    └──────────┘ └─────────┘ └────────┘
```

| Composant                     | Rôle                                                                 | Technologie                   |
| ----------------------------- | -------------------------------------------------------------------- | ----------------------------- |
| **Site vitrine (Landing)**    | Page d'accueil publique, présentation de l'école, espace entreprises | Astro (HTML statique)         |
| **Application Web**           | Quiz, résultats, fiches métiers, profil utilisateur                  | React + Vite                  |
| **Application Admin**         | Gestion des fiches, questions, contacts, utilisateurs                | React + Vite                  |
| **API Backend**               | Logique métier, gestion des données, analyse IA                      | Symfony (PHP 8.4)             |
| **Base de données**           | Stockage de toutes les données                                       | PostgreSQL (Supabase)         |
| **Authentification**          | Connexion sécurisée sans mot de passe (lien magique par email)       | Supabase Auth                 |
| **Intelligence Artificielle** | Analyse des réponses et recommandation personnalisée                 | Groq (Llama 3.3) / OpenRouter |

---

## 3. Parcours utilisateur complet

### Étape 1 — Connexion

L'utilisateur entre son adresse email et reçoit un **lien magique** (pas de mot de passe à retenir). En cliquant sur le lien, il est automatiquement connecté.

### Étape 2 — Le quiz

- **15 questions** sont présentées, tirées aléatoirement parmi l'ensemble des questions en base.
- Chaque question est liée à un **métier RH** spécifique.
- L'utilisateur répond sur une échelle de 1 (pas du tout d'accord) à 5 (tout à fait d'accord).
- Les réponses sont sauvegardées en temps réel : on peut quitter et reprendre plus tard.

### Étape 3 — L'analyse

Deux mécanismes complémentaires :

1. **Scoring par règles** (toujours actif) :
   - Les réponses sont regroupées par métier RH.
   - Un score moyen est calculé pour chaque métier.
   - Le métier avec le meilleur score est recommandé.

2. **Explication par Intelligence Artificielle** (si disponible) :
   - Les réponses et la liste des métiers sont envoyées à un modèle de langage (Groq / Llama 3.3).
   - L'IA génère un texte personnalisé expliquant pourquoi ce métier correspond au profil.
   - En cas d'indisponibilité de l'IA, une explication générique est utilisée.

### Étape 4 — Le résultat

L'utilisateur voit :

- Son **métier RH recommandé** avec un pourcentage de correspondance
- Un **graphique** montrant la répartition de ses affinités par domaine RH
- Un **carrousel de fiches métiers** du domaine principal
- La possibilité de **demander à être contacté** par SUP des RH

### Étape 5 — Suivi

- Toutes les sessions sont sauvegardées dans **« Mes sessions »**
- L'utilisateur peut refaire le quiz autant de fois qu'il le souhaite

---

## 4. Espace Administration

L'application admin permet à l'équipe SUP des RH de :

| Fonctionnalité           | Description                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------- |
| **Fiches métiers**       | Créer, modifier et supprimer les fiches (nom, description, salaire, indicateurs, vidéo) |
| **Domaines RH**          | Gérer les grands domaines (Recrutement, Paie, QVCT, etc.) avec emoji personnalisable    |
| **Questions de quiz**    | Rédiger les questions et les associer à un métier                                       |
| **Demandes de contact**  | Voir toutes les demandes « Être contacté » avec email, métier recommandé et scores      |
| **Demandes entreprises** | Consulter les demandes du formulaire entreprises de la landing                          |
| **Sessions de quiz**     | Consulter les sessions et résultats des utilisateurs                                    |

---

## 5. Sécurité et confidentialité

| Aspect                    | Mise en œuvre                                                                |
| ------------------------- | ---------------------------------------------------------------------------- |
| **Authentification**      | Token JWT vérifié sur chaque requête protégée                                |
| **Isolation des données** | Un utilisateur ne peut voir que ses propres sessions et résultats            |
| **Admin protégé**         | Routes dédiées avec vérification du rôle ADMIN                               |
| **Email**                 | Jamais utilisé à des fins commerciales. Sert uniquement au lien de connexion |
| **Pas de mot de passe**   | Connexion par lien magique = pas de risque de fuite de mot de passe          |

---

## 6. Déploiement

Le projet utilise **Docker** pour garantir un environnement identique partout :

| Environnement     | Usage                               | Accès                     |
| ----------------- | ----------------------------------- | ------------------------- |
| **Développement** | Travail local des développeurs      | `localhost`               |
| **Staging**       | Tests avant mise en production      | Serveur de pré-production |
| **Production**    | Version accessible aux utilisateurs | Domaine public            |

Le processus de déploiement est automatisé via **GitHub Actions** :

1. À chaque modification du code, des vérifications automatiques sont lancées (qualité, compilation)
2. Quand une version est validée, une image Docker est construite et publiée
3. Le serveur de production récupère la nouvelle version et la déploie

---

## 7. Données et stockage

### Entités principales en base de données

| Table                      | Contenu                                                           |
| -------------------------- | ----------------------------------------------------------------- |
| `jobs`                     | Fiches métiers RH (nom, description, salaire, indicateurs, vidéo) |
| `job_categories`           | Grands domaines RH (Recrutement, Formation, Paie, etc.)           |
| `quizzes`                  | Parcours de quiz (questions JSON liées à un métier)               |
| `quiz_sessions`            | Sessions de quiz (une par tentative d'un utilisateur)             |
| `quiz_session_answers`     | Réponses individuelles (question, valeur, métier associé)         |
| `contact_requests`         | Demandes de contact après le quiz                                 |
| `company_contact_requests` | Demandes de contact entreprises (landing)                         |
| `feedbacks`                | Avis et retours des utilisateurs                                  |

### Flux des données du quiz

```
Utilisateur répond à une question
        │
        ▼
quiz_session_answers (question + réponse + métier lié)
        │
        ▼ (15 réponses accumulées)
        │
        ▼
API Backend : scoring par métier
        │
        ├── Score calculé par règles (toujours)
        │
        ├── Explication IA (si disponible)
        │
        ▼
Résultat : métier recommandé + scores + explication
```

---

## 8. Technologies utilisées

| Catégorie            | Technologie                     | Pourquoi                                                 |
| -------------------- | ------------------------------- | -------------------------------------------------------- |
| **Frontend**         | React, TypeScript, Tailwind CSS | Interface moderne, réactive et maintenable               |
| **Landing**          | Astro                           | Pages statiques ultra-rapides pour le SEO                |
| **Backend**          | Symfony (PHP 8.4)               | Framework robuste, sécurisé, adapté aux API              |
| **Base de données**  | PostgreSQL (Supabase)           | Base relationnelle fiable avec authentification intégrée |
| **IA**               | Groq (Llama 3.3 70B)            | Analyse gratuite, rapide, modèle performant              |
| **Conteneurisation** | Docker                          | Déploiement reproductible sur tous les environnements    |
| **CI/CD**            | GitHub Actions                  | Automatisation des tests et du déploiement               |
| **UI**               | shadcn/ui                       | Composants accessibles et personnalisables               |

---

## 9. Points forts du projet

- **Gratuit et sans engagement** pour les utilisateurs
- **Pas de mot de passe** : connexion simplifiée par email
- **Recommandation fiable** : le scoring par règles fonctionne même sans IA
- **IA enrichissante** : l'explication personnalisée apporte une valeur ajoutée
- **Données protégées** : isolation stricte par utilisateur, pas de revente de données
- **Administration complète** : l'équipe SUP des RH gère tout le contenu sans intervention technique
- **Responsive** : fonctionne sur mobile, tablette et desktop
- **Open source** : code versionné et documenté sur GitHub
