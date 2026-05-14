import { z } from "zod";

export const incidentSeveritySchema = z.enum(["sev1", "sev2", "sev3", "sev4"]);
export type IncidentSeverity = z.infer<typeof incidentSeveritySchema>;

export const incidentStateSchema = z.enum(["active", "monitoring", "resolved"]);
export type IncidentState = z.infer<typeof incidentStateSchema>;

export const actionStatusSchema = z.enum(["ready", "pending_approval", "blocked", "executed"]);
export type ActionStatus = z.infer<typeof actionStatusSchema>;

export const approvalStatusSchema = z.enum(["pending", "approved", "rejected"]);
export type ApprovalStatus = z.infer<typeof approvalStatusSchema>;

export const actorRoleSchema = z.enum(["incident_commander", "platform_lead", "responder", "stakeholder"]);
export type ActorRole = z.infer<typeof actorRoleSchema>;

export const integrationProviderSchema = z.enum(["pagerduty", "slack", "github", "jira"]);
export type IntegrationProvider = z.infer<typeof integrationProviderSchema>;

export const incidentSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: incidentSeveritySchema,
  state: incidentStateSchema,
  commanderName: z.string(),
  affectedServiceCount: z.number().int().nonnegative(),
  startedAt: z.string().datetime(),
  pendingApprovalCount: z.number().int().nonnegative()
});
export type IncidentSummary = z.infer<typeof incidentSummarySchema>;

export const timelineEventSchema = z.object({
  id: z.string(),
  happenedAt: z.string().datetime(),
  actorName: z.string(),
  kind: z.enum(["detection", "assignment", "approval", "communication", "action"]),
  summary: z.string()
});
export type TimelineEvent = z.infer<typeof timelineEventSchema>;

export const approvalRequestSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: approvalStatusSchema,
  requestedBy: z.string(),
  approverRole: actorRoleSchema,
  rationale: z.string()
});
export type ApprovalRequest = z.infer<typeof approvalRequestSchema>;

export const tenantPolicySchema = z.object({
  tenantId: z.string(),
  rollbackRequiresDualApproval: z.boolean(),
  deployFreezeRequiresCommander: z.boolean(),
  stakeholderUpdateRole: actorRoleSchema,
  restrictedSeverities: z.array(incidentSeveritySchema)
});
export type TenantPolicy = z.infer<typeof tenantPolicySchema>;

export const actionCommandSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: actionStatusSchema,
  requiresApproval: z.boolean(),
  ownerRole: actorRoleSchema,
  description: z.string()
});
export type ActionCommand = z.infer<typeof actionCommandSchema>;

export const integrationConnectionSchema = z.object({
  id: z.string(),
  name: z.enum(["PagerDuty", "Slack", "GitHub", "Jira"]),
  status: z.enum(["connected", "needs_attention"]),
  scopeSummary: z.string()
});
export type IntegrationConnection = z.infer<typeof integrationConnectionSchema>;

export const incidentDetailSchema = incidentSummarySchema.extend({
  currentFocus: z.string(),
  affectedServices: z.array(z.string()),
  openApprovals: z.array(approvalRequestSchema),
  actions: z.array(actionCommandSchema),
  timeline: z.array(timelineEventSchema)
});
export type IncidentDetail = z.infer<typeof incidentDetailSchema>;

export const commandExecutionRequestSchema = z.object({
  actionId: z.string(),
  actorName: z.string(),
  actorRole: actorRoleSchema
});
export type CommandExecutionRequest = z.infer<typeof commandExecutionRequestSchema>;

export const approvalDecisionRequestSchema = z.object({
  approvalId: z.string(),
  decision: z.enum(["approve", "reject"]),
  note: z.string().min(1).max(500)
});
export type ApprovalDecisionRequest = z.infer<typeof approvalDecisionRequestSchema>;

export const actorSessionSchema = z.object({
  tenantId: z.string(),
  actorName: z.string(),
  actorRole: actorRoleSchema
});
export type ActorSession = z.infer<typeof actorSessionSchema>;

export const commandExecutionResultSchema = z.object({
  incidentId: z.string(),
  actionId: z.string(),
  outcome: z.enum(["executed", "approval_required", "blocked"]),
  message: z.string()
});
export type CommandExecutionResult = z.infer<typeof commandExecutionResultSchema>;

export const auditEventSchema = z.object({
  id: z.string(),
  incidentId: z.string(),
  actionId: z.string().nullable(),
  tenantId: z.string(),
  actorName: z.string(),
  actorRole: actorRoleSchema,
  outcome: z.enum(["executed", "approval_required", "blocked", "denied"]),
  summary: z.string(),
  happenedAt: z.string().datetime()
});
export type AuditEvent = z.infer<typeof auditEventSchema>;


export const scenarioMetadataSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string()
});
export type ScenarioMetadata = z.infer<typeof scenarioMetadataSchema>;

export const scenarioSeedSchema = z.object({
  incidents: z.array(incidentDetailSchema),
  integrations: z.array(integrationConnectionSchema),
  policies: z.array(tenantPolicySchema),
  auditEvents: z.array(auditEventSchema).default([])
});
export type ScenarioSeed = z.infer<typeof scenarioSeedSchema>;

export const scenarioPackSchema = z.object({
  metadata: scenarioMetadataSchema,
  seed: scenarioSeedSchema
});
export type ScenarioPack = z.infer<typeof scenarioPackSchema>;
