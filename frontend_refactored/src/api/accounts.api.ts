import apiClient from "./client";

export const accountsApi = {
  getAll: () => apiClient.get("/mongodb/accounts/"),
  create: (data: Record<string, unknown>) =>
    apiClient.post("/mongodb/accounts/create/", data),
  update: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/mongodb/accounts/${id}/update/`, data),
  delete: (id: string) => apiClient.delete(`/mongodb/accounts/${id}/delete/`),
};
