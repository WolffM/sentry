import styled from '@emotion/styled';

import {Alert} from '@sentry/scraps/alert';
import {Container, Flex, Stack} from '@sentry/scraps/layout';
import {Link} from '@sentry/scraps/link';
import {Heading, Text} from '@sentry/scraps/text';

import {IconCode, IconCommit, IconFix} from 'sentry/icons';
import {t, tct, tn} from 'sentry/locale';
import {useOrganization} from 'sentry/utils/useOrganization';

import {useSeerOverviewData} from 'getsentry/views/seerAutomation/components/overview/useSeerOverviewData';

function StatPill({
  value,
  outOf,
  label,
}: {
  label: string;
  value: number | string;
  outOf?: number;
}) {
  const display = outOf === undefined ? value : `${value}\u2009/\u2009${outOf}`;
  return (
    <Flex gap="xs" align="end">
      <Text size="lg" bold>
        {display}
      </Text>
      <Text size="sm" variant="muted">
        {label}
      </Text>
    </Flex>
  );
}

interface SectionRowProps {
  icon: React.ReactNode;
  isLoading: boolean;
  link: string;
  stats: Array<{label: string; value: number; outOf?: number}>;
  title: string;
  children?: React.ReactNode;
}

function SectionRow({children, icon, title, link, stats, isLoading}: SectionRowProps) {
  return (
    <Container border="primary" radius="md" padding="lg">
      <Stack gap="lg">
        <Flex gap="lg" align="center">
          <Flex gap="lg" align="start" flex={1}>
            <Flex gap="md" align="center">
              <IconBadge>{icon}</IconBadge>
              <TitleHeading as="h2" size="lg">
                {title}
              </TitleHeading>
            </Flex>
            <Stack gap="sm">
              {stats.map(({label, value, outOf}) => (
                <StatPill
                  key={label}
                  value={isLoading ? '\u2014' : value}
                  outOf={isLoading ? undefined : outOf}
                  label={label}
                />
              ))}
            </Stack>
          </Flex>

          <Text size="sm">
            <Link to={link}>{t('Configure')}</Link>
          </Text>
        </Flex>

        {children}
      </Stack>
    </Container>
  );
}

export function SeerOverview() {
  const organization = useOrganization();
  const {stats, isLoading} = useSeerOverviewData();

  const projectsWithAutomationButNoRepos =
    stats.projectsWithAutomationCount - stats.projectsWithReposCount;

  return (
    <Stack gap="md">
      <SectionRow
        icon={<IconCommit size="md" />}
        title={t('SCM Config')}
        link={`/settings/${organization.slug}/integrations/?category=source+code+management`}
        stats={[
          {
            label: tn('Integration', 'Integrations', stats.integrationCount),
            value: stats.integrationCount,
          },
          {
            label: tn('Repo connected', 'Repos connected', stats.totalRepoCount),
            value: stats.totalRepoCount,
          },
          {
            label: tn(
              'Repo supported by Seer',
              'Repos supported by Seer',
              stats.seerRepoCount
            ),
            value: stats.seerRepoCount,
            outOf: stats.totalRepoCount,
          },
        ]}
        isLoading={isLoading}
      >
        {!isLoading && stats.integrationCount === 0 && (
          <Alert variant="danger" showIcon>
            {tct(
              'No SCM integrations are installed. Seer requires a source code integration to analyze issues and review code. [link:Install an integration] to get started.',
              {
                link: (
                  <Link
                    to={`/settings/${organization.slug}/integrations/?category=source+code+management`}
                  />
                ),
              }
            )}
          </Alert>
        )}

        {!isLoading && stats.integrationCount > 0 && stats.totalRepoCount === 0 && (
          <Alert variant="danger" showIcon>
            {tct(
              'No repositories are connected. Seer needs access to your repositories to provide root cause analysis and code review. [link:Connect your repos] to enable Seer.',
              {
                link: (
                  <Link
                    to={`/settings/${organization.slug}/integrations/?category=source+code+management`}
                  />
                ),
              }
            )}
          </Alert>
        )}
      </SectionRow>

      <SectionRow
        icon={<IconFix size="md" />}
        title={t('Issue Autofix')}
        link={`/settings/${organization.slug}/seer/projects/`}
        stats={[
          {
            label: t('Projects with repos'),
            value: stats.projectsWithReposCount,
          },
          {
            label: t('Projects with automation'),
            value: stats.projectsWithAutomationCount,
          },
        ]}
        isLoading={isLoading}
      >
        {!isLoading && projectsWithAutomationButNoRepos > 0 && (
          <Alert variant="warning" showIcon>
            {tct(
              '[count] [projects] with automation enabled but no repositories connected. Seer cannot perform root cause analysis or create fixes without repo access. [link:Configure project repos] to fix this.',
              {
                count: projectsWithAutomationButNoRepos,
                projects: tn(
                  'project has',
                  'projects have',
                  projectsWithAutomationButNoRepos
                ),
                link: <Link to={`/settings/${organization.slug}/seer/projects/`} />,
              }
            )}
          </Alert>
        )}
      </SectionRow>

      <SectionRow
        icon={<IconCode size="md" />}
        title={t('Code Review')}
        link={`/settings/${organization.slug}/seer/repos/`}
        stats={[
          {
            label: tn('Repo enabled', 'Repos enabled', stats.reposWithCodeReviewCount),
            value: stats.reposWithCodeReviewCount,
            outOf: stats.seerRepoCount,
          },
        ]}
        isLoading={isLoading}
      />
    </Stack>
  );
}

const IconBadge = styled('div')`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: ${p => p.theme.tokens.background.secondary};
  flex-shrink: 0;
  color: ${p => p.theme.tokens.content.primary};
`;

const TitleHeading = styled(Heading)`
  min-width: 200px;
`;
