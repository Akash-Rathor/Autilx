import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { SITES, type SiteEntry } from '@/constants/sites';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ViewMode = 'list' | 'browser';

const STORAGE_KEY = 'sites';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [openTabs, setOpenTabs] = useState<SiteEntry[]>([]);
  const [sites, setSites] = useState<SiteEntry[]>(SITES);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Load sites from localStorage (web) on mount
  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window?.localStorage) {
        return;
      }
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SiteEntry[];
      if (Array.isArray(parsed)) {
        setSites(parsed);
      }
    } catch {
      // Ignore storage errors and fall back to defaults
    }
  }, []);

  // Persist sites to localStorage whenever they change (web)
  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window?.localStorage) {
        return;
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
    } catch {
      // Ignore storage errors
    }
  }, [sites]);

  const openSite = useCallback((site: SiteEntry) => {
    setOpenTabs((prev) => {
      const existing = prev.findIndex((t) => t.id === site.id);
      if (existing >= 0) {
        setActiveTabIndex(existing);
        return prev;
      }
      const next = [...prev, site];
      setActiveTabIndex(next.length - 1);
      return next;
    });
    setViewMode('browser');
  }, []);

  const goHome = useCallback(() => {
    setViewMode('list');
  }, []);

  const switchTab = useCallback((index: number) => {
    setActiveTabIndex(index);
  }, []);

  const addSite = useCallback(() => {
    const title = newTitle.trim();
    let url = newUrl.trim();

    if (!title || !url) {
      return;
    }

    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    const id = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const entry: SiteEntry = { id, title, url };

    setSites((prev) => [...prev, entry]);
    setNewTitle('');
    setNewUrl('');
  }, [newTitle, newUrl]);

  const deleteSite = useCallback((id: string) => {
    setSites((prev) => prev.filter((site) => site.id !== id));
    setOpenTabs((prev) => prev.filter((tab) => tab.id !== id));
    setActiveTabIndex(0);
  }, []);

  const colors = Colors[colorScheme ?? 'light'];

  if (viewMode === 'browser' && openTabs.length > 0) {
    return (
      <ThemedView style={styles.container}>
        {/* Top bar: back + tab switcher */}
        <View
          style={[
            styles.topBar,
            {
              paddingTop: insets.top,
              backgroundColor: colors.background,
              borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee',
            },
          ]}
        >
          <Pressable
            onPress={goHome}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <ThemedText type="defaultSemiBold" style={styles.backLabel}>
              ← Home
            </ThemedText>
          </Pressable>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
            style={styles.tabScroll}
          >
            {openTabs.map((site, index) => (
              <Pressable
                key={site.id}
                onPress={() => switchTab(index)}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor:
                      index === activeTabIndex ? colors.tint : 'transparent',
                    borderColor: colors.tint,
                  },
                ]}
              >
                <ThemedText
                  type="defaultSemiBold"
                  style={[
                    styles.tabPillText,
                    index === activeTabIndex && styles.tabPillTextActive,
                    index === activeTabIndex
                      ? { color: '#fff' }
                      : { color: colors.text },
                  ]}
                  numberOfLines={1}
                >
                  {site.title}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        {/* WebViews: all mounted, only active visible to preserve state */}
        <View style={styles.webviewContainer}>
          {openTabs.map((site, index) => (
            <View
              key={site.id}
              style={[
                StyleSheet.absoluteFill,
                index !== activeTabIndex && styles.webviewHidden,
              ]}
              pointerEvents={index === activeTabIndex ? 'auto' : 'none'}
            >
              <WebView
                source={{ uri: site.url }}
                style={styles.webview}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                scalesPageToFit
              />
            </View>
          ))}
        </View>
      </ThemedView>
    );
  }

  // List view: configurable site buttons
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.listHeader}>
        <ThemedText type="title">Sites</ThemedText>
        <ThemedText type="default" style={styles.listSubtitle}>
          Tap a site to open it in the app. Switch between open sites from the
          top bar; going back to home keeps your tabs.
        </ThemedText>
      </View>
      <View style={styles.formContainer}>
        <ThemedText type="defaultSemiBold" style={styles.formLabel}>
          Add a custom site
        </ThemedText>
        <View style={styles.formRow}>
          <TextInput
            placeholder="Title"
            placeholderTextColor={colorScheme === 'dark' ? '#777' : '#999'}
            value={newTitle}
            onChangeText={setNewTitle}
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
                backgroundColor: colorScheme === 'dark' ? '#151515' : '#fafafa',
              },
            ]}
          />
          <TextInput
            placeholder="URL (e.g. https://example.com)"
            placeholderTextColor={colorScheme === 'dark' ? '#777' : '#999'}
            value={newUrl}
            onChangeText={setNewUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
                backgroundColor: colorScheme === 'dark' ? '#151515' : '#fafafa',
              },
            ]}
          />
        </View>
        <Pressable
          onPress={addSite}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: colors.tint },
            pressed && styles.addButtonPressed,
          ]}
        >
          <ThemedText
            type="defaultSemiBold"
            style={styles.addButtonLabel}
          >
            Add site
          </ThemedText>
        </Pressable>
      </View>
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {sites.map((site) => (
          <View
            key={site.id}
            style={[
              styles.siteButton,
              {
                backgroundColor: colorScheme === 'dark' ? '#252525' : '#f0f0f0',
                borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
              },
            ]}
          >
            <Pressable
              onPress={() => openSite(site)}
              style={({ pressed }) => [
                styles.siteInfo,
                pressed && styles.siteButtonPressed,
              ]}
            >
              <ThemedText type="subtitle" style={styles.siteButtonTitle}>
                {site.title}
              </ThemedText>
              <ThemedText type="default" style={styles.siteButtonUrl}>
                {site.url}
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => deleteSite(site.id)}
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.deleteButtonPressed,
              ]}
            >
              <ThemedText type="defaultSemiBold" style={styles.deleteButtonLabel}>
                ✕
              </ThemedText>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  backButton: {
    paddingVertical: 10,
    paddingRight: 12,
    marginRight: 4,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  backLabel: {
    fontSize: 16,
  },
  tabScroll: {
    flex: 1,
    maxHeight: 44,
  },
  tabScrollContent: {
    alignItems: 'center',
    gap: 8,
    paddingRight: 16,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  tabPillText: {
    fontSize: 14,
  },
  tabPillTextActive: {
    color: '#fff',
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  webviewHidden: {
    left: 10000,
    right: -10000,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  listSubtitle: {
    marginTop: 8,
    opacity: 0.8,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
  },
  formLabel: {
    marginBottom: 4,
  },
  formRow: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  addButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  addButtonPressed: {
    opacity: 0.85,
  },
  addButtonLabel: {
    color: '#ffffff',
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  siteButton: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  siteButtonPressed: {
    opacity: 0.85,
  },
  siteInfo: {
    flex: 1,
  },
  siteButtonTitle: {
    marginBottom: 4,
  },
  siteButtonUrl: {
    fontSize: 13,
    opacity: 0.7,
  },
  deleteButton: {
    marginLeft: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ff4d4f22',
  },
  deleteButtonPressed: {
    opacity: 0.9,
  },
  deleteButtonLabel: {
    color: '#ff4d4f',
    fontSize: 14,
  },
});
