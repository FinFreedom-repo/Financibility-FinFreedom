import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Paper,
  Container,
  Alert,
  Fade,
  Avatar,
  Stack,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Button,
} from "@mui/material";
import {
  PersonAdd as PersonAddIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  AccountBalance as AccountBalanceIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import USAFlag from "@/components/shared/USAFlag";
import { useAppDispatch } from "@/store/hooks";
import { register as registerUser } from "@/store/authSlice";
import { ROUTES } from "@/utils/constants";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    return requirements;
  };

  const passwordRequirements = validatePassword(formData.password);
  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!isPasswordValid) {
      setError("Password does not meet requirements");
      return;
    }

    setLoading(true);
    try {
      await dispatch(
        registerUser({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        })
      ).unwrap();
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      setError((err as string) || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const PasswordRequirement = ({
    met,
    text,
  }: {
    met: boolean;
    text: string;
  }) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
      {met ? (
        <CheckIcon sx={{ color: "success.main", fontSize: "1rem" }} />
      ) : (
        <CloseIcon sx={{ color: "error.main", fontSize: "1rem" }} />
      )}
      <Typography
        variant="caption"
        sx={{
          color: met ? "success.main" : "error.main",
        }}
      >
        {text}
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Fade in={true}>
          <Paper
            elevation={24}
            sx={{
              p: 4,
              borderRadius: 3,
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "0 8px 32px rgba(31, 38, 135, 0.37)",
            }}
          >
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  mx: "auto",
                  mb: 2,
                  background: "linear-gradient(45deg, #ff0000, #0066ff)",
                  fontSize: "2rem",
                }}
              >
                <AccountBalanceIcon sx={{ fontSize: "2rem", color: "white" }} />
              </Avatar>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: "bold",
                  color: "text.primary",
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                }}
              >
                FinFreedom
                <USAFlag />
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  color: "text.secondary",
                  fontWeight: "normal",
                }}
              >
                Create Your Account
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {error && (
                  <Alert
                    severity="error"
                    sx={{
                      borderRadius: 2,
                      "& .MuiAlert-message": {
                        width: "100%",
                      },
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <TextField
                  label="Username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  fullWidth
                  autoComplete="username"
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />

                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  fullWidth
                  autoComplete="email"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />

                <TextField
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  fullWidth
                  autoComplete="new-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: "text.secondary" }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />

                {/* Password Requirements */}
                {formData.password && (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "rgba(0, 0, 0, 0.05)",
                      border: "1px solid rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: "bold", mb: 1, display: "block" }}
                    >
                      Password Requirements:
                    </Typography>
                    <PasswordRequirement
                      met={passwordRequirements.length}
                      text="At least 8 characters"
                    />
                    <PasswordRequirement
                      met={passwordRequirements.uppercase}
                      text="One uppercase letter"
                    />
                    <PasswordRequirement
                      met={passwordRequirements.lowercase}
                      text="One lowercase letter"
                    />
                    <PasswordRequirement
                      met={passwordRequirements.number}
                      text="One number"
                    />
                    <PasswordRequirement
                      met={passwordRequirements.special}
                      text="One special character"
                    />
                  </Box>
                )}

                <TextField
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  fullWidth
                  autoComplete="new-password"
                  error={
                    formData.confirmPassword &&
                    formData.password !== formData.confirmPassword
                  }
                  helperText={
                    formData.confirmPassword &&
                    formData.password !== formData.confirmPassword
                      ? "Passwords do not match"
                      : ""
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          edge="end"
                          sx={{ color: "text.secondary" }}
                        >
                          {showConfirmPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={
                    loading ||
                    !isPasswordValid ||
                    formData.password !== formData.confirmPassword
                  }
                  startIcon={loading ? undefined : <PersonAddIcon />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    background: "linear-gradient(45deg, #ff0000, #0066ff)",
                    "&:hover": {
                      background: "linear-gradient(45deg, #cc0000, #0052cc)",
                    },
                  }}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>

                {loading && (
                  <LinearProgress
                    sx={{
                      borderRadius: 1,
                      height: 6,
                    }}
                  />
                )}

                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    or
                  </Typography>
                </Divider>

                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="body2" color="textSecondary">
                    Already have an account?{" "}
                    <Link
                      to={ROUTES.LOGIN}
                      style={{
                        color: "#1976d2",
                        textDecoration: "none",
                        fontWeight: "bold",
                      }}
                    >
                      Sign In
                    </Link>
                  </Typography>
                </Box>
              </Stack>
            </form>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default RegisterPage;
