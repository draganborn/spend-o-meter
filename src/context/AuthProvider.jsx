import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { safeStorage } from '../hooks/useSafeLocalStorage';
import { sheetsApi, rowsToObjects } from '../services/googleSheets';

const STORAGE_KEY = 'auth:user';
const ACCESS_RANGE = 'Access!A:E';
const ACCESS_HEADERS = ['ID_user', 'email', 'role', 'active'];

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
    console.warn('Failed to read Access sheet', error);
    return { allowed: false, role: null, error: error.message };
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => safeStorage.getJSON(STORAGE_KEY));
  const [isAuthLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [sheetAccess, setSheetAccess] = useState({ allowed: false, role: null });

  const handleProfile = useCallback(async tokenResponse => {
    setAuthLoading(true);
    setError(null);
    try {
      const token = tokenResponse?.access_token;
      if (!token) {
        throw new Error('Missing Google access token');
      }

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
      safeStorage.setJSON(STORAGE_KEY, userPayload);
    } catch (err) {
      console.error('Failed to fetch Google profile', err);
      setError('AUTH_PROFILE_ERROR');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const login = useGoogleLogin({
    scope: 'openid profile email https://www.googleapis.com/auth/spreadsheets',
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
    setSheetAccess({ allowed: false, role: null });
    safeStorage.setJSON(STORAGE_KEY, null);
  }, []);

  const refreshSheetAccess = useCallback(async () => {
    if (!accessToken || !user?.email) return { allowed: false, role: null };
    const access = await readSheetAccess(accessToken, user.email);
    setSheetAccess(access);
    return access;
  }, [accessToken, user?.email]);

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
