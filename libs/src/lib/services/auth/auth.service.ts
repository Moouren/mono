// libs/shell/src/lib/services/auth/auth.service.ts
import axios, { AxiosInstance } from 'axios';
import { jwtDecode } from 'jwt-decode';
import { 
  AuthResponse, 
  LoginCredentials, 
  RegisterCredentials, 
  User 
} from './types';

export class AuthService {
  // Shared token storage key
  public static readonly TOKEN_STORAGE_KEY = 'my_monorepo_auth_tokens';
  
  private readonly api: AxiosInstance;
  
  // Cookie settings
  private readonly cookieOptions = {
    path: '/',
    domain: 'localhost', // This allows sharing between all localhost subdomains
    maxAge: 86400, // 1 day in seconds
    secure: false, // Set to true in production with HTTPS
    sameSite: 'lax', // Allows the cookie to be sent with cross-domain navigation
  };
  
  // Mock credentials for testing
  private mockUsers = [
    {
      email: 'admin@example.com',
      password: 'password123',
      name: 'Admin User',
      role: 'admin',
      id: '1'
    },
    {
      email: 'user@example.com',
      password: 'password123',
      name: 'Regular User',
      role: 'user',
      id: '2'
    }
  ];
  
  constructor(baseURL: string) {
    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Add interceptor to add auth token to requests
    this.api.interceptors.request.use(
      (config) => {
        // Only run in browser environment
        if (this.isBrowser()) {
          const tokens = this.getTokensFromStorage();
          if (tokens?.accessToken && config.headers) {
            config.headers.Authorization = `Bearer ${tokens.accessToken}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Add interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Only run in browser environment
            if (this.isBrowser()) {
              const tokens = this.getTokensFromStorage();
              if (tokens?.refreshToken) {
                const newTokens = await this.refreshToken(tokens.refreshToken);
                
                if (newTokens) {
                  // Update the request with the new token
                  originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
                  return this.api(originalRequest);
                }
              }
            }
          } catch (refreshError) {
            // If refresh fails, log out
            this.logout();
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  // Helper method to check if we're in a browser environment
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }
  
  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // In development/testing mode, use mock authentication
    if (process.env.NODE_ENV !== 'production') {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const user = this.mockUsers.find(u => u.email === credentials.email);
      
      if (!user || user.password !== credentials.password) {
        throw new Error('Invalid email or password');
      }
      
      // Create mock tokens with encoded user info
      // In real app, these would be JWTs with proper expiration
      const now = new Date();
      const exp = new Date(now.getTime() + 30 * 60000); // 30 minutes
      
      // Create a simple mock token that contains user info and expiration
      const tokenPayload = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        exp: Math.floor(exp.getTime() / 1000)
      };
      
      // Base64 encode the token payload - this is just for mocking!
      // Real JWT would be properly signed
      const accessToken = btoa(JSON.stringify(tokenPayload));
      const refreshToken = 'mock-refresh-token-' + user.id;
      
      const response: AuthResponse = {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      };
      
      // Only save tokens if in browser environment
      if (this.isBrowser()) {
        this.saveTokensToStorage(response);
      }
      
      return response;
    }
    
    // For production, use the real API
    const response = await this.api.post<AuthResponse>('/auth/login', credentials);
    
    // Only save tokens if in browser environment
    if (this.isBrowser()) {
      this.saveTokensToStorage(response.data);
    }
    
    return response.data;
  }
  
  public async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    // In development/testing mode, use mock registration
    if (process.env.NODE_ENV !== 'production') {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Check if user already exists
      if (this.mockUsers.some(u => u.email === credentials.email)) {
        throw new Error('User with this email already exists');
      }
      
      // Create new mock user
      const newUser = {
        id: (this.mockUsers.length + 1).toString(),
        email: credentials.email,
        password: credentials.password,
        name: credentials.name,
        role: 'user'
      };
      
      // Add to mock users (in real app this would persist to database)
      this.mockUsers.push(newUser);
      
      // Create tokens like in the login method
      const now = new Date();
      const exp = new Date(now.getTime() + 30 * 60000); // 30 minutes
      
      const tokenPayload = {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        },
        exp: Math.floor(exp.getTime() / 1000)
      };
      
      const accessToken = btoa(JSON.stringify(tokenPayload));
      const refreshToken = 'mock-refresh-token-' + newUser.id;
      
      const response: AuthResponse = {
        accessToken,
        refreshToken,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        }
      };
      
      // Only save tokens if in browser environment
      if (this.isBrowser()) {
        this.saveTokensToStorage(response);
      }
      
      return response;
    }
    
    // For production, use the real API
    const response = await this.api.post<AuthResponse>('/auth/register', credentials);
    
    // Only save tokens if in browser environment
    if (this.isBrowser()) {
      this.saveTokensToStorage(response.data);
    }
    
    return response.data;
  }
  
  public async logout(): Promise<void> {
    // Only proceed if in browser environment
    if (!this.isBrowser()) return;
    
    // In development/testing mode, simply clear storage
    if (process.env.NODE_ENV !== 'production') {
      this.clearTokensFromStorage();
      return;
    }
    
    // For production, call the API
    const tokens = this.getTokensFromStorage();
    
    if (tokens?.refreshToken) {
      try {
        await this.api.post('/auth/logout', { refreshToken: tokens.refreshToken });
      } catch (error) {
        // Continue with logout even if API call fails
        console.error('Logout API call failed:', error);
      }
    }
    
    this.clearTokensFromStorage();
  }
  
  public async refreshToken(refreshToken: string): Promise<AuthResponse | null> {
    // Only proceed if in browser environment
    if (!this.isBrowser()) return null;
    
    // In development/testing mode
    if (process.env.NODE_ENV !== 'production') {
      // Parse the existing token to get the user ID
      const tokens = this.getTokensFromStorage();
      if (!tokens?.accessToken) return null;
      
      try {
        // Decode the mock token
        const decoded = JSON.parse(atob(tokens.accessToken));
        const userId = decoded.user.id;
        
        // Find the user
        const user = this.mockUsers.find(u => u.id === userId);
        if (!user) {
          this.clearTokensFromStorage();
          return null;
        }
        
        // Create new tokens
        const now = new Date();
        const exp = new Date(now.getTime() + 30 * 60000); // 30 minutes
        
        const tokenPayload = {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          exp: Math.floor(exp.getTime() / 1000)
        };
        
        const newAccessToken = btoa(JSON.stringify(tokenPayload));
        const newRefreshToken = 'mock-refresh-token-' + user.id;
        
        const response: AuthResponse = {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        };
        
        this.saveTokensToStorage(response);
        return response;
      } catch (error) {
        this.clearTokensFromStorage();
        return null;
      }
    }
    
    // For production
    try {
      const response = await this.api.post<AuthResponse>('/auth/refresh', {
        refreshToken,
      });
      
      this.saveTokensToStorage(response.data);
      return response.data;
    } catch (error) {
      this.clearTokensFromStorage();
      return null;
    }
  }
  
  public isAuthenticated(): boolean {
    // Only proceed if in browser environment
    if (!this.isBrowser()) return false;
    
    const tokens = this.getTokensFromStorage();
    
    if (!tokens?.accessToken) {
      return false;
    }
    
    try {
      // For development/testing mode
      if (process.env.NODE_ENV !== 'production') {
        try {
          // Decode our mock token (base64 encoded JSON)
          const decoded = JSON.parse(atob(tokens.accessToken));
          const currentTime = Math.floor(Date.now() / 1000);
          
          return decoded.exp > currentTime;
        } catch (e) {
          return false;
        }
      }
      
      // For production, use jwtDecode
      const decodedToken: { exp: number } = jwtDecode(tokens.accessToken);
      const currentTime = Date.now() / 1000;
      
      return decodedToken.exp > currentTime;
    } catch (error) {
      return false;
    }
  }
  
  public getCurrentUser(): User | null {
    // Only proceed if in browser environment
    if (!this.isBrowser()) return null;
    
    const tokens = this.getTokensFromStorage();
    
    if (!tokens?.accessToken) {
      return null;
    }
    
    try {
      // For development/testing mode
      if (process.env.NODE_ENV !== 'production') {
        try {
          // Decode our mock token (base64 encoded JSON)
          const decoded = JSON.parse(atob(tokens.accessToken));
          return decoded.user;
        } catch (e) {
          return null;
        }
      }
      
      // For production, use jwtDecode
      const decodedToken: { user: User } = jwtDecode(tokens.accessToken);
      return decodedToken.user;
    } catch (error) {
      return null;
    }
  }
  
  public async validateAndRefreshToken(): Promise<boolean> {
    // Only proceed if in browser environment
    if (!this.isBrowser()) return false;
    
    try {
      const tokens = this.getTokensFromStorage();
      if (!tokens?.accessToken) {
        return false;
      }
      
      let isValid = false;
      
      // For development/testing mode
      if (process.env.NODE_ENV !== 'production') {
        try {
          // Decode our mock token (base64 encoded JSON)
          const decoded = JSON.parse(atob(tokens.accessToken));
          const currentTime = Math.floor(Date.now() / 1000);
          
          isValid = decoded.exp > currentTime;
        } catch (e) {
          return false;
        }
      } else {
        // Production code using jwtDecode
        const decodedToken: { exp: number } = jwtDecode(tokens.accessToken);
        const currentTime = Date.now() / 1000;
        
        isValid = decodedToken.exp > currentTime;
      }
      
      // If token is expired or about to expire, refresh it
      if (!isValid && tokens.refreshToken) {
        const newTokens = await this.refreshToken(tokens.refreshToken);
        return !!newTokens;
      }
      
      return isValid;
    } catch (error) {
      return false;
    }
  }
  
  // Modified token storage methods using cookies instead of localStorage
  public saveTokensToStorage(authResponse: AuthResponse): void {
    // Skip if not in browser environment
    if (!this.isBrowser()) return;
    
    try {
      const tokenData = JSON.stringify({
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
      });
      
      // Create the cookie string
      let cookieStr = `${AuthService.TOKEN_STORAGE_KEY}=${encodeURIComponent(tokenData)}`;
      
      // Add cookie options
      cookieStr += `; path=${this.cookieOptions.path}`;
      cookieStr += `; domain=${this.cookieOptions.domain}`;
      cookieStr += `; max-age=${this.cookieOptions.maxAge}`;
      
      if (this.cookieOptions.secure) {
        cookieStr += '; secure';
      }
      
      cookieStr += `; samesite=${this.cookieOptions.sameSite}`;
      
      // Set the cookie
      document.cookie = cookieStr;
      
      console.log('Auth tokens saved to cookie');
    } catch (error) {
      console.error('Error saving auth tokens to cookie:', error);
    }
  }
  
  public getTokensFromStorage(): { accessToken: string; refreshToken: string } | null {
    // Skip if not in browser environment
    if (!this.isBrowser()) return null;
    
    try {
      // Parse cookies
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(c => c.trim().startsWith(`${AuthService.TOKEN_STORAGE_KEY}=`));
      
      if (!tokenCookie) {
        return null;
      }
      
      const tokenValue = tokenCookie.split('=')[1].trim();
      return JSON.parse(decodeURIComponent(tokenValue));
    } catch (error) {
      console.error('Error parsing auth token cookie:', error);
      return null;
    }
  }
  
  public clearTokensFromStorage(): void {
    // Skip if not in browser environment
    if (!this.isBrowser()) return;
    
    try {
      // To delete a cookie, set its expiration to a past date
      document.cookie = `${AuthService.TOKEN_STORAGE_KEY}=; path=${this.cookieOptions.path}; domain=${this.cookieOptions.domain}; max-age=0`;
      console.log('Auth tokens cleared from cookie');
    } catch (error) {
      console.error('Error clearing auth tokens from cookie:', error);
    }
  }
}