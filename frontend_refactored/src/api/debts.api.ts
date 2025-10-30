import apiClient from "./client";

export const debtsApi = {
  getAll: () => apiClient.get("/mongodb/debts/"),
  create: (data: Record<string, unknown>) =>
    apiClient.post("/mongodb/debts/create/", data),
  update: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/mongodb/debts/${id}/update/`, data),
  delete: (id: string) => apiClient.delete(`/mongodb/debts/${id}/delete/`),
  calculatePayoffPlan: (data: Record<string, unknown>) =>
    apiClient.post("/mongodb/debt-planner/", data),
};
