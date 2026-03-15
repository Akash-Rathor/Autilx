import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'selected-tools';

type SelectedToolsContextValue = {
  selectedToolIds: string[];
  addTool: (id: string) => Promise<void>;
};

const SelectedToolsContext = createContext<SelectedToolsContextValue | undefined>(undefined);

export function SelectedToolsProvider({ children }: { children: React.ReactNode }) {
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed)) {
          setSelectedToolIds(parsed);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const addTool = useCallback(async (id: string) => {
    setSelectedToolIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
        // ignore
      });
      return next;
    });
  }, []);

  return (
    <SelectedToolsContext.Provider value={{ selectedToolIds, addTool }}>
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

