import cors from "@fastify/cors";
import Fastify from "fastify";
import { approvalDecisionRequestSchema, commandExecutionRequestSchema, tenantPolicySchema } from "@mobile-command-kit/domain";
import { requireActorSession } from "./lib/auth.js";
import {
  executeAction,
  getIncidentById,
  getTenantPolicy,
  listAuditEvents,
  listIncidents,
  listIntegrations,
  resolveApproval,
  saveTenantPolicy
} from "./mock-data.js";

const app = Fastify({
  logger: true
});

await app.register(cors, {
  origin: true
});

app.get("/health", async () => ({
  status: "ok"
}));

app.get("/api/incidents", async () => ({
  incidents: await listIncidents()
}));

app.get("/api/incidents/:incidentId", async (request, reply) => {
  const { incidentId } = request.params as { incidentId: string };
  const incident = await getIncidentById(incidentId);

  if (!incident) {
    return reply.code(404).send({ message: "Incident not found." });
  }

  return { incident };
});

app.get("/api/integrations", async () => ({
  integrations: await listIntegrations()
}));

app.get("/api/policies/current", { preHandler: requireActorSession }, async (request, reply) => {
  const policy = await getTenantPolicy(request.actorSession!.tenantId);

  if (!policy) {
    return reply.code(404).send({ message: "Tenant policy not found." });
  }

  return { policy };
});

app.put("/api/policies/current", { preHandler: requireActorSession }, async (request, reply) => {
  const parsed = tenantPolicySchema.safeParse({
    ...(request.body as Record<string, unknown>),
    tenantId: request.actorSession!.tenantId
  });

  if (!parsed.success) {
    return reply.code(400).send({
      message: "Invalid tenant policy payload.",
      issues: parsed.error.issues
    });
  }

  return { policy: await saveTenantPolicy(parsed.data) };
});

app.get("/api/incidents/:incidentId/audit", async (request) => {
  const { incidentId } = request.params as { incidentId: string };
  return { auditEvents: await listAuditEvents(incidentId) };
});

app.post("/api/incidents/:incidentId/approvals", { preHandler: requireActorSession }, async (request, reply) => {
  const { incidentId } = request.params as { incidentId: string };
  const parsedBody = approvalDecisionRequestSchema.safeParse(request.body);

  if (!parsedBody.success) {
    return reply.code(400).send({
      message: "Invalid approval decision request.",
      issues: parsedBody.error.issues
    });
  }

  const incident = await resolveApproval(incidentId, parsedBody.data, request.actorSession!);

  if (!incident) {
    return reply.code(404).send({ message: "Incident not found." });
  }

  return { incident };
});

app.post("/api/incidents/:incidentId/actions", { preHandler: requireActorSession }, async (request, reply) => {
  const { incidentId } = request.params as { incidentId: string };
  const parsedBody = commandExecutionRequestSchema.safeParse(request.body);

  if (!parsedBody.success) {
    return reply.code(400).send({
      message: "Invalid command execution request.",
      issues: parsedBody.error.issues
    });
  }

  const result = await executeAction(incidentId, parsedBody.data, request.actorSession!);

  if (!result) {
    return reply.code(404).send({ message: "Incident or action not found." });
  }

  return { result };
});

await app.listen({
  host: "0.0.0.0",
  port: 4000
});
