export type ScenarioSeed = {
  incidents: unknown[];
  integrations: unknown[];
  policies: unknown[];
  auditEvents: unknown[];
};

export type ScenarioPack = {
  id: string;
  label: string;
  description: string;
  seed: ScenarioSeed;
};

const defaultSeed: ScenarioSeed = {
  incidents: [],
  integrations: [],
  policies: [],
  auditEvents: []
};

const scenarioPacks: ScenarioPack[] = [
  {
    id: "retail_v1",
    label: "Retail baseline",
    description: "Default retail operations scenario with baseline incidents and integrations.",
    seed: defaultSeed
  },
  {
    id: "retail_peak",
    label: "Retail peak traffic",
    description: "Higher volume retail variant used for peak-hour simulation.",
    seed: defaultSeed
  }
];

export function getScenarioPackById(scenarioId?: string): ScenarioPack {
  if (!scenarioId) {
    return scenarioPacks[0]!;
  }

  return scenarioPacks.find((pack) => pack.id === scenarioId) ?? scenarioPacks[0]!;
}

export function getActiveScenario(scenarioId?: string): Pick<ScenarioPack, "id" | "label" | "description"> {
  const { id, label, description } = getScenarioPackById(scenarioId);
  return { id, label, description };
}

export function getStoreFallbackSeed(scenarioId?: string): ScenarioSeed {
  return getScenarioPackById(scenarioId).seed;
}

