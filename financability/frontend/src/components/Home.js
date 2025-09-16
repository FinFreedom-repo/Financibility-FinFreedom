import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Grid,
  Button,
  Card,
  CardContent,
  Avatar,
  Stack,
  Fade,
  useTheme,
  useMediaQuery,
  Chip,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Assessment as AssessmentIcon,
  MonetizationOn as MonetizationOnIcon,
  Timeline as TimelineIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Insights as InsightsIcon,
  ArrowForward as ArrowForwardIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  Analytics as AnalyticsIcon,
  Savings as SavingsIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import USAFlag from './USAFlag';
import { Button as CustomButton } from './common/Button';

function Home() {
  const { isDarkMode } = useCustomTheme();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const features = [
    {
      icon: <TimelineIcon sx={{ fontSize: '2rem' }} />,
      title: 'Wealth Projection',
      description: 'See your financial future with AI-powered wealth projections and retirement planning',
      color: theme.palette.primary.main
    },
    {
      icon: <AccountBalanceIcon sx={{ fontSize: '2rem' }} />,
      title: 'Debt Planning',
      description: 'Optimize debt payoff with snowball or avalanche strategies and payment scheduling',
      color: theme.palette.error.main
    },
    {
      icon: <PieChartIcon sx={{ fontSize: '2rem' }} />,
      title: 'Budget Management',
      description: 'Track income, expenses, and savings goals with interactive charts and insights',
      color: theme.palette.success.main
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: '2rem' }} />,
      title: 'Expense Analytics',
      description: 'Analyze spending patterns and get recommendations for better financial habits',
      color: theme.palette.warning.main
    },
    {
      icon: <SavingsIcon sx={{ fontSize: '2rem' }} />,
      title: 'Savings Goals',
      description: 'Set and track savings goals with progress monitoring and achievement rewards',
      color: theme.palette.info.main
    },
    {
      icon: <SecurityIcon sx={{ fontSize: '2rem' }} />,
      title: 'Financial Security',
      description: 'Build emergency funds and diversify investments for long-term financial security',
      color: theme.palette.secondary.main
    }
  ];

  const stats = [
    { label: 'Users Empowered', value: '10,000+' },
    { label: 'Debt Eliminated', value: '$2.5M+' },
    { label: 'Wealth Created', value: '$15M+' },
    { label: 'Success Rate', value: '95%' }
  ];

  return (
    <Box sx={{ minHeight: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          background: isDarkMode
            ? 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Navigation */}
        <Box sx={{ p: 3 }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                FinFreedom
                <USAFlag />
              </Typography>
              
              <Stack direction="row" spacing={2}>
                <CustomButton
                  component={Link}
                  to="/login"
                  variant="outlined"
                  startIcon={<LoginIcon />}
                  sx={{
                    color: 'white',
                    borderColor: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  Login
                </CustomButton>
                <CustomButton
                  component={Link}
                  to="/register"
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  sx={{
                    backgroundColor: 'white',
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)'
                    }
                  }}
                >
                  Get Started
                </CustomButton>
              </Stack>
            </Box>
          </Container>
        </Box>

        {/* Hero Section */}
        <Container maxWidth="lg" sx={{ flex: 1, display: 'flex', alignItems: 'center', py: 6 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Fade in={true}>
                <Box>
                  <Typography 
                    variant="h2" 
                    sx={{ 
                      fontWeight: 'bold',
                      mb: 2,
                      fontSize: isMobile ? '2.5rem' : '3.5rem'
                    }}
                  >
                    Take Control of Your 
                    <Box component="span" sx={{ color: theme.palette.secondary.light }}>
                      {' '}Financial Future
                    </Box>
                  </Typography>
                  
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 4,
                      opacity: 0.9,
                      lineHeight: 1.6
                    }}
                  >
                    FinFreedom provides a comprehensive suite of tools to help you build wealth, 
                    eliminate debt, and achieve true financial independence. Start your journey today
                    with our proven strategies and personalized insights.
                  </Typography>

                  <Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ mb: 4 }}>
                    <CustomButton
                      component={Link}
                      to="/register"
                      variant="contained"
                      size="large"
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        backgroundColor: 'white',
                        color: theme.palette.primary.main,
                        py: 1.5,
                        px: 4,
                        fontSize: '1.1rem',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.9)'
                        }
                      }}
                    >
                      Start Your Journey
                    </CustomButton>
                    <CustomButton
                      variant="outlined"
                      size="large"
                      sx={{
                        color: 'white',
                        borderColor: 'white',
                        py: 1.5,
                        px: 4,
                        fontSize: '1.1rem',
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)'
                        }
                      }}
                    >
                      Learn More
                    </CustomButton>
                  </Stack>

                  {/* Stats */}
                  <Grid container spacing={2}>
                    {stats.map((stat, index) => (
                      <Grid item xs={6} sm={3} key={index}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {stat.value}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            {stat.label}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Fade>
            </Grid>

            <Grid item xs={12} md={6}>
              <Fade in={true}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Grid container spacing={2}>
                    {features.slice(0, 3).map((feature, index) => (
                      <Grid item xs={12} sm={4} key={index}>
                        <Card
                          elevation={8}
                          sx={{
                            background: isDarkMode
                              ? 'rgba(255, 255, 255, 0.1)'
                              : 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.3)'}`,
                            borderRadius: 3,
                            transition: 'transform 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-5px)'
                            }
                          }}
                        >
                          <CardContent sx={{ textAlign: 'center', p: 3 }}>
                            <Avatar
                              sx={{
                                width: 60,
                                height: 60,
                                mx: 'auto',
                                mb: 2,
                                backgroundColor: feature.color
                              }}
                            >
                              {feature.icon}
                            </Avatar>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                              {feature.title}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                              {feature.description}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Fade>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 'bold',
              mb: 2,
              color: theme.palette.text.primary
            }}
          >
            Powerful Financial Tools
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: theme.palette.text.secondary,
              maxWidth: 600,
              mx: 'auto'
            }}
          >
            Everything you need to manage your finances, eliminate debt, and build lasting wealth
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card
                elevation={2}
                sx={{
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    elevation: 8,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      mb: 2,
                      backgroundColor: feature.color
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      flex: 1
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          background: isDarkMode
            ? 'linear-gradient(135deg, #2d2d2d 0%, #1e1e1e 100%)'
            : 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
          color: 'white',
          py: 8
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 'bold',
                mb: 2
              }}
            >
              Ready to Transform Your Finances?
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 4,
                opacity: 0.9,
                maxWidth: 600,
                mx: 'auto'
              }}
            >
              Join thousands of users who have already started their journey to financial freedom.
            </Typography>
            <CustomButton
              component={Link}
              to="/register"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{
                backgroundColor: 'white',
                color: theme.palette.primary.main,
                py: 1.5,
                px: 4,
                fontSize: '1.2rem',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)'
                }
              }}
            >
              Get Started Free
            </CustomButton>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

export default Home;
