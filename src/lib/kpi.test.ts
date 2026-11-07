import { describe, expect, it } from 'vitest';
import { computeKpis, type StageInfo } from './kpi';

const stages: StageInfo[] = [
  { id: 's1', name: 'Novo Lead', order: 1, kind: 'OPEN' },
  { id: 's2', name: 'Qualifié', order: 2, kind: 'OPEN' },
  { id: 's6', name: 'Ganho', order: 6, kind: 'WON' },
  { id: 's7', name: 'Perdu', order: 7, kind: 'LOST' },
];
const opp = (amount: number, stageId: string, probability: number, kind: StageInfo['kind']) => ({
  amount,
  stageId,
  stage: { ...stages.find((s) => s.id === stageId)!, probability, kind },
});

const base = {
  stages,
  companiesTotal: 0,
  companiesWithOpportunity: 0,
  activitiesLast7Days: 0,
  visits: [],
  quota: 0,
};

describe('computeKpis', () => {
  it('calcule pipeline ouvert, pondéré et par étape en ignorant les opportunités fermées', () => {
    const kpis = computeKpis({
      ...base,
      opportunities: [opp(10000, 's1', 5, 'OPEN'), opp(20000, 's2', 15, 'OPEN'), opp(99999, 's6', 100, 'WON')],
    });
    expect(kpis.openPipeline).toBe(30000);
    expect(kpis.weightedPipeline).toBeCloseTo(10000 * 0.05 + 20000 * 0.15);
    expect(kpis.pipelineByStage.find((s) => s.name === 'Qualifié')).toMatchObject({ amount: 20000, count: 1 });
  });

  it('calcule le win rate sur les affaires closes uniquement', () => {
    const kpis = computeKpis({
      ...base,
      opportunities: [opp(1, 's6', 100, 'WON'), opp(1, 's6', 100, 'WON'), opp(1, 's7', 0, 'LOST'), opp(1, 's1', 5, 'OPEN')],
    });
    expect(kpis.winRate).toBeCloseTo(2 / 3);
  });

  it('renvoie null plutôt que de diviser par zéro', () => {
    const kpis = computeKpis({ ...base, opportunities: [] });
    expect(kpis.winRate).toBeNull();
    expect(kpis.coverage).toBeNull();
    expect(kpis.leadToOpportunityRate).toBeNull();
    expect(kpis.sameDayVisitRate).toBeNull();
  });

  it('calcule le coverage ratio par rapport à l’objectif', () => {
    const kpis = computeKpis({ ...base, quota: 60000, opportunities: [opp(180000, 's1', 5, 'OPEN')] });
    expect(kpis.coverage).toBe(3);
  });

  it('calcule le taux de conversion entreprises → opportunité', () => {
    const kpis = computeKpis({ ...base, companiesTotal: 8, companiesWithOpportunity: 2, opportunities: [] });
    expect(kpis.leadToOpportunityRate).toBe(0.25);
  });

  it('mesure les visites saisies le jour même (jour de Zurich)', () => {
    const kpis = computeKpis({
      ...base,
      opportunities: [],
      visits: [
        // saisie le même jour à Zurich
        { occurredAt: new Date('2026-11-07T08:00:00Z'), createdAt: new Date('2026-11-07T15:00:00Z') },
        // saisie le lendemain
        { occurredAt: new Date('2026-11-06T08:00:00Z'), createdAt: new Date('2026-11-07T09:00:00Z') },
      ],
    });
    expect(kpis.sameDayVisitRate).toBe(0.5);
  });
});
