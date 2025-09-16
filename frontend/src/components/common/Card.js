import React from 'react';
import { Card as MuiCard, CardContent, CardHeader, CardActions } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(MuiCard)(({ theme, elevation = 1 }) => ({
  borderRadius: 16,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: `0 ${elevation * 2}px ${elevation * 12}px rgba(0, 0, 0, ${theme.palette.mode === 'dark' ? 0.3 : 0.08})`,
  transition: 'all 0.2s ease-in-out',
  
  '&:hover': {
    boxShadow: `0 ${elevation * 4}px ${elevation * 20}px rgba(0, 0, 0, ${theme.palette.mode === 'dark' ? 0.4 : 0.12})`,
    transform: 'translateY(-2px)',
  },
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(3),
  '&:last-child': {
    paddingBottom: theme.spacing(3),
  },
}));

const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  paddingBottom: theme.spacing(1),
  '& .MuiCardHeader-title': {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
  '& .MuiCardHeader-subheader': {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
  },
}));

export const Card = ({ 
  children, 
  elevation = 1, 
  title, 
  subtitle, 
  actions, 
  ...props 
}) => {
  return (
    <StyledCard elevation={elevation} {...props}>
      {title && (
        <StyledCardHeader
          title={title}
          subheader={subtitle}
          action={actions}
        />
      )}
      <StyledCardContent>
        {children}
      </StyledCardContent>
    </StyledCard>
  );
};

export default Card;
