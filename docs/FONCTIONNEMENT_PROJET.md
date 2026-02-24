# Fonctionnement technique du projet SupdesRH

Ce document décrit les mécanismes et l’architecture du projet, de façon technique mais accessible.

---

## Vue d’ensemble de l’architecture

SupdesRH est composé de **Cinq applications** qui communiquent entre elles :

| Application      | Rôle                                                                                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **App Web**      | Interface grand public : quiz, résultats, fiches métiers, profil utilisateur uniquement accessible apres authentification                                                                      |
| **App Admin**    | Interface de gestion : fiches métiers, questions de quiz, demandes de contact, feedbacks, utilisateurs, sessions de quiz, etc. uniquement accessible apres authentification avec un role ADMIN |
| **API Backend**  | Service central qui gère la logique, l’authentification et les données                                                                                                                         |
| **API IA**       | Service qui gère l'analyse IA                                                                                                                                                                  |
| **PAGE LANDING** | Qui est la page d'accueil du site                                                                                                                                                              |

Les apps web et admin s’appuient sur l’API pour toutes les opérations. L’authentification des utilisateurs est gérée par **Supabase Auth** (connexion par email/mot de passe, JWT).

---

## Flux principal : du quiz au résultat

### 1. Authentification

- L’utilisateur se connecte via Supabase Auth.
- L’API vérifie le **token JWT** sur chaque requête protégée.
- Les routes publiques (fiches métiers, page de login) ne demandent pas de connexion.

### 2. Chargement des questions

- L’API agrège les questions de **tous les quiz** liés aux fiches métiers.
- Chaque question est associée à une **fiche métier** (Job).
- Les questions sont mélangées aléatoirement, puis 15 aléatoires sont sélectionnées parmis toutes les questions.
- En cas de doublons (même texte dans plusieurs fiches), une seule occurrence est conservée.

### 3. Session de quiz

- Une **session** est créée au premier clic sur « Suivant ».
- Chaque réponse est enregistrée immédiatement avec :
  - l’identifiant de la question,
  - la valeur choisie (échelle 1 à 5),
  - l’identifiant de la fiche métier liée à la question.
- La session peut être reprise plus tard (l’utilisateur retrouve ses réponses).

### 4. Analyse et recommandation

Deux étapes distinctes :

1. **Sélection du métier** : basée sur une **logique de règles** qui exploite les liens question ↔ fiche. Pour chaque fiche, un score est calculé à partir des réponses des questions qui lui sont rattachées. La fiche avec le meilleur score est recommandée.
2. **Explication personnalisée** : si une clé API IA (Groq ou OpenRouter) est configurée, une requête est envoyée pour générer un texte explicatif à partir des réponses et de la fiche recommandée.

### 5. Résultat et suite

- Le résultat (métier, pourcentage, fiche, explication) est affiché.
- L’utilisateur peut demander à être contacté par l’équipe SupdesRH.
- Les sessions et résultats restent consultables dans « Mes sessions ».

---

## Structure des données clés

### Entités principales

- **Jobs (fiches métiers)** : métiers RH (nom, description, salaire, indicateurs, etc.).
- **Quizzes** : parcours de questions liés à une fiche. Chaque quiz contient des questions au format JSON.
- **Quiz Sessions** : une session = un utilisateur qui passe un quiz à un moment donné.
- **Quiz Session Answers** : chaque réponse contient la question, la valeur choisie, et l’identifiant de la fiche métier.

### Lien question ↔ fiche

Le lien est essentiel pour l’analyse :

- Chaque **question** appartient à un quiz.
- Chaque **quiz** est lié à une **fiche métier**.
- Quand une réponse est enregistrée, l’identifiant de la fiche est stocké avec la réponse.
- L’analyse s’appuie sur ces liens pour calculer un score par fiche.

---

## Moteurs d’analyse

### Priorité utilisée

1. **Logique par règles** (toujours utilisée quand les réponses ont un lien avec une fiche)
   - Regroupe les réponses par fiche métier.
   - Calcule une moyenne par fiche et en déduit un score.
   - Le métier avec le score le plus élevé est recommandé.
   - Nous utilisons deux IA pour l'analyse : Groq et OpenRouter.

2. **IA pour l’explication** (si clé API configurée)
   - Reçoit les réponses et la fiche recommandée.
   - Génère un texte personnalisé expliquant la correspondance.
   - En cas d’échec ou d’absence de clé, une phrase générique est utilisée.

### Fallback sans IA

Sans clé API ou en cas d’erreur IA, seul le moteur par règles est utilisé. La recommandation reste correcte ; seule l’explication est plus simple.

---

## Sécurité

- **Authentification** : JWT Supabase vérifié par l’API sur chaque route protégée.
- **Autorisation** : chaque session de quiz est rattachée à un utilisateur ; on ne peut accéder qu’à ses propres sessions et résultats.
- **Admin** : l’app admin dispose de ses propres routes et d’une authentification par token dédié.

---

## Données externes

- **Base de données** : PostgreSQL (Supabase).
- **Authentification** : Supabase Auth.
- **IA** (optionnel) : Groq ou OpenRouter pour les explications personnalisées et le recapitulatif de la session.

---

## En résumé

Le projet repose sur :

1. Un **lien clair** entre questions, réponses et fiches métiers.
2. Une **recommandation par règles** basée sur ces liens (robuste, pas dépendante de l’IA).
3. Une **explication enrichie par l’IA** en option.
4. Une **séparation nette** entre app utilisateur, app admin et API backend.
