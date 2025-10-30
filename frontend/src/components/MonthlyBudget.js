import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  IconButton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  Snackbar,
  Fade,
  useTheme,
  useMediaQuery,
  Stack,
  InputAdornment,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  PieChart as PieChartIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Home as HomeIcon,
  DirectionsCar as CarIcon,
  Restaurant as FoodIcon,
  LocalHospital as HealthIcon,
  Movie as EntertainmentIcon,
  School as EducationIcon,
  School as SchoolIcon,
  ShoppingCart as ShoppingIcon,
  Flight as TravelIcon,
  Build as UtilitiesIcon,
  ChildCare as ChildCareIcon,
  MoreHoriz as OtherIcon,
  AccountBalance as SavingsIcon,
  Receipt as DebtIcon,
  Visibility as ViewIcon,
  BarChart as BarChartIcon,
  DonutLarge as DonutLargeIcon,
} from "@mui/icons-material";
import { CircularProgress } from "@mui/material";
import axios from "../utils/axios";
import { useAuth } from "../contexts/AuthContext";
import { useTheme as useCustomTheme } from "../contexts/ThemeContext";
import Loading from "./common/Loading";
import Input from "./common/Input";
import { Button as CustomButton } from "./common/Button";
import Chart from "./common/Chart";

function MonthlyBudget() {
  const { user } = useAuth();
  const { isDarkMode } = useCustomTheme();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // State management
  const [formData, setFormData] = useState({
    income: "",
    additional_income: "",
  });

  const [expenses, setExpenses] = useState({
    housing: "",
    transportation: "",
    food: "",
    healthcare: "",
    entertainment: "",
    shopping: "",
    travel: "",
    education: "",
    utilities: "",
    childcare: "",
    debt_payments: "",
    others: "",
  });

  const [additionalExpenses, setAdditionalExpenses] = useState([]);
  const [additionalIncomeItems, setAdditionalIncomeItems] = useState([]);
  const [savingsItems, setSavingsItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [currentBudgetId, setCurrentBudgetId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false);
  const [showAddIncomeDialog, setShowAddIncomeDialog] = useState(false);
  const [showAddSavingsDialog, setShowAddSavingsDialog] = useState(false);
  const [newExpenseItem, setNewExpenseItem] = useState({
    name: "",
    amount: "",
  });
  const [newIncomeItem, setNewIncomeItem] = useState({ name: "", amount: "" });
  const [newSavingsItem, setNewSavingsItem] = useState({
    name: "",
    amount: "",
  });
  const [savingsType, setSavingsType] = useState("custom");
  const [editingExpenseIndex, setEditingExpenseIndex] = useState(null);
  const [editingIncomeIndex, setEditingIncomeIndex] = useState(null);
  const [editingSavingsIndex, setEditingSavingsIndex] = useState(null);

  // Confirmation dialogs state
  const [showDeleteSavingsDialog, setShowDeleteSavingsDialog] = useState(false);
  const [showDeleteExpenseDialog, setShowDeleteExpenseDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState({ type: "", index: -1 });

  // Fixed expense categories with icons and labels
  const expenseCategories = {
    housing: { label: "Housing", icon: <HomeIcon />, color: "#FF6B6B" },
    transportation: {
      label: "Transportation",
      icon: <CarIcon />,
      color: "#4ECDC4",
    },
    food: { label: "Food", icon: <FoodIcon />, color: "#45B7D1" },
    healthcare: { label: "Healthcare", icon: <HealthIcon />, color: "#96CEB4" },
    entertainment: {
      label: "Entertainment",
      icon: <EntertainmentIcon />,
      color: "#FFEAA7",
    },
    shopping: { label: "Shopping", icon: <ShoppingIcon />, color: "#DDA0DD" },
    travel: { label: "Travel", icon: <TravelIcon />, color: "#98D8C8" },
    education: {
      label: "Education",
      icon: <EducationIcon />,
      color: "#F7DC6F",
    },
    utilities: {
      label: "Utilities",
      icon: <UtilitiesIcon />,
      color: "#BB8FCE",
    },
    childcare: {
      label: "Childcare",
      icon: <ChildCareIcon />,
      color: "#85C1E9",
    },
    debt_payments: {
      label: "Required Debt Payments",
      icon: <DebtIcon />,
      color: "#F8C471",
    },
    others: { label: "Miscellaneous", icon: <OtherIcon />, color: "#82E0AA" },
  };

  const colorPalette = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
    "#F8C471",
    "#82E0AA",
    "#F1948A",
    "#85C1E9",
    "#F7DC6F",
  ];

  // Predefined savings options
  const savingsOptions = [
    {
      value: "emergency_fund",
      label: "Emergency Fund",
      icon: <SavingsIcon />,
      color: "#2E7D32",
    },
    {
      value: "retirement",
      label: "Retirement Savings",
      icon: <TrendingUpIcon />,
      color: "#2782ca",
    },
    {
      value: "vacation",
      label: "Vacation Fund",
      icon: <TravelIcon />,
      color: "#FF9800",
    },
    {
      value: "home",
      label: "Home Down Payment",
      icon: <HomeIcon />,
      color: "#ca4b41",
    },
    {
      value: "education",
      label: "Education Fund",
      icon: <EducationIcon />,
      color: "#F57C00",
    },
    {
      value: "college_fund",
      label: "Children's College Fund",
      icon: <SchoolIcon />,
      color: "#9C27B0",
    },
    {
      value: "custom",
      label: "Custom Savings",
      icon: <OtherIcon />,
      color: "#607D8B",
    },
  ];

  // Load budget data on component mount
  useEffect(() => {
    if (user) {
      console.log("✅ User authenticated, loading budget data...");
      loadBudgetData();
    } else {
      console.log("⏳ Waiting for user authentication...");
      setIsLoading(false);
    }
  }, [user]);

  // Load budget data from MongoDB Atlas
  const loadBudgetData = async () => {
    try {
      setIsLoading(true);
      console.log("🔄 Loading budget data from MongoDB Atlas...");

      if (!user) {
        console.error("❌ User not authenticated!");
        setError("Please login first to access budget data");
        setShowErrorSnackbar(true);
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("❌ No access token found!");
        setError("Please login first to access budget data");
        setShowErrorSnackbar(true);
        setIsLoading(false);
        return;
      }

      // FIXED: Use authenticated endpoint to ensure proper user isolation
      const response = await axios.get("/api/budgets/");
      console.log("📊 Budget API response:", response.data);

      // Get current month and year
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // 1-based month
      const currentYear = currentDate.getFullYear();

      console.log(
        `📅 Looking for budget for current month: ${currentMonth}/${currentYear}`
      );

      if (
        response.data &&
        response.data.budgets &&
        response.data.budgets.length > 0
      ) {
        // Find budget for current month and year
        const currentMonthBudget = response.data.budgets.find(
          (budget) =>
            budget.month === currentMonth && budget.year === currentYear
        );

        let budget;
        if (currentMonthBudget) {
          console.log("📊 Found current month budget:", currentMonthBudget);
          budget = currentMonthBudget;
        } else {
          console.log(
            `⚠️  No budget found for current month ${currentMonth}/${currentYear}, using first available budget`
          );
          budget = response.data.budgets[0];
          console.log("📊 Using first available budget:", budget);
        }

        console.log("📊 Loading budget data:", budget);

        setCurrentBudgetId(budget._id);

        // Extract income data
        setFormData({
          income: budget.income || "",
          additional_income: budget.additional_income || "",
        });

        // Extract additional income items
        if (
          budget.additional_income_items &&
          Array.isArray(budget.additional_income_items)
        ) {
          setAdditionalIncomeItems(budget.additional_income_items);
        } else {
          setAdditionalIncomeItems([]);
        }

        // Extract expenses from MongoDB structure
        const budgetExpenses = budget.expenses || {};
        const newExpenses = {};
        Object.keys(expenseCategories).forEach((category) => {
          const sourceKey = category === "others" ? "other" : category;
          newExpenses[category] = budgetExpenses[sourceKey] ?? "";
        });
        setExpenses(newExpenses);

        // Handle additional expenses and savings (filter out base categories that must not appear here)
        const filteredAdditional = (budget.additional_items || []).filter(
          (item) => {
            const name = (item.name || "").toString().toLowerCase().trim();
            return (
              name !== "others" &&
              name !== "other" &&
              name !== "debt payments" &&
              name !== "debt_payments"
            );
          }
        );
        setAdditionalExpenses(filteredAdditional);
        setSavingsItems(budget.savings_items || []);

        console.log("✅ Budget data loaded successfully");
      } else {
        // Initialize with empty values
        console.log(
          "📝 No existing budget found, initializing with empty values"
        );
        setFormData({ income: "", additional_income: "" });
        setExpenses(
          Object.fromEntries(
            Object.keys(expenseCategories).map((key) => [key, ""])
          )
        );
        setAdditionalExpenses([]);
        setAdditionalIncomeItems([]);
        setSavingsItems([]);
        setCurrentBudgetId(null);
      }
    } catch (error) {
      console.error("❌ Error loading budget data:", error);
      setError("Failed to load budget data from MongoDB Atlas");
      setShowErrorSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate budget summary
  const calculateBudgetSummary = () => {
    const primaryIncome = parseFloat(formData.income) || 0;
    const totalAdditionalIncome = additionalIncomeItems.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0
    );
    const totalIncome = primaryIncome + totalAdditionalIncome;

    const totalFixedExpenses = Object.values(expenses).reduce(
      (sum, value) => sum + (parseFloat(value) || 0),
      0
    );
    const totalAdditionalExpenses = additionalExpenses.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0
    );
    const totalExpenses = totalFixedExpenses + totalAdditionalExpenses;

    const totalSavings = savingsItems.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0
    );

    const netBalance = totalIncome - totalExpenses - totalSavings;

    return {
      totalIncome,
      totalFixedExpenses,
      totalAdditionalExpenses,
      totalExpenses,
      totalSavings,
      netBalance,
    };
  };

  // Generate chart data
  const generateChartData = () => {
    const summary = calculateBudgetSummary();

    // Expense breakdown chart
    const expenseLabels = [];
    const expenseData = [];
    const expenseColors = [];

    let colorIndex = 0;

    // Add fixed expenses
    Object.entries(expenses).forEach(([key, value]) => {
      if (value && parseFloat(value) > 0) {
        expenseLabels.push(expenseCategories[key].label);
        expenseData.push(parseFloat(value));
        expenseColors.push(expenseCategories[key].color);
        colorIndex++;
      }
    });

    // Add additional expenses
    additionalExpenses.forEach((item) => {
      if (item.amount && parseFloat(item.amount) > 0) {
        expenseLabels.push(item.name);
        expenseData.push(parseFloat(item.amount));
        expenseColors.push(colorPalette[colorIndex % colorPalette.length]);
        colorIndex++;
      }
    });

    const expenseChartData = {
      labels: expenseLabels,
      datasets: [
        {
          data: expenseData,
          backgroundColor: expenseColors,
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    };

    // Financial Overview chart
    const incomeVsExpensesData = {
      labels: ["Income", "Expenses", "Savings", "Net Balance"],
      datasets: [
        {
          data: [
            summary.totalIncome,
            summary.totalExpenses,
            summary.totalSavings,
            summary.netBalance,
          ],
          backgroundColor: [
            "#2E7D32",
            "#ca4b41",
            "#2782ca",
            summary.netBalance >= 0 ? "#FF9800" : "#ff0000",
          ],
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    };

    return { expenseChartData, incomeVsExpensesData };
  };

  // Handle form input changes
  const handleIncomeChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleExpenseChange = (e) => {
    const { name, value } = e.target;
    setExpenses((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add new expense category
  const handleAddExpense = () => {
    if (newExpenseItem.name && newExpenseItem.amount) {
      if (editingExpenseIndex !== null) {
        // Update existing expense
        const updatedExpenses = [...additionalExpenses];
        updatedExpenses[editingExpenseIndex] = {
          name: newExpenseItem.name,
          amount: parseFloat(newExpenseItem.amount),
        };
        setAdditionalExpenses(updatedExpenses);
        setEditingExpenseIndex(null);
      } else {
        // Add new expense
        setAdditionalExpenses((prev) => [
          ...prev,
          {
            name: newExpenseItem.name,
            amount: parseFloat(newExpenseItem.amount),
          },
        ]);
      }
      setNewExpenseItem({ name: "", amount: "" });
      setShowAddExpenseDialog(false);
    }
  };

  // Add new savings item
  const handleAddSavings = () => {
    if (newSavingsItem.name && newSavingsItem.amount) {
      if (editingSavingsIndex !== null) {
        // Update existing savings
        const updatedSavings = [...savingsItems];
        updatedSavings[editingSavingsIndex] = {
          name: newSavingsItem.name,
          amount: parseFloat(newSavingsItem.amount),
        };
        setSavingsItems(updatedSavings);
        setEditingSavingsIndex(null);
      } else {
        // Add new savings
        setSavingsItems((prev) => [
          ...prev,
          {
            name: newSavingsItem.name,
            amount: parseFloat(newSavingsItem.amount),
          },
        ]);
      }
      setNewSavingsItem({ name: "", amount: "" });
      setShowAddSavingsDialog(false);
    }
  };

  // Edit expense item
  const handleEditExpense = (index) => {
    const item = additionalExpenses[index];
    setNewExpenseItem({ name: item.name, amount: item.amount.toString() });
    setEditingExpenseIndex(index);
    setShowAddExpenseDialog(true);
  };

  // Add new income item
  const handleAddIncome = () => {
    if (newIncomeItem.name && newIncomeItem.amount) {
      if (editingIncomeIndex !== null) {
        // Update existing income item
        const updatedIncomeItems = [...additionalIncomeItems];
        updatedIncomeItems[editingIncomeIndex] = {
          name: newIncomeItem.name,
          amount: parseFloat(newIncomeItem.amount),
        };
        setAdditionalIncomeItems(updatedIncomeItems);
        setEditingIncomeIndex(null);
      } else {
        // Add new income item
        setAdditionalIncomeItems((prev) => [
          ...prev,
          {
            name: newIncomeItem.name,
            amount: parseFloat(newIncomeItem.amount),
          },
        ]);
      }
      setNewIncomeItem({ name: "", amount: "" });
      setShowAddIncomeDialog(false);
    }
  };

  // Edit income item
  const handleEditIncome = (index) => {
    const item = additionalIncomeItems[index];
    setNewIncomeItem({ name: item.name, amount: item.amount.toString() });
    setEditingIncomeIndex(index);
    setShowAddIncomeDialog(true);
  };

  // Delete income item
  const handleDeleteIncome = (index) => {
    setAdditionalIncomeItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Edit savings item
  const handleEditSavings = (index) => {
    const item = savingsItems[index];
    setNewSavingsItem({ name: item.name, amount: item.amount.toString() });
    setEditingSavingsIndex(index);
    setShowAddSavingsDialog(true);
  };

  // Show delete confirmation dialog for expense
  const showDeleteExpenseConfirmation = (index) => {
    setItemToDelete({ type: "expense", index });
    setShowDeleteExpenseDialog(true);
  };

  // Show delete confirmation dialog for savings
  const showDeleteSavingsConfirmation = (index) => {
    setItemToDelete({ type: "savings", index });
    setShowDeleteSavingsDialog(true);
  };

  // Confirm delete expense item
  const confirmDeleteExpense = () => {
    setAdditionalExpenses((prev) =>
      prev.filter((_, i) => i !== itemToDelete.index)
    );
    setShowDeleteExpenseDialog(false);
    setItemToDelete({ type: "", index: -1 });
  };

  // Confirm delete savings item
  const confirmDeleteSavings = () => {
    setSavingsItems((prev) => prev.filter((_, i) => i !== itemToDelete.index));
    setShowDeleteSavingsDialog(false);
    setItemToDelete({ type: "", index: -1 });
  };

  // Cancel delete operation
  const cancelDelete = () => {
    setShowDeleteExpenseDialog(false);
    setShowDeleteSavingsDialog(false);
    setItemToDelete({ type: "", index: -1 });
  };

  // Save budget to MongoDB Atlas
  const handleSaveBudget = async () => {
    try {
      setSaving(true);
      console.log("🔄 Saving budget data...");

      if (!user) {
        setError("Please login first to save budget data");
        setShowErrorSnackbar(true);
        setSaving(false);
        return;
      }

      const token = localStorage.getItem("access_token");
      if (!token) {
        setError("Please login first to save budget data");
        setShowErrorSnackbar(true);
        setSaving(false);
        return;
      }

      // Prepare budget data for current month
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      const budgetData = {
        income: parseFloat(formData.income) || 0,
        additional_income: parseFloat(formData.additional_income) || 0,
        additional_income_items: additionalIncomeItems.map((item) => ({
          name: item.name,
          amount: parseFloat(item.amount) || 0,
        })),
        expenses: Object.fromEntries(
          Object.entries(expenses).map(([key, value]) => [
            key === "others" ? "other" : key,
            parseFloat(value) || 0,
          ])
        ),
        additional_items: additionalExpenses.map((item) => ({
          name: item.name,
          amount: parseFloat(item.amount) || 0,
          type: item.type || "expense",
        })),
        savings_items: savingsItems.map((item) => ({
          name: item.name,
          amount: parseFloat(item.amount) || 0,
        })),
        month: currentMonth,
        year: currentYear,
      };

      console.log("📊 Saving current month budget data:", budgetData);
      console.log("💾 Savings items being saved:", budgetData.savings_items);

      let response;

      // Save current month budget
      if (currentBudgetId) {
        try {
          // Update existing budget for current month
          console.log(
            "🔄 Updating existing budget for current month:",
            currentBudgetId
          );
          response = await axios.put(
            `/api/budgets/${currentBudgetId}/update/`,
            budgetData
          );
          console.log("✅ Current month budget updated successfully");
        } catch (updateError) {
          console.log(
            "🔄 Error updating budget, creating new budget for current month"
          );
          response = await axios.post("/api/budgets/create/", budgetData);
          if (response.data && response.data._id) {
            setCurrentBudgetId(response.data._id);
          }
          console.log("✅ Current month budget created successfully");
        }
      } else {
        // Create new budget for current month
        console.log("🔄 Creating new budget for current month");
        response = await axios.post("/api/budgets/create/", budgetData);
        if (response.data && response.data._id) {
          setCurrentBudgetId(response.data._id);
        }
        console.log("✅ Current month budget created successfully");
      }

      // Fetch the just-saved current month from API to use as canonical base for projections
      const isDev = process.env.NODE_ENV === "development";
      // FIXED: Always use authenticated endpoint for proper user isolation
      const getMonthUrl = "/api/budgets/month/";
      // FIXED: Always use authenticated endpoint for proper user isolation
      const saveMonthUrl = "/api/budgets/month/save/";
      let baseBudgetForProjection = budgetData;
      try {
        const currentSavedResp = await axios.get(
          `${getMonthUrl}?month=${currentMonth}&year=${currentYear}`
        );
        baseBudgetForProjection = currentSavedResp.data || budgetData;
      } catch (_) {
        // Fall back to local data if fetch fails
      }

      // Now create 12 projected months with the canonical base budget (respecting manually edited categories)
      console.log(
        "🔄 Creating 12 projected months with current month data (respecting user edits)..."
      );

      // Create all projected months in parallel for better performance
      const projectedMonthPromises = [];
      for (let i = 1; i <= 12; i++) {
        const projectedDate = new Date(currentYear, currentMonth - 1 + i, 1);
        const projectedMonth = projectedDate.getMonth() + 1;
        const projectedYear = projectedDate.getFullYear();

        const promise = (async () => {
          try {
            // Fetch existing budget to check for manually edited categories
            let existingBudget = null;
            try {
              const getMonthUrl = `${process.env.REACT_APP_API_URL}/api/budgets/month/`;
              const existingResp = await axios.get(
                `${getMonthUrl}?month=${projectedMonth}&year=${projectedYear}`
              );
              existingBudget = existingResp.data;
            } catch (getError) {
              // Budget doesn't exist yet, use base budget entirely
              existingBudget = null;
            }

            let projectedBudgetData;
            if (
              existingBudget &&
              existingBudget.manually_edited_categories &&
              existingBudget.manually_edited_categories.length > 0
            ) {
              // This month has manually edited categories - preserve them
              console.log(
                `🔒 Preserving manually edited categories for ${projectedMonth}/${projectedYear}:`,
                existingBudget.manually_edited_categories
              );

              // Create mapping of category names to budget fields
              const categoryMapping = {
                Income: ["income", "additional_income"],
                Housing: ["expenses.housing"],
                "Debt payments": ["expenses.debt_payments"],
                Transportation: ["expenses.transportation"],
                Food: ["expenses.food"],
                Healthcare: ["expenses.healthcare"],
                Entertainment: ["expenses.entertainment"],
                Shopping: ["expenses.shopping"],
                Travel: ["expenses.travel"],
                Education: ["expenses.education"],
                Utilities: ["expenses.utilities"],
                Childcare: ["expenses.childcare"],
                Other: ["expenses.other"],
              };

              // Start with existing budget, then selectively update non-locked categories
              projectedBudgetData = { ...existingBudget };
              const lockedCategories = new Set(
                existingBudget.manually_edited_categories
              );

              // Update each category from base budget only if it's not manually edited
              Object.keys(categoryMapping).forEach((category) => {
                if (!lockedCategories.has(category)) {
                  if (category === "Income") {
                    projectedBudgetData.income =
                      baseBudgetForProjection.income || 0;
                    projectedBudgetData.additional_income =
                      baseBudgetForProjection.additional_income || 0;
                  } else {
                    const expenseKey =
                      categoryMapping[category][0].split(".")[1];
                    if (baseBudgetForProjection.expenses && expenseKey) {
                      projectedBudgetData.expenses[expenseKey] =
                        baseBudgetForProjection.expenses[expenseKey] || 0;
                    }
                  }
                }
              });

              // Always update additional_items and savings_items if not manually edited as individual categories
              const hasLockedAdditionalItems =
                existingBudget.manually_edited_categories.some(
                  (cat) => !Object.keys(categoryMapping).includes(cat)
                );
              if (!hasLockedAdditionalItems) {
                projectedBudgetData.additional_items =
                  baseBudgetForProjection.additional_items || [];
                projectedBudgetData.savings_items =
                  baseBudgetForProjection.savings_items || [];
              }

              console.log(
                `✅ Protected projected month ${projectedMonth}/${projectedYear} - kept ${lockedCategories.size} manually edited categories`
              );
            } else {
              // No manually edited categories, use base budget entirely
              projectedBudgetData = {
                ...baseBudgetForProjection,
                month: projectedMonth,
                year: projectedYear,
                manually_edited_categories: [], // Initialize empty array
              };
            }

            // Ensure month and year are set correctly
            projectedBudgetData.month = projectedMonth;
            projectedBudgetData.year = projectedYear;

            await axios.post(saveMonthUrl, projectedBudgetData);
            console.log(
              `✅ Saved projected month ${projectedMonth}/${projectedYear}`
            );
          } catch (projectedError) {
            console.error(
              `❌ Error saving projected month ${projectedMonth}/${projectedYear}:`,
              projectedError
            );
          }
        })();

        projectedMonthPromises.push(promise);
      }

      // Wait for all projected months to be created
      await Promise.all(projectedMonthPromises);

      console.log("✅ All 12 projected months created/updated successfully");

      setSuccessMessage("Budget saved successfully!");
      setShowSuccessSnackbar(true);

      // Reload budget data
      await loadBudgetData();

      setSaving(false);
    } catch (error) {
      console.error("❌ Error saving budget:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Failed to save budget to MongoDB Atlas";

      setError(errorMessage);
      setShowErrorSnackbar(true);
      setSaving(false);
    }
  };

  if (isLoading) {
    return <Loading.PageLoader />;
  }

  if (!user) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: "bold",
            color: theme.palette.text.primary,
            mb: 3,
          }}
        >
          Monthly Budget Planner
        </Typography>
        <Alert severity="warning" sx={{ maxWidth: 600, mx: "auto", mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Authentication Required
          </Typography>
          <Typography>Please login to access your budget data.</Typography>
        </Alert>
        <Button
          variant="contained"
          color="primary"
          onClick={() => (window.location.href = "/login")}
          sx={{ mt: 2 }}
        >
          Go to Login
        </Button>
      </Box>
    );
  }

  const summary = calculateBudgetSummary();
  const { expenseChartData, incomeVsExpensesData } = generateChartData();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
        p: { xs: 2, sm: 3, md: 4, lg: 5 },
        boxSizing: "border-box",
      }}
    >
      <Fade in={true}>
        <Box
          sx={{
            width: "100%",
            maxWidth: "100%",
            height: "100%",
          }}
        >
          <Typography
            variant="h3"
            gutterBottom
            sx={{
              fontWeight: "bold",
              color: theme.palette.text.primary,
              mb: 4,
              textAlign: "center",
              background: "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem", lg: "3.5rem" },
            }}
          >
            Monthly Budget Planner
          </Typography>

          {/* Navigation Tabs */}
          <Box
            sx={{
              mb: 4,
              p: 3,
              borderRadius: 3,
              background: `linear-gradient(90deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
              boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {[
                { key: "overview", label: "Overview", icon: <ViewIcon /> },
                { key: "income", label: "Income", icon: <MoneyIcon /> },
                {
                  key: "expenses",
                  label: "Expenses",
                  icon: <TrendingDownIcon />,
                },
                { key: "savings", label: "Savings", icon: <SavingsIcon /> },
                { key: "charts", label: "Stats", icon: <BarChartIcon /> },
              ].map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? "contained" : "outlined"}
                  startIcon={tab.icon}
                  onClick={() => setActiveTab(tab.key)}
                  sx={{
                    minWidth: { xs: "100%", sm: 140, md: 160 },
                    py: 1.5,
                    px: 3,
                    borderRadius: 2,
                    fontSize: { xs: "1rem", sm: "1.1rem" },
                    fontWeight: 600,
                    textTransform: "none",
                    boxShadow:
                      activeTab === tab.key
                        ? "0 4px 16px rgba(0,0,0,0.15)"
                        : "none",
                    transition: "all 0.3s ease",
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </Stack>
          </Box>

          <Grid container spacing={4} sx={{ width: "100%" }}>
            {/* Main Content */}
            <Grid item xs={12} xl={activeTab === "overview" ? 12 : 9}>
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <Card
                  elevation={4}
                  sx={{
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 3,
                      }}
                    >
                      <TrendingUpIcon
                        sx={{ mr: 1, color: theme.palette.primary.main }}
                      />
                      Budget Overview
                    </Typography>

                    <Grid container spacing={4}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box
                          sx={{
                            textAlign: "center",
                            p: 4,
                            background:
                              "linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)",
                            borderRadius: 3,
                            boxShadow: "0 6px 24px rgba(76, 175, 80, 0.3)",
                            color: "white",
                            transition: "transform 0.3s ease",
                            "&:hover": { transform: "translateY(-6px)" },
                            minHeight: 160,
                          }}
                        >
                          <Typography
                            variant="h4"
                            sx={{
                              fontWeight: "bold",
                              mb: 2,
                              fontSize: {
                                xs: "1.8rem",
                                sm: "2.2rem",
                                md: "2.5rem",
                              },
                            }}
                          >
                            ${summary.totalIncome.toLocaleString()}
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              opacity: 0.9,
                              fontSize: {
                                xs: "1rem",
                                sm: "1.1rem",
                                md: "1.2rem",
                              },
                            }}
                          >
                            Total Income
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6} md={3}>
                        <Box
                          sx={{
                            textAlign: "center",
                            p: 4,
                            background:
                              "linear-gradient(135deg, #F44336 0%, #EF5350 100%)",
                            borderRadius: 3,
                            boxShadow: "0 6px 24px rgba(244, 67, 54, 0.3)",
                            color: "white",
                            transition: "transform 0.3s ease",
                            "&:hover": { transform: "translateY(-6px)" },
                            minHeight: 160,
                          }}
                        >
                          <Typography
                            variant="h4"
                            sx={{
                              fontWeight: "bold",
                              mb: 2,
                              fontSize: {
                                xs: "1.8rem",
                                sm: "2.2rem",
                                md: "2.5rem",
                              },
                            }}
                          >
                            ${summary.totalExpenses.toLocaleString()}
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              opacity: 0.9,
                              fontSize: {
                                xs: "1rem",
                                sm: "1.1rem",
                                md: "1.2rem",
                              },
                            }}
                          >
                            Total Expenses
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6} md={3}>
                        <Box
                          sx={{
                            textAlign: "center",
                            p: 4,
                            background:
                              "linear-gradient(135deg, #007fff 0%, #4da6ff 100%)",
                            borderRadius: 3,
                            boxShadow: "0 6px 24px rgba(0, 102, 204, 0.3)",
                            color: "white",
                            transition: "transform 0.3s ease",
                            "&:hover": { transform: "translateY(-6px)" },
                            minHeight: 160,
                          }}
                        >
                          <Typography
                            variant="h4"
                            sx={{
                              fontWeight: "bold",
                              mb: 2,
                              fontSize: {
                                xs: "1.8rem",
                                sm: "2.2rem",
                                md: "2.5rem",
                              },
                            }}
                          >
                            ${summary.totalSavings.toLocaleString()}
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              opacity: 0.9,
                              fontSize: {
                                xs: "1rem",
                                sm: "1.1rem",
                                md: "1.2rem",
                              },
                            }}
                          >
                            Total Savings
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6} md={3}>
                        <Box
                          sx={{
                            textAlign: "center",
                            p: 4,
                            background:
                              summary.netBalance >= 0
                                ? "linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)"
                                : "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                            borderRadius: 3,
                            boxShadow:
                              summary.netBalance >= 0
                                ? "0 6px 24px rgba(255, 152, 0, 0.3)"
                                : "0 6px 24px rgba(0, 102, 204, 0.3)",
                            color: "white",
                            transition: "transform 0.3s ease",
                            "&:hover": { transform: "translateY(-6px)" },
                            minHeight: 160,
                          }}
                        >
                          <Typography
                            variant="h4"
                            sx={{
                              fontWeight: "bold",
                              mb: 2,
                              fontSize: {
                                xs: "1.8rem",
                                sm: "2.2rem",
                                md: "2.5rem",
                              },
                            }}
                          >
                            ${summary.netBalance.toLocaleString()}
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              opacity: 0.9,
                              fontSize: {
                                xs: "1rem",
                                sm: "1.1rem",
                                md: "1.2rem",
                              },
                            }}
                          >
                            Net Balance
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Box
                      sx={{
                        mt: 4,
                        p: 3,
                        bgcolor: "background.paper",
                        borderRadius: 3,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      }}
                    >
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ mb: 2, fontWeight: "bold" }}
                      >
                        Budget Progress
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={
                          summary.totalIncome > 0
                            ? (summary.totalExpenses / summary.totalIncome) *
                              100
                            : 0
                        }
                        sx={{ height: 12, borderRadius: 6, mb: 2 }}
                        color={
                          summary.totalExpenses > summary.totalIncome
                            ? "error"
                            : "success"
                        }
                      />
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {summary.totalIncome > 0
                          ? `${(
                              (summary.totalExpenses / summary.totalIncome) *
                              100
                            ).toFixed(1)}% of income spent`
                          : "No income recorded"}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Income Tab */}
              {activeTab === "income" && (
                <Card
                  elevation={4}
                  sx={{
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 3,
                      }}
                    >
                      <MoneyIcon
                        sx={{ mr: 1, color: theme.palette.success.main }}
                      />
                      Monthly Income
                    </Typography>

                    <Grid container spacing={4}>
                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{
                            p: 3,
                            bgcolor: "background.paper",
                            borderRadius: 3,
                            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                            border: `1px solid ${theme.palette.divider}`,
                            position: "relative",
                            overflow: "hidden",
                            "&::before": {
                              content: '""',
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              height: 4,
                              background: "#2196f3",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 3,
                            }}
                          >
                            <Box
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: "#2196f3",
                                mr: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <MoneyIcon
                                sx={{ color: "white", fontSize: 24 }}
                              />
                            </Box>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: "bold",
                                color: "#2196f3",
                              }}
                            >
                              Primary Income
                            </Typography>
                          </Box>

                          <Box sx={{ position: "relative" }}>
                            <Input
                              label="Monthly Income Amount"
                              name="income"
                              value={formData.income}
                              onChange={handleIncomeChange}
                              type="number"
                              startAdornment={
                                <InputAdornment position="start">
                                  $
                                </InputAdornment>
                              }
                              fullWidth
                              sx={{
                                "& .MuiInputBase-root": {
                                  height: 64,
                                  fontSize: "1.2rem",
                                  borderRadius: 2,
                                  border: `2px solid ${theme.palette.divider}`,
                                  transition:
                                    "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                  "&:hover": {
                                    borderColor: "primary.main",
                                  },
                                  "&.Mui-focused": {
                                    borderColor: "primary.main",
                                    boxShadow:
                                      "0 0 0 3px rgba(33, 150, 243, 0.1)",
                                  },
                                  "& input": {
                                    fontSize: "1.2rem",
                                    padding: "20px 16px",
                                    fontWeight: 600,
                                    color: "text.primary",
                                  },
                                },
                                "& .MuiInputLabel-root": {
                                  fontSize: "1rem",
                                  fontWeight: 500,
                                  "&.Mui-focused": {
                                    color: "primary.main",
                                  },
                                },
                              }}
                            />

                            {/* Income Display */}
                            {formData.income &&
                              parseFloat(formData.income) > 0 && (
                                <Box
                                  sx={{
                                    mt: 2,
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: "#2196f3",
                                    textAlign: "center",
                                  }}
                                >
                                  <Typography
                                    variant="subtitle2"
                                    sx={{
                                      color: "white",
                                      fontWeight: 600,
                                      mb: 0.5,
                                    }}
                                  >
                                    Monthly Primary Income
                                  </Typography>
                                  <Typography
                                    variant="h4"
                                    sx={{
                                      color: "white",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    $
                                    {parseFloat(
                                      formData.income
                                    ).toLocaleString()}
                                  </Typography>
                                </Box>
                              )}
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{
                            p: 3,
                            bgcolor: "background.paper",
                            borderRadius: 3,
                            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                            border: `1px solid ${theme.palette.divider}`,
                            position: "relative",
                            overflow: "hidden",
                            "&::before": {
                              content: '""',
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              height: 4,
                              background:
                                "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 3,
                            }}
                          >
                            <Box
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                background:
                                  "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                                mr: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <TrendingUpIcon
                                sx={{ color: "white", fontSize: 24 }}
                              />
                            </Box>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: "bold",
                                background:
                                  "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                                backgroundClip: "text",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                color: "transparent",
                              }}
                            >
                              Additional Income
                            </Typography>
                          </Box>

                          {/* Additional Income Items List */}
                          {additionalIncomeItems.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  mb: 2,
                                  color: "text.secondary",
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  letterSpacing: 0.5,
                                  fontSize: "0.75rem",
                                }}
                              >
                                Income Sources ({additionalIncomeItems.length})
                              </Typography>
                              <Stack spacing={1.5}>
                                {additionalIncomeItems.map((item, index) => (
                                  <Card
                                    key={index}
                                    sx={{
                                      borderRadius: 2,
                                      border: `1px solid ${theme.palette.divider}`,
                                      bgcolor: "background.default",
                                      transition:
                                        "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                      "&:hover": {
                                        transform: "translateY(-2px)",
                                        boxShadow:
                                          "0 8px 25px rgba(255, 0, 0, 0.15)",
                                        borderColor: "primary.main",
                                      },
                                    }}
                                  >
                                    <CardContent
                                      sx={{ p: 2, "&:last-child": { pb: 2 } }}
                                    >
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                        }}
                                      >
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            flex: 1,
                                          }}
                                        >
                                          <Box
                                            sx={{
                                              width: 8,
                                              height: 8,
                                              borderRadius: "50%",
                                              background:
                                                "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                                              mr: 2,
                                              flexShrink: 0,
                                            }}
                                          />
                                          <Box sx={{ flex: 1 }}>
                                            <Typography
                                              variant="subtitle1"
                                              sx={{
                                                fontWeight: 600,
                                                color: "text.primary",
                                                mb: 0.5,
                                              }}
                                            >
                                              {item.name}
                                            </Typography>
                                            <Typography
                                              variant="h6"
                                              sx={{
                                                background:
                                                  "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                                                backgroundClip: "text",
                                                WebkitBackgroundClip: "text",
                                                WebkitTextFillColor:
                                                  "transparent",
                                                color: "transparent",
                                                fontWeight: "bold",
                                                fontSize: "1.1rem",
                                              }}
                                            >
                                              ${item.amount.toLocaleString()}
                                            </Typography>
                                          </Box>
                                        </Box>
                                        <Box sx={{ display: "flex", gap: 0.5 }}>
                                          <IconButton
                                            onClick={() =>
                                              handleEditIncome(index)
                                            }
                                            size="small"
                                            sx={{
                                              color: "primary.main",
                                              "&:hover": {
                                                bgcolor: "primary.light",
                                                color: "primary.contrastText",
                                              },
                                            }}
                                          >
                                            <EditIcon fontSize="small" />
                                          </IconButton>
                                          <IconButton
                                            onClick={() =>
                                              handleDeleteIncome(index)
                                            }
                                            size="small"
                                            sx={{
                                              color: "error.main",
                                              "&:hover": {
                                                bgcolor: "error.light",
                                                color: "error.contrastText",
                                              },
                                            }}
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </Box>
                                      </Box>
                                    </CardContent>
                                  </Card>
                                ))}
                              </Stack>
                            </Box>
                          )}

                          {/* Add Additional Income Button */}
                          <Button
                            startIcon={<AddIcon />}
                            onClick={() => setShowAddIncomeDialog(true)}
                            variant="contained"
                            sx={{
                              width: "100%",
                              py: 1.5,
                              borderRadius: 2,
                              background:
                                "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                              boxShadow: "0 4px 15px rgba(255, 0, 0, 0.3)",
                              fontWeight: "bold",
                              fontSize: "1rem",
                              textTransform: "none",
                              transition:
                                "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                              "&:hover": {
                                transform: "translateY(-2px)",
                                boxShadow: "0 8px 25px rgba(255, 0, 0, 0.4)",
                                background:
                                  "linear-gradient(135deg, #cc0000 0%, #0000cc 100%)",
                              },
                              "&:active": {
                                transform: "translateY(0)",
                              },
                            }}
                          >
                            {additionalIncomeItems.length === 0
                              ? "Add Your First Income Source"
                              : "Add Another Income Source"}
                          </Button>

                          {/* Total Additional Income Display */}
                          {additionalIncomeItems.length > 0 && (
                            <Box
                              sx={{
                                mt: 2,
                                p: 2,
                                borderRadius: 2,
                                background:
                                  "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                                textAlign: "center",
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  color: "white",
                                  fontWeight: 600,
                                  mb: 0.5,
                                }}
                              >
                                Total Additional Income
                              </Typography>
                              <Typography
                                variant="h5"
                                sx={{
                                  color: "white",
                                  fontWeight: "bold",
                                }}
                              >
                                $
                                {additionalIncomeItems
                                  .reduce((sum, item) => sum + item.amount, 0)
                                  .toLocaleString()}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    </Grid>

                    <Box
                      sx={{ mt: 3, display: "flex", justifyContent: "center" }}
                    >
                      {/* Removed Overwrite projected months toggle */}
                      <CustomButton
                        onClick={handleSaveBudget}
                        variant="contained"
                        color="primary"
                        startIcon={
                          saving ? (
                            <CircularProgress size={24} color="inherit" />
                          ) : (
                            <SaveIcon />
                          )
                        }
                        disabled={saving}
                        sx={{
                          minWidth: 250,
                          py: 2,
                          px: 4,
                          fontSize: "1.1rem",
                          fontWeight: "bold",
                          borderRadius: 2,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          "&:hover": {
                            boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                            transform: "translateY(-2px)",
                          },
                        }}
                      >
                        {saving ? "Saving Income..." : "Save Budget"}
                      </CustomButton>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Expenses Tab */}
              {activeTab === "expenses" && (
                <Card
                  elevation={4}
                  sx={{
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 3,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: "#8a6bb8",
                            mr: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <TrendingDownIcon
                            sx={{ color: "white", fontSize: 24 }}
                          />
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: "bold",
                            color: "#8a6bb8",
                          }}
                        >
                          Monthly Expenses
                        </Typography>
                      </Box>
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => setShowAddExpenseDialog(true)}
                        variant="contained"
                        sx={{
                          py: 1.5,
                          px: 3,
                          borderRadius: 2,
                          background: "#8a6bb8",
                          boxShadow: "0 4px 15px rgba(138, 107, 184, 0.3)",
                          fontWeight: "bold",
                          fontSize: "1rem",
                          textTransform: "none",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 8px 25px rgba(138, 107, 184, 0.4)",
                            background: "#9d7bc7",
                          },
                          "&:active": {
                            transform: "translateY(0)",
                          },
                        }}
                      >
                        Add Custom Expense
                      </Button>
                    </Box>

                    {/* Monthly Expenses Categories */}
                    <Box sx={{ mt: 3, mb: 3 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 2,
                          color: "text.secondary",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          fontSize: "0.75rem",
                        }}
                      >
                        Expense Categories
                      </Typography>
                    </Box>
                    <Grid container spacing={3}>
                      {Object.entries(expenseCategories).map(
                        ([key, category]) => (
                          <Grid item xs={12} sm={6} md={4} key={key}>
                            <Box
                              sx={{
                                p: 4,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 3,
                                bgcolor: "background.paper",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                transition:
                                  "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                position: "relative",
                                overflow: "hidden",
                                "&::before": {
                                  content: '""',
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  height: 3,
                                  background: "#8a6bb8",
                                },
                                "&:hover": {
                                  boxShadow: "0 8px 25px rgba(255, 0, 0, 0.15)",
                                  transform: "translateY(-2px)",
                                  borderColor: "primary.main",
                                },
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: 3,
                                }}
                              >
                                <Box
                                  sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: "#8a6bb8",
                                    mr: 2,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Box
                                    sx={{ color: "white", fontSize: "1.2rem" }}
                                  >
                                    {category.icon}
                                  </Box>
                                </Box>
                                <Typography
                                  variant="h6"
                                  fontWeight="bold"
                                  sx={{
                                    color: "#8a6bb8",
                                  }}
                                >
                                  {category.label}
                                </Typography>
                              </Box>
                              <Input
                                label="Amount"
                                name={key}
                                value={expenses[key]}
                                onChange={handleExpenseChange}
                                type="number"
                                startAdornment={
                                  <InputAdornment position="start">
                                    $
                                  </InputAdornment>
                                }
                                fullWidth
                                sx={{
                                  "& .MuiInputBase-root": {
                                    height: 56,
                                    fontSize: "1.1rem",
                                    borderRadius: 2,
                                    border: `2px solid ${theme.palette.divider}`,
                                    transition:
                                      "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    "&:hover": {
                                      borderColor: "primary.main",
                                    },
                                    "&.Mui-focused": {
                                      borderColor: "primary.main",
                                      boxShadow:
                                        "0 0 0 3px rgba(33, 150, 243, 0.1)",
                                    },
                                    "& input": {
                                      fontSize: "1.1rem",
                                      padding: "16px 14px",
                                      fontWeight: 600,
                                      color: "text.primary",
                                    },
                                  },
                                  "& .MuiInputLabel-root": {
                                    fontSize: "1rem",
                                    fontWeight: 500,
                                    "&.Mui-focused": {
                                      color: "primary.main",
                                    },
                                  },
                                }}
                              />
                            </Box>
                          </Grid>
                        )
                      )}
                    </Grid>

                    {/* Additional Expenses */}
                    {additionalExpenses.length > 0 && (
                      <Box sx={{ mt: 6 }}>
                        <Box
                          sx={{
                            p: 3,
                            bgcolor: "background.paper",
                            borderRadius: 3,
                            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                            border: `1px solid ${theme.palette.divider}`,
                            position: "relative",
                            overflow: "hidden",
                            "&::before": {
                              content: '""',
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              height: 4,
                              background:
                                "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 3,
                            }}
                          >
                            <Box
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                background:
                                  "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                                mr: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <TrendingDownIcon
                                sx={{ color: "white", fontSize: 24 }}
                              />
                            </Box>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: "bold",
                                background:
                                  "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                                backgroundClip: "text",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                color: "transparent",
                              }}
                            >
                              Custom Expenses
                            </Typography>
                          </Box>

                          <Typography
                            variant="subtitle2"
                            sx={{
                              mb: 2,
                              color: "text.secondary",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                              fontSize: "0.75rem",
                            }}
                          >
                            Custom Expense Items ({additionalExpenses.length})
                          </Typography>

                          <Stack spacing={1.5}>
                            {additionalExpenses.map((item, index) => (
                              <Card
                                key={index}
                                sx={{
                                  borderRadius: 2,
                                  border: `1px solid ${theme.palette.divider}`,
                                  bgcolor: "background.default",
                                  transition:
                                    "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                  "&:hover": {
                                    transform: "translateY(-2px)",
                                    boxShadow:
                                      "0 8px 25px rgba(255, 0, 0, 0.15)",
                                    borderColor: "primary.main",
                                  },
                                }}
                              >
                                <CardContent
                                  sx={{ p: 2, "&:last-child": { pb: 2 } }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        flex: 1,
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          width: 8,
                                          height: 8,
                                          borderRadius: "50%",
                                          background:
                                            "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                                          mr: 2,
                                          flexShrink: 0,
                                        }}
                                      />
                                      <Box sx={{ flex: 1 }}>
                                        <Typography
                                          variant="subtitle1"
                                          sx={{
                                            fontWeight: 600,
                                            color: "text.primary",
                                            mb: 0.5,
                                          }}
                                        >
                                          {item.name}
                                        </Typography>
                                        <Typography
                                          variant="h6"
                                          sx={{
                                            background:
                                              "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                                            backgroundClip: "text",
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent",
                                            color: "transparent",
                                            fontWeight: "bold",
                                            fontSize: "1.1rem",
                                          }}
                                        >
                                          ${item.amount.toLocaleString()}
                                        </Typography>
                                      </Box>
                                    </Box>
                                    <Box sx={{ display: "flex", gap: 0.5 }}>
                                      <IconButton
                                        onClick={() => handleEditExpense(index)}
                                        size="small"
                                        sx={{
                                          color: "primary.main",
                                          "&:hover": {
                                            bgcolor: "primary.light",
                                            color: "primary.contrastText",
                                          },
                                        }}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        onClick={() =>
                                          showDeleteExpenseConfirmation(index)
                                        }
                                        size="small"
                                        sx={{
                                          color: "error.main",
                                          "&:hover": {
                                            bgcolor: "error.light",
                                            color: "error.contrastText",
                                          },
                                        }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  </Box>
                                </CardContent>
                              </Card>
                            ))}
                          </Stack>

                          {/* Total Custom Expenses Display */}
                          <Box
                            sx={{
                              mt: 2,
                              p: 2,
                              borderRadius: 2,
                              background:
                                "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                              textAlign: "center",
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{
                                color: "white",
                                fontWeight: 600,
                                mb: 0.5,
                              }}
                            >
                              Total Custom Expenses
                            </Typography>
                            <Typography
                              variant="h5"
                              sx={{
                                color: "white",
                                fontWeight: "bold",
                              }}
                            >
                              $
                              {additionalExpenses
                                .reduce((sum, item) => sum + item.amount, 0)
                                .toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}

                    <Box
                      sx={{ mt: 3, display: "flex", justifyContent: "center" }}
                    >
                      <CustomButton
                        onClick={handleSaveBudget}
                        variant="contained"
                        color="primary"
                        startIcon={
                          saving ? (
                            <CircularProgress size={24} color="inherit" />
                          ) : (
                            <SaveIcon />
                          )
                        }
                        disabled={saving}
                        sx={{
                          minWidth: 250,
                          py: 2,
                          px: 4,
                          fontSize: "1.1rem",
                          fontWeight: "bold",
                          borderRadius: 2,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          "&:hover": {
                            boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                            transform: "translateY(-2px)",
                          },
                        }}
                      >
                        {saving ? "Saving Expenses..." : "Save Budget"}
                      </CustomButton>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Savings Tab */}
              {activeTab === "savings" && (
                <Box
                  sx={{
                    p: 3,
                    bgcolor: "background.paper",
                    borderRadius: 3,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                    border: `1px solid ${theme.palette.divider}`,
                    position: "relative",
                    overflow: "hidden",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background:
                        "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        background:
                          "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                        mr: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <SavingsIcon sx={{ color: "white", fontSize: 24 }} />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: "bold",
                        background:
                          "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        color: "transparent",
                      }}
                    >
                      Savings
                    </Typography>
                  </Box>

                  {savingsItems.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 8 }}>
                      <Box
                        sx={{
                          p: 3,
                          borderRadius: 3,
                          background:
                            "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 3,
                        }}
                      >
                        <SavingsIcon sx={{ fontSize: 64, color: "white" }} />
                      </Box>
                      <Typography
                        variant="h5"
                        color="text.secondary"
                        gutterBottom
                        sx={{ fontWeight: "bold" }}
                      >
                        No Savings Items Yet
                      </Typography>
                      <Typography
                        variant="h6"
                        color="text.secondary"
                        sx={{ mb: 3 }}
                      >
                        Start building your financial future by adding your
                        savings and investment goals.
                      </Typography>
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => setShowAddSavingsDialog(true)}
                        variant="contained"
                        sx={{
                          py: 1.5,
                          px: 4,
                          borderRadius: 2,
                          background:
                            "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                          boxShadow: "0 4px 15px rgba(255, 0, 0, 0.3)",
                          fontWeight: "bold",
                          fontSize: "1rem",
                          textTransform: "none",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 8px 25px rgba(255, 0, 0, 0.4)",
                            background:
                              "linear-gradient(135deg, #cc0000 0%, #0000cc 100%)",
                          },
                          "&:active": {
                            transform: "translateY(0)",
                          },
                        }}
                      >
                        Add Your First Savings Goal
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 2,
                          color: "text.secondary",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          fontSize: "0.75rem",
                        }}
                      >
                        Savings Goals ({savingsItems.length})
                      </Typography>

                      <Stack spacing={1.5}>
                        {savingsItems.map((item, index) => (
                          <Card
                            key={index}
                            sx={{
                              borderRadius: 2,
                              border: `1px solid ${theme.palette.divider}`,
                              bgcolor: "background.default",
                              transition:
                                "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                              "&:hover": {
                                transform: "translateY(-2px)",
                                boxShadow: "0 8px 25px rgba(255, 0, 0, 0.15)",
                                borderColor: "primary.main",
                              },
                            }}
                          >
                            <CardContent
                              sx={{ p: 2, "&:last-child": { pb: 2 } }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    flex: 1,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: "50%",
                                      background:
                                        "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                                      mr: 2,
                                      flexShrink: 0,
                                    }}
                                  />
                                  <Box sx={{ flex: 1 }}>
                                    <Typography
                                      variant="subtitle1"
                                      sx={{
                                        fontWeight: 600,
                                        color: "text.primary",
                                        mb: 0.5,
                                      }}
                                    >
                                      {item.name}
                                    </Typography>
                                    <Typography
                                      variant="h6"
                                      sx={{
                                        background:
                                          "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                                        backgroundClip: "text",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        color: "transparent",
                                        fontWeight: "bold",
                                        fontSize: "1.1rem",
                                      }}
                                    >
                                      ${item.amount.toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ display: "flex", gap: 0.5 }}>
                                  <IconButton
                                    onClick={() => handleEditSavings(index)}
                                    size="small"
                                    sx={{
                                      color: "primary.main",
                                      "&:hover": {
                                        bgcolor: "primary.light",
                                        color: "primary.contrastText",
                                      },
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    onClick={() =>
                                      showDeleteSavingsConfirmation(index)
                                    }
                                    size="small"
                                    sx={{
                                      color: "error.main",
                                      "&:hover": {
                                        bgcolor: "error.light",
                                        color: "error.contrastText",
                                      },
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>

                      {/* Total Savings Display */}
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          borderRadius: 2,
                          background:
                            "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: "white",
                            fontWeight: 600,
                            mb: 0.5,
                          }}
                        >
                          Total Savings
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{
                            color: "white",
                            fontWeight: "bold",
                          }}
                        >
                          $
                          {savingsItems
                            .reduce((sum, item) => sum + item.amount, 0)
                            .toLocaleString()}
                        </Typography>
                      </Box>

                      {/* Add More Button */}
                      <Box sx={{ mt: 2, textAlign: "center" }}>
                        <Button
                          startIcon={<AddIcon />}
                          onClick={() => setShowAddSavingsDialog(true)}
                          variant="contained"
                          sx={{
                            py: 1.5,
                            px: 3,
                            borderRadius: 2,
                            background:
                              "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                            boxShadow: "0 4px 15px rgba(255, 0, 0, 0.3)",
                            fontWeight: "bold",
                            fontSize: "1rem",
                            textTransform: "none",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: "0 8px 25px rgba(255, 0, 0, 0.4)",
                              background:
                                "linear-gradient(135deg, #cc0000 0%, #0000cc 100%)",
                            },
                            "&:active": {
                              transform: "translateY(0)",
                            },
                          }}
                        >
                          Add Another Savings Goal
                        </Button>
                      </Box>
                    </Box>
                  )}

                  <Box
                    sx={{ mt: 3, display: "flex", justifyContent: "center" }}
                  >
                    <CustomButton
                      onClick={handleSaveBudget}
                      variant="contained"
                      color="primary"
                      startIcon={
                        saving ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          <SaveIcon />
                        )
                      }
                      disabled={saving}
                      sx={{
                        minWidth: 250,
                        py: 2,
                        px: 4,
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                        borderRadius: 2,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        "&:hover": {
                          boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      {saving ? "Saving Budget..." : "Save Budget"}
                    </CustomButton>
                  </Box>
                </Box>
              )}

              {/* Stats Tab */}
              {activeTab === "charts" && (
                <Grid container spacing={6}>
                  <Grid item xs={12} md={6}>
                    <Card
                      elevation={4}
                      sx={{
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                        minHeight: 600,
                      }}
                    >
                      <CardContent sx={{ p: 4 }}>
                        <Typography
                          variant="h5"
                          gutterBottom
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            mb: 4,
                            fontWeight: "bold",
                          }}
                        >
                          <BarChartIcon
                            sx={{
                              mr: 2,
                              color: theme.palette.secondary.main,
                              fontSize: "2rem",
                            }}
                          />
                          Expense Breakdown
                        </Typography>
                        {expenseChartData.labels.length > 0 ? (
                          <Chart
                            type="bar"
                            data={expenseChartData}
                            height={500}
                            options={{
                              plugins: {
                                legend: {
                                  display: false, // Hide legend for bar chart
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function (context) {
                                      let label = context.dataset.label || "";
                                      if (label) {
                                        label += ": ";
                                      }
                                      if (context.parsed.y !== null) {
                                        label += context.parsed.y;
                                      }
                                      return label;
                                    },
                                  },
                                },
                              },
                              scales: {
                                x: {
                                  beginAtZero: true,
                                  stacked: true,
                                  grid: {
                                    display: false,
                                  },
                                  ticks: {
                                    color: theme.palette.text.secondary,
                                  },
                                },
                                y: {
                                  beginAtZero: true,
                                  stacked: true,
                                  grid: {
                                    display: false,
                                  },
                                  ticks: {
                                    color: theme.palette.text.secondary,
                                  },
                                },
                              },
                            }}
                          />
                        ) : (
                          <Box sx={{ textAlign: "center", py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              No expense data to display
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card
                      elevation={4}
                      sx={{
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                        minHeight: 600,
                      }}
                    >
                      <CardContent sx={{ p: 4 }}>
                        <Typography
                          variant="h5"
                          gutterBottom
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            mb: 4,
                            fontWeight: "bold",
                          }}
                        >
                          <DonutLargeIcon
                            sx={{
                              mr: 2,
                              color: theme.palette.primary.main,
                              fontSize: "2rem",
                            }}
                          />
                          Financial Overview
                        </Typography>
                        <Chart
                          type="doughnut"
                          data={incomeVsExpensesData}
                          height={500}
                          options={{
                            plugins: {
                              legend: {
                                position: "bottom",
                                labels: {
                                  usePointStyle: true,
                                  padding: 20,
                                },
                              },
                            },
                          }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </Grid>

            {/* Sidebar */}
            {activeTab !== "overview" && (
              <Grid item xs={12} xl={3}>
                <Stack spacing={4}>
                  {/* Quick Summary */}
                  <Box
                    sx={{
                      p: 3,
                      bgcolor: "background.paper",
                      borderRadius: 3,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                      border: `1px solid ${theme.palette.divider}`,
                      position: "relative",
                      overflow: "hidden",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background:
                          "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          background:
                            "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                          mr: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <TrendingUpIcon sx={{ color: "white", fontSize: 24 }} />
                      </Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: "bold",
                          background:
                            "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                          backgroundClip: "text",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          color: "transparent",
                        }}
                      >
                        Quick Summary
                      </Typography>
                    </Box>

                    <Stack spacing={2}>
                      {/* Total Income */}
                      <Box
                        sx={{
                          p: 3,
                          background: "#2196f3",
                          borderRadius: 2,
                          textAlign: "center",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 8px 25px rgba(33, 150, 243, 0.3)",
                            background: "#2782ca",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mb: 1,
                          }}
                        >
                          <TrendingUpIcon
                            sx={{ color: "white", fontSize: 20, mr: 1 }}
                          />
                          <Typography
                            variant="h6"
                            sx={{ color: "white", fontWeight: "bold" }}
                          >
                            Total Income
                          </Typography>
                        </Box>
                        <Typography
                          variant="h4"
                          sx={{ color: "white", fontWeight: "bold" }}
                        >
                          ${summary.totalIncome.toLocaleString()}
                        </Typography>
                      </Box>

                      {/* Total Expenses */}
                      <Box
                        sx={{
                          p: 3,
                          background: "#f44336",
                          borderRadius: 2,
                          textAlign: "center",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 8px 25px rgba(244, 67, 54, 0.3)",
                            background: "#d32f2f",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mb: 1,
                          }}
                        >
                          <TrendingDownIcon
                            sx={{ color: "white", fontSize: 20, mr: 1 }}
                          />
                          <Typography
                            variant="h6"
                            sx={{ color: "white", fontWeight: "bold" }}
                          >
                            Total Expenses
                          </Typography>
                        </Box>
                        <Typography
                          variant="h4"
                          sx={{ color: "white", fontWeight: "bold" }}
                        >
                          ${summary.totalExpenses.toLocaleString()}
                        </Typography>
                      </Box>

                      {/* Total Savings */}
                      <Box
                        sx={{
                          p: 3,
                          background: "#2196f3",
                          borderRadius: 2,
                          textAlign: "center",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 8px 25px rgba(33, 150, 243, 0.3)",
                            background: "#2782ca",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mb: 1,
                          }}
                        >
                          <SavingsIcon
                            sx={{ color: "white", fontSize: 20, mr: 1 }}
                          />
                          <Typography
                            variant="h6"
                            sx={{ color: "white", fontWeight: "bold" }}
                          >
                            Total Savings
                          </Typography>
                        </Box>
                        <Typography
                          variant="h4"
                          sx={{ color: "white", fontWeight: "bold" }}
                        >
                          ${summary.totalSavings.toLocaleString()}
                        </Typography>
                      </Box>

                      <Divider
                        sx={{ my: 2, borderColor: "rgba(255, 0, 0, 0.2)" }}
                      />

                      {/* Net Balance */}
                      <Box
                        sx={{
                          p: 3,
                          background:
                            summary.netBalance >= 0 ? "#2196f3" : "#f44336",
                          borderRadius: 2,
                          textAlign: "center",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow:
                              summary.netBalance >= 0
                                ? "0 8px 25px rgba(33, 150, 243, 0.3)"
                                : "0 8px 25px rgba(244, 67, 54, 0.3)",
                            background:
                              summary.netBalance >= 0 ? "#1976d2" : "#d32f2f",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mb: 1,
                          }}
                        >
                          {summary.netBalance >= 0 ? (
                            <TrendingUpIcon
                              sx={{ color: "white", fontSize: 20, mr: 1 }}
                            />
                          ) : (
                            <TrendingDownIcon
                              sx={{ color: "white", fontSize: 20, mr: 1 }}
                            />
                          )}
                          <Typography
                            variant="h6"
                            sx={{ color: "white", fontWeight: "bold" }}
                          >
                            Net Balance
                          </Typography>
                        </Box>
                        <Typography
                          variant="h4"
                          sx={{ color: "white", fontWeight: "bold" }}
                        >
                          ${summary.netBalance.toLocaleString()}
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          sx={{ color: "rgba(255,255,255,0.8)", mt: 1 }}
                        >
                          {summary.netBalance >= 0
                            ? "Positive Balance"
                            : "Negative Balance"}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Stack>
              </Grid>
            )}
          </Grid>
        </Box>
      </Fade>

      {/* Add Expense Dialog */}
      <Dialog
        open={showAddExpenseDialog}
        onClose={() => setShowAddExpenseDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 2,
            background: "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
            color: "white",
            position: "relative",
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 1,
              background: "rgba(255,255,255,0.2)",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 1,
                bgcolor: "rgba(255,255,255,0.2)",
                mr: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingDownIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {editingExpenseIndex !== null
                ? "Edit Custom Expense"
                : "Add Custom Expense"}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 4, bgcolor: "background.paper" }}>
          <Box sx={{ pt: 2 }}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{
                mb: 3,
                fontWeight: 600,
                color: "text.secondary",
              }}
            >
              Enter the details for your custom expense
            </Typography>

            <Box sx={{ mb: 3 }}>
              <TextField
                label="Expense Name"
                placeholder="e.g., Gym Membership, Netflix Subscription"
                value={newExpenseItem.name}
                onChange={(e) =>
                  setNewExpenseItem((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                fullWidth
                sx={{
                  "& .MuiInputBase-root": {
                    height: 56,
                    fontSize: "1.1rem",
                    borderRadius: 2,
                    "& input": {
                      fontSize: "1.1rem",
                      padding: "16px 14px",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "1rem",
                    "&.Mui-focused": {
                      color: "primary.main",
                    },
                  },
                }}
              />
            </Box>

            <Box>
              <TextField
                label="Monthly Amount"
                type="number"
                placeholder="0"
                value={newExpenseItem.amount}
                onChange={(e) =>
                  setNewExpenseItem((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                startAdornment={
                  <InputAdornment position="start">$</InputAdornment>
                }
                fullWidth
                sx={{
                  "& .MuiInputBase-root": {
                    height: 56,
                    fontSize: "1.1rem",
                    borderRadius: 2,
                    "& input": {
                      fontSize: "1.1rem",
                      padding: "16px 14px",
                      fontWeight: 600,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "1rem",
                    "&.Mui-focused": {
                      color: "primary.main",
                    },
                  },
                }}
              />
            </Box>

            {/* Preview */}
            {newExpenseItem.name && newExpenseItem.amount && (
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  borderRadius: 2,
                  background:
                    "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "white",
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  Preview
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                  }}
                >
                  {newExpenseItem.name}: $
                  {parseFloat(newExpenseItem.amount || 0).toLocaleString()}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            p: 3,
            bgcolor: "background.paper",
            borderTop: "1px solid rgba(0,0,0,0.1)",
          }}
        >
          <Button
            onClick={() => {
              setShowAddExpenseDialog(false);
              setNewExpenseItem({ name: "", amount: "" });
              setEditingExpenseIndex(null);
            }}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddExpense}
            variant="contained"
            sx={{
              px: 4,
              py: 1,
              borderRadius: 2,
              background: "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
              boxShadow: "0 4px 15px rgba(255, 0, 0, 0.3)",
              textTransform: "none",
              fontWeight: "bold",
              "&:hover": {
                background: "linear-gradient(135deg, #cc0000 0%, #0000cc 100%)",
                boxShadow: "0 6px 20px rgba(255, 0, 0, 0.4)",
              },
            }}
          >
            {editingExpenseIndex !== null ? "Update Expense" : "Add Expense"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Income Dialog */}
      <Dialog
        open={showAddIncomeDialog}
        onClose={() => setShowAddIncomeDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 2,
            background: "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
            color: "white",
            position: "relative",
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 1,
              background: "rgba(255,255,255,0.2)",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 1,
                bgcolor: "rgba(255,255,255,0.2)",
                mr: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUpIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {editingIncomeIndex !== null
                ? "Edit Income Source"
                : "Add Income Source"}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 4, bgcolor: "background.paper" }}>
          <Box sx={{ pt: 2 }}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{
                mb: 3,
                fontWeight: 600,
                color: "text.secondary",
              }}
            >
              Enter the details for your income source
            </Typography>

            <Box sx={{ mb: 3 }}>
              <TextField
                label="Income Source Name"
                placeholder="e.g., Freelance Writing, Part-time Job"
                value={newIncomeItem.name}
                onChange={(e) =>
                  setNewIncomeItem((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                fullWidth
                sx={{
                  "& .MuiInputBase-root": {
                    height: 56,
                    fontSize: "1.1rem",
                    borderRadius: 2,
                    "& input": {
                      fontSize: "1.1rem",
                      padding: "16px 14px",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "1rem",
                    "&.Mui-focused": {
                      color: "primary.main",
                    },
                  },
                }}
              />
            </Box>

            <Box>
              <TextField
                label="Monthly Amount"
                type="number"
                placeholder="0"
                value={newIncomeItem.amount}
                onChange={(e) =>
                  setNewIncomeItem((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                startAdornment={
                  <InputAdornment position="start">$</InputAdornment>
                }
                fullWidth
                sx={{
                  "& .MuiInputBase-root": {
                    height: 56,
                    fontSize: "1.1rem",
                    borderRadius: 2,
                    "& input": {
                      fontSize: "1.1rem",
                      padding: "16px 14px",
                      fontWeight: 600,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "1rem",
                    "&.Mui-focused": {
                      color: "primary.main",
                    },
                  },
                }}
              />
            </Box>

            {/* Preview */}
            {newIncomeItem.name && newIncomeItem.amount && (
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  borderRadius: 2,
                  background:
                    "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "white",
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  Preview
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                  }}
                >
                  {newIncomeItem.name}: $
                  {parseFloat(newIncomeItem.amount || 0).toLocaleString()}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            p: 3,
            bgcolor: "background.paper",
            borderTop: "1px solid rgba(0,0,0,0.1)",
          }}
        >
          <Button
            onClick={() => {
              setShowAddIncomeDialog(false);
              setNewIncomeItem({ name: "", amount: "" });
              setEditingIncomeIndex(null);
            }}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddIncome}
            variant="contained"
            sx={{
              px: 4,
              py: 1,
              borderRadius: 2,
              background: "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
              boxShadow: "0 4px 15px rgba(255, 0, 0, 0.3)",
              textTransform: "none",
              fontWeight: "bold",
              "&:hover": {
                background: "linear-gradient(135deg, #cc0000 0%, #0000cc 100%)",
                boxShadow: "0 6px 20px rgba(255, 0, 0, 0.4)",
              },
            }}
          >
            {editingIncomeIndex !== null ? "Update Income" : "Add Income"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Savings Dialog */}
      <Dialog
        open={showAddSavingsDialog}
        onClose={() => setShowAddSavingsDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 2,
            background: "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
            color: "white",
            position: "relative",
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 1,
              background: "rgba(255,255,255,0.2)",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 1,
                bgcolor: "rgba(255,255,255,0.2)",
                mr: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SavingsIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {editingSavingsIndex !== null
                ? "Edit Savings Goal"
                : "Add Savings Goal"}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 4, bgcolor: "background.paper" }}>
          <Box sx={{ pt: 2 }}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{
                mb: 3,
                fontWeight: 600,
                color: "text.secondary",
              }}
            >
              Set up your savings or investment goal
            </Typography>

            {/* Savings Type Selection */}
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel
                  sx={{
                    fontSize: "1rem",
                    "&.Mui-focused": {
                      color: "primary.main",
                    },
                  }}
                >
                  Savings Type
                </InputLabel>
                <Select
                  value={savingsType}
                  label="Savings Type"
                  onChange={(e) => {
                    setSavingsType(e.target.value);
                    if (e.target.value !== "custom") {
                      const selectedOption = savingsOptions.find(
                        (opt) => opt.value === e.target.value
                      );
                      setNewSavingsItem((prev) => ({
                        ...prev,
                        name: selectedOption.label,
                      }));
                    } else {
                      setNewSavingsItem((prev) => ({ ...prev, name: "" }));
                    }
                  }}
                  sx={{
                    "& .MuiInputBase-root": {
                      height: 56,
                      fontSize: "1.1rem",
                      borderRadius: 2,
                    },
                  }}
                >
                  {savingsOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box sx={{ color: option.color }}>{option.icon}</Box>
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Custom Name Input (only for custom type) */}
            {savingsType === "custom" && (
              <Box sx={{ mb: 3 }}>
                <TextField
                  label="Custom Savings Name"
                  placeholder="e.g., Vacation Fund, New Car"
                  value={newSavingsItem.name}
                  onChange={(e) =>
                    setNewSavingsItem((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  fullWidth
                  sx={{
                    "& .MuiInputBase-root": {
                      height: 56,
                      fontSize: "1.1rem",
                      borderRadius: 2,
                      "& input": {
                        fontSize: "1.1rem",
                        padding: "16px 14px",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      fontSize: "1rem",
                      "&.Mui-focused": {
                        color: "primary.main",
                      },
                    },
                  }}
                />
              </Box>
            )}

            <Box>
              <TextField
                label="Monthly Amount"
                type="number"
                placeholder="0"
                value={newSavingsItem.amount}
                onChange={(e) =>
                  setNewSavingsItem((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                startAdornment={
                  <InputAdornment position="start">$</InputAdornment>
                }
                fullWidth
                sx={{
                  "& .MuiInputBase-root": {
                    height: 56,
                    fontSize: "1.1rem",
                    borderRadius: 2,
                    "& input": {
                      fontSize: "1.1rem",
                      padding: "16px 14px",
                      fontWeight: 600,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "1rem",
                    "&.Mui-focused": {
                      color: "primary.main",
                    },
                  },
                }}
              />
            </Box>

            {/* Preview */}
            {newSavingsItem.name && newSavingsItem.amount && (
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  borderRadius: 2,
                  background:
                    "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "white",
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  Preview
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                  }}
                >
                  {newSavingsItem.name}: $
                  {parseFloat(newSavingsItem.amount || 0).toLocaleString()}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            p: 3,
            bgcolor: "background.paper",
            borderTop: "1px solid rgba(0,0,0,0.1)",
          }}
        >
          <Button
            onClick={() => {
              setShowAddSavingsDialog(false);
              setNewSavingsItem({ name: "", amount: "" });
              setSavingsType("custom");
              setEditingSavingsIndex(null);
            }}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddSavings}
            variant="contained"
            sx={{
              px: 4,
              py: 1,
              borderRadius: 2,
              background: "linear-gradient(135deg, #ff0000 0%, #007fff 100%)",
              boxShadow: "0 4px 15px rgba(255, 0, 0, 0.3)",
              textTransform: "none",
              fontWeight: "bold",
              "&:hover": {
                background: "linear-gradient(135deg, #cc0000 0%, #0000cc 100%)",
                boxShadow: "0 6px 20px rgba(255, 0, 0, 0.4)",
              },
            }}
          >
            {editingSavingsIndex !== null ? "Update Savings" : "Add Savings"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Savings Dialog */}
      <Dialog
        open={showDeleteSavingsDialog}
        onClose={() => setShowDeleteSavingsDialog(false)}
        aria-labelledby="delete-savings-dialog-title"
        aria-describedby="delete-savings-dialog-description"
      >
        <DialogTitle id="delete-savings-dialog-title">
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-savings-dialog-description">
            Are you sure you want to delete this savings item? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowDeleteSavingsDialog(false)}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              confirmDeleteSavings();
              setShowDeleteSavingsDialog(false);
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Expense Dialog */}
      <Dialog
        open={showDeleteExpenseDialog}
        onClose={() => setShowDeleteExpenseDialog(false)}
        aria-labelledby="delete-expense-dialog-title"
        aria-describedby="delete-expense-dialog-description"
      >
        <DialogTitle id="delete-expense-dialog-title">
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-expense-dialog-description">
            Are you sure you want to delete this custom expense? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowDeleteExpenseDialog(false)}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              confirmDeleteExpense();
              setShowDeleteExpenseDialog(false);
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSuccessSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setShowSuccessSnackbar(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={showErrorSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowErrorSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setShowErrorSnackbar(false)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Loading Overlay for Save Operation */}
      {saving && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <Box
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
              p: 4,
              textAlign: "center",
              boxShadow: 3,
            }}
          >
            <CircularProgress size={60} sx={{ mb: 2 }} />
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default MonthlyBudget;
