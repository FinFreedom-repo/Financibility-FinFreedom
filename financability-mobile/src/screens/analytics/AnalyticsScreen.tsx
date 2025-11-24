import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const AnalyticsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Insights into your financial health</Text>
      </View>

      {/* Expense Analyzer Card */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons
            name="analytics"
            size={32}
            color={theme.colors.primary}
            style={styles.cardIcon}
          />
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>Expense Analyzer</Text>
            <Text style={styles.cardText}>
              Upload your expense files (CSV, Excel) and get AI-powered insights
              about your spending patterns
            </Text>
          </View>
        </View>
        <Button
          title="Analyze Expenses"
          onPress={() => navigation.navigate('ExpenseAnalyzer' as never)}
          icon="analytics-outline"
          style={styles.actionButton}
        />
      </Card>

      {/* Coming Soon Card */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>More Analytics Coming Soon</Text>
        <Text style={styles.cardText}>
          This screen will provide detailed analytics and insights about your
          financial situation, including charts and trends.
        </Text>
      </Card>
    </ScrollView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.lg,
      alignItems: 'center',
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      ...theme.typography.body1,
      color: theme.colors.textSecondary,
    },
    card: {
      margin: theme.spacing.lg,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.md,
    },
    cardIcon: {
      marginRight: theme.spacing.md,
    },
    cardHeaderText: {
      flex: 1,
    },
    cardTitle: {
      ...theme.typography.h4,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    cardText: {
      ...theme.typography.body1,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    actionButton: {
      marginTop: theme.spacing.sm,
    },
  });

export default AnalyticsScreen;
