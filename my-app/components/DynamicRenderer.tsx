/**
 * components/DynamicRenderer.tsx
 *
 * Config-driven mobile section engine.
 * Renders the ordered component list from `config.components.home` (or passed components)
 * matching the active tenant's API configuration.
 *
 * Resilience:
 * - Each section is wrapped in an isolated error boundary; one section failing never breaks the screen.
 * - Unknown types/variants are skipped cleanly.
 * - Supports legacy string sections array for full backward compatibility.
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import type { ComponentConfig } from '@/lib/config/siteConfigSchema';
import { resolveMobileComponent } from '@/lib/registry/componentRegistry';
import { componentRegistry } from '@/lib/componentRegistry';
import type { MergedWebsiteConfig } from '@/lib/mergeWebsiteConfig';
import type { SectionData } from '@/types';

interface SectionErrorBoundaryProps {
  children: React.ReactNode;
  fallbackKey: string;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
}

class SectionErrorBoundary extends React.Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (__DEV__) {
      console.warn(`[SectionErrorBoundary] Section '${this.props.fallbackKey}' crashed:`, error);
    }
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

interface DynamicRendererProps {
  sections?: string[];
  components?: ComponentConfig[];
  config: MergedWebsiteConfig | any;
  data: SectionData;
}

export default function DynamicRenderer({
  sections,
  components,
  config,
  data,
}: DynamicRendererProps) {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    if (path === '/') {
      router.replace('/(tabs)');
    } else {
      router.push(path as any);
    }
  };

  // Modern Path: Driven by typed ComponentConfig[] from SiteConfig
  const effectiveComponents: ComponentConfig[] =
    components || config?.components?.home || [];

  if (Array.isArray(effectiveComponents) && effectiveComponents.length > 0) {
    const appComponents = effectiveComponents
      .filter((c) => c.enabled !== false && (!c.platforms || c.platforms.includes('app')))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return (
      <View style={styles.container}>
        {appComponents.map((comp) => {
          const Component = resolveMobileComponent(comp);
          const key = comp.id || `${comp.type}:${comp.variant || 'default'}`;

          if (!Component) {
            return null;
          }

          return (
            <SectionErrorBoundary key={key} fallbackKey={key}>
              <Component
                component={comp}
                config={config}
                data={data}
                onNavigate={handleNavigate}
              />
            </SectionErrorBoundary>
          );
        })}
      </View>
    );
  }

  // Legacy Fallback Path: Driven by string section keys
  const fallbackSections = sections || config?.homeSections || [];

  return (
    <View style={styles.container}>
      {fallbackSections.map((sectionKey: string, index: number) => {
        const SectionComponent = componentRegistry[sectionKey];

        if (!SectionComponent) {
          return null;
        }

        return (
          <SectionErrorBoundary
            key={`${sectionKey}-${index}`}
            fallbackKey={`${sectionKey}-${index}`}
          >
            <SectionComponent
              config={config}
              data={data}
              onNavigate={handleNavigate}
            />
          </SectionErrorBoundary>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
