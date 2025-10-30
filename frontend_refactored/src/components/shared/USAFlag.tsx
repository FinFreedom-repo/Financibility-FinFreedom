import React from "react";
import { Box } from "@mui/material";

const USAFlag: React.FC = () => {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        width: 24,
        height: 16,
        fontSize: "1.5rem",
        verticalAlign: "middle",
        ml: 1,
      }}
    >
      🇺🇸
    </Box>
  );
};

export default USAFlag;
