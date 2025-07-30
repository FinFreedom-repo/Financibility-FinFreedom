import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, Box } from '@mui/material';

function TestDialog() {
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    console.log('Opening dialog');
    setOpen(true);
  };

  const handleClose = () => {
    console.log('Closing dialog');
    setOpen(false);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Button variant="contained" onClick={handleOpen}>
        Open Test Dialog
      </Button>
      
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Test Dialog</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This is a test dialog to verify basic functionality.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TestDialog;
