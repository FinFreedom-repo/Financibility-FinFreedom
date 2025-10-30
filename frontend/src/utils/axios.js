import axios from "axios";

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to add the JWT token to all requests
instance.interceptors.request.use(
  (config) => {
    // Check if we're in development mode or on localhost
    const isDevelopment =
      process.env.NODE_ENV === "development" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Request interceptor - token added to headers");
    } else if (isDevelopment) {
      console.log("Development mode - no token found, continuing without auth");
    }

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh and unauthorized responses
instance.interceptors.response.use(
  (response) => {
    console.log("Response interceptor - success:", response.status);
    return response;
  },
  async (error) => {
    console.log(
      "Response interceptor - error:",
      error.response?.status,
      error.message
    );

    // In development mode, don't handle auth errors since backend allows any access
    if (process.env.NODE_ENV === "development") {
      console.log(
        "Development mode - skipping auth error handling, passing error through"
      );
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    // Don't handle login/register requests in the interceptor
    const isAuthRequest =
      originalRequest.url?.includes("/auth/login/") ||
      originalRequest.url?.includes("/auth/register/") ||
      originalRequest.url?.includes("/auth/refresh/");

    console.log("Is auth request:", isAuthRequest);

    // If the error is 401 and we haven't tried to refresh the token yet
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      console.log("Attempting token refresh...");
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          console.log("No refresh token found");
          // No refresh token, redirect to login
          localStorage.removeItem("access_token");
          window.location.href = "/login";
          return Promise.reject(error);
        }

        const response = await axios.post(
          `${
            process.env.REACT_APP_API_URL || "http://localhost:8000"
          }/api/auth/refresh/`,
          {
            refresh: refreshToken,
          }
        );

        const { access } = response.data;
        localStorage.setItem("access_token", access);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return instance(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, clear tokens and redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // For any other error, if it's an unauthorized response and not an auth request, redirect to login
    if (error.response?.status === 401 && !isAuthRequest) {
      // In development mode, don't clear tokens or redirect
      if (process.env.NODE_ENV === "development") {
        console.log(
          "Development mode - not clearing tokens or redirecting on 401"
        );
        return Promise.reject(error);
      }

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default instance;
