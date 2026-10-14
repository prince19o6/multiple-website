/**
 * components/DynamicRenderer.tsx
 *
 * Config-driven section engine.
 * Receives the list of section keys from the API config (homeSections)
 * and renders the matching registered React Native components in sequence.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { componentRegistry } from '@/lib/componentRegistry';
import type { MergedWebsiteConfig } from '@/lib/mergeWebsiteConfig';
import type { SectionData } from '@/types';

interface DynamicRendererProps {
  sections: string[];
  config: MergedWebsiteConfig;
  data: SectionData;
}

export default function DynamicRenderer({
  sections,
  config,
  data,
}: DynamicRendererProps) {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    if (path === '/') {
      router.replace('/(app)');
    } else {
      router.push(path as any);
    }
  };

  return (
    <View style={styles.container}>
      {sections.map((sectionKey, index) => {
        const SectionComponent = componentRegistry[sectionKey];

        if (!SectionComponent) {
          // Unknown or remote-injected component string — silently skip for security
          return null;
        }

        return (
          <SectionComponent
            key={`${sectionKey}-${index}`}
            config={config}
            data={data}
            onNavigate={handleNavigate}
          />
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
