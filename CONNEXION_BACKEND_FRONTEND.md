# 🔗 Connexion Backend ↔ Frontend - Résumé des Modifications

## ✅ Modifications Effectuées

### 1. Client API Frontend (`apps/web/src/lib/api.ts`)

**Créé :** Client API TypeScript pour communiquer avec le backend Symfony

**Fonctionnalités :**

- ✅ Gestion automatique du token JWT Supabase
- ✅ Fonctions pour toutes les routes API :
  - `getHealth()` - Health check
  - `getMe()` - Informations utilisateur
  - `createQuizSession()` - Créer une session
  - `getQuizSessions()` - Lister les sessions
  - `getQuizSession(id)` - Récupérer une session
  - `submitAnswer(sessionId, answer)` - Soumettre une réponse
  - `analyzeQuiz(sessionId)` - Analyser avec IA

**Configuration :**

- Utilise `VITE_API_URL` depuis `.env` (défaut: `http://127.0.0.1:8000/api`)
- Ajoute automatiquement le header `Authorization: Bearer <token>`

---

### 2. QuizPage Mise à Jour (`apps/web/src/pages/QuizPage.tsx`)

**Modifié :** Page quiz pour utiliser l'API backend

**Nouvelles fonctionnalités :**

- ✅ Création de session de quiz
- ✅ Affichage des réponses soumises
- ✅ Soumission de réponses (bouton test)
- ✅ Analyse IA des réponses
- ✅ Affichage des résultats d'analyse
- ✅ Gestion des erreurs avec messages clairs

**UI :**

- Affiche l'ID de session
- Liste toutes les réponses
- Bouton pour analyser avec IA
- Carte de résultat avec métier recommandé, confiance, explication

---

### 3. Configuration CORS (`backend/api/config/packages/nelmio_cors.yaml`)

**Vérifié :** CORS déjà configuré correctement

**Configuration actuelle :**

```yaml
allow_origin: ["http://localhost:5173", "http://localhost:5175"]
allow_headers: ["Content-Type", "Authorization"]
allow_methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
allow_credentials: true
```

✅ **OK** - Le frontend peut communiquer avec le backend

---

### 4. Variables d'Environnement (`apps/web/.env`)

**Vérifié :** Configuration présente

```env
VITE_SUPABASE_URL=https://sskekjasvjazqsilimry.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_API_URL=http://127.0.0.1:8000
```

✅ **OK** - L'URL de l'API est configurée

---

### 5. Routes Backend

**Vérifiées :** Toutes les routes sont disponibles

```
✅ GET  /api/health
✅ GET  /api/me
✅ POST /api/quiz/session
✅ GET  /api/quiz/session
✅ GET  /api/quiz/session/{id}
✅ POST /api/quiz/session/{sessionId}/answer
✅ POST /api/quiz/session/{sessionId}/analyze
```

---

## 🚀 Comment Tester

### Étape 1 : Démarrer le Backend

```bash
cd backend/api
symfony serve -d
# ou
php -S 127.0.0.1:8000 -t public
```

Vérifier :

```bash
curl http://127.0.0.1:8000/api/health
# Devrait retourner: {"status":"ok","service":"api"}
```

### Étape 2 : Démarrer le Frontend

```bash
cd apps/web
bun dev
# ou
npm run dev
```

Le frontend sera sur `http://localhost:5173`

### Étape 3 : Tester le Flow Complet

1. **Se connecter** via `/login`
   - Entrer votre email
   - Cliquer sur le magic link reçu
   - Vous serez redirigé vers `/quiz`

2. **Créer une session**
   - Cliquer sur "Créer une nouvelle session de quiz"
   - Une session sera créée avec un UUID

3. **Ajouter des réponses**
   - Cliquer sur "Ajouter réponse test (Q1 → A1)"
   - La réponse apparaîtra dans la liste

4. **Analyser**
   - Cliquer sur "Analyser avec IA"
   - Le résultat s'affichera avec le métier recommandé

---

## 🔍 Vérifications de Débogage

### Erreur CORS dans la console ?

1. Vérifier que le backend tourne sur `http://127.0.0.1:8000`
2. Vérifier `nelmio_cors.yaml` autorise `http://localhost:5173`
3. Vider le cache : `php bin/console cache:clear`

### Erreur 401 Unauthorized ?

1. Vérifier que vous êtes connecté via Supabase
2. Vérifier que le token est bien envoyé (console navigateur → Network)
3. Vérifier `AuthListener` dans les logs Symfony

### Erreur 404 Not Found ?

1. Vérifier les routes : `php bin/console debug:router`
2. Vérifier que l'URL dans `api.ts` est correcte
3. Vérifier `.env` contient `VITE_API_URL=http://127.0.0.1:8000`

### Erreur de connexion ?

1. Vérifier que le backend tourne
2. Vérifier les logs Symfony : `tail -f var/log/dev.log`
3. Vérifier la console navigateur pour les erreurs réseau

---

## 📝 Fichiers Modifiés/Créés

### Frontend

- ✅ `apps/web/src/lib/api.ts` - **CRÉÉ** (Client API)
- ✅ `apps/web/src/pages/QuizPage.tsx` - **MODIFIÉ** (Utilise l'API)
- ✅ `apps/web/.env` - **VÉRIFIÉ** (Configuration API URL)

### Backend

- ✅ Routes déjà créées précédemment
- ✅ CORS déjà configuré
- ✅ Sécurité déjà configurée

### Documentation

- ✅ `TESTING.md` - Guide de test complet
- ✅ `API_DOCUMENTATION.md` - Documentation API
- ✅ `CONNEXION_BACKEND_FRONTEND.md` - Ce fichier

---

## ✨ Résultat Final

Le backend et le frontend sont maintenant **connectés** :

1. ✅ Le frontend peut créer des sessions de quiz
2. ✅ Le frontend peut soumettre des réponses
3. ✅ Le frontend peut analyser avec l'IA
4. ✅ Les données sont sauvegardées en base Supabase
5. ✅ L'authentification Supabase fonctionne
6. ✅ CORS est configuré correctement

**Tout est prêt pour tester ! 🎉**
