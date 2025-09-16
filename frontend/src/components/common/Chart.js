import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';
import { useTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Chart = ({ 
  type, 
  data, 
  options = {}, 
  height = 300, 
  title,
  animated = true,
  responsive = true 
}) => {
  const theme = useTheme();
  const chartRef = useRef(null);

  // Theme-based chart colors
  const getThemeColors = () => {
    const isDark = theme.palette.mode === 'dark';
    return {
      primary: theme.palette.primary.main,
      secondary: theme.palette.secondary.main,
      success: theme.palette.success.main,
      error: theme.palette.error.main,
      warning: theme.palette.warning.main,
      info: theme.palette.info.main,
      text: theme.palette.text.primary,
      textSecondary: theme.palette.text.secondary,
      background: theme.palette.background.paper,
      surface: theme.palette.background.default,
      divider: theme.palette.divider,
      gradients: [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        'linear-gradient(135deg, #ff8a80 0%, #ea4c89 100%)',
      ],
      colors: [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.success.main,
        theme.palette.error.main,
        theme.palette.warning.main,
        theme.palette.info.main,
        '#9c27b0',
        '#ff5722',
        '#607d8b',
        '#795548',
      ]
    };
  };

  // Default theme options
  const getDefaultOptions = () => {
    const themeColors = getThemeColors();
    
    return {
      responsive: responsive,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index',
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: themeColors.text,
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
              family: theme.typography.fontFamily,
            },
          },
        },
        tooltip: {
          backgroundColor: themeColors.surface,
          titleColor: themeColors.text,
          bodyColor: themeColors.text,
          borderColor: themeColors.divider,
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y || context.parsed;
              return `${label}: ${typeof value === 'number' ? value.toLocaleString() : value}`;
            }
          }
        },
      },
      scales: {
        ...(type !== 'doughnut' && type !== 'pie' && {
          x: {
            ticks: {
              color: themeColors.textSecondary,
              font: {
                size: 11,
                family: theme.typography.fontFamily,
              },
            },
            grid: {
              color: themeColors.divider,
              drawBorder: false,
            },
          },
          y: {
            ticks: {
              color: themeColors.textSecondary,
              font: {
                size: 11,
                family: theme.typography.fontFamily,
              },
              callback: (value) => {
                if (typeof value === 'number') {
                  return value.toLocaleString();
                }
                return value;
              }
            },
            grid: {
              color: themeColors.divider,
              drawBorder: false,
            },
          },
        }),
      },
      animation: animated ? {
        duration: 1000,
        easing: 'easeInOutQuart',
      } : false,
    };
  };

  // Apply theme colors to data
  const getThemedData = () => {
    const themeColors = getThemeColors();
    const themedData = { ...data };

    if (themedData.datasets) {
      themedData.datasets = themedData.datasets.map((dataset, index) => {
        const colorIndex = index % themeColors.colors.length;
        const baseColor = themeColors.colors[colorIndex];
        
        return {
          ...dataset,
          backgroundColor: dataset.backgroundColor || (
            type === 'line' 
              ? `${baseColor}20` 
              : Array.isArray(dataset.data) 
                ? dataset.data.map((_, i) => themeColors.colors[i % themeColors.colors.length] + '80')
                : `${baseColor}80`
          ),
          borderColor: dataset.borderColor || baseColor,
          borderWidth: dataset.borderWidth || (type === 'line' ? 3 : 1),
          pointBackgroundColor: dataset.pointBackgroundColor || baseColor,
          pointBorderColor: dataset.pointBorderColor || baseColor,
          pointHoverBackgroundColor: dataset.pointHoverBackgroundColor || baseColor,
          pointHoverBorderColor: dataset.pointHoverBorderColor || baseColor,
          fill: dataset.fill !== undefined ? dataset.fill : (type === 'line' ? true : false),
          tension: dataset.tension || (type === 'line' ? 0.4 : 0),
        };
      });
    }

    return themedData;
  };

  // Merge options
  const mergedOptions = {
    ...getDefaultOptions(),
    ...options,
    plugins: {
      ...getDefaultOptions().plugins,
      ...options.plugins,
    },
  };

  const themedData = getThemedData();

  // Animation effect
  useEffect(() => {
    if (animated && chartRef.current) {
      const chart = chartRef.current;
      chart.update('active');
    }
  }, [animated, data]);

  const renderChart = () => {
    const commonProps = {
      ref: chartRef,
      data: themedData,
      options: mergedOptions,
    };

    switch (type) {
      case 'bar':
        return <Bar {...commonProps} />;
      case 'line':
        return <Line {...commonProps} />;
      case 'doughnut':
        return <Doughnut {...commonProps} />;
      case 'pie':
        return <Pie {...commonProps} />;
      default:
        return <Bar {...commonProps} />;
    }
  };

  return (
    <Box sx={{ width: '100%', height: height }}>
      {title && (
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            mb: 2, 
            fontWeight: 'bold',
            color: 'text.primary'
          }}
        >
          {title}
        </Typography>
      )}
      <Box sx={{ position: 'relative', height: title ? height - 40 : height }}>
        {renderChart()}
      </Box>
    </Box>
  );
};

export default Chart;
