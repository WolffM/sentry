import {useEffect, useMemo} from 'react';
import uniqBy from 'lodash/uniqBy';

import {bulkAutofixAutomationSettingsInfiniteOptions} from 'sentry/components/events/autofix/preferences/hooks/useBulkAutofixAutomationSettings';
import {organizationRepositoriesInfiniteOptions} from 'sentry/components/events/autofix/preferences/hooks/useOrganizationRepositories';
import {isSupportedAutofixProvider} from 'sentry/components/events/autofix/utils';
import type {OrganizationIntegration} from 'sentry/types/integrations';
import {apiOptions} from 'sentry/utils/api/apiOptions';
import {useInfiniteQuery, useQuery} from 'sentry/utils/queryClient';
import {useOrganization} from 'sentry/utils/useOrganization';

export function useSeerOverviewData() {
  const organization = useOrganization();

  const {data: integrations = [], isPending: isIntegrationsPending} = useQuery(
    apiOptions.as<OrganizationIntegration[]>()(
      '/organizations/$organizationIdOrSlug/integrations/',
      {
        path: {organizationIdOrSlug: organization.slug},
        query: {includeConfig: 0},
        staleTime: 60_000,
      }
    )
  );

  const queryOptions = organizationRepositoriesInfiniteOptions({
    organization,
    query: {per_page: 100},
  });
  const {
    data: allRepositories,
    hasNextPage,
    isError: isReposError,
    isPending: isReposPending,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    ...queryOptions,
    select: ({pages}) =>
      uniqBy(
        pages.flatMap(page => page.json),
        'externalId'
      ).filter(repository => repository.externalId),
  });

  useEffect(() => {
    if (!isReposError && !isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage, isReposError, isFetchingNextPage]);

  const {data: autofixSettings, isFetching: isFetchingAutofix} = useInfiniteQuery({
    ...bulkAutofixAutomationSettingsInfiniteOptions({organization}),
    select: ({pages}) => pages.flatMap(page => page.json),
  });

  // const autofixSettings = useMemo(() => autofixPages.flat(), [autofixPages]);

  const stats = useMemo(() => {
    const allRepos = allRepositories ?? [];
    const seerRepos = allRepos.filter(r => isSupportedAutofixProvider(r.provider));
    const scmIntegrations = integrations.filter(i =>
      i.provider.features.includes('commits')
    );

    return {
      integrationCount: scmIntegrations.length,
      totalRepoCount: allRepos.length,
      seerRepoCount: seerRepos.length,
      reposWithSettingsCount: seerRepos.filter(r => r.settings !== null).length,
      projectsWithReposCount: autofixSettings?.filter(s => s.reposCount > 0).length,
      projectsWithAutomationCount: autofixSettings?.filter(
        s => s.autofixAutomationTuning !== 'off'
      ).length,
      totalProjects: autofixSettings?.length,
      reposWithCodeReviewCount: seerRepos.filter(r => r.settings?.enabledCodeReview)
        .length,
    };
  }, [allRepositories, autofixSettings, integrations]);

  return {
    stats,
    isLoading: isIntegrationsPending || isReposPending || isFetchingAutofix,
  };
}
