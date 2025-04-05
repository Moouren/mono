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
        const tokens = this.getTokensFromStorage();
        if (tokens?.accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
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
            const tokens = this.getTokensFromStorage();
            if (tokens?.refreshToken) {
              const newTokens = await this.refreshToken(tokens.refreshToken);
              
              if (newTokens) {
                // Update the request with the new token
                originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
                return this.api(originalRequest);
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
  
  // Rest of the service methods (login, register, etc.) remain the same
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
      
      this.saveTokensToStorage(response);
      return response;
    }
    
    // For production, use the real API
    const response = await this.api.post<AuthResponse>('/auth/login', credentials);
    this.saveTokensToStorage(response.data);
    return response.data;
  }
  
  // In libs/shell/src/lib/services/auth/auth.service.ts
public async logout(): Promise<void> {
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
  
  public async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    // Implementation remains the same, just calls saveTokensToStorage at the end
    // ... existing code ...
    
    // For production, use the real API
    const response = await this.api.post<AuthResponse>('/auth/register', credentials);
    this.saveTokensToStorage(response.data);
    return response.data;
  }
  
  // ... other methods ...
  
  // Modified token storage methods using cookies instead of localStorage
  public saveTokensToStorage(authResponse: AuthResponse): void {
    if (typeof document !== 'undefined') {
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
    }
  }
  
  public getTokensFromStorage(): { accessToken: string; refreshToken: string } | null {
    if (typeof document === 'undefined') {
      return null;
    }
    
    // Parse cookies
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(c => c.trim().startsWith(`${AuthService.TOKEN_STORAGE_KEY}=`));
    
    if (!tokenCookie) {
      return null;
    }
    
    try {
      const tokenValue = tokenCookie.split('=')[1].trim();
      return JSON.parse(decodeURIComponent(tokenValue));
    } catch (error) {
      console.error('Error parsing auth token cookie:', error);
      return null;
    }
  }
  
  public clearTokensFromStorage(): void {
    if (typeof document !== 'undefined') {
      // To delete a cookie, set its expiration to a past date
      document.cookie = `${AuthService.TOKEN_STORAGE_KEY}=; path=${this.cookieOptions.path}; domain=${this.cookieOptions.domain}; max-age=0`;
      console.log('Auth tokens cleared from cookie');
    }
  }
  
  // Other methods remain the same
  public isAuthenticated(): boolean {
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
    // Implementation remains the same, uses getTokensFromStorage
    // ... existing code ...
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
}