import React, { useState } from "react";
import {
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
} from "@mui/material";
import Layout from "@/components/Layout/Layout";
import axios from "@/utils/axios";

const WealthProjectorPage: React.FC = () => {
  const [form, setForm] = useState({
    current_age: "",
    retirement_age: "",
    current_savings: "",
    monthly_contribution: "",
    expected_return: "7",
  });
  const [projection, setProjection] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculateProjection = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/mongodb/wealth-projection/", {
        ...form,
        current_age: parseInt(form.current_age),
        retirement_age: parseInt(form.retirement_age),
        current_savings: parseFloat(form.current_savings),
        monthly_contribution: parseFloat(form.monthly_contribution),
        expected_return: parseFloat(form.expected_return),
      });
      setProjection(response.data);
    } catch (error) {
      console.error("Error calculating projection:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Wealth Projector
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Current Age"
              type="number"
              value={form.current_age}
              onChange={(e) =>
                setForm({ ...form, current_age: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Retirement Age"
              type="number"
              value={form.retirement_age}
              onChange={(e) =>
                setForm({ ...form, retirement_age: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Current Savings"
              type="number"
              value={form.current_savings}
              onChange={(e) =>
                setForm({ ...form, current_savings: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Monthly Contribution"
              type="number"
              value={form.monthly_contribution}
              onChange={(e) =>
                setForm({ ...form, monthly_contribution: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Expected Return (%)"
              type="number"
              value={form.expected_return}
              onChange={(e) =>
                setForm({ ...form, expected_return: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={calculateProjection}
              disabled={loading}
              fullWidth
            >
              {loading ? "Calculating..." : "Calculate Projection"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {projection && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Projection Results
          </Typography>
          <Typography>
            Projected Wealth at Retirement: $
            {projection.final_amount?.toFixed(2)}
          </Typography>
          <Typography>
            Years to Retirement: {projection.years_to_retirement}
          </Typography>
        </Paper>
      )}
    </Layout>
  );
};

export default WealthProjectorPage;
