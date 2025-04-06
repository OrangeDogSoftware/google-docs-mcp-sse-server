# Serveur MCP SSE pour Google Docs

Ce serveur implémente un pattern Modèle-Canal-Présentation (MCP) avec Server-Sent Events (SSE) pour gérer les documents Google Docs.

## Fonctionnalités

- Authentification avec l'API Google Docs
- Création et modification de documents
- Notification en temps réel des changements via SSE
- Gestion des droits d'accès
- Historique des modifications

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/OrangeDogSoftware/google-docs-mcp-sse-server.git
cd google-docs-mcp-sse-server

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
```

## Configuration

1. Créez un projet dans la [Console Google Cloud](https://console.cloud.google.com/)
2. Activez l'API Google Docs
3. Créez des identifiants OAuth 2.0
4. Téléchargez le fichier JSON des identifiants et renommez-le en `credentials.json`

## Démarrage

```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## Architecture MCP

Le serveur suit l'architecture Modèle-Canal-Présentation :

- **Modèle** : Gestion des données des documents Google Docs
- **Canal** : Communication entre le modèle et la présentation via SSE
- **Présentation** : Interface avec les clients via l'API REST

## Endpoints API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/docs | Liste tous les documents |
| GET | /api/docs/:id | Récupère un document spécifique |
| POST | /api/docs | Crée un nouveau document |
| PUT | /api/docs/:id | Met à jour un document |
| DELETE | /api/docs/:id | Supprime un document |
| GET | /api/sse | Connexion SSE pour les notifications |

## Licence

MIT