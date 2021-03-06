import React, { Fragment, useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { t } from '@lingui/macro';
import {
  Card,
  CardHeader,
  CardActions,
  CardBody,
  PageSection,
  Select,
  SelectVariant,
  SelectOption,
  Tabs,
  Tab,
  TabTitleText,
} from '@patternfly/react-core';

import useRequest from '../../util/useRequest';
import { DashboardAPI } from '../../api';
import ScreenHeader from '../../components/ScreenHeader';
import JobList from '../../components/JobList';
import ContentLoading from '../../components/ContentLoading';
import LineChart from './shared/LineChart';
import Count from './shared/Count';
import TemplateList from '../../components/TemplateList';

const Counts = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-gap: var(--pf-global--spacer--lg);

  @media (max-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: 1fr;
  }
`;

const MainPageSection = styled(PageSection)`
  padding-top: 0;
  padding-bottom: 0;

  & .spacer {
    margin-bottom: var(--pf-global--spacer--lg);
  }
`;

const GraphCardHeader = styled(CardHeader)`
  margin-top: var(--pf-global--spacer--lg);
`;

const GraphCardActions = styled(CardActions)`
  margin-left: initial;
  padding-left: 0;
`;

function Dashboard() {
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [isJobTypeDropdownOpen, setIsJobTypeDropdownOpen] = useState(false);
  const [periodSelection, setPeriodSelection] = useState('month');
  const [jobTypeSelection, setJobTypeSelection] = useState('all');
  const [activeTabId, setActiveTabId] = useState(0);

  const {
    isLoading,
    result: { jobGraphData, countData },
    request: fetchDashboardGraph,
  } = useRequest(
    useCallback(async () => {
      const [{ data }, { data: dataFromCount }] = await Promise.all([
        DashboardAPI.readJobGraph({
          period: periodSelection,
          job_type: jobTypeSelection,
        }),
        DashboardAPI.read(),
      ]);
      const newData = {};
      data.jobs.successful.forEach(([dateSecs, count]) => {
        if (!newData[dateSecs]) {
          newData[dateSecs] = {};
        }
        newData[dateSecs].successful = count;
      });
      data.jobs.failed.forEach(([dateSecs, count]) => {
        if (!newData[dateSecs]) {
          newData[dateSecs] = {};
        }
        newData[dateSecs].failed = count;
      });
      const jobData = Object.keys(newData).map(dateSecs => {
        const [created] = new Date(dateSecs * 1000).toISOString().split('T');
        newData[dateSecs].created = created;
        return newData[dateSecs];
      });
      return {
        jobGraphData: jobData,
        countData: dataFromCount,
      };
    }, [periodSelection, jobTypeSelection]),
    {
      jobGraphData: [],
      countData: {},
    }
  );

  useEffect(() => {
    fetchDashboardGraph();
  }, [fetchDashboardGraph, periodSelection, jobTypeSelection]);
  if (isLoading) {
    return (
      <PageSection>
        <Card>
          <ContentLoading />
        </Card>
      </PageSection>
    );
  }
  return (
    <Fragment>
      <ScreenHeader
        streamType="all"
        breadcrumbConfig={{ '/home': t`Dashboard` }}
      />
      <PageSection>
        <Counts>
          <Count
            link="/hosts"
            data={countData?.hosts?.total}
            label={t`Hosts`}
          />
          <Count
            failed
            link="/hosts?host.last_job_host_summary__failed=true"
            data={countData?.hosts?.failed}
            label={t`Failed hosts`}
          />
          <Count
            link="/inventories"
            data={countData?.inventories?.total}
            label={t`Inventories`}
          />
          <Count
            failed
            link="/inventories?inventory.inventory_sources_with_failures__gt=0"
            data={countData?.inventories?.inventory_failed}
            label={t`Inventory sync failures`}
          />
          <Count
            link="/projects"
            data={countData?.projects?.total}
            label={t`Projects`}
          />
          <Count
            failed
            link="/projects?project.status__in=failed,canceled"
            data={countData?.projects?.failed}
            label={t`Project sync failures`}
          />
        </Counts>
      </PageSection>
      <MainPageSection>
        <div className="spacer">
          <Card id="dashboard-main-container">
            <Tabs
              aria-label={t`Tabs`}
              activeKey={activeTabId}
              onSelect={(key, eventKey) => setActiveTabId(eventKey)}
            >
              <Tab
                aria-label={t`Job status graph tab`}
                eventKey={0}
                title={<TabTitleText>{t`Job status`}</TabTitleText>}
              >
                <Fragment>
                  <GraphCardHeader>
                    <GraphCardActions>
                      <Select
                        variant={SelectVariant.single}
                        placeholderText={t`Select period`}
                        aria-label={t`Select period`}
                        typeAheadAriaLabel={t`Select period`}
                        className="periodSelect"
                        onToggle={setIsPeriodDropdownOpen}
                        onSelect={(event, selection) =>
                          setPeriodSelection(selection)
                        }
                        selections={periodSelection}
                        isOpen={isPeriodDropdownOpen}
                      >
                        <SelectOption key="month" value="month">
                          {t`Past month`}
                        </SelectOption>
                        <SelectOption key="two_weeks" value="two_weeks">
                          {t`Past two weeks`}
                        </SelectOption>
                        <SelectOption key="week" value="week">
                          {t`Past week`}
                        </SelectOption>
                      </Select>
                      <Select
                        variant={SelectVariant.single}
                        placeholderText={t`Select job type`}
                        aria-label={t`Select job type`}
                        className="jobTypeSelect"
                        onToggle={setIsJobTypeDropdownOpen}
                        onSelect={(event, selection) =>
                          setJobTypeSelection(selection)
                        }
                        selections={jobTypeSelection}
                        isOpen={isJobTypeDropdownOpen}
                      >
                        <SelectOption key="all" value="all">
                          {t`All job types`}
                        </SelectOption>
                        <SelectOption key="inv_sync" value="inv_sync">
                          {t`Inventory sync`}
                        </SelectOption>
                        <SelectOption key="scm_update" value="scm_update">
                          {t`SCM update`}
                        </SelectOption>
                        <SelectOption key="playbook_run" value="playbook_run">
                          {t`Playbook run`}
                        </SelectOption>
                      </Select>
                    </GraphCardActions>
                  </GraphCardHeader>
                  <CardBody>
                    <LineChart
                      height={390}
                      id="d3-line-chart-root"
                      data={jobGraphData}
                    />
                  </CardBody>
                </Fragment>
              </Tab>
              <Tab
                aria-label={t`Recent Jobs list tab`}
                eventKey={1}
                title={<TabTitleText>{t`Recent Jobs`}</TabTitleText>}
              >
                <div>
                  {activeTabId === 1 && (
                    <JobList defaultParams={{ page_size: 5 }} />
                  )}
                </div>
              </Tab>
              <Tab
                aria-label={t`Recent Templates list tab`}
                eventKey={2}
                title={<TabTitleText>{t`Recent Templates`}</TabTitleText>}
              >
                <div>
                  {activeTabId === 2 && (
                    <TemplateList defaultParams={{ page_size: 5 }} />
                  )}
                </div>
              </Tab>
            </Tabs>
          </Card>
        </div>
      </MainPageSection>
    </Fragment>
  );
}

export default Dashboard;
