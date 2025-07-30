import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 16,
    boxShadow: `0 8px 40px rgba(0, 0, 0, ${theme.palette.mode === 'dark' ? 0.4 : 0.15})`,
    border: `1px solid ${theme.palette.divider}`,
    maxWidth: 'none',
    margin: theme.spacing(2),
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  padding: theme.spacing(3, 3, 1, 3),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  
  '& .MuiTypography-root': {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(1, 3, 2, 3),
  color: theme.palette.text.primary,
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(2, 3, 3, 3),
  gap: theme.spacing(1),
}));

export const Modal = ({ 
  open, 
  onClose, 
  title, 
  children, 
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  ...props 
}) => {
  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      {...props}
    >
      {title && (
        <StyledDialogTitle>
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </StyledDialogTitle>
      )}
      
      <StyledDialogContent>
        {children}
      </StyledDialogContent>
      
      {actions && (
        <StyledDialogActions>
          {actions}
        </StyledDialogActions>
      )}
    </StyledDialog>
  );
};

export default Modal;
