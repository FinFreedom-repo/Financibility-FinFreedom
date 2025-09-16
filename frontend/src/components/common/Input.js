import React from 'react';
import { TextField as MuiTextField, InputAdornment } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledTextField = styled(MuiTextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
    transition: 'all 0.2s ease-in-out',
    
    '& fieldset': {
      borderColor: theme.palette.divider,
      borderWidth: 1,
    },
    
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
    
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
    },
    
    '&.Mui-error fieldset': {
      borderColor: theme.palette.error.main,
    },
  },
  
  '& .MuiInputLabel-root': {
    fontSize: '0.875rem',
    fontWeight: 500,
    
    '&.Mui-focused': {
      color: theme.palette.primary.main,
    },
  },
  
  '& .MuiFormHelperText-root': {
    fontSize: '0.75rem',
    marginTop: theme.spacing(1),
    marginLeft: theme.spacing(1),
  },
}));

export const Input = ({ 
  label, 
  placeholder, 
  error, 
  helperText, 
  startIcon, 
  endIcon, 
  type = 'text',
  fullWidth = true,
  ...props 
}) => {
  return (
    <StyledTextField
      label={label}
      placeholder={placeholder}
      type={type}
      fullWidth={fullWidth}
      variant="outlined"
      error={error}
      helperText={helperText}
      InputProps={{
        startAdornment: startIcon && (
          <InputAdornment position="start">{startIcon}</InputAdornment>
        ),
        endAdornment: endIcon && (
          <InputAdornment position="end">{endIcon}</InputAdornment>
        ),
      }}
      {...props}
    />
  );
};

export default Input;
