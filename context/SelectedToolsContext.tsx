import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'selected-tools';

type SelectedToolsContextValue = {
  selectedToolIds: string[];
  addTool: (id: string) => Promise<void>;
  removeTool: (id: string) => Promise<void>;
};

const SelectedToolsContext = createContext<SelectedToolsContextValue | undefined>(undefined);

export function SelectedToolsProvider({ children }: { children: React.ReactNode }) {
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as string[];
          if (Array.isArray(parsed)) {
            setSelectedToolIds(parsed);
          }
        }
      } catch {
        // ignore
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  // Persist whenever selectedToolIds changes
  useEffect(() => {
    if (!isLoaded) return;

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(selectedToolIds)).catch(() => {
      // ignore
    });
  }, [selectedToolIds, isLoaded]);

  const addTool = useCallback(async (id: string) => {
    setSelectedToolIds((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }, []);

  const removeTool = useCallback(async (id: string) => {
    setSelectedToolIds((prev) => prev.filter((toolId) => toolId !== id));
  }, []);

  return (
    <SelectedToolsContext.Provider value={{ selectedToolIds, addTool, removeTool }}>
      {children}
    </SelectedToolsContext.Provider>
  );
}

export function useSelectedTools() {
  const ctx = useContext(SelectedToolsContext);
  if (!ctx) {
    throw new Error('useSelectedTools must be used within SelectedToolsProvider');
  }
  return ctx;
}

