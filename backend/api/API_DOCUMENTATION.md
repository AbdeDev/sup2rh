# 📚 Documentation API Sup2RH Backend

## 🎯 Vue d'ensemble

Backend Symfony API pour l'application Sup2RH - Quiz RH avec analyse IA.

**Base URL :** `http://127.0.0.1:8000/api`

## 🔐 Authentification

Toutes les routes (sauf `/api/health`) nécessitent un token JWT Supabase dans le header :

```
Authorization: Bearer <supabase_access_token>
```

## 📍 Endpoints

### Health Check

#### `GET /api/health`

Vérifie que l'API est opérationnelle.

**Réponse :**

```json
{
    "status": "ok",
    "service": "api"
}
```

---

### Utilisateur

#### `GET /api/me`

Récupère les informations de l'utilisateur connecté.

**Headers requis :**

```
Authorization: Bearer <token>
```

**Réponse :**

```json
{
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER"
}
```

---

### Quiz Sessions

#### `POST /api/quiz/session`

Crée une nouvelle session de quiz.

**Headers requis :**

```
Authorization: Bearer <token>
```

**Réponse (201) :**

```json
{
    "id": "uuid",
    "userId": "uuid",
    "createdAt": "2024-01-01T00:00:00+00:00",
    "finalJobId": null,
    "scores": null
}
```

---

#### `GET /api/quiz/session`

Liste toutes les sessions de quiz de l'utilisateur connecté.

**Headers requis :**

```
Authorization: Bearer <token>
```

**Réponse :**

```json
{
    "items": [
        {
            "id": "uuid",
            "userId": "uuid",
            "createdAt": "2024-01-01T00:00:00+00:00",
            "finalJobId": "hr-business-partner",
            "scores": {},
            "answerCount": 5
        }
    ]
}
```

---

#### `GET /api/quiz/session/{id}`

Récupère une session de quiz spécifique avec toutes ses réponses.

**Headers requis :**

```
Authorization: Bearer <token>
```

**Réponse (200) :**

```json
{
    "id": "uuid",
    "userId": "uuid",
    "createdAt": "2024-01-01T00:00:00+00:00",
    "finalJobId": "hr-business-partner",
    "scores": {},
    "answers": [
        {
            "id": "uuid",
            "questionId": "q1",
            "answerId": "a1",
            "textValue": null,
            "createdAt": "2024-01-01T00:00:00+00:00"
        }
    ]
}
```

**Erreurs :**

- `404` : Session non trouvée
- `403` : Accès refusé (session n'appartient pas à l'utilisateur)

---

### Réponses Quiz

#### `POST /api/quiz/session/{sessionId}/answer`

Soumet une réponse à une question du quiz.

**Headers requis :**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :**

```json
{
    "questionId": "q1",
    "answerId": "a1",
    "textValue": null
}
```

**Note :** Soit `answerId` soit `textValue` doit être fourni.

**Réponse (201) :**

```json
{
    "id": "uuid",
    "questionId": "q1",
    "answerId": "a1",
    "textValue": null,
    "createdAt": "2024-01-01T00:00:00+00:00"
}
```

**Erreurs :**

- `404` : Session non trouvée
- `403` : Accès refusé
- `422` : Données invalides (questionId manquant, ou answerId/textValue manquant)

---

### Analyse IA

#### `POST /api/quiz/session/{sessionId}/analyze`

Lance l'analyse IA des réponses pour recommander un métier RH.

**Headers requis :**

```
Authorization: Bearer <token>
```

**Réponse (200) :**

```json
{
    "jobId": "hr-business-partner",
    "confidence": 0.85,
    "explanation": "Basé sur vos réponses, nous recommandons le métier de HR Business Partner.",
    "scores": {
        "hr-business-partner": 0.85,
        "recruiter": 0.6,
        "hr-analyst": 0.45
    }
}
```

**Erreurs :**

- `404` : Session non trouvée
- `403` : Accès refusé
- `422` : Aucune réponse trouvée pour cette session

---

## 🧪 Exemples de requêtes curl

### Créer une session

```bash
curl -X POST http://127.0.0.1:8000/api/quiz/session \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Soumettre une réponse

```bash
curl -X POST http://127.0.0.1:8000/api/quiz/session/SESSION_ID/answer \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "q1",
    "answerId": "a1"
  }'
```

### Analyser les réponses

```bash
curl -X POST http://127.0.0.1:8000/api/quiz/session/SESSION_ID/analyze \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Récupérer les informations utilisateur

```bash
curl http://127.0.0.1:8000/api/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🗄️ Structure de la base de données

### Tables principales

- **profiles** : Profils utilisateurs
- **quiz_sessions** : Sessions de quiz
- **quiz_session_answers** : Réponses aux questions
- **jobs** : Métiers RH disponibles

---

## ⚙️ Configuration

### Variables d'environnement

Dans `.env.local` :

```env
# Supabase
DATABASE_URL="postgresql://..."
SUPABASE_PROJECT_URL="https://..."
SUPABASE_JWT_AUD="authenticated"

# IA (optionnel)
OPENROUTER_API_KEY="..."
HUGGINGFACE_API_KEY="..."
```

---

## 🚀 Démarrage

1. Installer les dépendances :

```bash
composer install
```

2. Configurer `.env.local` avec vos credentials Supabase

3. Appliquer les migrations :

```bash
php bin/console doctrine:migrations:migrate
```

4. Lancer le serveur :

```bash
symfony serve
# ou
php -S 127.0.0.1:8000 -t public
```

---

## 📝 Notes

- Les UUID sont générés côté backend avec `Symfony\Component\Uid\Uuid`
- L'analyse IA utilise OpenRouter par défaut (gratuit), avec fallback sur règles simples
- Les métiers RH disponibles sont définis dans le service `AiAnalyzer`

---

## 🔧 Commandes utiles

```bash
# Voir toutes les routes
php bin/console debug:router

# Valider le schéma
php bin/console doctrine:schema:validate

# Créer une migration
php bin/console make:migration

# Appliquer les migrations
php bin/console doctrine:migrations:migrate

# Info sur la base de données
php bin/console doctrine:database:info
```
