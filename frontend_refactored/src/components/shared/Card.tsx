import React from "react";
import { Card as MuiCard, CardContent } from "@mui/material";
import type { CardProps as MuiCardProps } from "@mui/material";

interface CardProps extends MuiCardProps {
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, ...props }) => {
  return (
    <MuiCard {...props}>
      <CardContent>{children}</CardContent>
    </MuiCard>
  );
};

export default Card;
