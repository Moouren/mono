// AuthService.ts
import Cookies from 'js-cookie';
import axios, { AxiosInstance } from 'axios';

interface User {
  id: string | number;
  name: string;
  email: string;
  role?: string;
  [key: string]: any;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

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
            
            const response = await this.refreshToken();
            
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
  getTokensFromStorage(): { accessToken?: string; refreshToken?: string; userData: User | null } {
    const accessToken = Cookies.get('accessToken');
    const refreshToken = Cookies.get('refreshToken');
    const userDataString = localStorage.getItem('userData');
    const userData = userDataString ? JSON.parse(userDataString) : null;
    
    return {
      accessToken,
      refreshToken,
      userData
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
  
  // Get user data
  getUserData(): User | null {
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
  
  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.axiosInstance.post<AuthResponse>(
        '/api/auth/login',
        credentials
      );
      
      // Save tokens to storage
      this.saveTokensToStorage(response.data);
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Login failed');
      }
      throw new Error('Login failed');
    }
  }
  
  // Register
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await this.axiosInstance.post<AuthResponse>(
        '/api/auth/register',
        credentials
      );
      
      // Save tokens to storage
      this.saveTokensToStorage(response.data);
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Registration failed');
      }
      throw new Error('Registration failed');
    }
  }
  
  // Logout
  async logout(): Promise<void> {
    try {
      // Call logout endpoint if available
      await this.axiosInstance.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear tokens from storage
      this.clearTokensFromStorage();
    }
  }
  
  // Refresh token
  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      const response = await axios.post<AuthResponse>(
        `${this.apiUrl}/api/auth/refresh-token`,
        { refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      // Save the new tokens
      this.saveTokensToStorage(response.data);
      
      return response.data;
    } catch (error) {
      // Clear tokens on refresh failure
      this.clearTokensFromStorage();
      
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Token refresh failed');
      }
      throw new Error('Token refresh failed');
    }
  }
  
  // Get user profile
  async getUserProfile(): Promise<User> {
    try {
      const response = await this.axiosInstance.get<User>('/api/auth/profile');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to get user profile');
      }
      throw new Error('Failed to get user profile');
    }
  }
  
  // Update user profile
  async updateUserProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await this.axiosInstance.put<User>('/api/auth/profile', userData);
      
      // Update stored user data
      const currentUser = this.getUserData();
      if (currentUser) {
        this.setUserData({ ...currentUser, ...response.data });
      }
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to update user profile');
      }
      throw new Error('Failed to update user profile');
    }
  }
  
  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await this.axiosInstance.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to change password');
      }
      throw new Error('Failed to change password');
    }
  }
  
  // Request password reset
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await axios.post(
        `${this.apiUrl}/api/auth/request-password-reset`,
        { email },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to request password reset');
      }
      throw new Error('Failed to request password reset');
    }
  }
  
  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await axios.post(
        `${this.apiUrl}/api/auth/reset-password`,
        { token, newPassword },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to reset password');
      }
      throw new Error('Failed to reset password');
    }
  }
}

export default AuthService;