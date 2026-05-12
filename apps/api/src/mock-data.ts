import type {
  ActorSession,
  ApprovalDecisionRequest,
  AuditEvent,
  CommandExecutionRequest,
  CommandExecutionResult,
  IncidentDetail,
  IncidentSummary,
  IntegrationConnection,
  IntegrationProvider,
  TenantPolicy
} from "@mobile-command-kit/domain";
import { auditEventSchema } from "@mobile-command-kit/domain";
import { dispatchIntegrationAction } from "./lib/adapters.js";
import { evaluateActionPolicy } from "./lib/policy.js";
import { IncidentStore } from "./lib/store.js";

const store = new IncidentStore();

const providerByActionId: Record<string, IntegrationProvider> = {
  act_rollback: "github",
  act_freeze: "pagerduty",
  act_assign: "pagerduty",
  act_update: "slack",
  act_scale_workers: "pagerduty",
  act_partner_update: "jira"
};

function makeAuditEvent(params: {
  incidentId: string;
  actionId: string | null;
  actor: ActorSession;
  outcome: AuditEvent["outcome"];
  summary: string;
}): AuditEvent {
  return auditEventSchema.parse({
    id: `aud_${Date.now()}`,
    incidentId: params.incidentId,
    actionId: params.actionId,
    tenantId: params.actor.tenantId,
    actorName: params.actor.actorName,
    actorRole: params.actor.actorRole,
    outcome: params.outcome,
    summary: params.summary,
    happenedAt: new Date().toISOString()
  });
}

export async function listIncidents(): Promise<IncidentSummary[]> {
  return store.listIncidents();
}

export async function getIncidentById(incidentId: string): Promise<IncidentDetail | undefined> {
  return store.getIncidentById(incidentId);
}

export async function listIntegrations(): Promise<IntegrationConnection[]> {
  return store.listIntegrations();
}

export async function listAuditEvents(incidentId?: string): Promise<AuditEvent[]> {
  return store.listAuditEvents(incidentId);
}

export async function getTenantPolicy(tenantId: string): Promise<TenantPolicy | undefined> {
  return store.getPolicy(tenantId);
}

export async function saveTenantPolicy(policy: TenantPolicy): Promise<TenantPolicy> {
  return store.upsertPolicy(policy);
}

export async function executeAction(
  incidentId: string,
  request: CommandExecutionRequest,
  actor: ActorSession
): Promise<CommandExecutionResult | undefined> {
  const incident = await store.getIncidentById(incidentId);

  if (!incident) {
    return undefined;
  }

  const action = incident.actions.find((item) => item.id === request.actionId);

  if (!action) {
    return undefined;
  }

  const policyResult = evaluateActionPolicy({
    incident,
    action,
    actor,
    policy: await store.getPolicy(actor.tenantId)
  });

  if (policyResult.outcome !== "executed") {
    await store.appendAuditEvent(
      makeAuditEvent({
        incidentId,
        actionId: action.id,
        actor,
        outcome: policyResult.outcome,
        summary: policyResult.message
      })
    );

    return policyResult;
  }

  const provider = providerByActionId[action.id];

  if (!provider) {
    throw new Error(`Missing integration provider for action ${action.id}`);
  }

  const adapterResult = await dispatchIntegrationAction(provider, action.label);

  await store.updateIncident(incidentId, (currentIncident) => ({
    ...currentIncident,
    pendingApprovalCount:
      action.id === "act_rollback" ? Math.max(0, currentIncident.pendingApprovalCount - 1) : currentIncident.pendingApprovalCount,
    openApprovals:
      action.id === "act_rollback"
        ? currentIncident.openApprovals.map((approval) =>
            approval.title === "Production rollback" ? { ...approval, status: "approved" as const } : approval
          )
        : currentIncident.openApprovals,
    actions: currentIncident.actions.map((currentAction) =>
      currentAction.id === action.id ? { ...currentAction, status: "executed" as const } : currentAction
    ),
    timeline: [
      {
        id: `evt_${Date.now()}`,
        happenedAt: new Date().toISOString(),
        actorName: actor.actorName,
        kind: "action" as const,
        summary: `${action.label} sent to ${adapterResult.provider} as ${adapterResult.reference}.`
      },
      ...currentIncident.timeline
    ]
  }));

  const executedResult: CommandExecutionResult = {
    incidentId,
    actionId: action.id,
    outcome: "executed",
    message: `${action.label} was accepted and dispatched through ${adapterResult.provider}.`
  };

  await store.appendAuditEvent(
    makeAuditEvent({
      incidentId,
      actionId: action.id,
      actor,
      outcome: "executed",
      summary: executedResult.message
    })
  );

  return executedResult;
}

export async function resolveApproval(
  incidentId: string,
  request: ApprovalDecisionRequest,
  actor: ActorSession
): Promise<IncidentDetail | undefined> {
  const incident = await store.getIncidentById(incidentId);

  if (!incident) {
    return undefined;
  }

  const approval = incident.openApprovals.find((item) => item.id === request.approvalId);

  if (!approval || approval.approverRole !== actor.actorRole) {
    await store.appendAuditEvent(
      makeAuditEvent({
        incidentId,
        actionId: null,
        actor,
        outcome: "denied",
        summary: `Approval resolution denied for ${request.approvalId}.`
      })
    );

    return incident;
  }

  const updatedIncident = await store.updateIncident(incidentId, (currentIncident) => {
    const resolvedApprovals = currentIncident.openApprovals.map((item) =>
      item.id === request.approvalId
        ? {
            ...item,
            status: request.decision === "approve" ? ("approved" as const) : ("rejected" as const)
          }
        : item
    );

    const resolvedCount = resolvedApprovals.filter((item) => item.status === "pending").length;

    return {
      ...currentIncident,
      pendingApprovalCount: resolvedCount,
      openApprovals: resolvedApprovals,
      actions: currentIncident.actions.map((action) =>
        action.id === "act_rollback"
          ? {
              ...action,
              status: request.decision === "approve" ? ("ready" as const) : ("blocked" as const),
              requiresApproval: false
            }
          : action
      ),
      timeline: [
        {
          id: `evt_${Date.now()}`,
          happenedAt: new Date().toISOString(),
          actorName: actor.actorName,
          kind: "approval" as const,
          summary: `${request.decision === "approve" ? "Approved" : "Rejected"} ${approval.title}: ${request.note}`
        },
        ...currentIncident.timeline
      ]
    };
  });

  await store.appendAuditEvent(
    makeAuditEvent({
      incidentId,
      actionId: "act_rollback",
      actor,
      outcome: request.decision === "approve" ? "executed" : "blocked",
      summary: `${approval.title} was ${request.decision}d by ${actor.actorName}.`
    })
  );

  return updatedIncident;
}
