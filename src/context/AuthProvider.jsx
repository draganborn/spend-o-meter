import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { googleLogout } from '@react-oauth/google';
import { safeStorage } from '../hooks/useSafeLocalStorage';
import { rowsToObjects } from '../services/googleSheets';

const STORAGE_KEY = 'auth:user';
const ACCESS_RANGE = 'Access!A:E';
const ACCESS_HEADERS = ['ID_user', 'email', 'role', 'active'];
const DEFAULT_SHEET_ACCESS = { allowed: false, role: null };

const getStoredAuthState = () => {
  const stored = safeStorage.getJSON(STORAGE_KEY);
  if (!stored) {
    return {
      user: null,
      googleSub: null,
      token: null,
      sheetAccess: DEFAULT_SHEET_ACCESS,
    };
  }

  if (stored.profile || stored.accessToken || stored.sheetAccess) {
    return {
      user: stored.profile ?? null,
      googleSub: stored.googleSub ?? stored.profile?.id ?? null,
      token: stored.accessToken ?? null,
      sheetAccess: stored.sheetAccess ?? DEFAULT_SHEET_ACCESS,
    };
  }

  return {
    user: stored,
    googleSub: stored?.id ?? null,
    token: stored,
    sheetAccess: DEFAULT_SHEET_ACCESS,
  };
};

const AuthContext = createContext();

const parseBoolean = value => {
  if (typeof value === 'boolean') return value;
  if (value === null || value === undefined) return false;
  const normalized = `${value}`.toLowerCase().replace(/[^a-z0-9]/g, '');
  return normalized === 'true' || normalized === '1';
};

const readSheetAccess = async (googleSub, email) => {
  if (!googleSub || !email) {
    return { allowed: false, role: null };
  }

  try {
    const response = await fetch('/api/sheets-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        google_sub: googleSub,
        range: ACCESS_RANGE,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to read Access sheet');
    }

    const sheetResponse = await response.json();
    const rows = rowsToObjects(sheetResponse?.values ?? [], ACCESS_HEADERS);
    const match = rows.find(entry => entry.email?.toLowerCase() === email.toLowerCase());
    if (!match) {
      return { allowed: false, role: null };
    }

    const active = parseBoolean(match.active);
    return {
      allowed: active,
      role: match.role || 'read',
      entry: match,
    };
  } catch (error) {
    if (error?.message?.includes('insufficient authentication scopes')) {
      throw new Error('AUTH_SCOPE_INSUFFICIENT');
    }
    console.warn('Failed to read Access sheet', error);
    return { allowed: false, role: null, error: error.message };
  }
};

export const AuthProvider = ({ children }) => {
  const storedAuth = useMemo(() => getStoredAuthState(), []);
  const [user, setUser] = useState(storedAuth.user);
  const [isAuthLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState(storedAuth.token);
  const [googleSub, setGoogleSub] = useState(storedAuth.googleSub);
  const [sheetAccess, setSheetAccess] = useState(storedAuth.sheetAccess);
  
  const initializeFromAuthPayload = useCallback(async authPayload => {
    setAuthLoading(true);
    setError(null);
    try {
      const userPayload = {
        id: authPayload.google_sub,
        name: authPayload.name,
        email: authPayload.email,
        picture: authPayload.picture,
        givenName: authPayload.given_name,
        familyName: authPayload.family_name,
      };

      const access = await readSheetAccess(authPayload.google_sub, authPayload.email);

      setUser(userPayload);
      setGoogleSub(authPayload.google_sub);
      setAccessToken(null);
      setSheetAccess(access);

      safeStorage.setJSON(STORAGE_KEY, {
        profile: userPayload,
        googleSub: authPayload.google_sub,
        accessToken: null,
        sheetAccess: access,
      });
    } catch (err) {
      console.error('Failed to initialize auth from backend payload', err);
      setError('AUTH_PROFILE_ERROR');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const authParam = url.searchParams.get('auth');
    if (!authParam) return;

    try {
      const decoded = decodeURIComponent(authParam);
      const payload = JSON.parse(decoded);
      if (payload?.google_sub && payload?.email) {
        initializeFromAuthPayload(payload);
      }
    } catch (err) {
      console.error('Failed to parse auth payload from URL', err);
      setError('AUTH_PROFILE_ERROR');
    } finally {
      url.searchParams.delete('auth');
      const newUrl = `${url.pathname}${url.search ? `?${url.searchParams.toString()}` : ''}${url.hash}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [initializeFromAuthPayload]);

  const login = useCallback(() => {
    if (typeof window === 'undefined') return;
    setAuthLoading(true);
    setError(null);
    window.location.href = '/api/auth-start';
  }, []);

  const logout = useCallback(() => {
    googleLogout();
    setUser(null);
    setGoogleSub(null);
    setAccessToken(null);
    setSheetAccess(DEFAULT_SHEET_ACCESS);
    safeStorage.setJSON(STORAGE_KEY, null);
  }, []);

  const refreshSheetAccess = useCallback(async () => {
    if (!googleSub || !user?.email) return { allowed: false, role: null };
    const access = await readSheetAccess(googleSub, user.email);
    setSheetAccess(access);
    safeStorage.setJSON(STORAGE_KEY, {
      profile: user,
      googleSub,
      accessToken,
      sheetAccess: access,
    });
    return access;
  }, [googleSub, user, accessToken]);

  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
      isAuthLoading,
      error,
      accessToken,
      googleSub,
      sheetAccess,
      refreshSheetAccess,
    }),
    [user, login, logout, isAuthLoading, error, accessToken, googleSub, sheetAccess, refreshSheetAccess],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
