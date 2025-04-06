// auth.service.ts
import Cookies from 'js-cookie';
import axios, { AxiosInstance } from 'axios';
import { AuthResponse, LoginCredentials, RegisterCredentials, User } from './types';

export class AuthService {
  private apiUrl: string;
  private axiosInstance: AxiosInstance;
  
  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
    
    this.axiosInstance = axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Add request interceptor to add auth token to requests
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Add response interceptor to handle token expiration
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If error is 401 and we haven't already tried refreshing
        if (
          error.response &&
          error.response.status === 401 &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;
          
          try {
            // Attempt to refresh the token
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }
            
            const response = await this.refreshToken(refreshToken);
            
            // If refresh successful, retry the original request
            if (response.accessToken) {
              originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            // If refresh fails, clear tokens and let the error propagate
            this.clearTokensFromStorage();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  // Save tokens to storage with cross-domain support
  saveTokensToStorage(response: AuthResponse): void {
    // Get the current domain
    const currentDomain = window.location.hostname;
    // Extract the base domain (for cross-domain cookie sharing)
    const baseDomain = this.getBaseDomain(currentDomain);
    
    // Set cookies with appropriate domain
    const cookieOptions = { 
      domain: baseDomain, 
      secure: true,
      sameSite: 'lax' as 'lax' // TypeScript needs this type assertion
    };
    
    console.log('Saving tokens with domain:', baseDomain);
    
    // Store tokens in cookies
    Cookies.set('accessToken', response.accessToken, cookieOptions);
    Cookies.set('refreshToken', response.refreshToken, cookieOptions);
    
    // Store user data in localStorage (no domain restrictions)
    if (response.user) {
      localStorage.setItem('userData', JSON.stringify(response.user));
    }
  }
  
  // Helper to extract base domain for cookie sharing
  private getBaseDomain(hostname: string): string | undefined {
    // For Vercel deployments like mono-auth.vercel.app and mono-my-monorepo-2sn1.vercel.app
    // We need to set domain to .vercel.app to share cookies
    
    // Check if it's a vercel app
    if (hostname.endsWith('vercel.app')) {
      return '.vercel.app';
    }
    
    // For localhost development, return undefined (uses default)
    if (hostname === 'localhost') {
      return undefined;
    }
    
    // For custom domains, extract the base domain
    const parts = hostname.split('.');
    if (parts.length > 2) {
      // Return something like .example.com for subdomains
      return `.${parts.slice(-2).join('.')}`;
    }
    
    // Default fallback - return undefined to use the default behavior
    return undefined;
  }
  
  // Get tokens from storage
  getTokensFromStorage(): { accessToken?: string; refreshToken?: string; user?: User } {
    const accessToken = Cookies.get('accessToken');
    const refreshToken = Cookies.get('refreshToken');
    const userDataString = localStorage.getItem('userData');
    const user = userDataString ? JSON.parse(userDataString) : null;
    
    return {
      accessToken,
      refreshToken,
      user
    };
  }
  
  // Clear all tokens from storage
  clearTokensFromStorage(): void {
    // Get the current domain
    const currentDomain = window.location.hostname;
    // Extract the base domain
    const baseDomain = this.getBaseDomain(currentDomain);
    
    const cookieOptions = { domain: baseDomain };
    
    // Clear cookies with the same domain setting
    Cookies.remove('accessToken', cookieOptions);
    Cookies.remove('refreshToken', cookieOptions);
    
    // Clear local storage
    localStorage.removeItem('userData');
  }
  
  // Get access token
  getAccessToken(): string | undefined {
    return Cookies.get('accessToken');
  }
  
  // Get refresh token
  getRefreshToken(): string | undefined {
    return Cookies.get('refreshToken');
  }
  
  // Alias method to match your context expectations
  getCurrentUser(): User | null {
    const userDataString = localStorage.getItem('userData');
    return userDataString ? JSON.parse(userDataString) : null;
  }
  
  // Set user data
  setUserData(user: User | null): void {
    if (user) {
      localStorage.setItem('userData', JSON.stringify(user));
    } else {
      localStorage.removeItem('userData');
    }
  }
  
  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
  
  // Simulated Login - no actual API call
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('Simulated login with credentials:', credentials);
      
      // Create a fake successful response
      const response: AuthResponse = {
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        user: {
          id: "12345",
          name: credentials.email.split('@')[0] || "User",
          email: credentials.email,
          role: "user"
        }
      };
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Save tokens to storage
      this.saveTokensToStorage(response);
      
      return response;
    } catch (error) {
      throw new Error('Login failed');
    }
  }
  
  // Simulated Register - no actual API call
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      console.log('Simulated register with credentials:', credentials);
      
      // Create a fake successful response
      const response: AuthResponse = {
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlNpbXVsYXRlZCBVc2VyIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE3MDI1NTYwMDB9.aStUV4tYyF0Wo0K7H8jQeW4LRC_4L4K15s5J-Bwz7WQ",
        refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlNpbXVsYXRlZCBVc2VyIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE3MDI1NTYwMDB9.bRtUV4sYoF0Wo0K7H8jQeW4LRC_4L4K15s5J-Bwz7WQ",
        user: {
          id: "12345",
          name: credentials.name,
          email: credentials.email,
          role: "user"
        }
      };
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Save tokens to storage
      this.saveTokensToStorage(response);
      
      return response;
    } catch (error) {
      throw new Error('Registration failed');
    }
  }
  
  // Simulated Logout - no actual API call
  async logout(): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Clear tokens from storage
    this.clearTokensFromStorage();
  }
  
  // Simulated Refresh Token - no actual API call
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    if (!refreshToken) {
      throw new Error('No refresh token provided');
    }
    
    try {
      console.log('Simulated token refresh');
      
      // Create a fake successful response with a new access token
      const response: AuthResponse = {
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlNpbXVsYXRlZCBVc2VyIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE3MDI1NTYwMDB9.cStUV4tYyF0Wo0K7H8jQeW4LRC_4L4K15s5J-Bwz7WQ",
        refreshToken: refreshToken, // Keep the same refresh token
        user: this.getCurrentUser() // Keep the same user
      };
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Save the new tokens
      this.saveTokensToStorage(response);
      
      return response;
    } catch (error) {
      // Clear tokens on refresh failure
      this.clearTokensFromStorage();
      throw new Error('Token refresh failed');
    }
  }
}

export default AuthService;