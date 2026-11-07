// Données initiales : étapes du pipeline, comptes démo et quelques données d'exemple.
// Idempotent : peut être relancé sans créer de doublons.
// Usage : npm run db:seed   (lit DATABASE_URL depuis .env)
import { PrismaClient, StageKind } from '@prisma/client';

const prisma = new PrismaClient();

const STAGES: { order: number; name: string; probability: number; kind: StageKind }[] = [
  { order: 1, name: 'Novo Lead', probability: 5, kind: 'OPEN' },
  { order: 2, name: 'Qualifié', probability: 15, kind: 'OPEN' },
  { order: 3, name: 'Visite / Demo', probability: 30, kind: 'OPEN' },
  { order: 4, name: 'Proposition Envoyée', probability: 50, kind: 'OPEN' },
  { order: 5, name: 'Négociation', probability: 70, kind: 'OPEN' },
  { order: 6, name: 'Ganho', probability: 100, kind: 'WON' },
  { order: 7, name: 'Perdu', probability: 0, kind: 'LOST' },
];

async function main() {
  for (const stage of STAGES) {
    await prisma.stage.upsert({
      where: { order: stage.order },
      update: { name: stage.name, probability: stage.probability, kind: stage.kind },
      create: stage,
    });
  }

  const commercial = await prisma.user.upsert({
    where: { email: 'commercial@demo.ch' },
    update: {},
    create: {
      email: 'commercial@demo.ch',
      name: 'Commercial Démo',
      role: 'commercial',
      quota: 150000,
    },
  });

  await prisma.user.upsert({
    where: { email: 'chefia@demo.ch' },
    update: {},
    create: {
      email: 'chefia@demo.ch',
      name: 'Chefia Démo',
      role: 'chefia',
      quota: 0,
    },
  });

  // Exemple : une entreprise, un contact et une opportunité, si la base est vide.
  const existing = await prisma.company.findFirst({ where: { ownerId: commercial.id } });
  if (!existing) {
    const stage = await prisma.stage.findUniqueOrThrow({ where: { order: 2 } });
    const company = await prisma.company.create({
      data: {
        name: 'Exemple Industries SA',
        city: 'Lausanne',
        canton: 'VD',
        industry: 'Industrie',
        ownerId: commercial.id,
        contacts: {
          create: {
            firstName: 'Marie',
            lastName: 'Dupont',
            email: 'marie.dupont@example.ch',
            jobTitle: 'Directrice achats',
            isDecisionMaker: true,
            ownerId: commercial.id,
          },
        },
      },
      include: { contacts: true },
    });
    await prisma.opportunity.create({
      data: {
        title: 'Renouvellement flotte',
        amount: 42000,
        stageId: stage.id,
        companyId: company.id,
        contactId: company.contacts[0]?.id,
        ownerId: commercial.id,
      },
    });
  }

  console.log(`Seed terminé : ${STAGES.length} étapes, 2 comptes démo.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
