import axios from '../utils/axios';

const settingsService = {
  /**
   * Get user settings from the API
   * @returns {Promise} Promise object representing the settings data
   */
  getSettings: async () => {
    try {
      const response = await axios.get('/api/settings/');
      return response.data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  },

  /**
   * Update user settings (placeholder for future implementation)
   * @param {Object} settings - The settings to update
   * @returns {Promise} Promise object representing the updated settings
   */
  updateSettings: async (settings) => {
    try {
      const response = await axios.put('/api/settings/', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  /**
   * Get default settings (fallback when API is not available)
   * @returns {Object} Default settings object
   */
  getDefaultSettings: () => {
    return {
      theme: 'light',
      payment_plan: 'basic',
      notifications: {
        email: true,
        push: false,
        sms: false
      },
      language: 'en',
      timezone: 'UTC'
    };
  }
};

export default settingsService; 