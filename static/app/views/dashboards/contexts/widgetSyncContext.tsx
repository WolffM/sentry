import type {ReactNode} from 'react';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {EChartsType} from 'echarts';
import * as echarts from 'echarts';

import {uniqueId} from 'sentry/utils/guid';
import {createDefinedContext} from 'sentry/utils/performance/contexts/utils';

type RegistrationFunction = (chart: EChartsType) => () => void;

interface WidgetSyncContext {
  groupName: string;
  register: RegistrationFunction;
}

const [_WidgetSyncProvider, _useWidgetSyncContext, WidgetSyncContext] =
  createDefinedContext<WidgetSyncContext>({
    name: 'WidgetSyncContext',
    strict: false,
  });

interface WidgetSyncContextProviderProps {
  children: ReactNode;
  groupName?: string;
}

export function WidgetSyncContextProvider({
  children,
  groupName: groupNameProp,
}: WidgetSyncContextProviderProps) {
  // Use useState to ensure stable groupName when not provided as prop
  const [stableGroupName] = useState(() => groupNameProp ?? uniqueId());
  const groupName = groupNameProp ?? stableGroupName;

  const chartsRef = useRef<Map<Element, EChartsType>>(new Map());

  // Create observer synchronously so it exists before children mount (fixes Bug 3)
  const observerRef = useMemo(() => {
    return new IntersectionObserver(entries => {
      for (const entry of entries) {
        const chart = chartsRef.current.get(entry.target);
        if (!chart) {
          continue;
        }

        if (entry.isIntersecting) {
          chart.group = groupName;
        } else {
          chart.group = '';
        }
      }

      echarts?.connect(groupName);
    });
  }, [groupName]);

  // Re-observe all existing charts when observer changes (fixes Bug 1)
  useEffect(() => {
    const charts = Array.from(chartsRef.current.entries());
    for (const [dom] of charts) {
      observerRef.observe(dom);
    }

    return () => {
      observerRef.disconnect();
    };
  }, [observerRef]);

  const register = useCallback(
    (chart: EChartsType) => {
      const dom = chart.getDom();
      if (!dom) {
        return () => {};
      }

      chartsRef.current.set(dom, chart);
      observerRef.observe(dom);

      // Set the group immediately for charts that may already be visible
      chart.group = groupName;
      echarts?.connect(groupName);

      // Return unregister function for cleanup (fixes Bug 2)
      return () => {
        chartsRef.current.delete(dom);
        observerRef.unobserve(dom);
      };
    },
    [groupName, observerRef]
  );

  return (
    <_WidgetSyncProvider
      value={{
        register,
        groupName,
      }}
    >
      {children}
    </_WidgetSyncProvider>
  );
}

export function useWidgetSyncContext(): WidgetSyncContext {
  const context = _useWidgetSyncContext();

  if (!context) {
    // The provider was not registered, return a dummy function
    return {
      register: (_p: any) => () => {},
      groupName: '',
    };
  }

  return context;
}
