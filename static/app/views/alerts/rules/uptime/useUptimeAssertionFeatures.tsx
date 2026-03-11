import useOrganization from 'sentry/utils/useOrganization';

export function useUptimeAssertionFeatures() {
  const organization = useOrganization();

  const hasRuntimeAssertions = true;
  const hasAiAssertionSuggestions =
    hasRuntimeAssertions &&
    organization.features.includes('uptime-ai-assertion-suggestions') &&
    organization.features.includes('gen-ai-features') &&
    !organization.hideAiFeatures;

  return {hasRuntimeAssertions, hasAiAssertionSuggestions};
}
