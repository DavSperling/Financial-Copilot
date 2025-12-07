# Guide de vérification Supabase

## 1. Vérifier que les utilisateurs sont bien créés

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Dans le menu de gauche : **Authentication** → **Users**
4. Vous devriez voir les comptes créés lors des tests :
   - test.user12345@gmail.com
   - portfolio.test@gmail.com

## 2. Vérifier que les assets sont bien enregistrés

1. Dans le menu de gauche : **Table Editor**
2. Cliquez sur la table **assets**
3. Vous devriez voir l'asset AAPL (Apple Inc.) avec :
   - symbol: AAPL
   - name: Apple Inc.
   - amount: 10
   - price: 150
   - user_id: (l'ID de l'utilisateur portfolio.test@gmail.com)

## 3. Désactiver la confirmation d'email

1. **Authentication** → **Providers** → **Email**
2. Décochez **"Confirm email"**
3. Cliquez sur **"Save"**

## 4. Tester la connexion

Après avoir désactivé la confirmation d'email :

1. Allez sur http://localhost:3000/
2. Cliquez sur "Log In"
3. Connectez-vous avec :
   - Email: portfolio.test@gmail.com
   - Password: password123
4. Vous devriez voir l'asset AAPL dans le dashboard !

---

## Ce qui est DÉJÀ fait automatiquement par Supabase

✅ Table `auth.users` - gère les comptes utilisateurs
✅ Authentification email/password
✅ Hashage sécurisé des mots de passe
✅ Gestion des sessions
✅ Tokens JWT

## Ce que VOUS avez créé

✅ Table `assets` - pour stocker les investissements
✅ Row Level Security - pour isoler les données par utilisateur
✅ Code d'authentification dans l'application

## Aucune autre table SQL n'est nécessaire ! 🎉
