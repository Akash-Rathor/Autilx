import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { SITES, type SiteEntry } from '@/constants/sites';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ViewMode = 'list' | 'browser';

const STORAGE_KEY = 'sites';

export function GoogleServicesTool() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [openTabs, setOpenTabs] = useState<SiteEntry[]>([]);
  const [sites, setSites] = useState<SiteEntry[]>(SITES);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const webviewRefs = useRef<(WebView | null)[]>([]);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load sites from persistent storage on mount
  useEffect(() => {
    (async () => {
      try {
        const raw =
          typeof window !== 'undefined' && window.localStorage
            ? window.localStorage.getItem(STORAGE_KEY)
            : await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as SiteEntry[];
          if (Array.isArray(parsed)) {
            setSites(parsed);
          }
        }
      } catch {
        // Ignore storage errors and fall back to defaults
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  // Persist sites whenever they change
  useEffect(() => {
    if (!isLoaded) return;

    (async () => {
      try {
        const serialized = JSON.stringify(sites);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(STORAGE_KEY, serialized);
        } else {
          await AsyncStorage.setItem(STORAGE_KEY, serialized);
        }
      } catch {
        // Ignore storage errors
      }
    })();
  }, [sites, isLoaded]);

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
    const ref = webviewRefs.current[index];
    if (!ref) {
      setCanGoBack(false);
      setCanGoForward(false);
    }
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
    setIsAddModalVisible(false);
  }, [newTitle, newUrl]);

  const deleteSite = useCallback((id: string) => {
    setSites((prev) => prev.filter((site) => site.id !== id));
    setOpenTabs((prev) => prev.filter((tab) => tab.id !== id));
    setActiveTabIndex(0);
  }, []);
  
  const closeTab = useCallback((index: number) => {
    setOpenTabs((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        setViewMode('list');
        setActiveTabIndex(0);
        return [];
      }
      
      if (index === activeTabIndex) {
        setActiveTabIndex(Math.max(0, index - 1));
      } else if (index < activeTabIndex) {
        setActiveTabIndex(activeTabIndex - 1);
      }
      return next;
    });
  }, [activeTabIndex]);

  const colors = Colors[colorScheme ?? 'light'];
  const handleNavChange = useCallback((navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
  }, []);

  const goWebBack = useCallback(() => {
    const ref = webviewRefs.current[activeTabIndex];
    if (ref && canGoBack) {
      ref.goBack();
    }
  }, [activeTabIndex, canGoBack]);

  const goWebForward = useCallback(() => {
    const ref = webviewRefs.current[activeTabIndex];
    if (ref && canGoForward) {
      ref.goForward();
    }
  }, [activeTabIndex, canGoForward]);

  const getFaviconUrl = useCallback((url: string) => {
    try {
      const parsed = new URL(url);
      return `${parsed.origin}/favicon.ico`;
    } catch {
      return undefined;
    }
  }, []);

  if (viewMode === 'browser' && openTabs.length > 0) {
    return (
      <ThemedView style={styles.container}>
        {/* Top bar: back + tab switcher */}
        <View
          style={[
            styles.topBar,
            {
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
              ← Sites
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
                <TouchableOpacity
                  onPress={(e) => {
                    // Prevent switching tab when closing
                    closeTab(index);
                  }}
                  style={styles.closeTabButton}
                >
                  <ThemedText
                    style={[
                      styles.closeTabIcon,
                      index === activeTabIndex ? { color: '#fff' } : { color: colors.text },
                    ]}
                  >
                    ✕
                  </ThemedText>
                </TouchableOpacity>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.webNavRow}>
            <Pressable
              onPress={goWebBack}
              disabled={!canGoBack}
              style={[
                styles.webNavButton,
                !canGoBack && styles.webNavButtonDisabled,
              ]}
            >
              <ThemedText style={styles.webNavLabel}>{'◀︎'}</ThemedText>
            </Pressable>
            <Pressable
              onPress={goWebForward}
              disabled={!canGoForward}
              style={[
                styles.webNavButton,
                !canGoForward && styles.webNavButtonDisabled,
              ]}
            >
              <ThemedText style={styles.webNavLabel}>{'▶︎'}</ThemedText>
            </Pressable>
          </View>
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
                ref={(ref) => {
                  webviewRefs.current[index] = ref;
                }}
                source={{ uri: site.url }}
                style={styles.webview}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                scalesPageToFit
                onNavigationStateChange={handleNavChange}
              />
            </View>
          ))}
        </View>
      </ThemedView>
    );
  }

  // List view: configurable site buttons
  return (
    <ThemedView style={styles.container}>
      <View style={styles.listHeader}>
        <View style={styles.headerTitleRow}>
          <ThemedText type="subtitle">Manage Sites</ThemedText>
          <TouchableOpacity
            onPress={() => setIsAddModalVisible(true)}
            style={[styles.headerAddButton, { backgroundColor: colors.tint }]}
          >
            <ThemedText style={styles.headerAddButtonText}>+</ThemedText>
          </TouchableOpacity>
        </View>
        <ThemedText type="default" style={styles.listSubtitle}>
          Tap a site to open it in the app. Switch between open sites from the
          top bar; going back keeps your tabs.
        </ThemedText>
      </View>


      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Add a custom site</ThemedText>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <ThemedText style={styles.modalCloseButton}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
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
                <ThemedText type="defaultSemiBold" style={styles.addButtonLabel}>
                  Add site
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
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
              <View style={styles.siteHeaderRow}>
                {getFaviconUrl(site.url) && (
                  <Image
                    source={{ uri: getFaviconUrl(site.url)! }}
                    style={styles.favicon}
                  />
                )}
                <ThemedText type="subtitle" style={styles.siteButtonTitle}>
                  {site.title}
                </ThemedText>
              </View>
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
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  webNavRow: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  webNavButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  webNavButtonDisabled: {
    opacity: 0.4,
  },
  webNavLabel: {
    fontSize: 14,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerAddButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAddButtonText: {
    color: '#fff',
    fontSize: 24,
    lineHeight: 28,
  },
  listSubtitle: {
    marginTop: 4,
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalCloseButton: {
    fontSize: 20,
    opacity: 0.5,
    padding: 4,
  },
  formContainer: {
    gap: 16,
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
  siteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  favicon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#00000022',
  },
  closeTabButton: {
    padding: 2,
    marginLeft: 2,
  },
  closeTabIcon: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

