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

### 5. Seed Initial (une seule fois)
- Vercel → Functions → `POST /api/seed` (crée stages pipeline + users demo)

## 🔐 Comptes Démo
Après le seed :
- **Commercial** : `commercial@demo.ch` (rôle: commercial)
- **Chefia** : `chefia@demo.ch` (rôle: chefia)

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

## 🛠️ Développement Local (optionnel)

```bash
# Installer dépendances
npm install

# Configurer variables d'environnement
cp .env.example .env
# Éditez .env avec vos valeurs

# Base de données
npm run db:generate
npm run db:push
npm run db:seed

# Développement
npm run dev
# → http://localhost:3000
```

## 📁 Structure du Projet

```
crm-mvp/
├── prisma/
│   ├── schema.prisma      # Modèles DB
│   └── seed.ts            # Données démo
├── public/
│   ├── manifest.json      # PWA manifest
│   └── icons/             # Icônes PWA (à générer)
├── src/
│   ├── app/
│   │   ├── (auth)/login/  # Page magic link
│   │   ├── (dashboard)/   # Pages protégées
│   │   │   ├── page.tsx           # Dashboard KPIs
│   │   │   ├── pipeline/page.tsx  # Kanban
│   │   │   ├── entreprises/       # CRUD entreprises
│   │   │   ├── opportunites/      # CRUD opportunités
│   │   │   └── taches/            # Liste tâches
│   │   └── api/           # Routes API (REST)
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   ├── kanban/        # KanbanColumn, DealCard
│   │   ├── dashboard/     # KPICards, PipelineChart, ActivityFeed
│   │   ├── forms/         # DealForm, ActivityModal
│   │   └── pwa/           # SyncStatus, InstallPWA
│   ├── hooks/             # useAuth, useOfflineSync, useSpeech
│   ├── lib/               # utils, prisma, auth, dexie, speech, validations
│   └── types/             # Types TypeScript
├── .env.example
├── .gitignore
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

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