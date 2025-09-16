import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  LinearProgress,
  Skeleton,
  useTheme,
} from '@mui/material';

// Full page loading spinner
export const PageLoader = ({ message = 'Loading...' }) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        p: 3,
      }}
    >
      <CircularProgress
        size={48}
        sx={{
          mb: 2,
          color: theme.palette.primary.main,
        }}
      />
      <Typography variant="h6" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

// Inline loading spinner
export const InlineLoader = ({ size = 20, message }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
};

// Linear progress loader
export const LinearLoader = ({ message }) => {
  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <LinearProgress />
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {message}
        </Typography>
      )}
    </Box>
  );
};

// Card skeleton loader
export const CardSkeleton = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Box key={index} sx={{ p: 2, mb: 2 }}>
          <Skeleton variant="rectangular" height={200} sx={{ mb: 1, borderRadius: 2 }} />
          <Skeleton variant="text" sx={{ fontSize: '1.2rem', mb: 1 }} />
          <Skeleton variant="text" sx={{ fontSize: '0.9rem' }} />
        </Box>
      ))}
    </>
  );
};

// Table skeleton loader
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <Box sx={{ width: '100%' }}>
      {/* Table header */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} variant="text" sx={{ flex: 1, height: 40 }} />
        ))}
      </Box>
      
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box key={rowIndex} sx={{ display: 'flex', gap: 2, mb: 1 }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" sx={{ flex: 1, height: 30 }} />
          ))}
        </Box>
      ))}
    </Box>
  );
};

// Chart skeleton loader
export const ChartSkeleton = ({ height = 300 }) => {
  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Skeleton variant="text" sx={{ fontSize: '1.5rem', mb: 2, width: '40%' }} />
      <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 2 }} />
    </Box>
  );
};

// Default export
const Loading = {
  PageLoader,
  InlineLoader,
  LinearLoader,
  CardSkeleton,
  TableSkeleton,
  ChartSkeleton,
};

export default Loading;
