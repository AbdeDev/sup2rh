# Tables BDD Sup2RH et RLS Supabase

## Tables gérées par le backend Symfony (Doctrine)

Le backend utilise PostgreSQL via Doctrine. Ces tables sont créées par les migrations :

- **quiz_sessions** : Une session de quiz par tentative d’un utilisateur. Créée uniquement quand l’utilisateur clique sur « Suivant » pour la première fois (pas au chargement de la page).
- **quiz_session_answers** : Réponses aux questions du quiz (lien session ↔ question ↔ réponse). **Indispensable** : sans elle, l’IA ne peut pas analyser ni recommander de fiche métier.
- **quizzes** : Parcours de quiz définis en admin (questions par fiche métier).
- **jobs** : Fiches métier RH.
- **contact_requests** : Demandes « Être contacté ».
- **feedbacks** : Avis utilisateurs (texte + note étoiles).
- **doctrine_migration_versions** : Suivi des migrations Doctrine.

### Rôle de `quiz_session_answers`

Cette table stocke **chaque réponse** d’un utilisateur à une question pendant une session de quiz :

| Colonne       | Rôle                                                    |
| ------------- | ------------------------------------------------------- |
| `id`          | Identifiant unique de la réponse                        |
| `session_id`  | Référence à `quiz_sessions` (quelle session)            |
| `question_id` | Identifiant de la question (ex : q1, q2)                |
| `answer_id`   | Réponse choisie (ex : a1 = pas d’accord, a5 = d’accord) |
| `text_value`  | Valeur texte optionnelle (pour réponses libres)         |
| `created_at`  | Date/heure de la réponse                                |

Sans elle, on ne pourrait pas savoir ce que l’utilisateur a répondu ni analyser son profil pour recommander un métier.

---

## RLS (Row Level Security) Supabase

Si tu utilises Supabase comme hébergement PostgreSQL, certaines tables peuvent être « unrestricted » (sans RLS ou avec des politiques trop permissives).

### Configurer RLS

1. Dans le dashboard Supabase : **Authentication** → **Policies**.
2. Pour chaque table sensible, active RLS et crée des politiques.

### Tables à sécuriser

| Table                         | Recommandation                                                            |
| ----------------------------- | ------------------------------------------------------------------------- |
| `quizzes`                     | Lire : tout le monde. Écrire : rôle `service_role` ou backend uniquement. |
| `trees`                       | Si utilisée : politique selon `user_id` ou rôle.                          |
| `messenger_message`           | Table Symfony Messenger : accès réservé au backend.                       |
| `doctrine_migration_versions` | Lecture seule pour le backend, aucune modification côté client.           |

### Exemple de politique RLS (PostgreSQL)

```sql
-- Exemple : quiz_sessions accessibles uniquement au propriétaire
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sessions"
  ON quiz_sessions FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own sessions"
  ON quiz_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);
```

**Attention** : le backend Symfony se connecte avec un utilisateur de service (pas `auth.uid()`). Si tu actives RLS sur des tables utilisées uniquement par le backend, crée une politique qui autorise le rôle `service_role` ou désactive RLS pour les connexions backend.

---

## Calendrier shadcn

Pour ajouter un calendrier shadcn dans l’admin (filtres par date) :

```bash
cd apps/web  # ou apps/admin si partagé
npx shadcn@latest add calendar
```

Puis installer les dépendances :

```bash
npm install react-day-picker date-fns
```

Utilisation pour un filtre par date :

```tsx
import { Calendar } from "@/components/ui/calendar";

const [dateFrom, setDateFrom] = useState<Date | undefined>();
// Filtrer les résultats par dateFrom...
```
