# 🧪 Guide de Test - Backend + Frontend

## ✅ État actuel

- ✅ Backend Symfony configuré et fonctionnel
- ✅ Frontend React configuré
- ✅ Client API créé dans `apps/web/src/lib/api.ts`
- ✅ QuizPage mise à jour pour utiliser l'API backend
- ✅ CORS configuré pour `http://localhost:5173`

## 🚀 Démarrage

### 1. Démarrer le backend Symfony

```bash
cd backend/api
symfony serve -d
# ou
php -S 127.0.0.1:8000 -t public
```

Vérifier que le backend répond :

```bash
curl http://127.0.0.1:8000/api/health
# Devrait retourner: {"status":"ok","service":"api"}
```

### 2. Démarrer le frontend

```bash
cd apps/web
bun dev
# ou
npm run dev
```

Le frontend sera accessible sur `http://localhost:5173`

## 🧪 Tests manuels

### Test 1 : Health Check (sans auth)

```bash
curl http://127.0.0.1:8000/api/health
```

**Résultat attendu :**

```json
{ "status": "ok", "service": "api" }
```

### Test 2 : Créer une session (nécessite auth)

1. Se connecter via le frontend (`http://localhost:5173/login`)
2. Entrer votre email
3. Cliquer sur "Créer une nouvelle session de quiz"
4. Vérifier que la session est créée

### Test 3 : Soumettre une réponse

1. Dans QuizPage, cliquer sur "Ajouter réponse test (Q1 → A1)"
2. Vérifier que la réponse apparaît dans la liste

### Test 4 : Analyser avec IA

1. Après avoir ajouté au moins une réponse
2. Cliquer sur "Analyser avec IA"
3. Vérifier que le résultat s'affiche

## 🔍 Tests avec curl (nécessite token Supabase)

### Obtenir un token Supabase

1. Se connecter via le frontend
2. Ouvrir la console du navigateur
3. Exécuter :

```javascript
const { data } = await supabase.auth.getSession();
console.log(data.session.access_token);
```

### Créer une session

```bash
TOKEN="votre_token_supabase"

curl -X POST http://127.0.0.1:8000/api/quiz/session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Soumettre une réponse

```bash
SESSION_ID="uuid_de_la_session"

curl -X POST http://127.0.0.1:8000/api/quiz/session/$SESSION_ID/answer \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "q1",
    "answerId": "a1"
  }'
```

### Analyser

```bash
curl -X POST http://127.0.0.1:8000/api/quiz/session/$SESSION_ID/analyze \
  -H "Authorization: Bearer $TOKEN"
```

## 🐛 Dépannage

### Erreur CORS

Si vous voyez des erreurs CORS dans la console du navigateur :

1. Vérifier que `nelmio_cors.yaml` autorise `http://localhost:5173`
2. Vider le cache Symfony : `php bin/console cache:clear`
3. Redémarrer le serveur Symfony

### Erreur 401 Unauthorized

- Vérifier que le token Supabase est valide
- Vérifier que `AuthListener` est bien configuré
- Vérifier les logs Symfony : `tail -f var/log/dev.log`

### Erreur 404 Not Found

- Vérifier que les routes sont bien enregistrées : `php bin/console debug:router`
- Vérifier que le serveur Symfony tourne sur le bon port

### Erreur de connexion à la base de données

- Vérifier `.env.local` avec les credentials Supabase
- Tester la connexion : `php bin/console doctrine:database:info`

## 📝 Checklist de test complète

- [ ] Backend démarre sans erreur
- [ ] `/api/health` répond correctement
- [ ] Frontend démarre sans erreur
- [ ] Connexion Supabase fonctionne
- [ ] Création de session fonctionne
- [ ] Soumission de réponse fonctionne
- [ ] Analyse IA fonctionne
- [ ] CORS fonctionne (pas d'erreurs dans la console)
- [ ] Les données sont bien sauvegardées en base

## 🎯 Prochaines étapes

1. Créer un vrai quiz avec des questions
2. Améliorer l'UI du quiz
3. Ajouter la gestion des résultats
4. Créer la page de résultats
