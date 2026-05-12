import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import type {
  AuditEvent,
  IncidentDetail,
  IncidentSummary,
  IntegrationConnection,
  TenantPolicy
} from "@mobile-command-kit/domain";

type FeedResponse = { incidents: IncidentSummary[] };
type IncidentResponse = { incident: IncidentDetail };
type IntegrationResponse = { integrations: IntegrationConnection[] };
type PolicyResponse = { policy: TenantPolicy };
type AuditResponse = { auditEvents: AuditEvent[] };

const defaultApiBaseUrl = "http://localhost:4000";
const actorHeaders = {
  "x-tenant-id": "demo-tenant",
  "x-actor-name": "Riley Chen",
  "x-actor-role": "incident_commander"
} as const;

export default function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState(defaultApiBaseUrl);
  const [draftApiBaseUrl, setDraftApiBaseUrl] = useState(defaultApiBaseUrl);
  const [incidentFeed, setIncidentFeed] = useState<IncidentSummary[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<IncidentDetail | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationConnection[]>([]);
  const [policy, setPolicy] = useState<TenantPolicy | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchJson<T>(path: string, nextApiBaseUrl = apiBaseUrl): Promise<T> {
    const response = await fetch(`${nextApiBaseUrl}${path}`, {
      headers: actorHeaders
    });

    if (!response.ok) {
      throw new Error(`Request failed for ${path}: ${response.status}`);
    }

    return (await response.json()) as T;
  }

  async function loadDashboard(nextApiBaseUrl = apiBaseUrl, nextIncidentId = selectedIncidentId) {
    try {
      setError(null);

      const feed = await fetchJson<FeedResponse>("/api/incidents", nextApiBaseUrl);
      const resolvedIncidentId = nextIncidentId ?? feed.incidents[0]?.id ?? null;

      setIncidentFeed(feed.incidents);
      setSelectedIncidentId(resolvedIncidentId);

      if (!resolvedIncidentId) {
        setSelectedIncident(null);
        setIntegrations([]);
        setPolicy(null);
        setAuditEvents([]);
        return;
      }

      const [incidentResult, integrationsResult, policyResult, auditResult] = await Promise.all([
        fetchJson<IncidentResponse>(`/api/incidents/${resolvedIncidentId}`, nextApiBaseUrl),
        fetchJson<IntegrationResponse>("/api/integrations", nextApiBaseUrl),
        fetchJson<PolicyResponse>("/api/policies/current", nextApiBaseUrl),
        fetchJson<AuditResponse>(`/api/incidents/${resolvedIncidentId}/audit`, nextApiBaseUrl)
      ]);

      setSelectedIncident(incidentResult.incident);
      setIntegrations(integrationsResult.integrations);
      setPolicy(policyResult.policy);
      setAuditEvents(auditResult.auditEvents);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "The retail command view could not load. Check the API URL and device network."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  function applyApiBaseUrl() {
    setIsLoading(true);
    setApiBaseUrl(draftApiBaseUrl);
    void loadDashboard(draftApiBaseUrl, selectedIncidentId);
  }

  function selectIncident(incidentId: string) {
    setIsRefreshing(true);
    void loadDashboard(apiBaseUrl, incidentId);
  }

  if (isLoading && !selectedIncident) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#8e4a20" />
          <Text style={styles.loadingText}>Loading live retail incident data from the command API.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const openApprovalCount = selectedIncident?.openApprovals.filter((approval) => approval.status === "pending").length ?? 0;
  const connectedIntegrationCount = integrations.filter((integration) => integration.status === "connected").length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.screen}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              void loadDashboard();
            }}
          />
        }
      >
        <Text style={styles.eyebrow}>Retail Command</Text>
        <Text style={styles.title}>Keep stores selling through live incidents.</Text>
        <Text style={styles.subtitle}>
          This mobile view is aimed at district and store operations. It pulls live incident state, approval posture,
          integration health, and audit history from the Fastify backend.
        </Text>

        <View style={styles.apiCard}>
          <Text style={styles.sectionTitle}>API endpoint</Text>
          <TextInput
            value={draftApiBaseUrl}
            onChangeText={setDraftApiBaseUrl}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.apiInput}
            placeholder="http://localhost:4000"
            placeholderTextColor="#8f9ca8"
          />
          <Pressable style={styles.applyButton} onPress={applyApiBaseUrl}>
            <Text style={styles.applyButtonText}>Reload retail dashboard</Text>
          </Pressable>
          <Text style={styles.helperText}>
            On a physical device, replace `localhost` with the machine&apos;s LAN IP.
          </Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active retail incidents</Text>
          {incidentFeed.map((incident) => {
            const isSelected = incident.id === selectedIncidentId;

            return (
              <Pressable key={incident.id} style={[styles.feedRow, isSelected ? styles.feedRowSelected : null]} onPress={() => selectIncident(incident.id)}>
                <View style={styles.feedCopy}>
                  <Text style={styles.feedTitle}>{incident.title}</Text>
                  <Text style={styles.feedMeta}>
                    {incident.commanderName} · {incident.affectedServiceCount} store systems · {incident.pendingApprovalCount} approvals
                  </Text>
                </View>
                <Text style={styles.feedSeverity}>{incident.severity.toUpperCase()}</Text>
              </Pressable>
            );
          })}
        </View>

        {selectedIncident ? (
          <>
            <View style={styles.heroCard}>
              <View style={styles.severityRow}>
                <Text style={styles.cardLabel}>Customer risk</Text>
                <Text style={styles.severityBadge}>{labelizeSeverity(selectedIncident.severity)}</Text>
              </View>
              <Text style={styles.cardTitle}>{selectedIncident.title}</Text>
              <Text style={styles.cardBody}>{selectedIncident.currentFocus}</Text>
              <View style={styles.tagRow}>
                {selectedIncident.affectedServices.map((service) => (
                  <View key={service} style={styles.serviceChip}>
                    <Text style={styles.serviceChipText}>{service}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.metricsRow}>
              <MetricCard label="Commander" value={selectedIncident.commanderName} />
              <MetricCard label="Open approvals" value={String(openApprovalCount)} />
              <MetricCard label="Connected systems" value={String(connectedIntegrationCount)} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Playbook posture</Text>
              <View style={styles.policyGrid}>
                <View style={styles.policyCard}>
                  <Text style={styles.metricLabel}>Dual approval</Text>
                  <Text style={styles.policyValue}>{policy?.rollbackRequiresDualApproval ? "Required" : "Off"}</Text>
                </View>
                <View style={styles.policyCard}>
                  <Text style={styles.metricLabel}>Freeze authority</Text>
                  <Text style={styles.policyValue}>{policy?.deployFreezeRequiresCommander ? "Commander" : "Broader team"}</Text>
                </View>
                <View style={styles.policyCard}>
                  <Text style={styles.metricLabel}>Customer comms owner</Text>
                  <Text style={styles.policyValue}>
                    {policy ? labelizeRole(policy.stakeholderUpdateRole) : "Not set"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Approvals and actions</Text>
              {selectedIncident.openApprovals.map((approval) => (
                <View key={approval.id} style={styles.approvalCard}>
                  <Text style={styles.actionText}>{approval.title}</Text>
                  <Text style={styles.approvalBody}>{approval.rationale}</Text>
                  <Text style={styles.feedMeta}>
                    Requested by {approval.requestedBy} · Required role: {labelizeRole(approval.approverRole)} · Status:{" "}
                    {approval.status}
                  </Text>
                </View>
              ))}
              {selectedIncident.actions.map((action) => (
                <View key={action.id} style={styles.actionRow}>
                  <View style={styles.feedCopy}>
                    <Text style={styles.actionText}>{action.label}</Text>
                    <Text style={styles.actionBody}>{action.description}</Text>
                  </View>
                  <Text style={styles.actionHint}>{labelizeStatus(action.status)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Integration readiness</Text>
              {integrations.map((integration) => (
                <View key={integration.id} style={styles.integrationRow}>
                  <View style={styles.feedCopy}>
                    <Text style={styles.actionText}>{integration.name}</Text>
                    <Text style={styles.actionBody}>{integration.scopeSummary}</Text>
                  </View>
                  <Text
                    style={[
                      styles.integrationStatus,
                      integration.status === "connected" ? styles.integrationConnected : styles.integrationAttention
                    ]}
                  >
                    {integration.status === "connected" ? "Connected" : "Needs attention"}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent audit trail</Text>
              {auditEvents.length === 0 ? <Text style={styles.actionBody}>No live audit entries yet for this incident.</Text> : null}
              {auditEvents.map((event) => (
                <View key={event.id} style={styles.timelineRow}>
                  <Text style={styles.timelineActor}>
                    {event.actorName} · {new Date(event.happenedAt).toLocaleString()}
                  </Text>
                  <Text style={styles.actionBody}>{event.summary}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function labelizeStatus(status: "ready" | "pending_approval" | "blocked" | "executed") {
  if (status === "pending_approval") {
    return "Approval";
  }

  if (status === "executed") {
    return "Done";
  }

  if (status === "blocked") {
    return "Blocked";
  }

  return "Ready";
}

function labelizeSeverity(severity: IncidentSummary["severity"]) {
  if (severity === "sev1") {
    return "Checkout at risk";
  }

  if (severity === "sev2") {
    return "Sales impact";
  }

  if (severity === "sev3") {
    return "Ops drag";
  }

  return "Low";
}

function labelizeRole(role: TenantPolicy["stakeholderUpdateRole"]) {
  return role
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f1ea"
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 24
  },
  loadingText: {
    color: "#5d665f",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22
  },
  screen: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
    gap: 18
  },
  eyebrow: {
    color: "#9d4e1d",
    textTransform: "uppercase",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5
  },
  title: {
    color: "#1e1e1a",
    fontSize: 34,
    fontWeight: "700"
  },
  subtitle: {
    color: "#5d665f",
    fontSize: 16,
    lineHeight: 24
  },
  apiCard: {
    backgroundColor: "#fffdf8",
    borderColor: "#d9d2c4",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12
  },
  apiInput: {
    borderColor: "#d9d2c4",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#f8f5ee",
    color: "#1e1e1a"
  },
  applyButton: {
    backgroundColor: "#9d4e1d",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  applyButtonText: {
    color: "#fff9f1",
    fontWeight: "700"
  },
  helperText: {
    color: "#7a756c",
    lineHeight: 18
  },
  errorText: {
    color: "#ad2c1d",
    lineHeight: 20
  },
  heroCard: {
    backgroundColor: "#223127",
    borderRadius: 20,
    padding: 20,
    gap: 12
  },
  severityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  cardLabel: {
    color: "#b7c4b7",
    fontSize: 13
  },
  severityBadge: {
    color: "#7e2a10",
    backgroundColor: "#fce8d7",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    overflow: "hidden",
    fontWeight: "700"
  },
  cardTitle: {
    color: "#fffaf0",
    fontSize: 24,
    fontWeight: "700"
  },
  cardBody: {
    color: "#dde7dd",
    fontSize: 15,
    lineHeight: 22
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  serviceChip: {
    backgroundColor: "#314539",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  serviceChipText: {
    color: "#edf4ee",
    fontSize: 12,
    fontWeight: "600"
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#fffdf8",
    borderColor: "#d9d2c4",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8
  },
  metricLabel: {
    color: "#6f7069",
    fontSize: 13
  },
  metricValue: {
    color: "#1e1e1a",
    fontSize: 18,
    fontWeight: "700"
  },
  section: {
    backgroundColor: "#fffdf8",
    borderColor: "#d9d2c4",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12
  },
  sectionTitle: {
    color: "#1e1e1a",
    fontSize: 18,
    fontWeight: "700"
  },
  feedRow: {
    borderColor: "#ddd6c7",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#f7f3eb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  feedRowSelected: {
    borderColor: "#9d4e1d",
    backgroundColor: "#fff3e6"
  },
  feedCopy: {
    flex: 1,
    gap: 4
  },
  feedTitle: {
    color: "#1e1e1a",
    fontSize: 15,
    fontWeight: "700"
  },
  feedMeta: {
    color: "#6f7069",
    fontSize: 13,
    lineHeight: 18
  },
  feedSeverity: {
    color: "#9d4e1d",
    fontWeight: "700"
  },
  policyGrid: {
    gap: 10
  },
  policyCard: {
    borderColor: "#ddd6c7",
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: "#f7f3eb",
    padding: 14,
    gap: 6
  },
  policyValue: {
    color: "#1e1e1a",
    fontSize: 16,
    fontWeight: "700"
  },
  approvalCard: {
    borderColor: "#ddd6c7",
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: "#f7f3eb",
    padding: 14,
    gap: 8
  },
  approvalBody: {
    color: "#5d665f",
    fontSize: 14,
    lineHeight: 20
  },
  actionRow: {
    borderColor: "#ddd6c7",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f7f3eb",
    gap: 12
  },
  actionText: {
    color: "#1e1e1a",
    fontSize: 15,
    fontWeight: "600"
  },
  actionBody: {
    color: "#6f7069",
    fontSize: 13,
    lineHeight: 18
  },
  actionHint: {
    color: "#9d4e1d",
    fontWeight: "700"
  },
  integrationRow: {
    borderColor: "#ddd6c7",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#f7f3eb",
    gap: 10
  },
  integrationStatus: {
    fontWeight: "700"
  },
  integrationConnected: {
    color: "#21673d"
  },
  integrationAttention: {
    color: "#9d4e1d"
  },
  timelineRow: {
    gap: 6,
    paddingBottom: 12,
    borderBottomColor: "#ece4d7",
    borderBottomWidth: 1
  },
  timelineActor: {
    color: "#1e1e1a",
    fontSize: 14,
    fontWeight: "700"
  }
});
