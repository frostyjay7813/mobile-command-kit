import type {
  ActionCommand,
  ActorSession,
  CommandExecutionResult,
  IncidentDetail,
  TenantPolicy
} from "@mobile-command-kit/domain";
import { commandExecutionResultSchema } from "@mobile-command-kit/domain";

export function evaluateActionPolicy(params: {
  incident: IncidentDetail;
  action: ActionCommand;
  actor: ActorSession;
  policy?: TenantPolicy;
}): CommandExecutionResult {
  const { action, actor, incident, policy } = params;

  if (action.ownerRole !== actor.actorRole) {
    return commandExecutionResultSchema.parse({
      incidentId: incident.id,
      actionId: action.id,
      outcome: "blocked",
      message: `${action.label} is reserved for the ${action.ownerRole.replaceAll("_", " ")} role.`
    });
  }

  if (action.status === "executed") {
    return commandExecutionResultSchema.parse({
      incidentId: incident.id,
      actionId: action.id,
      outcome: "blocked",
      message: `${action.label} has already been executed.`
    });
  }

  if (action.id === "act_freeze" && policy?.deployFreezeRequiresCommander && actor.actorRole !== "incident_commander") {
    return commandExecutionResultSchema.parse({
      incidentId: incident.id,
      actionId: action.id,
      outcome: "blocked",
      message: "Deploy freeze requires an incident commander under the current tenant policy."
    });
  }

  if (action.requiresApproval || action.status === "pending_approval") {
    return commandExecutionResultSchema.parse({
      incidentId: incident.id,
      actionId: action.id,
      outcome: "approval_required",
      message: `${action.label} still needs approval before execution.`
    });
  }

  return commandExecutionResultSchema.parse({
    incidentId: incident.id,
    actionId: action.id,
    outcome: "executed",
    message: `${action.label} passed policy checks and was recorded for execution.`
  });
}
