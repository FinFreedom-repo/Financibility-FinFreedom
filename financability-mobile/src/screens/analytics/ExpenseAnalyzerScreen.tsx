import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import expenseAnalyzerService, {
  ExpenseAnalysis,
  ChatMessage,
} from '../../services/expenseAnalyzerService';
import { PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');
const CHART_SIZE = width - 80;

const ExpenseAnalyzerScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  // State
  const [file, setFile] = useState<DocumentPicker.DocumentPickerResult | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ExpenseAnalysis | null>(null);
  const [analysisString, setAnalysisString] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Pick file
  const pickFile = async () => {
    try {
      // Use '*' to allow all file types, then filter by extension
      // This works better on mobile devices where MIME types can be unreliable
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Allow all file types
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        const fileName = selectedFile.name?.toLowerCase() || '';

        // Validate file extension
        const allowedExtensions = ['.csv', '.xlsx', '.xls', '.txt'];
        const hasValidExtension = allowedExtensions.some(ext =>
          fileName.endsWith(ext)
        );

        if (!hasValidExtension) {
          Alert.alert(
            'Invalid File Type',
            'Please select a CSV, Excel (.xlsx, .xls), or Text file.',
            [{ text: 'OK' }]
          );
          return;
        }

        setFile(result);
        setError(null);
        setAnalysis(null);
        setAnalysisString('');
        setChatHistory([]);
      }
    } catch (err) {
      console.error('Error picking file:', err);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  };

  // Upload and analyze file
  const handleUpload = async () => {
    if (!file || file.canceled || !file.assets || file.assets.length === 0) {
      Alert.alert('No File', 'Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setAnalysisString('');
    setChatHistory([]);

    try {
      const selectedFile = file.assets[0];

      // Create file object for upload
      const fileToUpload = {
        uri: selectedFile.uri,
        name: selectedFile.name || 'expenses.csv',
        type: selectedFile.mimeType || 'text/csv',
      };

      const response = await expenseAnalyzerService.uploadFile(fileToUpload);

      if (response.error) {
        setError(response.error);
        Alert.alert('Upload Failed', response.error);
        return;
      }

      if (response.data) {
        setAnalysisString(response.data.analysis);

        // Parse the analysis
        const parsed = expenseAnalyzerService.parseAnalysis(
          response.data.analysis
        );
        if (parsed) {
          setAnalysis(parsed);
          setChatHistory([
            {
              type: 'system',
              content:
                "I've analyzed your expenses. You can ask me questions about your spending patterns, categories, or any other insights you'd like to know.",
            },
          ]);
        } else {
          setError('Failed to parse analysis results');
        }
      }
    } catch (err: any) {
      console.error('Error uploading file:', err);
      const errorMsg = err.message || 'Failed to upload file';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Send chat message
  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !analysisString) return;

    const userMessage = chatMessage.trim();
    setChatMessage('');
    setChatHistory(prev => [...prev, { type: 'user', content: userMessage }]);
    setSendingMessage(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await expenseAnalyzerService.sendChatMessage(
        userMessage,
        analysisString
      );

      if (response.error) {
        setChatHistory(prev => [
          ...prev,
          {
            type: 'error',
            content:
              'Sorry, I encountered an error while processing your question. Please try again.',
          },
        ]);
      } else if (response.data?.response) {
        setChatHistory(prev => [
          ...prev,
          { type: 'assistant', content: response.data!.response },
        ]);
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setChatHistory(prev => [
        ...prev,
        {
          type: 'error',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setSendingMessage(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Format chart data
  const getChartData = () => {
    if (!analysis) return null;

    const labels = Object.keys(analysis);
    const values = Object.values(analysis) as number[];
    const total = values.reduce((sum: number, val: number) => sum + val, 0);

    // Format labels with percentages
    const formattedLabels = labels.map((label, index) => {
      const percentage =
        total > 0 ? ((values[index] / total) * 100).toFixed(0) : '0';
      return `${label}\n${percentage}%`;
    });

    return {
      labels: formattedLabels,
      datasets: [
        {
          data: values,
        },
      ],
    };
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const chartData = getChartData();
  const hasFile =
    file && !file.canceled && file.assets && file.assets.length > 0;
  const fileName = hasFile && file.assets ? file.assets[0].name : '';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons
            name="analytics"
            size={32}
            color={theme.colors.primary}
            style={styles.headerIcon}
          />
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Expense Analyzer
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          >
            Upload your expense data and get AI-powered insights
          </Text>
        </View>

        {/* File Upload Section */}
        <Card style={styles.card}>
          <TouchableOpacity
            style={[
              styles.uploadArea,
              {
                backgroundColor: theme.colors.surface,
                borderColor: hasFile
                  ? theme.colors.primary
                  : theme.colors.textSecondary + '40',
              },
            ]}
            onPress={pickFile}
            disabled={loading}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={48}
              color={
                hasFile ? theme.colors.primary : theme.colors.textSecondary
              }
            />
            <Text
              style={[
                styles.uploadText,
                { color: hasFile ? theme.colors.primary : theme.colors.text },
              ]}
            >
              {hasFile ? 'File Selected' : 'Tap to Select File'}
            </Text>
            <Text
              style={[styles.uploadHint, { color: theme.colors.textSecondary }]}
            >
              CSV, Excel, or Text files
            </Text>
            {hasFile && (
              <View style={styles.fileInfo}>
                <Ionicons
                  name="document-text"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text
                  style={[styles.fileName, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {fileName}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setFile(null);
                    setAnalysis(null);
                    setAnalysisString('');
                    setChatHistory([]);
                  }}
                  style={styles.removeFileButton}
                >
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={theme.colors.error}
                  />
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text
                style={[
                  styles.loadingText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Analyzing your expenses...
              </Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons
                name="alert-circle"
                size={20}
                color={theme.colors.error}
              />
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
            </View>
          )}

          <Button
            title={loading ? 'Analyzing...' : 'Analyze Expenses'}
            onPress={handleUpload}
            disabled={!hasFile || loading}
            loading={loading}
            style={styles.analyzeButton}
            icon="analytics-outline"
          />
        </Card>

        {/* Analysis Results */}
        {analysis && chartData && (
          <>
            {/* Chart Section */}
            <Card style={styles.card}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Expense Breakdown
              </Text>
              <View style={styles.chartContainer}>
                <PieChart
                  data={chartData as any}
                  width={CHART_SIZE}
                  height={220}
                  chartConfig={{
                    backgroundColor: theme.colors.surface,
                    backgroundGradientFrom: theme.colors.surface,
                    backgroundGradientTo: theme.colors.surface,
                    decimalPlaces: 0,
                    color: (opacity = 1) =>
                      isDark
                        ? `rgba(255, 255, 255, ${opacity})`
                        : `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) =>
                      isDark
                        ? `rgba(255, 255, 255, ${opacity})`
                        : `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor="data"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </View>

              {/* Category List */}
              <View style={styles.categoryList}>
                {Object.entries(analysis)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([category, amount]) => {
                    const total = (Object.values(analysis) as number[]).reduce(
                      (sum: number, val: number) => sum + val,
                      0
                    );
                    const percentage =
                      total > 0
                        ? (((amount as number) / total) * 100).toFixed(1)
                        : '0';
                    return (
                      <View
                        key={category}
                        style={[
                          styles.categoryItem,
                          { backgroundColor: theme.colors.surface },
                        ]}
                      >
                        <View style={styles.categoryLeft}>
                          <View
                            style={[
                              styles.categoryDot,
                              {
                                backgroundColor:
                                  chartData.labels.findIndex(l =>
                                    l.includes(category)
                                  ) !== -1
                                    ? '#FF6B6B'
                                    : theme.colors.primary,
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.categoryName,
                              { color: theme.colors.text },
                            ]}
                          >
                            {category.charAt(0).toUpperCase() +
                              category.slice(1)}
                          </Text>
                        </View>
                        <View style={styles.categoryRight}>
                          <Text
                            style={[
                              styles.categoryAmount,
                              { color: theme.colors.text },
                            ]}
                          >
                            {formatCurrency(amount as number)}
                          </Text>
                          <Text
                            style={[
                              styles.categoryPercentage,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
                            {percentage}%
                          </Text>
                        </View>
                      </View>
                    );
                  })}
              </View>
            </Card>

            {/* Chat Section */}
            <Card style={styles.card}>
              <View style={styles.chatHeader}>
                <Ionicons
                  name="chatbubbles"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text
                  style={[styles.sectionTitle, { color: theme.colors.text }]}
                >
                  AI Assistant
                </Text>
              </View>
              <Text
                style={[
                  styles.chatSubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Ask questions about your expenses
              </Text>

              {/* Chat Messages */}
              <ScrollView
                style={styles.chatMessages}
                contentContainerStyle={styles.chatMessagesContent}
                nestedScrollEnabled
              >
                {chatHistory.map((message, index) => (
                  <View
                    key={index}
                    style={[
                      styles.messageBubble,
                      message.type === 'user'
                        ? [
                            styles.userMessage,
                            { backgroundColor: theme.colors.primary },
                          ]
                        : [
                            styles.assistantMessage,
                            {
                              backgroundColor:
                                message.type === 'error'
                                  ? theme.colors.error + '20'
                                  : theme.colors.surface,
                            },
                          ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        {
                          color:
                            message.type === 'user'
                              ? '#FFFFFF'
                              : message.type === 'error'
                                ? theme.colors.error
                                : theme.colors.text,
                        },
                      ]}
                    >
                      {message.content}
                    </Text>
                  </View>
                ))}
                {sendingMessage && (
                  <View style={styles.typingIndicator}>
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.primary}
                    />
                    <Text
                      style={[
                        styles.typingText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Thinking...
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Chat Input */}
              <View style={styles.chatInputContainer}>
                <Input
                  label=""
                  placeholder="Ask about your spending patterns..."
                  value={chatMessage}
                  onChangeText={setChatMessage}
                  style={styles.chatInput}
                  multiline
                  numberOfLines={2}
                />
                <TouchableOpacity
                  onPress={handleSendMessage}
                  disabled={!chatMessage.trim() || sendingMessage}
                  style={[
                    styles.sendButton,
                    {
                      backgroundColor:
                        chatMessage.trim() && !sendingMessage
                          ? theme.colors.primary
                          : theme.colors.textSecondary + '40',
                    },
                  ]}
                >
                  {sendingMessage ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="send" size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  headerIcon: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  card: {
    marginBottom: 16,
  },
  uploadArea: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  uploadText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 12,
    marginTop: 4,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    maxWidth: '100%',
  },
  fileName: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  removeFileButton: {
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FEE',
  },
  errorText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  analyzeButton: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  categoryList: {
    marginTop: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryPercentage: {
    fontSize: 12,
    marginTop: 2,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chatSubtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  chatMessages: {
    maxHeight: 300,
    marginBottom: 16,
  },
  chatMessagesContent: {
    paddingBottom: 8,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
  },
  typingText: {
    fontSize: 14,
    marginLeft: 8,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  chatInput: {
    flex: 1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ExpenseAnalyzerScreen;
