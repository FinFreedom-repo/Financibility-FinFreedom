import axios from "@/utils/axios";

class AccountsDebtsService {
  async getAccounts() {
    const response = await axios.get("/api/mongodb/accounts/");
    return response.data.accounts || [];
  }

  async getDebts() {
    const response = await axios.get("/api/mongodb/debts/");
    return response.data.debts || [];
  }

  async createAccount(data: any) {
    const response = await axios.post("/api/mongodb/accounts/create/", data);
    return response.data;
  }

  async createDebt(data: any) {
    const response = await axios.post("/api/mongodb/debts/create/", data);
    return response.data;
  }

  async updateAccount(id: string, data: any) {
    const response = await axios.put(
      `/api/mongodb/accounts/${id}/update/`,
      data
    );
    return response.data;
  }

  async updateDebt(id: string, data: any) {
    const response = await axios.put(`/api/mongodb/debts/${id}/update/`, data);
    return response.data;
  }

  async deleteAccount(id: string) {
    await axios.delete(`/api/mongodb/accounts/${id}/delete/`);
    return true;
  }

  async deleteDebt(id: string) {
    await axios.delete(`/api/mongodb/debts/${id}/delete/`);
    return true;
  }
}

export default new AccountsDebtsService();
