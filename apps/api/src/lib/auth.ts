import type { FastifyReply, FastifyRequest } from "fastify";
import { actorSessionSchema, type ActorSession } from "@mobile-command-kit/domain";

export async function requireActorSession(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parsed = actorSessionSchema.safeParse({
    tenantId: request.headers["x-tenant-id"],
    actorName: request.headers["x-actor-name"],
    actorRole: request.headers["x-actor-role"]
  });

  if (!parsed.success) {
    await reply.code(401).send({
      message: "Missing or invalid actor session headers.",
      requiredHeaders: ["x-tenant-id", "x-actor-name", "x-actor-role"]
    });
    return;
  }

  request.actorSession = parsed.data;
}

declare module "fastify" {
  interface FastifyRequest {
    actorSession?: ActorSession;
  }
}
