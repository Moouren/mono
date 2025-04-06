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
  }
  
  // Helper method to check if we're in a browser environment
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  // Get dynamic cookie options based on environment
  private getCookieOptions(): {
    path: string;
    domain: string;
    maxAge: number;
    secure: boolean;
    sameSite: string;
  } {
    const isProduction = process.env.NODE_ENV === 'production';
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    
    // Base options
    const options = {
      path: '/',
      domain: 'localhost', // Default for development
      maxAge: 86400, // 1 day in seconds
      secure: isHttps, // Only use secure flag with HTTPS
      sameSite: 'lax' as 'lax' | 'strict' | 'none', // Type assertion for TypeScript
    };
    
    // If in production, try to determine proper domain
    if (isProduction && typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      // Handle different production domain strategies
      if (hostname !== 'localhost') {
        // For Vercel deployments, use the hostname directly
        options.domain = hostname;
        
        // In production with HTTPS, use secure cookies
        options.secure = isHttps;
      }
      
      console.log('Using cookie domain:', options.domain);
    }
    
    return options;
  }
  
  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const user = this.mockUsers.find(u => u.email === credentials.email);
    
    if (!user || user.password !== credentials.password) {
      throw new Error('Invalid email or password');
    }
    
    // Create mock tokens with encoded user info
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
    
    // Save tokens if in browser environment
    if (this.isBrowser()) {
      this.saveTokensToStorage(response);
    }
    
    return response;
  }
  
  public async register(credentials: RegisterCredentials): Promise<AuthResponse> {
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
    
    // Add to mock users
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
    
    // Save tokens if in browser environment
    if (this.isBrowser()) {
      this.saveTokensToStorage(response);
    }
    
    return response;
  }
  
  public async logout(): Promise<void> {
    // Only proceed if in browser environment
    if (!this.isBrowser()) return;
    
    // For POC just clear storage
    this.clearTokensFromStorage();
  }
  
  public async refreshToken(refreshToken: string): Promise<AuthResponse | null> {
    // Only proceed if in browser environment
    if (!this.isBrowser()) return null;
    
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
  
  public isAuthenticated(): boolean {
    // Only proceed if in browser environment
    if (!this.isBrowser()) return false;
    
    const tokens = this.getTokensFromStorage();
    
    if (!tokens?.accessToken) {
      return false;
    }
    
    try {
      // Decode our mock token (base64 encoded JSON)
      const decoded = JSON.parse(atob(tokens.accessToken));
      const currentTime = Math.floor(Date.now() / 1000);
      
      return decoded.exp > currentTime;
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
      // Decode our mock token (base64 encoded JSON)
      const decoded = JSON.parse(atob(tokens.accessToken));
      return decoded.user;
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
      
      try {
        // Decode our mock token (base64 encoded JSON)
        const decoded = JSON.parse(atob(tokens.accessToken));
        const currentTime = Math.floor(Date.now() / 1000);
        
        isValid = decoded.exp > currentTime;
      } catch (e) {
        return false;
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
  
  // Token storage methods using cookies with dynamic domain detection
  public saveTokensToStorage(authResponse: AuthResponse): void {
    // Skip if not in browser environment
    if (!this.isBrowser()) return;
    
    try {
      const tokenData = JSON.stringify({
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
      });
      
      // Get dynamic cookie options
      const cookieOptions = this.getCookieOptions();
      
      // Create the cookie string
      let cookieStr = `${AuthService.TOKEN_STORAGE_KEY}=${encodeURIComponent(tokenData)}`;
      
      // Add cookie options
      cookieStr += `; path=${cookieOptions.path}`;
      cookieStr += `; domain=${cookieOptions.domain}`;
      cookieStr += `; max-age=${cookieOptions.maxAge}`;
      
      if (cookieOptions.secure) {
        cookieStr += '; secure';
      }
      
      cookieStr += `; samesite=${cookieOptions.sameSite}`;
      
      // Set the cookie
      document.cookie = cookieStr;
      
      // IMPORTANT: Also save to localStorage as a fallback
      // This helps with cross-domain issues in Vercel
      localStorage.setItem(`${AuthService.TOKEN_STORAGE_KEY}_fallback`, tokenData);
      
      console.log('Auth tokens saved to cookie and localStorage fallback');
      console.log('Cookie options:', cookieOptions);
    } catch (error) {
      console.error('Error saving auth tokens:', error);
    }
  }
  
  public getTokensFromStorage(): { accessToken: string; refreshToken: string } | null {
    // Skip if not in browser environment
    if (!this.isBrowser()) return null;
    
    try {
      // First try to get from cookies
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(c => c.trim().startsWith(`${AuthService.TOKEN_STORAGE_KEY}=`));
      
      if (tokenCookie) {
        console.log('Auth token found in cookie');
        const tokenValue = tokenCookie.split('=')[1].trim();
        return JSON.parse(decodeURIComponent(tokenValue));
      }
      
      // If cookie not found, try localStorage fallback
      const fallbackToken = localStorage.getItem(`${AuthService.TOKEN_STORAGE_KEY}_fallback`);
      if (fallbackToken) {
        console.log('Auth token found in localStorage fallback');
        return JSON.parse(fallbackToken);
      }
      
      console.log('No auth token found in cookie or localStorage');
      return null;
    } catch (error) {
      console.error('Error parsing auth token:', error);
      return null;
    }
  }
  
  public clearTokensFromStorage(): void {
    // Skip if not in browser environment
    if (!this.isBrowser()) return;
    
    try {
      // Clear cookie
      const cookieOptions = this.getCookieOptions();
      let cookieStr = `${AuthService.TOKEN_STORAGE_KEY}=`;
      cookieStr += `; path=${cookieOptions.path}`;
      cookieStr += `; domain=${cookieOptions.domain}`;
      cookieStr += `; max-age=0`;
      
      if (cookieOptions.secure) {
        cookieStr += '; secure';
      }
      
      cookieStr += `; samesite=${cookieOptions.sameSite}`;
      
      document.cookie = cookieStr;
      
      // Also clear localStorage fallback
      localStorage.removeItem(`${AuthService.TOKEN_STORAGE_KEY}_fallback`);
      
      console.log('Auth tokens cleared from cookie and localStorage');
    } catch (error) {
      console.error('Error clearing auth tokens:', error);
    }
  }
  
  // Method to get user profile from the token
  public getUserProfile(): User | null {
    // For POC, just return the user from the access token
    return this.getCurrentUser();
  }
}