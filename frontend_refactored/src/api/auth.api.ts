import apiClient from "./client";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    username: string;
    email: string;
    profile: {
      first_name: string;
      last_name: string;
      avatar: string;
    };
  };
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>("/mongodb/auth/mongodb/login/", data),

  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>("/mongodb/auth/mongodb/register/", data),

  getProfile: () => apiClient.get("/mongodb/auth/mongodb/profile/"),

  updateProfile: (data: Record<string, unknown>) =>
    apiClient.put("/mongodb/auth/mongodb/profile/update/", data),

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    return Promise.resolve();
  },
};
