import type { IncidentDetail, IntegrationConnection, TenantPolicy } from "@mobile-command-kit/domain";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    cache: "no-store",
    headers: {
      "x-tenant-id": "demo-tenant",
      "x-actor-name": "Riley Chen",
      "x-actor-role": "incident_commander"
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${path}: ${response.status}`);
  }

  return (await response.json()) as T;
}

export default async function HomePage() {
  const [incidentResult, integrationsResult, policyResult, auditResult] = await Promise.all([
    fetchJson<{ incident: IncidentDetail }>("/api/incidents/inc_01"),
    fetchJson<{ integrations: IntegrationConnection[] }>("/api/integrations"),
    fetchJson<{ policy: TenantPolicy }>("/api/policies/current"),
    fetchJson<{ auditEvents: Array<{ id: string; summary: string; happenedAt: string }> }>("/api/incidents/inc_01/audit")
  ]);

  const incident = incidentResult.incident;
  const integrations = integrationsResult.integrations;
  const policy = policyResult.policy;
  const auditEvents = auditResult.auditEvents;

  return (
    <main style={{ padding: "48px 24px 80px" }}>
      <section
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          display: "grid",
          gap: 24
        }}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <p style={{ margin: 0, color: "#7a3e2f", fontWeight: 700, textTransform: "uppercase", fontSize: 12 }}>Retail Ops Admin</p>
          <h1 style={{ margin: 0, fontSize: "clamp(2rem, 5vw, 4rem)" }}>Retail incident command with guardrails.</h1>
          <p style={{ margin: 0, maxWidth: 720, color: "var(--muted)", fontSize: 18, lineHeight: 1.5 }}>
            Live data is flowing from the Fastify backend with store-impact actions, approval posture, tenant policy,
            integration readiness, and audit history.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.45fr) minmax(320px, 0.95fr)",
            gap: 20
          }}
        >
          <section
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              padding: 24,
              borderRadius: 8,
              display: "grid",
              gap: 16
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
              <div>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>Live Incident</p>
                <h2 style={{ margin: "6px 0 0", fontSize: 28 }}>{incident.title}</h2>
              </div>
              <span
                style={{
                  border: "1px solid #f1b7a5",
                  background: "#fff1ec",
                  color: "#8c2f12",
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontWeight: 700
                }}
              >
                {incident.severity.toUpperCase()}
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 12
              }}
            >
              {[
                ["Commander", incident.commanderName],
                ["Store Systems", String(incident.affectedServiceCount)],
                ["Pending Approvals", String(incident.pendingApprovalCount)]
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: 16,
                    background: "#fbfcfc"
                  }}
                >
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>{label}</p>
                  <p style={{ margin: "8px 0 0", fontWeight: 700, fontSize: 20 }}>{value}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 20 }}>Store response actions</h3>
              {incident.actions.map((action) => (
                <div
                  key={action.id}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: 16,
                    display: "grid",
                    gap: 8,
                    background: "#fbfcfc"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <strong>{action.label}</strong>
                    <span style={{ color: "#8c2f12", fontWeight: 700 }}>{labelizeStatus(action.status)}</span>
                  </div>
                  <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>{action.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section
            style={{
              background: "#0f1720",
              color: "#f8fafb",
              borderRadius: 8,
              padding: 24,
              display: "grid",
              gap: 12
            }}
          >
            <p style={{ margin: 0, opacity: 0.72, fontSize: 13 }}>Retail Policy Preview</p>
            <h2 style={{ margin: 0, fontSize: 26 }}>Recovery policy is live</h2>
            <p style={{ margin: 0, lineHeight: 1.6, color: "#d7dee6" }}>
              Dual approval: {policy.rollbackRequiresDualApproval ? "required" : "not required"} · Deploy freeze:{" "}
              {policy.deployFreezeRequiresCommander ? "commander only" : "broadly allowed"}
            </p>
            <div
              style={{
                marginTop: 8,
                borderTop: "1px solid rgba(255,255,255,0.12)",
                paddingTop: 14,
                display: "grid",
                gap: 10
              }}
            >
              {incident.openApprovals.map((approval) => (
                <div key={approval.id} style={{ display: "grid", gap: 4 }}>
                  <strong>{approval.title}</strong>
                  <span style={{ color: "#d7dee6", lineHeight: 1.5 }}>{approval.rationale}</span>
                  <span style={{ opacity: 0.8, fontSize: 13 }}>
                    Requested by {approval.requestedBy} · Required role: {labelizeRole(approval.approverRole)} · Status:{" "}
                    {approval.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
            gap: 20
          }}
        >
          <article
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 20,
              display: "grid",
              gap: 14
            }}
          >
            <h3 style={{ margin: 0, fontSize: 20 }}>Retail integration readiness</h3>
            {integrations.map((integration) => (
              <div
                key={integration.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  alignItems: "center",
                  background: "#fbfcfc"
                }}
              >
                <div style={{ display: "grid", gap: 4 }}>
                  <strong>{integration.name}</strong>
                  <span style={{ color: "var(--muted)", lineHeight: 1.5 }}>{integration.scopeSummary}</span>
                </div>
                <span style={{ color: integration.status === "connected" ? "#2a6a45" : "#9a5a10", fontWeight: 700 }}>
                  {integration.status === "connected" ? "Connected" : "Needs attention"}
                </span>
              </div>
            ))}
          </article>

          <article
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 20,
              display: "grid",
              gap: 14
            }}
          >
            <h3 style={{ margin: 0, fontSize: 20 }}>Recent audit</h3>
            {auditEvents.map((event) => (
              <div
                key={event.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: 16,
                  lineHeight: 1.6,
                  background: "#fbfcfc"
                }}
              >
                <strong style={{ display: "block" }}>{new Date(event.happenedAt).toLocaleString()}</strong>
                <span style={{ color: "var(--muted)" }}>{event.summary}</span>
              </div>
            ))}
          </article>
        </section>
      </section>
    </main>
  );
}

function labelizeStatus(status: "ready" | "pending_approval" | "blocked" | "executed") {
  if (status === "pending_approval") {
    return "Approval required";
  }

  if (status === "executed") {
    return "Executed";
  }

  if (status === "blocked") {
    return "Blocked";
  }

  return "Ready";
}

function labelizeRole(role: "incident_commander" | "platform_lead" | "responder" | "stakeholder") {
  return role
    .split("_")
    .map((part) => {
      const first = part.charAt(0).toUpperCase();
      return `${first}${part.slice(1)}`;
    })
    .join(" ");
}
