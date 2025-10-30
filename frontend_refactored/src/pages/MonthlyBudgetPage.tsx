import React, { useState, useEffect } from "react";
import { Typography, Paper, TextField, Button, Grid } from "@mui/material";
import { useSnackbar } from "notistack";
import Layout from "@/components/Layout/Layout";
import axios from "@/utils/axios";

const MonthlyBudgetPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [budget, setBudget] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    income: "",
    expenses: {} as any,
  });
  const [loading, setLoading] = useState(false);

  const expenseCategories = [
    "Housing",
    "Transportation",
    "Food",
    "Utilities",
    "Insurance",
    "Healthcare",
    "Savings",
    "Personal",
    "Entertainment",
    "Other",
  ];

  useEffect(() => {
    fetchBudget();
  }, []);

  const fetchBudget = async () => {
    try {
      const response = await axios.get("/api/mongodb/budget/");
      if (response.data) {
        setBudget(response.data);
      }
    } catch (error) {
      console.error("Error fetching budget:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("/api/mongodb/budget/", budget);
      enqueueSnackbar("Budget saved successfully!", { variant: "success" });
    } catch (error) {
      console.error("Error saving budget:", error);
      enqueueSnackbar("Error saving budget", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const totalExpenses = Object.values(budget.expenses).reduce(
    (sum: number, val: any) => sum + (parseFloat(val) || 0),
    0
  );
  const remaining = parseFloat(budget.income) - totalExpenses;

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Monthly Budget
      </Typography>

      {message && (
        <Alert
          severity={message.includes("Error") ? "error" : "success"}
          sx={{ mb: 2 }}
        >
          {message}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Month"
                type="number"
                value={budget.month}
                onChange={(e) =>
                  setBudget({ ...budget, month: parseInt(e.target.value) })
                }
                inputProps={{ min: 1, max: 12 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Year"
                type="number"
                value={budget.year}
                onChange={(e) =>
                  setBudget({ ...budget, year: parseInt(e.target.value) })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Monthly Income"
                type="number"
                value={budget.income}
                onChange={(e) =>
                  setBudget({ ...budget, income: e.target.value })
                }
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Expenses
              </Typography>
            </Grid>

            {expenseCategories.map((category) => (
              <Grid item xs={12} md={6} key={category}>
                <TextField
                  fullWidth
                  label={category}
                  type="number"
                  value={budget.expenses[category] || ""}
                  onChange={(e) =>
                    setBudget({
                      ...budget,
                      expenses: {
                        ...budget.expenses,
                        [category]: e.target.value,
                      },
                    })
                  }
                />
              </Grid>
            ))}

            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: "grey.100" }}>
                <Typography>
                  Total Income: ${parseFloat(budget.income) || 0}
                </Typography>
                <Typography>
                  Total Expenses: ${totalExpenses.toFixed(2)}
                </Typography>
                <Typography
                  color={remaining >= 0 ? "success.main" : "error.main"}
                >
                  Remaining: ${remaining.toFixed(2)}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                fullWidth
              >
                {loading ? "Saving..." : "Save Budget"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Layout>
  );
};

export default MonthlyBudgetPage;
