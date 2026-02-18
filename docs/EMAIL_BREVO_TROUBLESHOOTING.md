# Brevo + Supabase : erreur 500 "Error sending magic link email"

## Points critiques Brevo

### 1. **Clé SMTP ≠ API Key**

Le champ **Password** dans Supabase doit être ta **clé SMTP**, pas l’API key ni ton mot de passe Brevo.

- Va sur [Brevo → SMTP](https://app.brevo.com/settings/keys/smtp)
- Copie le **SMTP login** (email) et la **clé SMTP** (Master password)
- Dans Supabase : **Username** = SMTP login, **Password** = clé SMTP

### 2. **Domaine vérifié requis**

Brevo exige qu’un domaine soit vérifié. Depuis février 2024, sans domaine vérifié, l’envoi peut être refusé.

- Brevo → **Senders** : crée un expéditeur avec une adresse du type `noreply@tondomaine.com`
- Brevo → **Domains** : ajoute et vérifie ton domaine (enregistrements DNS)

**Sans domaine** : Brevo ne fonctionnera probablement pas. Passe par **Ethereal** pour tester.

### 3. **Paramètres SMTP exacts**

| Champ Supabase   | Valeur Brevo                                             |
| ---------------- | -------------------------------------------------------- |
| **Host**         | `smtp-relay.brevo.com`                                   |
| **Port**         | `587` (ou 465, 2525)                                     |
| **Username**     | Ton SMTP login (email depuis Brevo SMTP)                 |
| **Password**     | La clé SMTP (Master password depuis Brevo SMTP)          |
| **Sender email** | Une adresse créée dans Brevo → Senders (domaine vérifié) |

### 4. **Vérifier dans Brevo**

- **Transactional → Logs** : l’envoi apparaît-il ? Si oui, le problème vient de Supabase. Si non, Supabase n’atteint pas Brevo.
- **Domains** : le domaine de l’expéditeur est-il vérifié (vert) ?

---

## Solution sans domaine : Ethereal

[ethereal.email/create](https://ethereal.email/create) → tu obtiens immédiatement des identifiants SMTP de test. Aucun domaine requis.

| Champ Supabase   | Valeur Ethereal             |
| ---------------- | --------------------------- |
| **Host**         | `smtp.ethereal.email`       |
| **Port**         | `587`                       |
| **Username**     | fourni par Ethereal         |
| **Password**     | fourni par Ethereal         |
| **Sender email** | l’email fourni par Ethereal |

Les emails n’arrivent pas dans une vraie boîte : tu les visualises dans l’interface Ethereal. Adapté au dev.
