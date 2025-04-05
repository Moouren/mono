// libs/shell/src/lib/services/auth/hooks.ts
import { useContext, useCallback } from 'react';
import { AuthContext, AuthContextProps } from './context';
import { LoginCredentials, RegisterCredentials } from './types';

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export const useLogin = () => {
  const { login, state } = useAuth();
  
  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      // eslint-disable-next-line no-useless-catch
      try {
        return await login(credentials);
      } catch (error) {
        throw error;
      }
    },
    [login]
  );
  
  return {
    login: handleLogin,
    loading: state.loading,
    error: state.error,
  };
};

export const useRegister = () => {
  const { register, state } = useAuth();
  
  const handleRegister = useCallback(
    async (credentials: RegisterCredentials) => {
      // eslint-disable-next-line no-useless-catch
      try {
        return await register(credentials);
      } catch (error) {
        throw error;
      }
    },
    [register]
  );
  
  return {
    register: handleRegister,
    loading: state.loading,
    error: state.error,
  };
};

export const useLogout = () => {
  const { logout, state } = useAuth();
  
  return {
    logout,
    loading: state.loading,
  };
};

export const useAuthState = () => {
  const { state } = useAuth();
  
  return {
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    loading: state.loading,
    error: state.error,
  };
};