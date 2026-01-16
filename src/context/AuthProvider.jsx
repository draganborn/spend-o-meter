import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { safeStorage } from '../hooks/useSafeLocalStorage';

const STORAGE_KEY = 'auth:user';

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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => safeStorage.getJSON(STORAGE_KEY));
  const [isAuthLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleProfile = useCallback(async tokenResponse => {
    setAuthLoading(true);
    setError(null);
    try {
      const profile = await fetchGoogleProfile(tokenResponse.access_token);
      const userPayload = {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
        givenName: profile.given_name,
        familyName: profile.family_name,
      };
      setUser(userPayload);
      safeStorage.setJSON(STORAGE_KEY, userPayload);
    } catch (err) {
      console.error('Failed to fetch Google profile', err);
      setError('AUTH_PROFILE_ERROR');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const login = useGoogleLogin({
    scope: 'openid profile email',
    onSuccess: handleProfile,
    onError: err => {
      console.error('Google login error', err);
      setError('AUTH_LOGIN_ERROR');
    },
  });

  const logout = useCallback(() => {
    googleLogout();
    setUser(null);
    safeStorage.setJSON(STORAGE_KEY, null);
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
      isAuthLoading,
      error,
    }),
    [user, login, logout, isAuthLoading, error],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);
