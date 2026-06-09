import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { AuditEvent, IncidentDetail, IntegrationConnection, IncidentSummary, TenantPolicy } from "@mobile-command-kit/domain";
import { auditEventSchema, incidentDetailSchema, integrationConnectionSchema, tenantPolicySchema } from "@mobile-command-kit/domain";
import { getActiveScenarioId, resolveScenarioPack, seedPolicies } from "./bootstrap-data.js";

type StoreShape = {
  incidents: IncidentDetail[];
  integrations: IntegrationConnection[];
  policies: TenantPolicy[];
  auditEvents: AuditEvent[];
};

const currentDir = dirname(fileURLToPath(import.meta.url));
const storePath = resolve(currentDir, "../../data/store.json");

function summarizeIncident(incident: IncidentDetail): IncidentSummary {
  const { id, title, severity, state, commanderName, affectedServiceCount, startedAt, pendingApprovalCount } = incident;
  return { id, title, severity, state, commanderName, affectedServiceCount, startedAt, pendingApprovalCount };
}

async function writeStore(data: StoreShape): Promise<void> {
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(data, null, 2), "utf8");
}

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as StoreShape;

    return {
      incidents: parsed.incidents.map((incident) => incidentDetailSchema.parse(incident)),
      integrations: parsed.integrations.map((integration) => integrationConnectionSchema.parse(integration)),
      policies: (parsed.policies ?? seedPolicies).map((policy) => tenantPolicySchema.parse(policy)),
      auditEvents: (parsed.auditEvents ?? []).map((event) => auditEventSchema.parse(event))
    };
  } catch {
    const pack = resolveScenarioPack(getActiveScenarioId());
    const seeded: StoreShape = {
      incidents: pack.seed.incidents,
      integrations: pack.seed.integrations,
      policies: pack.seed.policies,
      auditEvents: []
    };

    await writeStore(seeded);
    return seeded;
  }
}

export class IncidentStore {
  async listIncidents(): Promise<IncidentSummary[]> {
    const data = await readStore();
    return data.incidents.map(summarizeIncident);
  }

  async getIncidentById(incidentId: string): Promise<IncidentDetail | undefined> {
    const data = await readStore();
    return data.incidents.find((incident) => incident.id === incidentId);
  }

  async listIntegrations(): Promise<IntegrationConnection[]> {
    const data = await readStore();
    return data.integrations;
  }

  async listAuditEvents(incidentId?: string): Promise<AuditEvent[]> {
    const data = await readStore();
    return incidentId ? data.auditEvents.filter((event) => event.incidentId === incidentId) : data.auditEvents;
  }

  async getPolicy(tenantId: string): Promise<TenantPolicy | undefined> {
    const data = await readStore();
    return data.policies.find((policy) => policy.tenantId === tenantId);
  }

  async upsertPolicy(policy: TenantPolicy): Promise<TenantPolicy> {
    const data = await readStore();
    const index = data.policies.findIndex((currentPolicy) => currentPolicy.tenantId === policy.tenantId);
    const parsedPolicy = tenantPolicySchema.parse(policy);

    if (index === -1) {
      data.policies.push(parsedPolicy);
    } else {
      data.policies[index] = parsedPolicy;
    }

    await writeStore(data);
    return parsedPolicy;
  }

  async updateIncident(
    incidentId: string,
    updater: (incident: IncidentDetail) => IncidentDetail
  ): Promise<IncidentDetail | undefined> {
    const data = await readStore();
    const index = data.incidents.findIndex((incident) => incident.id === incidentId);

    if (index === -1) {
      return undefined;
    }

    const currentIncident = data.incidents[index];

    if (!currentIncident) {
      return undefined;
    }

    const updatedIncident = incidentDetailSchema.parse(updater(currentIncident));
    data.incidents[index] = updatedIncident;
    await writeStore(data);
    return updatedIncident;
  }

  async appendAuditEvent(event: AuditEvent): Promise<void> {
    const data = await readStore();
    data.auditEvents.unshift(auditEventSchema.parse(event));
    await writeStore(data);
  }
}
