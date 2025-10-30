import React, { useState, useEffect } from "react";
import {
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
} from "@mui/material";
import Layout from "@/components/Layout/Layout";
import axios from "@/utils/axios";

const ExpenseAnalyzerPage: React.FC = () => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyzeExpenses = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/mongodb/expense-analysis/");
      setAnalysis(response.data);
    } catch (error) {
      console.error("Error analyzing expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyzeExpenses();
  }, []);

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Expense Analyzer
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Button
          variant="contained"
          onClick={analyzeExpenses}
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Analyze Expenses"}
        </Button>
      </Paper>

      {analysis && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Analysis Results
          </Typography>
          <List>
            {analysis.categories?.map((cat: any, idx: number) => (
              <ListItem key={idx}>
                <ListItemText
                  primary={cat.name}
                  secondary={`Amount: $${cat.amount} (${cat.percentage}%)`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Layout>
  );
};

export default ExpenseAnalyzerPage;
