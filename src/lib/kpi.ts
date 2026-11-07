// Calcul des KPIs du tableau de bord. Fonctions pures : testables sans base de données.
import { zurichDayKey } from './time';

export type StageInfo = { id: string; name: string; order: number; kind: 'OPEN' | 'WON' | 'LOST' };

export type KpiOpportunity = {
  amount: number;
  stageId: string;
  stage: StageInfo & { probability: number };
};

export type KpiInput = {
  stages: StageInfo[];
  opportunities: KpiOpportunity[];
  companiesTotal: number;
  companiesWithOpportunity: number;
  activitiesLast7Days: number;
  // Visites des 30 derniers jours, pour le taux d'enregistrement le jour même.
  visits: { occurredAt: Date; createdAt: Date }[];
  quota: number; // objectif CHF (somme pour la chefia)
};

export type Kpis = {
  openPipeline: number;
  weightedPipeline: number;
  pipelineByStage: { stageId: string; name: string; amount: number; count: number }[];
  winRate: number | null; // gagnées / (gagnées + perdues)
  leadToOpportunityRate: number | null; // entreprises avec opportunité / entreprises
  activitiesLast7Days: number;
  sameDayVisitRate: number | null; // visites saisies le jour même / visites
  coverage: number | null; // pipeline ouvert / objectif
};

const ratio = (part: number, whole: number): number | null => (whole > 0 ? part / whole : null);

const sameDay = (a: Date, b: Date) => zurichDayKey(a) === zurichDayKey(b);

export function computeKpis(input: KpiInput): Kpis {
  const open = input.opportunities.filter((o) => o.stage.kind === 'OPEN');
  const won = input.opportunities.filter((o) => o.stage.kind === 'WON').length;
  const lost = input.opportunities.filter((o) => o.stage.kind === 'LOST').length;

  const openPipeline = open.reduce((sum, o) => sum + o.amount, 0);
  const weightedPipeline = open.reduce((sum, o) => sum + (o.amount * o.stage.probability) / 100, 0);

  const pipelineByStage = [...input.stages]
    .sort((a, b) => a.order - b.order)
    .map((stage) => {
      const inStage = input.opportunities.filter((o) => o.stageId === stage.id);
      return {
        stageId: stage.id,
        name: stage.name,
        amount: inStage.reduce((sum, o) => sum + o.amount, 0),
        count: inStage.length,
      };
    });

  const visitsSameDay = input.visits.filter((v) => sameDay(v.occurredAt, v.createdAt)).length;

  return {
    openPipeline,
    weightedPipeline,
    pipelineByStage,
    winRate: ratio(won, won + lost),
    leadToOpportunityRate: ratio(input.companiesWithOpportunity, input.companiesTotal),
    activitiesLast7Days: input.activitiesLast7Days,
    sameDayVisitRate: ratio(visitsSameDay, input.visits.length),
    coverage: input.quota > 0 ? openPipeline / input.quota : null,
  };
}
