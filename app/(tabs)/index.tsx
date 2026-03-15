import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { GoogleServicesTool } from '@/tools/google-services/GoogleServicesTool';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSelectedTools } from '@/context/SelectedToolsContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { selectedToolIds, removeTool } = useSelectedTools();
  const [openedToolId, setOpenedToolId] = useState<string | null>(null);

  const goToTools = useCallback(() => {
    router.push('/(tabs)/tools');
  }, [router]);

  const handleRemoveTool = useCallback((id: string) => {
    Alert.alert(
      'Remove Tool',
      `Are you sure you want to remove ${id === 'google-services' ? 'Google Services' : id} from your home page?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => removeTool(id)
        },
      ]
    );
  }, [removeTool]);

  const hasGoogleServices = selectedToolIds.includes('google-services');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {!hasGoogleServices ? (
        <ThemedView style={[styles.container, styles.centerContent]}>
          <ThemedText type="title">No tools added yet</ThemedText>
          <ThemedText type="default" style={styles.subtitle}>
            Click on &quot;Add tools&quot; to select tools and show them here.
          </ThemedText>
          <Pressable
            onPress={goToTools}
            style={({ pressed }) => [
              styles.addToolsButton,
              { backgroundColor: colors.tint },
              pressed && styles.addToolsButtonPressed,
            ]}
          >
            <ThemedText type="defaultSemiBold" style={styles.addToolsLabel}>
              Add tools
            </ThemedText>
          </Pressable>
        </ThemedView>
      ) : (
        <ThemedView style={styles.container}>
          {openedToolId ? (
            <ThemedView style={styles.toolContainer}>
              <View style={[styles.toolHeader, { borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
                <TouchableOpacity
                  onPress={() => setOpenedToolId(null)}
                  style={styles.homeIconButton}
                >
                  <IconSymbol name="house.fill" size={24} color={colors.tint} />
                </TouchableOpacity>
                <ThemedText type="defaultSemiBold" style={styles.toolHeaderTitle}>
                  {openedToolId === 'google-services' ? 'Google Services' : openedToolId}
                </ThemedText>
                <View style={{ width: 40 }} /> 
              </View>
              <View style={styles.toolContent}>
                {openedToolId === 'google-services' && <GoogleServicesTool />}
              </View>
            </ThemedView>
          ) : (
            <ScrollView
              style={styles.container}
              contentContainerStyle={styles.scrollContent}
            >
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Your Tools
              </ThemedText>
              {selectedToolIds.map((id) => (
                <Pressable
                  key={id}
                  onPress={() => setOpenedToolId(id)}
                  style={({ pressed }) => [
                    styles.toolCard,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#252525' : '#f0f0f0',
                      borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
                    },
                    pressed && styles.toolCardPressed,
                  ]}
                >
                  <ThemedView style={styles.toolCardInfo}>
                    <View style={styles.toolCardMainInfo}>
                      <ThemedText type="defaultSemiBold" style={styles.toolCardTitle}>
                        {id === 'google-services' ? 'Google Services' : id}
                      </ThemedText>
                      <ThemedText type="default" style={styles.toolCardChevron}>
                        Tap to open →
                      </ThemedText>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveTool(id)}
                      style={styles.removeButton}
                    >
                      <IconSymbol name="trash.fill" size={20} color="#ff4444" />
                    </TouchableOpacity>
                  </ThemedView>
                </Pressable>
              ))}
              <Pressable
                onPress={goToTools}
                style={({ pressed }) => [
                  styles.addMoreButton,
                  pressed && styles.addMoreButtonPressed,
                ]}
              >
                <ThemedText style={{ color: colors.tint }}>
                  + Add more tools
                </ThemedText>
              </Pressable>
            </ScrollView>
          )}
        </ThemedView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.8,
  },
  addToolsButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  addToolsButtonPressed: {
    opacity: 0.85,
  },
  addToolsLabel: {
    color: '#ffffff',
  },
  scrollContent: {
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  toolCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  toolCardPressed: {
    opacity: 0.7,
  },
  toolCardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  toolCardMainInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  removeButton: {
    padding: 8,
    marginLeft: 12,
  },
  toolCardTitle: {
    fontSize: 18,
  },
  toolCardChevron: {
    fontSize: 14,
    opacity: 0.6,
  },
  addMoreButton: {
    marginTop: 12,
    padding: 12,
    alignItems: 'center',
  },
  addMoreButtonPressed: {
    opacity: 0.7,
  },
  toolContainer: {
    flex: 1,
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  homeIconButton: {
    padding: 8,
  },
  toolHeaderTitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  toolContent: {
    flex: 1,
  },
});
