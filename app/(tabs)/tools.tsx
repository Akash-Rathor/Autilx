import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { TOOLS } from '@/constants/tools';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSelectedTools } from '@/context/SelectedToolsContext';

export default function ToolsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { selectedToolIds, addTool } = useSelectedTools();

  const bookmarkTool = useCallback(
    async (tool: (typeof TOOLS)[number]) => {
      await addTool(tool.id);
    },
    [addTool],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title">Tools</ThemedText>
          <ThemedText type="default" style={styles.subtitle}>
            Bookmark tools to show them on the Home screen.
          </ThemedText>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {TOOLS.map((tool) => (
            <View
              key={tool.id}
              style={[
                styles.toolCard,
                {
                  backgroundColor: colorScheme === 'dark' ? '#252525' : '#f0f0f0',
                  borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
                },
              ]}
            >
              <View style={styles.toolInfo}>
                <View style={styles.toolHeaderRow}>
                  <ThemedText type="subtitle">{tool.title}</ThemedText>
                </View>
                {tool.description ? (
                  <ThemedText type="default" style={styles.description}>
                    {tool.description}
                  </ThemedText>
                ) : null}
                {selectedToolIds.includes(tool.id) ? (
                  <ThemedText type="default" style={styles.addedLabel}>
                    Added to home
                  </ThemedText>
                ) : null}
              </View>
              <Pressable
                onPress={() => bookmarkTool(tool)}
                style={({ pressed }) => [
                  styles.bookmarkButton,
                  { backgroundColor: colors.tint },
                  pressed && styles.bookmarkButtonPressed,
                ]}
              >
                <ThemedText style={styles.bookmarkLabel}>＋</ThemedText>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.8,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  toolCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolInfo: {
    flex: 1,
  },
  toolHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  description: {
    marginTop: 4,
  },
  addedLabel: {
    marginTop: 4,
    fontSize: 13,
    opacity: 0.7,
  },
  bookmarkButton: {
    marginLeft: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  bookmarkButtonPressed: {
    opacity: 0.85,
  },
  bookmarkLabel: {
    color: '#ffffff',
    fontSize: 18,
  },
});

