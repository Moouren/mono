// libs/shell/src/lib/services/auth/context.tsx
import React, { createContext, useEffect, useState, useCallback, ReactNode, JSX } from 'react';
import { AuthService } from './auth.service';
import { 
  AuthState, 
  LoginCredentials, 
  RegisterCredentials, 
  User, 
  AuthResponse 
} from './types';
import dynamic from 'next/dynamic';

// Define the context props interface
export interface AuthContextProps {
  state: AuthState;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (credentials: RegisterCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  redirectAfterLogin?: string;
  setRedirectAfterLogin: (url: string) => void;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: true,
  error: null,
};

// Create the context with the correct type
export const AuthContext = createContext<AuthContextProps>({
  state: initialState,
  login: async () => {
    throw new Error('Auth provider not initialized');
  },
  register: async () => {
    throw new Error('Auth provider not initialized');
  },
  logout: async () => {
    throw new Error('Auth provider not initialized');
  },
  setUser: () => {
    throw new Error('Auth provider not initialized');
  },
  redirectAfterLogin: undefined,
  setRedirectAfterLogin: () => {
    throw new Error('Auth provider not initialized');
  }
});

// Define prop types for the AuthProvider
export interface AuthProviderProps {
  children: ReactNode;
  authService: AuthService;
  forceTokenRefresh?: boolean;
}

// Helper to check if we're in a browser environment
const isBrowser = () => typeof window !== 'undefined';

// Storage key for redirect URL
const REDIRECT_STORAGE_KEY = 'auth_redirect_url';

// The internal AuthProvider component
const AuthProviderComponent = ({ 
  children, 
  authService,
  forceTokenRefresh = false
}: AuthProviderProps): JSX.Element => {
  const [state, setState] = useState<AuthState>(initialState);
  const [redirectAfterLogin, setRedirectAfterLoginState] = useState<string | undefined>(
    isBrowser() ? localStorage.getItem(REDIRECT_STORAGE_KEY) || undefined : undefined
  );

  // Store redirect URL in localStorage
  const setRedirectAfterLogin = useCallback((url: string) => {
    setRedirectAfterLoginState(url);
    if (isBrowser()) {
      localStorage.setItem(REDIRECT_STORAGE_KEY, url);
    }
  }, []);

  // Clear redirect URL from localStorage
  const clearRedirectAfterLogin = useCallback(() => {
    setRedirectAfterLoginState(undefined);
    if (isBrowser()) {
      localStorage.removeItem(REDIRECT_STORAGE_KEY);
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    // Skip initialization on server
    if (!isBrowser()) return;
    
    const initializeAuth = async () => {
      const isAuthenticated = authService.isAuthenticated();
      const user = authService.getCurrentUser();
      
      // If tokens exist but need refresh, do it now
      if (isAuthenticated && forceTokenRefresh) {
        try {
          const tokens = authService.getTokensFromStorage();
          if (tokens?.refreshToken) {
            await authService.refreshToken(tokens.refreshToken);
          }
        } catch (error) {
          console.error('Token refresh failed during initialization:', error);
        }
      }
      
      setState((prevState) => ({
        ...prevState,
        isAuthenticated,
        user,
        loading: false,
      }));
    };

    initializeAuth();
  }, [authService, forceTokenRefresh]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setState((prevState) => ({ ...prevState, loading: true, error: null }));
      
      try {
        const response = await authService.login(credentials);
        
        setState((prevState) => ({
          ...prevState,
          isAuthenticated: true,
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          loading: false,
          error: null,
        }));
        
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Login failed';
        
        setState((prevState) => ({
          ...prevState,
          isAuthenticated: false,
          loading: false,
          error: errorMessage,
        }));
        
        throw error;
      }
    },
    [authService]
  );

  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      setState((prevState) => ({ ...prevState, loading: true, error: null }));
      
      try {
        const response = await authService.register(credentials);
        
        setState((prevState) => ({
          ...prevState,
          isAuthenticated: true,
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          loading: false,
          error: null,
        }));
        
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Registration failed';
        
        setState((prevState) => ({
          ...prevState,
          isAuthenticated: false,
          loading: false,
          error: errorMessage,
        }));
        
        throw error;
      }
    },
    [authService]
  );

  const logout = useCallback(async () => {
    setState((prevState) => ({ ...prevState, loading: true }));
    
    try {
      await authService.logout();
      clearRedirectAfterLogin();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setState({
        ...initialState,
        loading: false,
      });
    }
  }, [authService, clearRedirectAfterLogin]);

  const setUser = useCallback((user: User) => {
    setState((prevState) => ({
      ...prevState,
      user,
    }));
  }, []);

  // Create the value object explicitly
  const contextValue: AuthContextProps = {
    state,
    login,
    register,
    logout,
    setUser,
    redirectAfterLogin,
    setRedirectAfterLogin
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a dynamically imported version that only runs on the client
export const AuthProvider = dynamic(() => Promise.resolve(AuthProviderComponent), {
  ssr: false
}) as React.FC<AuthProviderProps>;