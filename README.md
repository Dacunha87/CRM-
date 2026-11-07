# CRM Ventes - MVP

CRM mobile-first pour commerciaux terrain en Suisse romande. Développé avec Next.js 14, PostgreSQL (Neon), Prisma, NextAuth, et déployable sur Vercel + GitHub sans installation locale.

## 🚀 Stack Technique

| Couche | Technologie |
|--------|-------------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| **UI** | shadcn/ui (Radix UI), dnd-kit (Kanban), Recharts |
| **Backend/DB** | PostgreSQL via Neon (serverless), Prisma ORM |
| **Auth** | NextAuth v5 (Email magic link, pas de mot de passe) |
| **Offline** | Dexie.js (IndexedDB), Service Worker (Workbox) |
| **Deploy** | GitHub → Vercel (preview + production) |
| **Domaine** | Vercel + domaine personnalisé (~CHF 15/an) |

## ✨ Fonctionnalités MVP

- **Entreprises & Contacts** : CRUD complet, recherche, filtres
- **Pipeline Kanban** : 7 étapes (Novo Lead → Ganho/Perdu), drag-and-drop, valeurs CHF par colonne
- **Activités rapides** : Modal mobile-first (<30s), voice-to-text, offline-first, GPS, photos
- **Tâches / Rappels** : Créées depuis activité ou manuelles, notifications navigateur
- **Dashboard KPIs** : Pipeline value par étape, taux conversion, activités semaine, coverage ratio, win rate
- **Auth** : Magic link email, 2 rôles (commercial/chefia), session 30 jours
- **PWA** : Installable, offline-first, sync auto au retour en ligne

## 📋 Pipeline de Ventes (7 Étapes)

| Ordre | Étape | Prob. | Critères Entrée | Critères Sortie |
|-------|-------|-------|-----------------|-----------------|
| 1 | Novo Lead | 5% | Lead créé + entreprise/contact | BANT validé (budget, autorité, besoin, timeline ≤6m) |
| 2 | Qualifié | 15% | BANT validé + commercial accepte | Visite/démo agendée avec décideur |
| 3 | Visite / Demo | 30% | Réunion réalisée avec décideur | Besoins détaillés + budget aligné + proposition demandée |
| 4 | Proposition Envoyée | 50% | PDF envoyé au décideur | Feedback reçu (accepte/ajustements/refuse) |
| 5 | Négociation | 70% | Ajustements demandés ou approbation interne | Accord verbal/écrit + date clôture confirmée |
| 6 | **Ganho** | 100% | Contrat signé / PO / facture | — |
| 7 | **Perdu** | 0% | Refus / silence >30j / annulé | Motif perte obligatoire |

## 🏃‍♂️ Déploiement Rapide (sans installation locale)

### 1. Créer le repo GitHub
- Allez sur github.com/new → nom `crm-mvp` → Private → Create repository
- Dans le repo vide : "uploading an existing file" → glissez **tous les fichiers** de ce projet

### 2. Base de données PostgreSQL (Neon)
- Allez sur neon.tech → Sign up avec GitHub → Create project
- Copiez la `DATABASE_URL` (format: `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`)
- Depuis votre ordinateur, créez les tables et les données initiales (une seule fois) :
```bash
DATABASE_URL="postgresql://..." npm run db:push
DATABASE_URL="postgresql://..." npm run db:seed
```

### 3. Déploiement Vercel
- Allez sur vercel.com → Import Project → Sélectionnez `crm-mvp`
- Ajoutez les variables d'environnement :
```
DATABASE_URL=postgresql://... (de Neon)
NEXTAUTH_SECRET=openssl rand -base64 32 (générez en ligne)
NEXTAUTH_URL=https://crm-mvp.vercel.app
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=votre-email@gmail.com
EMAIL_SERVER_PASSWORD=mot-de-passe-application
EMAIL_FROM=CRM <votre-email@gmail.com>
```
- Deploy → attendez le build → URL `https://crm-mvp.vercel.app`

### 4. Domaine Propre (optionnel)
- Vercel → Project → Domains → Add → pointez CNAME vers `cname.vercel-dns.com`

### 5. Données initiales
- Le seed (`npm run db:seed`, étape 2) crée les 7 étapes du pipeline et les comptes démo.
- Il n'existe volontairement pas de route publique de seed : elle serait déclenchable par n'importe qui en production.
- Pour ajouter un utilisateur réel, insérez-le dans la table `User` (email, nom, rôle `commercial` ou `chefia`). Seuls les comptes existants reçoivent un lien de connexion.

## 🔐 Comptes Démo
Après le seed :
- **Commercial** : `commercial@demo.ch` (rôle: commercial, ne voit que ses données)
- **Chefia** : `chefia@demo.ch` (rôle: chefia, voit toutes les données)

En développement sans SMTP configuré, le lien de connexion est affiché dans le terminal (`[auth] Lien de connexion pour …`). En production, `EMAIL_SERVER_HOST` est obligatoire.

## 📱 Utilisation Mobile (PWA)
1. Ouvrez l'URL sur iPhone/Android
2. Safari/Chrome → Partager → "Sur l'écran d'accueil"
3. L'icône apparaît → ouvre en plein écran, fonctionne hors ligne

## 🔄 Sync Offline
- Enregistrez visites/appels sans réseau (chantier, tunnel, etc.)
- Données stockées localement (IndexedDB via Dexie.js)
- Sync automatique au retour en ligne (WiFi/4G)
- Conflits résolus côté client (last-write-wins)

## 📊 KPIs Suivis
- Pipeline total / pondéré par étape
- Taux conversion lead→opportunité (cible: 25% à 3 mois)
- Temps follow-up post-visite (cible: <4h)
- % visites enregistrées jour même (cible: 90%)
- Coverage ratio pipeline/quota (cible: 3x)
- Win rate (cible: 30%)

## 🛠️ Développement Local

```bash
# Installer dépendances (le lockfile est versionné)
npm install

# Configurer variables d'environnement
cp .env.example .env
# Éditez .env avec vos valeurs (DATABASE_URL pointant vers une base de test)

# Base de données
npm run db:push     # crée les tables
npm run db:seed     # étapes du pipeline + comptes démo

# Développement
npm run dev         # → http://localhost:3000
```

Autres commandes : `npm run typecheck`, `npm run lint`, `npm test` (tests unitaires : fuseau horaire, formatage, KPIs).

## 📁 Structure du Projet

```
prisma/
├── schema.prisma        # Modèles de données
└── seed.ts              # Étapes du pipeline et données démo
public/
├── manifest.json        # Manifest PWA
├── sw.js                # Service worker (cache de l'application, page hors ligne)
├── offline.html
└── icons/               # Icônes PWA
src/
├── auth.ts              # NextAuth v5 : lien magique, accès sur invitation
├── app/
│   ├── (auth)/login/    # Connexion et page « vérifiez vos e-mails »
│   ├── (dashboard)/     # Pages protégées : accueil (KPIs), pipeline, entreprises,
│   │                    # opportunités, tâches
│   └── api/             # API REST : companies, contacts, opportunities, tasks, activities
├── components/          # Interface (ui/), Kanban, formulaires, activité, PWA
├── hooks/               # useOnline, useSpeech (dictée vocale)
└── lib/
    ├── access.ts        # Vérifications de périmètre des ressources liées
    ├── kpi.ts           # Calcul des KPIs (fonctions pures)
    ├── offline/         # IndexedDB (Dexie) et synchronisation
    ├── scope.ts         # Règles commercial / chefia
    ├── time.ts          # Fuseau Europe/Zurich
    └── validations.ts   # Schémas Zod partagés (formulaires, API, hors ligne)
```

## 📴 Périmètre du mode hors ligne

- **Hors ligne** : création d'une activité (visite, appel, e-mail, note), avec dictée, photo et position. Elle est stockée sur l'appareil puis envoyée automatiquement au retour du réseau. L'envoi est idempotent (identifiant UUID généré sur l'appareil).
- **En ligne uniquement** : création et modification des entreprises, contacts, opportunités et tâches.
- **Conflits** : pas de modification hors ligne d'une fiche existante, donc pas de conflit à résoudre pour le MVP.
- **Listes de choix** : entreprises et opportunités sont mises en cache à chaque connexion au réseau.

## 💰 Coûts Annuels Estimés

| Poste | Coût |
|-------|------|
| Domaine (.ch/.com) | ~CHF 15-20/an |
| Vercel Pro (optionnel) | CHF 0 (gratuit suffisant) |
| Neon Postgres | CHF 0 (gratuit jusqu'à 0.5 GB) |
| Email (Gmail/SendGrid) | CHF 0-20/an |
| **Total** | **~CHF 20-50/an** |

*vs HubSpot/Pipedrive/Zoho: CHF 1'200-2'400/an pour 1 user*

## 🎯 Différenciateur Clé
**Enregistrement visite <30s offline-first + voice-to-text** — n'existe pas dans les CRM SaaS actuels. C'est le facteur d'adoption #1 pour le terrain.

## 📞 Support / Itérations
- Feedback hebdo via formulaire 5 questions (Typeform/Google Forms)
- Corrections top 3 bugs + 1 feature demandée par sprint
- Critère Go/No-go après 2 semaines: ≥80% visites enregistrées jour même, 0 bloquants critiques

## 📄 Licence
Projet privé - usage interne uniquement.