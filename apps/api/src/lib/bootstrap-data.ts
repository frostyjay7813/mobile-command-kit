import type { IncidentDetail, IntegrationConnection, TenantPolicy } from "@mobile-command-kit/domain";
import { incidentDetailSchema, integrationConnectionSchema, tenantPolicySchema } from "@mobile-command-kit/domain";
import { z } from "zod";

export const scenarioPackSchema = z.object({
  id: z.string().min(1),
  incidents: z.array(incidentDetailSchema),
  integrations: z.array(integrationConnectionSchema),
  policies: z.array(tenantPolicySchema)
});

export type ScenarioPack = z.infer<typeof scenarioPackSchema>;

const retailV1Pack = scenarioPackSchema.parse({
  id: "retail_v1",
  incidents: [
    incidentDetailSchema.parse({
      id: "inc_01",
      title: "POS payment authorization spike",
      severity: "sev1",
      state: "active",
      commanderName: "Riley Chen",
      affectedServiceCount: 4,
      startedAt: "2026-05-11T16:40:00.000Z",
      pendingApprovalCount: 1,
      currentFocus:
        "Freeze new POS config changes, shift traffic to the backup acquirer, and push cashier guidance before the lunch rush expands the impact.",
      affectedServices: ["store-pos", "payment-gateway", "associate-handhelds", "receipts-service"],
      openApprovals: [
        {
          id: "apr_01",
          title: "Activate backup processor",
          status: "pending",
          requestedBy: "Mika Torres",
          approverRole: "platform_lead",
          rationale: "Card authorization failures are above 18% across 46 stores and self-checkout lanes are timing out."
        }
      ],
      actions: [
        {
          id: "act_rollback",
          label: "Activate backup processor",
          status: "pending_approval",
          requiresApproval: true,
          ownerRole: "platform_lead",
          description: "Route payment authorization traffic to the backup acquirer for impacted stores."
        },
        {
          id: "act_freeze",
          label: "Freeze POS config changes",
          status: "ready",
          requiresApproval: false,
          ownerRole: "incident_commander",
          description: "Pause new POS configuration and pricing pushes until payment stability returns."
        },
        {
          id: "act_assign",
          label: "Dispatch field support lead",
          status: "ready",
          requiresApproval: false,
          ownerRole: "incident_commander",
          description: "Assign field operations to coach store leaders and confirm fallback tender procedures."
        },
        {
          id: "act_update",
          label: "Send store manager brief",
          status: "ready",
          requiresApproval: false,
          ownerRole: "stakeholder",
          description: "Push a concise operations update to store managers, district leaders, and customer support."
        }
      ],
      timeline: [
        {
          id: "evt_01",
          happenedAt: "2026-05-11T16:40:00.000Z",
          actorName: "PagerDuty",
          kind: "detection",
          summary: "Authorization failures crossed the Sev1 threshold for card-present payments in the central region."
        },
        {
          id: "evt_02",
          happenedAt: "2026-05-11T16:43:00.000Z",
          actorName: "Riley Chen",
          kind: "assignment",
          summary: "Claimed incident commander role and assigned the payment operations lead plus field support coverage."
        },
        {
          id: "evt_03",
          happenedAt: "2026-05-11T16:47:00.000Z",
          actorName: "Mika Torres",
          kind: "approval",
          summary: "Requested backup processor activation with a recommendation to freeze POS config changes."
        }
      ]
    }),
    incidentDetailSchema.parse({
      id: "inc_02",
      title: "Curbside pickup queue delay",
      severity: "sev3",
      state: "monitoring",
      commanderName: "Samira Patel",
      affectedServiceCount: 2,
      startedAt: "2026-05-11T14:12:00.000Z",
      pendingApprovalCount: 0,
      currentFocus: "Watch order routing recover and keep customer ETA messaging ahead of the backlog.",
      affectedServices: ["order-routing", "pickup-eta-service"],
      openApprovals: [],
      actions: [
        {
          id: "act_scale_workers",
          label: "Open overflow picking wave",
          status: "executed",
          requiresApproval: false,
          ownerRole: "incident_commander",
          description: "Reassign associate labor to clear staged curbside orders before the evening rush."
        },
        {
          id: "act_partner_update",
          label: "Send customer ETA update",
          status: "ready",
          requiresApproval: false,
          ownerRole: "stakeholder",
          description: "Update customer messaging with longer pickup windows while the backlog drains."
        }
      ],
      timeline: [
        {
          id: "evt_11",
          happenedAt: "2026-05-11T14:12:00.000Z",
          actorName: "Datadog",
          kind: "detection",
          summary: "Curbside order routing latency exceeded the monitoring threshold across two metro markets."
        },
        {
          id: "evt_12",
          happenedAt: "2026-05-11T14:20:00.000Z",
          actorName: "Samira Patel",
          kind: "action",
          summary: "Opened an overflow picking wave and paused low-priority inventory sync tasks."
        }
      ]
    })
  ],
  integrations: [
    integrationConnectionSchema.parse({
      id: "int_01",
      name: "PagerDuty",
      status: "connected",
      scopeSummary: "Regional incidents, district escalation, on-call coverage"
    }),
    integrationConnectionSchema.parse({
      id: "int_02",
      name: "Slack",
      status: "connected",
      scopeSummary: "Ops channels, store manager updates, field support rooms"
    }),
    integrationConnectionSchema.parse({
      id: "int_03",
      name: "GitHub",
      status: "connected",
      scopeSummary: "Feature flags, rollback approvals, release references"
    }),
    integrationConnectionSchema.parse({
      id: "int_04",
      name: "Jira",
      status: "needs_attention",
      scopeSummary: "Store follow-up tasks, vendor remediation"
    })
  ],
  policies: [
    tenantPolicySchema.parse({
      tenantId: "demo-tenant",
      rollbackRequiresDualApproval: true,
      deployFreezeRequiresCommander: true,
      stakeholderUpdateRole: "stakeholder",
      restrictedSeverities: ["sev1", "sev2"]
    })
  ]
});

export const scenarioPacksById: Record<string, ScenarioPack> = {
  [retailV1Pack.id]: retailV1Pack
};

export function getActiveScenarioId(): string | undefined {
  return process.env.SCENARIO_PACK_ID;
}

export function resolveScenarioPack(requestedId?: string): ScenarioPack {
  const resolved = requestedId ? scenarioPacksById[requestedId] : undefined;
  return scenarioPackSchema.parse(resolved ?? scenarioPacksById.retail_v1);
}

const defaultScenarioPack = resolveScenarioPack(getActiveScenarioId());

export const seedIncidents: IncidentDetail[] = defaultScenarioPack.incidents;
export const seedIntegrations: IntegrationConnection[] = defaultScenarioPack.integrations;
export const seedPolicies: TenantPolicy[] = defaultScenarioPack.policies;
