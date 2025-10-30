import React, { useState, useEffect } from "react";
import {
  Typography,
  Paper,
  Button,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useSnackbar } from "notistack";
import Layout from "@/components/Layout/Layout";
import axios from "@/utils/axios";

const DebtPlanningPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [debts, setDebts] = useState<any[]>([]);
  const [strategy, setStrategy] = useState("snowball");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      const response = await axios.get("/api/mongodb/debts/");
      setDebts(response.data.debts || []);
    } catch (error) {
      console.error("Error fetching debts:", error);
    }
  };

  const calculatePlan = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/mongodb/debt-planner/", {
        debts: debts.map((d) => ({
          name: d.name,
          balance: d.balance,
          rate: d.interest_rate,
        })),
        strategy,
        monthly_payment: parseFloat(monthlyPayment),
      });
      setPlan(response.data);
      enqueueSnackbar("Debt payoff plan calculated!", { variant: "success" });
    } catch (error) {
      console.error("Error calculating plan:", error);
      enqueueSnackbar("Error calculating debt plan", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Debt Planning
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Your Debts
        </Typography>
        <List>
          {debts.map((debt) => (
            <ListItem key={debt.id}>
              <ListItemText
                primary={debt.name}
                secondary={`Balance: $${debt.balance} | Rate: ${debt.interest_rate}%`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Payoff Strategy
        </Typography>

        <TextField
          fullWidth
          select
          label="Strategy"
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
          sx={{ mb: 2 }}
        >
          <MenuItem value="snowball">Snowball (Smallest First)</MenuItem>
          <MenuItem value="avalanche">Avalanche (Highest Rate First)</MenuItem>
        </TextField>

        <TextField
          fullWidth
          label="Monthly Payment"
          type="number"
          value={monthlyPayment}
          onChange={(e) => setMonthlyPayment(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained"
          onClick={calculatePlan}
          disabled={loading || debts.length === 0}
          fullWidth
        >
          {loading ? "Calculating..." : "Calculate Payoff Plan"}
        </Button>
      </Paper>

      {plan && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Payoff Plan
          </Typography>
          <Typography>Total Debt: ${plan.total_debt}</Typography>
          <Typography>Months to Payoff: {plan.months_to_payoff}</Typography>
          <Typography>Total Interest: ${plan.total_interest}</Typography>
        </Paper>
      )}
    </Layout>
  );
};

export default DebtPlanningPage;
