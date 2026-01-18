import { useCallback, useRef, useState } from 'react';
import { useAuth } from '../context/AuthProvider';
import { sheetsApi } from '../services/googleSheets';

export const useSheetSync = ({ range, mapFromSheet, mapToSheet, enabled = true }) => {
  const { accessToken, sheetAccess } = useAuth();
  const canSync = Boolean(accessToken) && sheetAccess?.allowed && enabled;

  const [isSyncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const hydratedRef = useRef(false);

  const pull = useCallback(async () => {
    if (!canSync) return null;
    setSyncing(true);
    try {
      const data = await sheetsApi.read(range, accessToken);
      const mapped = mapFromSheet(data?.values ?? []);
      hydratedRef.current = true;
      setSyncError(null);
      return mapped;
    } catch (error) {
      hydratedRef.current = true;
      setSyncError(error.message || 'Не удалось получить данные Google Sheets');
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [canSync, range, accessToken, mapFromSheet]);

  const push = useCallback(
    async items => {
      if (!canSync) return;
      if (!hydratedRef.current) {
        hydratedRef.current = true;
      }
      setSyncing(true);
      try {
        const rows = mapToSheet(items);
        await sheetsApi.clear(range, accessToken);
        await sheetsApi.write(range, rows, accessToken);
        setSyncError(null);
      } catch (error) {
        setSyncError(error.message || 'Не удалось сохранить данные в Google Sheets');
        throw error;
      } finally {
        setSyncing(false);
      }
    },
    [canSync, range, accessToken, mapToSheet],
  );

  const resetHydration = useCallback(() => {
    hydratedRef.current = false;
  }, []);

  return {
    canSync,
    pull,
    push,
    isSyncing,
    syncError,
    hydratedRef,
    resetHydration,
  };
};
