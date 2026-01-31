import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { safeStorage } from '../hooks/useSafeLocalStorage';
import { sheetsApi, rowsToObjects } from '../services/googleSheets';

const STORAGE_KEY = 'auth:user';
const ACCESS_RANGE = 'Access!A:E';
const ACCESS_HEADERS = ['ID_user', 'email', 'role', 'active'];
const GOOGLE_SCOPES = 'openid profile email https://www.googleapis.com/auth/spreadsheets';
const DEFAULT_SHEET_ACCESS = { allowed: false, role: null };
const TOKEN_EXPIRY_GRACE_MS = 60_000; // renew 1 min earlier to avoid borderline 401

const isExpired = expiresAt => {
  if (!expiresAt) return true;
  return Date.now() >= expiresAt;
};

const getStoredAuthState = () => {
  const stored = safeStorage.getJSON(STORAGE_KEY);
  if (!stored) {
    return {
      user: null,
      token: null,
      sheetAccess: DEFAULT_SHEET_ACCESS,
    };
  }

  const tokenExpired = isExpired(stored.expiresAt);

  if (stored.profile || stored.accessToken || stored.sheetAccess) {
    return {
      user: stored.profile ?? null,
      token: tokenExpired ? null : stored.accessToken ?? null,
      sheetAccess: stored.sheetAccess ?? DEFAULT_SHEET_ACCESS,
    };
  }

  return {
    user: stored,
    token: tokenExpired ? null : stored,
    sheetAccess: DEFAULT_SHEET_ACCESS,
  };
};

const AuthContext = createContext();

const fetchGoogleProfile = async accessToken => {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Google profile');
  }

  return response.json();
};

const parseBoolean = value => {
  if (typeof value === 'boolean') return value;
  if (value === null || value === undefined) return false;
  const normalized = `${value}`.toLowerCase().replace(/[^a-z0-9]/g, '');
  return normalized === 'true' || normalized === '1';
};

const readSheetAccess = async (accessToken, email) => {
  if (!accessToken || !email || !import.meta.env.VITE_GOOGLE_SHEET_ID) {
    return { allowed: false, role: null };
  }

  try {
    const sheetResponse = await sheetsApi.read(ACCESS_RANGE, accessToken);
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
  const [sheetAccess, setSheetAccess] = useState(storedAuth.sheetAccess);

  const handleProfile = useCallback(async tokenResponse => {
    setAuthLoading(true);
    setError(null);
    try {
      const token = tokenResponse?.access_token;
      if (!token) {
        throw new Error('Missing Google access token');
      }

      const issuedAt = Date.now();
      const expiresAt = tokenResponse?.expires_in
        ? issuedAt + tokenResponse.expires_in * 1000 - TOKEN_EXPIRY_GRACE_MS
        : null;

      const profile = await fetchGoogleProfile(token);
      const access = await readSheetAccess(token, profile.email);
      const userPayload = {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
        givenName: profile.given_name,
        familyName: profile.family_name,
      };
      setUser(userPayload);
      setAccessToken(token);
      setSheetAccess(access);
      safeStorage.setJSON(STORAGE_KEY, {
        profile: userPayload,
        accessToken: token,
        expiresAt,
        sheetAccess: access,
      });
    } catch (err) {
      console.error('Failed to fetch Google profile', err);
      setError('AUTH_PROFILE_ERROR');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const login = useGoogleLogin({
    scope: GOOGLE_SCOPES,
    prompt: 'consent',
    include_granted_scopes: true,
    onSuccess: handleProfile,
    onError: err => {
      console.error('Google login error', err);
      setError('AUTH_LOGIN_ERROR');
    },
  });

  const logout = useCallback(() => {
    googleLogout();
    setUser(null);
    setAccessToken(null);
    setSheetAccess(DEFAULT_SHEET_ACCESS);
    safeStorage.setJSON(STORAGE_KEY, null);
  }, []);

  const refreshSheetAccess = useCallback(async () => {
    if (!accessToken || !user?.email) return { allowed: false, role: null };
    const access = await readSheetAccess(accessToken, user.email);
    setSheetAccess(access);
    safeStorage.setJSON(STORAGE_KEY, {
      profile: user,
      accessToken,
      sheetAccess: access,
    });
    return access;
  }, [accessToken, user]);

  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
      isAuthLoading,
      error,
      accessToken,
      sheetAccess,
      refreshSheetAccess,
    }),
    [user, login, logout, isAuthLoading, error, accessToken, sheetAccess, refreshSheetAccess],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);
