import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Paper,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import Layout from "@/components/Layout/Layout";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useConfirm } from "@/hooks/useConfirm";
import accountsDebtsService from "@/services/accountsDebtsService";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function AccountsAndDebtsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { confirm, dialogProps } = useConfirm();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  // Dialog states
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [debtDialogOpen, setDebtDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [editingDebt, setEditingDebt] = useState<any>(null);

  // Form states
  const [accountForm, setAccountForm] = useState({
    name: "",
    balance: "",
    account_type: "checking",
    interest_rate: "0.01",
    effective_date: new Date().toISOString().split("T")[0],
  });

  const [debtForm, setDebtForm] = useState({
    name: "",
    balance: "",
    debt_type: "credit_card",
    interest_rate: "24.99",
    effective_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accountsRes, debtsRes] = await Promise.all([
        accountsDebtsService.getAccounts(),
        accountsDebtsService.getDebts(),
      ]);
      setAccounts(accountsRes || []);
      setDebts(debtsRes || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      enqueueSnackbar("Error loading data", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...accountForm,
        balance: parseFloat(accountForm.balance),
        interest_rate: parseFloat(accountForm.interest_rate),
      };

      if (editingAccount) {
        await accountsDebtsService.updateAccount(editingAccount.id, data);
        enqueueSnackbar("Account updated successfully!", {
          variant: "success",
        });
      } else {
        await accountsDebtsService.createAccount(data);
        enqueueSnackbar("Account added successfully!", { variant: "success" });
      }

      setAccountDialogOpen(false);
      setEditingAccount(null);
      resetAccountForm();
      await fetchData();
    } catch (error) {
      console.error("Error saving account:", error);
      enqueueSnackbar("Error saving account", { variant: "error" });
    }
  };

  const handleDebtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...debtForm,
        amount: parseFloat(debtForm.balance),
        interest_rate: parseFloat(debtForm.interest_rate),
      };

      if (editingDebt) {
        await accountsDebtsService.updateDebt(editingDebt.id, data);
        enqueueSnackbar("Debt updated successfully!", { variant: "success" });
      } else {
        await accountsDebtsService.createDebt(data);
        enqueueSnackbar("Debt added successfully!", { variant: "success" });
      }

      setDebtDialogOpen(false);
      setEditingDebt(null);
      resetDebtForm();
      await fetchData();
    } catch (error) {
      console.error("Error saving debt:", error);
      enqueueSnackbar("Error saving debt", { variant: "error" });
    }
  };

  const handleDeleteAccount = async (id: string) => {
    const confirmed = await confirm({
      title: "Delete Account",
      message:
        "Are you sure you want to delete this account? This action cannot be undone.",
      confirmText: "Delete",
      confirmColor: "error",
    });

    if (confirmed) {
      try {
        await accountsDebtsService.deleteAccount(id);
        enqueueSnackbar("Account deleted successfully!", {
          variant: "success",
        });
        await fetchData();
      } catch (error) {
        console.error("Error deleting account:", error);
        enqueueSnackbar("Error deleting account", { variant: "error" });
      }
    }
  };

  const handleDeleteDebt = async (id: string) => {
    const confirmed = await confirm({
      title: "Delete Debt",
      message:
        "Are you sure you want to delete this debt? This action cannot be undone.",
      confirmText: "Delete",
      confirmColor: "error",
    });

    if (confirmed) {
      try {
        await accountsDebtsService.deleteDebt(id);
        enqueueSnackbar("Debt deleted successfully!", { variant: "success" });
        await fetchData();
      } catch (error) {
        console.error("Error deleting debt:", error);
        enqueueSnackbar("Error deleting debt", { variant: "error" });
      }
    }
  };

  const resetAccountForm = () => {
    setAccountForm({
      name: "",
      balance: "",
      account_type: "checking",
      interest_rate: "0.01",
      effective_date: new Date().toISOString().split("T")[0],
    });
  };

  const resetDebtForm = () => {
    setDebtForm({
      name: "",
      balance: "",
      debt_type: "credit_card",
      interest_rate: "24.99",
      effective_date: new Date().toISOString().split("T")[0],
    });
  };

  const openAccountDialog = (account?: any) => {
    if (account) {
      setEditingAccount(account);
      setAccountForm({
        name: account.name,
        balance: account.balance.toString(),
        account_type: account.account_type,
        interest_rate: account.interest_rate.toString(),
        effective_date: account.effective_date,
      });
    } else {
      resetAccountForm();
    }
    setAccountDialogOpen(true);
  };

  const openDebtDialog = (debt?: any) => {
    if (debt) {
      setEditingDebt(debt);
      setDebtForm({
        name: debt.name,
        balance: debt.balance.toString(),
        debt_type: debt.debt_type,
        interest_rate: debt.interest_rate.toString(),
        effective_date: debt.effective_date,
      });
    } else {
      resetDebtForm();
    }
    setDebtDialogOpen(true);
  };

  const totalAccounts = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalDebts = debts.reduce((sum, debt) => sum + debt.balance, 0);
  const netWorth = totalAccounts - totalDebts;

  return (
    <Layout>
      <ConfirmDialog {...dialogProps} />

      <Typography variant="h4" gutterBottom>
        Accounts & Debts
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Total Accounts</Typography>
            <Typography variant="h5" color="success.main">
              ${totalAccounts.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Total Debts</Typography>
            <Typography variant="h5" color="error.main">
              ${totalDebts.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Net Worth</Typography>
            <Typography
              variant="h5"
              color={netWorth >= 0 ? "success.main" : "error.main"}
            >
              ${netWorth.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Accounts" />
          <Tab label="Debts" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openAccountDialog()}
          sx={{ mb: 2 }}
        >
          Add Account
        </Button>

        <List>
          {accounts.map((account) => (
            <Paper key={account.id} sx={{ mb: 1 }}>
              <ListItem
                secondaryAction={
                  <>
                    <IconButton onClick={() => openAccountDialog(account)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteAccount(account.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                }
              >
                <ListItemText
                  primary={account.name}
                  secondary={`${
                    account.account_type
                  } - $${account.balance.toFixed(2)} (${
                    account.interest_rate
                  }%)`}
                />
              </ListItem>
            </Paper>
          ))}
        </List>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openDebtDialog()}
          sx={{ mb: 2 }}
        >
          Add Debt
        </Button>

        <List>
          {debts.map((debt) => (
            <Paper key={debt.id} sx={{ mb: 1 }}>
              <ListItem
                secondaryAction={
                  <>
                    <IconButton onClick={() => openDebtDialog(debt)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteDebt(debt.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                }
              >
                <ListItemText
                  primary={debt.name}
                  secondary={`${debt.debt_type} - $${debt.balance.toFixed(
                    2
                  )} (${debt.interest_rate}%)`}
                />
              </ListItem>
            </Paper>
          ))}
        </List>
      </TabPanel>

      {/* Account Dialog */}
      <Dialog
        open={accountDialogOpen}
        onClose={() => setAccountDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleAccountSubmit}>
          <DialogTitle>
            {editingAccount ? "Edit Account" : "Add Account"}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Account Name"
              value={accountForm.name}
              onChange={(e) =>
                setAccountForm({ ...accountForm, name: e.target.value })
              }
              required
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              label="Balance"
              type="number"
              value={accountForm.balance}
              onChange={(e) =>
                setAccountForm({ ...accountForm, balance: e.target.value })
              }
              required
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              select
              label="Account Type"
              value={accountForm.account_type}
              onChange={(e) =>
                setAccountForm({ ...accountForm, account_type: e.target.value })
              }
              sx={{ mt: 2 }}
            >
              <MenuItem value="checking">Checking</MenuItem>
              <MenuItem value="savings">Savings</MenuItem>
              <MenuItem value="investment">Investment</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Interest Rate (%)"
              type="number"
              value={accountForm.interest_rate}
              onChange={(e) =>
                setAccountForm({
                  ...accountForm,
                  interest_rate: e.target.value,
                })
              }
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              label="Effective Date"
              type="date"
              value={accountForm.effective_date}
              onChange={(e) =>
                setAccountForm({
                  ...accountForm,
                  effective_date: e.target.value,
                })
              }
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAccountDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingAccount ? "Update" : "Add"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Debt Dialog */}
      <Dialog
        open={debtDialogOpen}
        onClose={() => setDebtDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleDebtSubmit}>
          <DialogTitle>{editingDebt ? "Edit Debt" : "Add Debt"}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Debt Name"
              value={debtForm.name}
              onChange={(e) =>
                setDebtForm({ ...debtForm, name: e.target.value })
              }
              required
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              label="Balance"
              type="number"
              value={debtForm.balance}
              onChange={(e) =>
                setDebtForm({ ...debtForm, balance: e.target.value })
              }
              required
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              select
              label="Debt Type"
              value={debtForm.debt_type}
              onChange={(e) =>
                setDebtForm({ ...debtForm, debt_type: e.target.value })
              }
              sx={{ mt: 2 }}
            >
              <MenuItem value="credit_card">Credit Card</MenuItem>
              <MenuItem value="student_loan">Student Loan</MenuItem>
              <MenuItem value="car_loan">Car Loan</MenuItem>
              <MenuItem value="mortgage">Mortgage</MenuItem>
              <MenuItem value="personal_loan">Personal Loan</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Interest Rate (%)"
              type="number"
              value={debtForm.interest_rate}
              onChange={(e) =>
                setDebtForm({ ...debtForm, interest_rate: e.target.value })
              }
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              label="Effective Date"
              type="date"
              value={debtForm.effective_date}
              onChange={(e) =>
                setDebtForm({ ...debtForm, effective_date: e.target.value })
              }
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDebtDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingDebt ? "Update" : "Add"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Layout>
  );
}

export default AccountsAndDebtsPage;
