/**
 * hooks/useModuleHome.ts
 *
 * Dedicated TanStack Query hook for module-driven home data.
 * Calls GET /api/core/v1/home?module={module} with multi-tenant headers.
 *
 * Features:
 * - Tenant + module scoped query key: ['moduleHome', siteId, module]
 * - Skeleton loaders support on initial load
 * - Intelligent background prefetching for neighboring enabled modules
 * - Zero mock data fallback (never fakes success on API failure)
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSite } from '@/store/SiteConfigContext';
import { useActiveModule, type CanonicalModule } from '@/store/ModuleContext';
import { fetchModuleHome, type ModuleHomePayload } from '@/services/api';

export function useModuleHome(targetModule?: CanonicalModule) {
  const { siteId, hostname } = useSite();
  const { activeModule, enabledModules } = useActiveModule();
  const queryClient = useQueryClient();

  const moduleToLoad = targetModule || activeModule;

  const query = useQuery<ModuleHomePayload, Error>({
    queryKey: ['moduleHome', siteId, moduleToLoad],
    queryFn: () => fetchModuleHome(moduleToLoad, siteId, hostname),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    gcTime: 1000 * 60 * 30, // 30 minutes in garbage collection
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Prefetch neighboring modules to ensure instant tab switching with no layout shift
  useEffect(() => {
    if (!enabledModules || enabledModules.length <= 1) return;

    const currentIndex = enabledModules.findIndex((m) => m.id === moduleToLoad);
    if (currentIndex === -1) return;

    const neighborsToPrefetch: CanonicalModule[] = [];
    if (currentIndex + 1 < enabledModules.length) {
      neighborsToPrefetch.push(enabledModules[currentIndex + 1].id);
    }
    if (currentIndex - 1 >= 0) {
      neighborsToPrefetch.push(enabledModules[currentIndex - 1].id);
    }

    neighborsToPrefetch.forEach((mod) => {
      queryClient.prefetchQuery({
        queryKey: ['moduleHome', siteId, mod],
        queryFn: () => fetchModuleHome(mod, siteId, hostname),
        staleTime: 1000 * 60 * 5,
      });
    });
  }, [moduleToLoad, enabledModules, siteId, hostname, queryClient]);

  return {
    ...query,
    module: moduleToLoad,
  };
}

