import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';

function DialogTest() {
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    console.log('Opening dialog...');
    setOpen(true);
  };

  const handleClose = () => {
    console.log('Closing dialog...');
    setOpen(false);
  };

  return (
    <div>
      <Button variant="contained" onClick={handleOpen}>
        Open Test Dialog
      </Button>
      
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Test Dialog</DialogTitle>
        <DialogContent>
          <Typography>
            This is a test dialog to verify MUI Dialog functionality in React 19.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default DialogTest;
