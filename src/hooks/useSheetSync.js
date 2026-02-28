import { useCallback, useRef, useState } from 'react';
import { useAuth } from '../context/AuthProvider';
import { sheetsApi } from '../services/googleSheets';

export const useSheetSync = ({ range, mapFromSheet, mapToSheet, enabled = true }) => {
  const { accessToken, googleSub, sheetAccess } = useAuth();
  const canSync = sheetAccess?.allowed && enabled && (Boolean(googleSub) || Boolean(accessToken));

  const [isSyncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const hydratedRef = useRef(false);

  const pull = useCallback(async () => {
    if (!canSync) return null;
    setSyncing(true);
    try {
      let values;
      if (googleSub) {
        const response = await fetch('/.netlify/functions/sheets-read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            google_sub: googleSub,
            range,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || 'Не удалось получить данные Google Sheets через backend');
        }

        const json = await response.json();
        values = json?.values ?? [];
      } else {
        const data = await sheetsApi.read(range, accessToken);
        values = data?.values ?? [];
      }

      const mapped = mapFromSheet(values);
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
  }, [canSync, range, googleSub, accessToken, mapFromSheet]);

  const push = useCallback(
    async items => {
      if (!canSync) return;
      if (!hydratedRef.current) {
        hydratedRef.current = true;
      }
      setSyncing(true);
      try {
        const rows = mapToSheet(items);

        if (googleSub) {
          const response = await fetch('/.netlify/functions/sheets-write', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              google_sub: googleSub,
              range,
              values: rows,
            }),
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(text || 'Не удалось сохранить данные в Google Sheets через backend');
          }
        } else {
          await sheetsApi.clear(range, accessToken);
          await sheetsApi.write(range, rows, accessToken);
        }

        setSyncError(null);
      } catch (error) {
        setSyncError(error.message || 'Не удалось сохранить данные в Google Sheets');
        throw error;
      } finally {
        setSyncing(false);
      }
    },
    [canSync, range, googleSub, accessToken, mapToSheet],
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
