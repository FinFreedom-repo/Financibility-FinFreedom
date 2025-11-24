import apiClient from './api';
import { ApiResponse } from '../types';
import axios from 'axios';
import { Platform } from 'react-native';
import { API_CONFIG } from '../constants';
import secureStorage from './secureStorage';

export interface ExpenseAnalysis {
  [category: string]: number;
}

export interface ExpenseAnalyzerResponse {
  message: string;
  filename: string;
  analysis: string; // JSON string of categorized expenses
}

export interface ChatMessage {
  type: 'user' | 'assistant' | 'system' | 'error';
  content: string;
}

class ExpenseAnalyzerService {
  /**
   * Upload expense file (CSV, Excel, TXT) for analysis
   */
  async uploadFile(
    file: File | any
  ): Promise<ApiResponse<ExpenseAnalyzerResponse>> {
    try {
      const formData = new FormData();

      // Handle React Native file object
      if (file.uri) {
        // React Native file from document picker
        // Determine MIME type from file extension if not provided
        let mimeType = file.mimeType || 'application/octet-stream';
        const fileName = file.name || 'expenses.csv';
        const fileExt = fileName.toLowerCase().split('.').pop();

        if (!file.mimeType) {
          switch (fileExt) {
            case 'csv':
              mimeType = 'text/csv';
              break;
            case 'xlsx':
              mimeType =
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
              break;
            case 'xls':
              mimeType = 'application/vnd.ms-excel';
              break;
            case 'txt':
              mimeType = 'text/plain';
              break;
          }
        }

        // expo-document-picker already provides the correct URI format
        // For React Native FormData, use the URI as-is
        formData.append('file', {
          uri: file.uri,
          type: mimeType,
          name: fileName,
        } as any);
      } else {
        // Web File object
        formData.append('file', file);
      }

      console.log('📤 Uploading file:', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      });

      // Use apiClient with transformRequest to prevent FormData transformation
      // This must be passed in the config, not set in interceptor
      const response = await apiClient.post<ExpenseAnalyzerResponse>(
        '/api/expense-analyzer/upload/',
        formData,
        {
          transformRequest: [data => data], // Prevent axios from transforming FormData
        }
      );

      console.log('✅ Upload response:', response);
      return response;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      return {
        error:
          error.response?.data?.error ||
          error.message ||
          'Failed to upload file',
        status: error.response?.status || 0,
      };
    }
  }

  /**
   * Send chat message about expense analysis
   */
  async sendChatMessage(
    message: string,
    analysis: string
  ): Promise<ApiResponse<{ response: string }>> {
    try {
      const response = await apiClient.post<{ response: string }>(
        '/api/expense-analyzer/chat/',
        {
          message,
          analysis,
        }
      );

      return response;
    } catch (error: any) {
      console.error('Error sending chat message:', error);
      return {
        error:
          error.response?.data?.error ||
          error.message ||
          'Failed to send message',
        status: error.response?.status || 0,
      };
    }
  }

  /**
   * Parse analysis JSON string into expense categories
   */
  parseAnalysis(analysisString: string): ExpenseAnalysis | null {
    try {
      // Try to extract JSON from the response (Grok might return text with JSON)
      const jsonMatch = analysisString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      // If no JSON found, try parsing the whole string
      return JSON.parse(analysisString);
    } catch (error) {
      console.error('Error parsing analysis:', error);
      return null;
    }
  }

  /**
   * Format expense analysis for chart display
   */
  formatForChart(analysis: ExpenseAnalysis): {
    labels: string[];
    values: number[];
    colors: string[];
  } {
    const labels = Object.keys(analysis);
    const values = Object.values(analysis);

    // Generate colors for each category
    const colors = this.generateColors(labels.length);

    return { labels, values, colors };
  }

  /**
   * Generate color palette for charts
   */
  private generateColors(count: number): string[] {
    const baseColors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E9',
      '#F8C471',
      '#82E0AA',
      '#F1948A',
      '#85C1E9',
      '#F7DC6F',
    ];

    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  }
}

export default new ExpenseAnalyzerService();
