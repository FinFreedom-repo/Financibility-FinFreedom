import axios from "@/utils/axios";

class SettingsService {
  async getSettings() {
    const response = await axios.get("/api/mongodb/settings/");
    return response.data;
  }

  async updateSettings(data: any) {
    const response = await axios.put("/api/mongodb/settings/update/", data);
    return response.data;
  }

  getDefaultSettings() {
    return {
      payment_plan: "basic",
      notifications_enabled: true,
      email_notifications: true,
    };
  }
}

export default new SettingsService();
