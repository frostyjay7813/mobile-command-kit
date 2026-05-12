import type { IntegrationProvider } from "@mobile-command-kit/domain";

type AdapterResult = {
  provider: IntegrationProvider;
  status: "accepted";
  reference: string;
};

export async function dispatchIntegrationAction(provider: IntegrationProvider, actionLabel: string): Promise<AdapterResult> {
  return {
    provider,
    status: "accepted",
    reference: `${provider}:${actionLabel.toLowerCase().replaceAll(" ", "-")}`
  };
}
