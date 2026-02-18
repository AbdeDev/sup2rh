# Configurer Resend (gratuit) pour les magic links Supabase

Resend offre **3 000 emails/mois gratuits**. **Aucun nom de domaine requis** : tu peux utiliser l’adresse fournie par Resend (`onboarding@resend.dev`) sans rien acheter ni configurer.

## 1. Créer un compte Resend

1. Va sur [resend.com](https://resend.com) → **Sign up** (gratuit).
2. Une fois connecté : **API Keys** → **Create API Key** → donne un nom (ex. `Sup2RH`) → copie la clé (elle ne s’affiche qu’une fois).

## 2. Configurer Supabase

1. Ouvre ton projet Supabase → **Authentication** → **Providers** → **Email** (ou **Project Settings** → **Auth** → **SMTP**).
2. Active **Custom SMTP** et remplis :

   | Champ            | Valeur                                                               |
   | ---------------- | -------------------------------------------------------------------- |
   | **Sender email** | `onboarding@resend.dev` (aucun domaine à acheter, fourni par Resend) |
   | **Sender name**  | `Sup2RH` (ou ce que tu veux)                                         |
   | **Host**         | `smtp.resend.com`                                                    |
   | **Port**         | `465`                                                                |
   | **Username**     | `resend`                                                             |
   | **Password**     | Ta **API Key** Resend (coller la clé copiée à l’étape 1)             |

3. **Minimum time between emails** : mets `0` (ou 10) si tu ne veux pas de blocage.
4. **Save**.

## 3. Tester

- Sur ton app : entre ton email → **Envoyer le lien magique**.
- Avec `onboarding@resend.dev`, le mail part bien ; vérifie les spams la première fois.
- Les mails envoyés apparaissent dans Resend → **Emails** (pour le debug).

Tu n’as pas besoin d’acheter un domaine. Si un jour tu en as un, tu pourras l’ajouter dans Resend (Domains) et utiliser une adresse du type `noreply@tondomaine.com`.

C’est tout. Aucun code à modifier dans le projet.
