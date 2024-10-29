###CE Bâtiment - Gestion des Plans d'Aide à l'Habitat
🏠 Aperçu
Application web pour la gestion des plans d'aide à l'habitat, permettant aux agents de créer, suivre et gérer des dossiers d'aide à la rénovation et à l'amélioration de l'habitat.
✨ Fonctionnalités
🔐 Authentification & Gestion des Utilisateurs

Connexion sécurisée avec JWT
Gestion des rôles (Admin/Agent)
Gestion des profils utilisateurs

📋 Gestion des Plans d'Aide

Création de nouveaux plans d'aide
Suivi des dossiers en cours
Génération de PDF
Historique des modifications

👥 Administration

Gestion des utilisateurs
Tableau de bord administrateur
Statistiques et rapports
Configuration du système

🛠 Technologies Utilisées
Frontend

Next.js 13 (App Router)
React 18
Chakra UI
TypeScript
JWT pour l'authentification

Backend

API Routes Next.js
MongoDB avec Mongoose
JWT pour la sécurité
bcrypt pour le hachage des mots de passe

🚀 Installation

Cloner le repository

bashCopygit clone https://github.com/votre-repo/ce-batiment.git
cd ce-batiment

Installer les dépendances

bashCopynpm install

Configuration des variables d'environnement
Créer un fichier .env.local à la racine du projet :

envCopyMONGODB_URI=votre_uri_mongodb
JWT_SECRET=votre_secret_jwt
NEXT_PUBLIC_JWT_SECRET=votre_secret_jwt

Lancer le serveur de développement

bashCopynpm run dev
L'application sera accessible à l'adresse http://localhost:3000
📁 Structure du Projet
Copyce-batiment/
├── app/                    # Pages et routes de l'application
│   ├── api/               # Routes API
│   ├── auth/             # Pages d'authentification
│   ├── dashboard/        # Pages du tableau de bord
│   └── users/           # Gestion des utilisateurs
├── components/           # Composants React réutilisables
├── lib/                  # Utilitaires et configurations
├── models/              # Modèles Mongoose
├── public/              # Assets statiques
└── styles/              # Styles globaux
🔧 Configuration
Base de données

MongoDB Atlas ou MongoDB local
Configuration via les variables d'environnement

Sécurité

JWT pour l'authentification
Bcrypt pour le hachage des mots de passe
Protection CSRF
Validation des données

👥 Utilisateurs par Défaut
Deux comptes sont créés par défaut pour le développement :

Admin

Email: admin@admin.com
Mot de passe: admin1234


Agent

Email: user@user.com
Mot de passe: user1234



📝 API Endpoints
Authentification

POST /api/user (login)
POST /api/user (register)
GET /api/user (refresh token)

Gestion des Utilisateurs

GET /api/user (liste des utilisateurs)
PUT /api/user (mise à jour utilisateur)
DELETE /api/user (suppression utilisateur)

Plans d'Aide

GET /api/pda (liste des plans)
POST /api/pda (création)
PUT /api/pda/[id] (mise à jour)
DELETE /api/pda/[id] (suppression)

🔐 Sécurité

Authentification JWT
Hachage des mots de passe avec bcrypt
Validation des données entrantes
Protection CSRF
Sessions sécurisées
Gestion des rôles et permissions

📚 Guide de Contribution

Fork le projet
Créer une branche pour votre fonctionnalité
Commiter vos changements
Pousser vers la branche
Ouvrir une Pull Request

🐛 Signalement de Bugs
Veuillez signaler les bugs via l'onglet Issues de GitHub en incluant :

Description du bug
Étapes pour reproduire
Comportement attendu
Screenshots (si pertinent)

📄 Licence
Ce projet est sous licence MIT
👤 Contact
Pour toute question ou support :

Email: contact@votre-email.com
GitHub: votre-profil

🙏 Remerciements

Chakra UI pour les composants
Next.js team
MongoDB
Tous les contributeurs


Développé avec ❤️ par l'équipe CE Bâtiment