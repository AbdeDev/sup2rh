# Comment l'IA détermine ton profil RH

## Vue d'ensemble

L'analyse du profil est effectuée par le service `AiAnalyzer` (`backend/api/src/Services/AiAnalyzer.php`). L'IA reçoit tes réponses au quiz et recommande le métier RH le plus cohérent parmi les fiches configurées en base.

## Ordre de priorité des moteurs

1. **Groq** (prioritaire) – Llama 3.3 70B, gratuit, rapide
2. **OpenRouter** – Llama 3.1 8B
3. **HuggingFace** – non implémenté (fallback règles)
4. **Règles** – logique sans LLM si aucune clé API

## Déroulement

1. **Contexte** : Les réponses (questionId + answerId/textValue) sont formatées en texte.
2. **Prompt** : L'IA reçoit ce contexte + la liste des métiers RH disponibles (id, nom).
3. **Sortie** : L'IA doit répondre en JSON avec :
   - `jobId` : l’un des identifiants de la liste
   - `confidence` : niveau de confiance (0–1)
   - `explanation` : pourquoi ce métier correspond
   - `scores` : scores par métier (pour affichage des alternatives)

## Fallback "règles"

Sans API (ou en cas d’erreur), le système applique :

- Recommandation par défaut : premier métier en liste
- Recherche de mots-clés : si le nom d’un métier apparaît dans tes réponses, il est proposé
- Scores fixes pour les autres métiers
