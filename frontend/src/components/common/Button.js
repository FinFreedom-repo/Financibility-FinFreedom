import React from 'react';
import { Button as MuiButton, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledButton = styled(MuiButton)(({ theme, variant, size }) => ({
  borderRadius: 8,
  fontWeight: 600,
  textTransform: 'none',
  padding: size === 'small' ? '6px 16px' : size === 'large' ? '12px 32px' : '8px 24px',
  fontSize: size === 'small' ? '0.875rem' : size === 'large' ? '1.125rem' : '1rem',
  transition: 'all 0.2s ease-in-out',
  
  ...(variant === 'contained' && {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    '&:hover': {
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
      transform: 'translateY(-1px)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  }),
  
  ...(variant === 'outlined' && {
    border: `2px solid ${theme.palette.primary.main}`,
    '&:hover': {
      border: `2px solid ${theme.palette.primary.dark}`,
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
    },
  }),
  
  ...(variant === 'text' && {
    '&:hover': {
      backgroundColor: theme.palette.primary.main + '0A',
    },
  }),
}));

export const Button = ({ 
  children, 
  loading = false, 
  disabled = false, 
  variant = 'contained', 
  size = 'medium',
  color = 'primary',
  ...props 
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      color={color}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <CircularProgress
          size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
          sx={{ mr: 1 }}
        />
      )}
      {children}
    </StyledButton>
  );
};

export default Button;
