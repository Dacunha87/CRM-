// Schémas de validation partagés entre formulaires, routes API et mode hors ligne.
import { z } from 'zod';

// Les formulaires HTML envoient '' pour un champ vide : on le traite comme absent.
const emptyToUndefined = (value: unknown) => (value === '' || value === null ? undefined : value);

const optionalText = (max: number) => z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());
const optionalEmail = z.preprocess(emptyToUndefined, z.string().trim().email().max(200).optional());
const optionalUrl = z.preprocess(emptyToUndefined, z.string().trim().url().max(300).optional());
const id = z.string().min(1).max(64);
const optionalId = z.preprocess(emptyToUndefined, id.optional());
const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());

export const companyInput = z.object({
  name: z.string().trim().min(1, 'Nom requis').max(200),
  city: optionalText(120),
  canton: z.preprocess(emptyToUndefined, z.string().trim().toUpperCase().length(2).optional()),
  industry: optionalText(120),
  website: optionalUrl,
  phone: optionalText(40),
  address: optionalText(300),
  notes: optionalText(5000),
});
export const companyUpdate = companyInput.partial();

export const contactInput = z.object({
  firstName: z.string().trim().min(1, 'Prénom requis').max(100),
  lastName: z.string().trim().min(1, 'Nom requis').max(100),
  email: optionalEmail,
  phone: optionalText(40),
  jobTitle: optionalText(120),
  isDecisionMaker: z.boolean().default(false),
  companyId: id,
});

export const OPPORTUNITY_MAX_AMOUNT = 100_000_000;

export const opportunityInput = z.object({
  title: z.string().trim().min(1, 'Titre requis').max(200),
  amount: z.coerce.number().min(0).max(OPPORTUNITY_MAX_AMOUNT).default(0),
  expectedCloseDate: optionalDate,
  stageId: id,
  companyId: id,
  contactId: optionalId,
});

export const opportunityUpdate = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  amount: z.coerce.number().min(0).max(OPPORTUNITY_MAX_AMOUNT).optional(),
  expectedCloseDate: optionalDate,
  stageId: id.optional(),
  // Obligatoire quand l'étape cible est « Perdu » (motif de perte, cf. README).
  lostReason: optionalText(500),
});

export const taskInput = z.object({
  title: z.string().trim().min(1, 'Titre requis').max(200),
  dueAt: z.coerce.date(),
  companyId: optionalId,
  opportunityId: optionalId,
});

export const taskUpdate = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  dueAt: z.coerce.date().optional(),
  done: z.boolean().optional(),
});

export const ACTIVITY_TYPES = ['VISITE', 'APPEL', 'EMAIL', 'NOTE'] as const;
export const PHOTO_MAX_CHARS = 550_000; // ~400 Ko de JPEG encodé en base64

export const activityInput = z.object({
  // Généré côté client : permet de rejouer un envoi hors ligne sans créer de doublon.
  id: z.string().uuid().optional(),
  type: z.enum(ACTIVITY_TYPES),
  summary: z.string().trim().min(1, 'Résumé requis').max(5000),
  occurredAt: z.coerce.date(),
  durationMin: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).max(1440).optional()),
  latitude: z.preprocess(emptyToUndefined, z.coerce.number().min(-90).max(90).optional()),
  longitude: z.preprocess(emptyToUndefined, z.coerce.number().min(-180).max(180).optional()),
  photo: z.preprocess(
    emptyToUndefined,
    z.string().startsWith('data:image/').max(PHOTO_MAX_CHARS, 'Photo trop lourde').optional(),
  ),
  companyId: id,
  contactId: optionalId,
  opportunityId: optionalId,
});

export type CompanyInput = z.infer<typeof companyInput>;
export type ContactInput = z.infer<typeof contactInput>;
export type OpportunityInput = z.infer<typeof opportunityInput>;
export type TaskInput = z.infer<typeof taskInput>;
export type ActivityInput = z.infer<typeof activityInput>;
