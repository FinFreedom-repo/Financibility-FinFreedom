import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
    fill?: boolean;
  }[];
}

interface ChartProps {
  data: ChartData;
  type?: 'line' | 'bar' | 'pie';
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  formatYLabel?: (value: string) => string;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

const Chart: React.FC<ChartProps> = ({
  data,
  type = 'line',
  height = 200,
  showLegend = true,
  showGrid = true,
  formatYLabel,
  yAxisLabel,
  xAxisLabel,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState<{
    title: string;
    content: string[];
  } | null>(null);

  const chartConfig: any = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) =>
      theme.colors.primary +
      Math.floor(opacity * 255)
        .toString(16)
        .padStart(2, '0'),
    labelColor: (opacity = 1) =>
      theme.colors.text +
      Math.floor(opacity * 255)
        .toString(16)
        .padStart(2, '0'),
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '5,5',
      stroke: theme.colors.textSecondary + '30',
    },
    formatYLabel:
      formatYLabel ||
      ((value: string) => {
        const num = parseFloat(value);
        if (isNaN(num)) return value;
        if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
        return `$${num.toFixed(0)}`;
      }),
  };

  const chartData = {
    labels: data.labels || [],
    datasets: (data.datasets || []).map(dataset => ({
      data: dataset.data || [],
      color: (opacity = 1) => {
        const color = dataset.color || '#000000';
        return (
          color +
          Math.floor(opacity * 255)
            .toString(16)
            .padStart(2, '0')
        );
      },
      strokeWidth: 2,
    })),
  };

  const formatYValue = (value: number | string) => {
    if (formatYLabel) {
      return formatYLabel(value.toString());
    }
    const num =
      typeof value === 'number' ? value : parseFloat(value.toString());
    if (isNaN(num)) return value.toString();
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  if (type === 'line') {
    if (!chartData || !chartData.labels || chartData.labels.length === 0) {
      return (
        <View style={[styles.container, styles.placeholder]}>
          <Text style={styles.placeholderText}>
            No data available for chart
          </Text>
        </View>
      );
    }

    const validDatasets = chartData.datasets.filter(
      dataset =>
        dataset.data &&
        dataset.data.length > 0 &&
        dataset.data.every(value => typeof value === 'number' && !isNaN(value))
    );

    if (validDatasets.length === 0) {
      return (
        <View style={[styles.container, styles.placeholder]}>
          <Text style={styles.placeholderText}>No valid data for chart</Text>
        </View>
      );
    }

    const chartHeight =
      typeof height === 'number' && !isNaN(height) ? height : 200;

    const handleDataPointClick = (clickData: any) => {
      const label = chartData.labels[clickData.index] || '';
      const datasets: { label: string; value: number; color: string }[] = [];

      data.datasets.forEach((dataset, idx: number) => {
        const value = chartData.datasets[idx]?.data?.[clickData.index];
        if (value !== undefined && value !== null && !isNaN(value)) {
          datasets.push({
            label: dataset.label,
            value: value,
            color: dataset.color,
          });
        }
      });

      if (datasets.length > 0) {
        const pointData = datasets.map(
          ds => `${ds.label}: ${formatYValue(ds.value)}`
        );
        setAlertData({
          title: `Age ${label}`,
          content: pointData,
        });
        setAlertVisible(true);
      }
    };

    try {
      return (
        <View style={styles.container}>
          {yAxisLabel && (
            <View style={styles.yAxisLabelContainer}>
              <Text style={styles.yAxisLabel}>{yAxisLabel}</Text>
            </View>
          )}
          <View style={styles.chartWrapper}>
            <LineChart
              data={chartData}
              width={screenWidth - 40}
              height={chartHeight}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withDots={true}
              withShadow={false}
              onDataPointClick={handleDataPointClick}
            />
            {xAxisLabel && (
              <View style={styles.xAxisLabelContainer}>
                <Text style={styles.xAxisLabel}>{xAxisLabel}</Text>
              </View>
            )}
          </View>
          <Modal
            visible={alertVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setAlertVisible(false)}
          >
            <TouchableOpacity
              style={styles.alertOverlay}
              activeOpacity={1}
              onPress={() => setAlertVisible(false)}
            >
              <TouchableOpacity
                style={styles.alertContainer}
                activeOpacity={1}
                onPress={e => e.stopPropagation()}
              >
                <Text style={styles.alertTitle}>{alertData?.title || ''}</Text>
                <View style={styles.alertContent}>
                  {alertData?.content.map((line, index) => (
                    <Text key={index} style={styles.alertText}>
                      {line}
                    </Text>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.alertButton}
                  onPress={() => setAlertVisible(false)}
                >
                  <Text style={styles.alertButtonText}>OK</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
          {showLegend && data.datasets && data.datasets.length > 0 && (
            <View style={[styles.legend, xAxisLabel && styles.legendWithXAxis]}>
              {data.datasets.map((dataset, index) => (
                <View
                  key={`${dataset.label}-${index}`}
                  style={styles.legendItem}
                >
                  <View
                    style={[
                      styles.legendColor,
                      { backgroundColor: dataset.color },
                    ]}
                  />
                  <Text style={styles.legendText}>{dataset.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    } catch {
      return (
        <View style={[styles.container, styles.placeholder]}>
          <Text style={styles.placeholderText}>Error rendering chart</Text>
        </View>
      );
    }
  }

  return (
    <View style={[styles.container, styles.placeholder]}>
      <Text style={styles.placeholderText}>
        Chart type "{type}" not implemented yet
      </Text>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    yAxisLabelContainer: {
      width: '100%',
      paddingLeft: 20,
      marginBottom: 8,
    },
    yAxisLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    chartWrapper: {
      position: 'relative',
      width: screenWidth - 40,
    },
    chart: {
      marginTop: 8,
      marginBottom: 0,
      borderRadius: 16,
    },
    xAxisLabelContainer: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      paddingRight: 20,
    },
    xAxisLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    legend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
    },
    legendWithXAxis: {
      marginTop: theme.spacing.lg + 16,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: theme.spacing.xs,
      marginVertical: theme.spacing.xs,
      minWidth: 100,
    },
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: theme.spacing.xs,
    },
    legendText: {
      fontSize: 12,
      color: theme.colors.text,
      fontWeight: '500',
    },
    placeholder: {
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      margin: theme.spacing.md,
    },
    placeholderText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    alertOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    alertContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg || 16,
      padding: theme.spacing.lg,
      width: '100%',
      maxWidth: 400,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    alertTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      textAlign: 'left',
    },
    alertContent: {
      marginBottom: theme.spacing.lg,
    },
    alertText: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
      lineHeight: 20,
    },
    alertButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.sm || 8,
      alignItems: 'center',
      height: 40,
    },
    alertButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default Chart;
