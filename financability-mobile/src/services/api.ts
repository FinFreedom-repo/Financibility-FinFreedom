import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, ERROR_MESSAGES } from '../constants';
import { AuthResponse, ApiResponse } from '../types';
import secureStorage from './secureStorage';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: {
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const { accessToken } = await secureStorage.getTokens();
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => {
              return this.client(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const { refreshToken } = await secureStorage.getTokens();
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const response = await this.refreshToken(refreshToken);
            const { access } = response.data;

            await secureStorage.setItem('access_token', access);
            this.client.defaults.headers.Authorization = `Bearer ${access}`;

            // Process failed queue
            this.processQueue(null, access);

            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            await this.clearAuthData();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private async refreshToken(refreshToken: string): Promise<AxiosResponse<AuthResponse>> {
    return this.client.post(API_CONFIG.ENDPOINTS.AUTH.REFRESH, {
      refresh: refreshToken,
    });
  }

  private async clearAuthData() {
    await secureStorage.clearAuthData();
  }

  // Public methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      console.log(`🌐 GET ${url}`);
      const response = await this.client.get<T>(url, config);
      console.log(`✅ GET ${url} - Status: ${response.status}`);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: any) {
      console.log(`❌ GET ${url} - Error: ${error.response?.status || 'Network Error'}`);
      return this.handleError(error);
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      console.log(`🌐 POST ${url}`);
      console.log(`📤 POST Data:`, data);
      const response = await this.client.post<T>(url, data, config);
      console.log(`✅ POST ${url} - Status: ${response.status}`);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: any) {
      console.log(`❌ POST ${url} - Error: ${error.response?.status || 'Network Error'}`);
      return this.handleError(error);
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      console.log(`🌐 PUT ${url}`);
      console.log(`📤 PUT Data:`, data);
      const response = await this.client.put<T>(url, data, config);
      console.log(`✅ PUT ${url} - Status: ${response.status}`);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: any) {
      console.log(`❌ PUT ${url} - Error: ${error.response?.status || 'Network Error'}`);
      return this.handleError(error);
    }
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      console.log(`🌐 PATCH ${url}`);
      console.log(`📤 PATCH Data:`, data);
      const response = await this.client.patch<T>(url, data, config);
      console.log(`✅ PATCH ${url} - Status: ${response.status}`);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: any) {
      console.log(`❌ PATCH ${url} - Error: ${error.response?.status || 'Network Error'}`);
      return this.handleError(error);
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      console.log(`🌐 DELETE ${url}`);
      const response = await this.client.delete<T>(url, config);
      console.log(`✅ DELETE ${url} - Status: ${response.status}`);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: any) {
      console.log(`❌ DELETE ${url} - Error: ${error.response?.status || 'Network Error'}`);
      return this.handleError(error);
    }
  }

  private handleError(error: any): ApiResponse<any> {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      return {
        error: data?.error || data?.detail || data?.message || ERROR_MESSAGES.SERVER_ERROR,
        status,
      };
    } else if (error.request) {
      // Network error
      let networkError = ERROR_MESSAGES.NETWORK;
      
      if (error.code === 'ECONNREFUSED') {
        networkError = 'Network error. Please check your connection.';
      } else if (error.code === 'ENOTFOUND') {
        networkError = 'Network error. Please check your connection.';
      } else if (error.code === 'ETIMEDOUT') {
        networkError = 'Network error. Please check your connection.';
      }
      
      return {
        error: networkError,
        status: 0,
      };
    } else {
      // Other error
      return {
        error: error.message || ERROR_MESSAGES.UNKNOWN,
        status: 0,
      };
    }
  }

  // Auth methods
  async login(credentials: { username: string; password: string }): Promise<ApiResponse<AuthResponse>> {
    return this.post<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials);
  }

  async register(credentials: { username: string; email: string; password: string }): Promise<ApiResponse<AuthResponse>> {
    return this.post<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.REGISTER, credentials);
  }

  async logout(): Promise<void> {
    await this.clearAuthData();
  }

  // Utility methods
  setAuthToken(token: string) {
    this.client.defaults.headers.Authorization = `Bearer ${token}`;
  }

  removeAuthToken() {
    delete this.client.defaults.headers.Authorization;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;

