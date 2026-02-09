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
  Divider,
  alpha,
  Grow,
  Paper
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
  PieChart as PieChartIcon,
  Mic as MicIcon,
  AutoAwesome as AIIcon,
  CheckCircle as CheckCircleIcon,
  EmojiEvents as TrophyIcon
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
      icon: <TimelineIcon sx={{ fontSize: '2.5rem' }} />,
      title: 'Wealth Projection',
      description: 'AI-powered wealth forecasting with retirement planning and investment growth tracking',
      color: '#667eea',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      icon: <AccountBalanceIcon sx={{ fontSize: '2.5rem' }} />,
      title: 'Debt Planning',
      description: 'Optimize debt payoff with snowball or avalanche strategies and payment scheduling',
      color: '#f44336',
      gradient: 'linear-gradient(135deg, #ff0000 0%, #007fff 100%)'
    },
    {
      icon: <PieChartIcon sx={{ fontSize: '2.5rem' }} />,
      title: 'Budget Management',
      description: 'Track income, expenses, and savings with interactive charts and real-time insights',
      color: '#4caf50',
      gradient: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)'
    },
    {
      icon: <MicIcon sx={{ fontSize: '2.5rem' }} />,
      title: 'Voice Input Budget',
      description: 'Revolutionary AI-powered voice commands to input your budget in seconds',
      color: '#9c27b0',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      badge: 'NEW!'
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: '2.5rem' }} />,
      title: 'Expense Analytics',
      description: 'Smart spending analysis with AI recommendations for better financial habits',
      color: '#ff9800',
      gradient: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)'
    },
    {
      icon: <SavingsIcon sx={{ fontSize: '2.5rem' }} />,
      title: 'Savings Goals',
      description: 'Set and track multiple savings goals with progress monitoring and milestones',
      color: '#2196f3',
      gradient: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)'
    }
  ];

  const stats = [
    { label: 'Users Empowered', value: '10,000+', icon: <CheckCircleIcon /> },
    { label: 'Debt Eliminated', value: '$2.5M+', icon: <MonetizationOnIcon /> },
    { label: 'Wealth Created', value: '$15M+', icon: <TrendingUpIcon /> },
    { label: 'Success Rate', value: '95%', icon: <TrophyIcon /> }
  ];

  const benefits = [
    'AI-Powered Financial Insights',
    'Voice-Activated Budget Input',
    'Real-time Debt Tracking',
    'Wealth Projection Tools',
    'Mobile & Web Access',
    '100% Free to Use'
  ];

  return (
    <Box sx={{ minHeight: '100vh', overflow: 'hidden' }}>
      {/* Header with Gradient */}
      <Box
        sx={{
          background: isDarkMode
            ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          color: 'white',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Animated Background Circles */}
        <Box
          sx={{
            position: 'absolute',
            top: '-10%',
            right: '-5%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
            animation: 'float 20s infinite ease-in-out'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '-10%',
            left: '-5%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)',
            animation: 'float 25s infinite ease-in-out reverse'
          }}
        />

        {/* Navigation */}
        <Box sx={{ p: 3, position: 'relative', zIndex: 10 }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)'
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
                    borderColor: 'rgba(255,255,255,0.5)',
                    backdropFilter: 'blur(10px)',
                    background: 'rgba(255,255,255,0.1)',
                    '&:hover': {
                      borderColor: 'white',
                      background: 'rgba(255,255,255,0.2)'
                    }
                  }}
                >
                  {!isMobile && 'Login'}
                </CustomButton>
                <CustomButton
                  component={Link}
                  to="/register"
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  sx={{
                    background: 'linear-gradient(135deg, #ff0000 0%, #007fff 100%)',
                    color: 'white',
                    boxShadow: '0 4px 20px rgba(255,0,0,0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #cc0000 0%, #0066cc 100%)',
                      boxShadow: '0 6px 25px rgba(255,0,0,0.4)'
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
        <Container maxWidth="lg" sx={{ flex: 1, display: 'flex', alignItems: 'center', py: { xs: 4, md: 8 }, position: 'relative', zIndex: 10 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Fade in={true} timeout={1000}>
                <Box>
                  <Chip
                    icon={<AIIcon />}
                    label="AI-Powered Financial Platform"
                    sx={{
                      mb: 3,
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                      fontWeight: 'bold'
                    }}
                  />
                  
                  <Typography 
                    variant="h1" 
                    sx={{ 
                      fontWeight: 'bold',
                      mb: 2,
                      fontSize: isMobile ? '2.5rem' : '4rem',
                      lineHeight: 1.2,
                      textShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }}
                  >
                    Take Control of Your{' '}
                    <Box 
                      component="span" 
                      sx={{ 
                        background: 'linear-gradient(135deg, #ff0000 0%, #007fff 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: 'none'
                      }}
                    >
                      Financial Future
                    </Box>
                  </Typography>
                  
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 4,
                      opacity: 0.95,
                      lineHeight: 1.8,
                      fontSize: isMobile ? '1rem' : '1.25rem',
                      textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                    }}
                  >
                    FinFreedom provides AI-powered tools to help you build wealth, 
                    eliminate debt, and achieve financial independence. Voice input, 
                    smart analytics, and personalized insights—all for free.
                  </Typography>

                  <Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ mb: 5 }}>
                    <CustomButton
                      component={Link}
                      to="/register"
                      variant="contained"
                      size="large"
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        background: 'linear-gradient(135deg, #ff0000 0%, #007fff 100%)',
                        color: 'white',
                        py: 2,
                        px: 5,
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        boxShadow: '0 8px 30px rgba(255,0,0,0.4)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #cc0000 0%, #0066cc 100%)',
                          boxShadow: '0 12px 40px rgba(255,0,0,0.5)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      Start Your Journey
                    </CustomButton>
                    <CustomButton
                      variant="outlined"
                      size="large"
                      onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                      sx={{
                        color: 'white',
                        borderColor: 'rgba(255,255,255,0.5)',
                        backdropFilter: 'blur(10px)',
                        background: 'rgba(255,255,255,0.1)',
                        py: 2,
                        px: 5,
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        '&:hover': {
                          borderColor: 'white',
                          background: 'rgba(255,255,255,0.2)'
                        }
                      }}
                    >
                      Learn More
                    </CustomButton>
                  </Stack>

                  {/* Stats Grid */}
                  <Grid container spacing={3}>
                    {stats.map((stat, index) => (
                      <Grid item xs={6} sm={3} key={index}>
                        <Grow in={true} timeout={1000 + index * 200}>
                          <Paper
                            elevation={0}
                            sx={{
                              textAlign: 'center',
                              p: 2,
                              background: 'rgba(255,255,255,0.15)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: 3,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                background: 'rgba(255,255,255,0.25)',
                                transform: 'translateY(-5px)'
                              }
                            }}
                          >
                            <Box sx={{ mb: 1, color: 'rgba(255,255,255,0.9)' }}>
                              {stat.icon}
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                              {stat.value}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                              {stat.label}
                            </Typography>
                          </Paper>
                        </Grow>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Fade>
            </Grid>

            <Grid item xs={12} md={6}>
              <Fade in={true} timeout={1200}>
                <Box>
                  {/* Feature Preview Cards */}
                  <Grid container spacing={2}>
                    {features.slice(0, 3).map((feature, index) => (
                      <Grid item xs={12} sm={4} md={12} key={index}>
                        <Grow in={true} timeout={1200 + index * 200}>
                          <Card
                            elevation={0}
                            sx={{
                              background: 'rgba(255, 255, 255, 0.95)',
                              backdropFilter: 'blur(20px)',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              borderRadius: 4,
                              transition: 'all 0.3s ease',
                              position: 'relative',
                              overflow: 'hidden',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 4,
                                background: feature.gradient
                              },
                              '&:hover': {
                                transform: 'translateY(-8px) scale(1.02)',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                              }
                            }}
                          >
                            <CardContent sx={{ p: 3 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar
                                  sx={{
                                    width: 56,
                                    height: 56,
                                    background: feature.gradient,
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                                  }}
                                >
                                  {feature.icon}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                                      {feature.title}
                                    </Typography>
                                    {feature.badge && (
                                      <Chip 
                                        label={feature.badge} 
                                        size="small"
                                        sx={{
                                          background: 'linear-gradient(135deg, #ff0000 0%, #007fff 100%)',
                                          color: 'white',
                                          fontWeight: 'bold',
                                          fontSize: '0.65rem',
                                          height: 20
                                        }}
                                      />
                                    )}
                                  </Box>
                                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                                    {feature.description}
                                  </Typography>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grow>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Fade>
            </Grid>
          </Grid>
        </Container>

        {/* Scroll Indicator */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 30,
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'bounce 2s infinite',
            '@keyframes bounce': {
              '0%, 100%': { transform: 'translateX(-50%) translateY(0)' },
              '50%': { transform: 'translateX(-50%) translateY(-10px)' }
            }
          }}
        >
          <Box
            sx={{
              width: 30,
              height: 50,
              border: '2px solid rgba(255,255,255,0.5)',
              borderRadius: 15,
              position: 'relative'
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 10,
                background: 'white',
                borderRadius: 3,
                position: 'absolute',
                top: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                animation: 'scroll 2s infinite',
                '@keyframes scroll': {
                  '0%': { opacity: 1, top: 8 },
                  '100%': { opacity: 0, top: 30 }
                }
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Features Section */}
      <Box id="features" sx={{ py: { xs: 6, md: 12 }, background: theme.palette.background.default }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip
              icon={<SpeedIcon />}
              label="Powerful Features"
              sx={{
                mb: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 'bold',
                px: 2,
                py: 3
              }}
            />
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 'bold',
                mb: 2,
                background: 'linear-gradient(135deg, #ff0000 0%, #007fff 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '2rem', md: '3rem' }
              }}
            >
              Everything You Need
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: theme.palette.text.secondary,
                maxWidth: 700,
                mx: 'auto',
                lineHeight: 1.8
              }}
            >
              Comprehensive tools to manage your finances, eliminate debt, and build lasting wealth
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} lg={4} key={index}>
                <Grow in={true} timeout={800 + index * 150}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      background: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 4,
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: feature.gradient
                      },
                      '&:hover': {
                        transform: 'translateY(-10px)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                        borderColor: 'transparent'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                        <Avatar
                          sx={{
                            width: 64,
                            height: 64,
                            background: feature.gradient,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                          }}
                        >
                          {feature.icon}
                        </Avatar>
                        {feature.badge && (
                          <Chip 
                            label={feature.badge} 
                            size="small"
                            sx={{
                              background: 'linear-gradient(135deg, #ff0000 0%, #007fff 100%)',
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        )}
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: theme.palette.text.primary }}>
                        {feature.title}
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: theme.palette.text.secondary,
                          flex: 1,
                          lineHeight: 1.7
                        }}
                      >
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
            ))}
          </Grid>

          {/* Benefits List */}
          <Box sx={{ mt: 8 }}>
            <Paper
              elevation={0}
              sx={{
                p: 5,
                borderRadius: 4,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                border: `1px solid ${theme.palette.divider}`
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
                Why Choose FinFreedom?
              </Typography>
              <Grid container spacing={2}>
                {benefits.map((benefit, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1.5rem' }} />
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {benefit}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          color: 'white',
          py: { xs: 6, md: 10 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 10 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 'bold',
                mb: 2,
                fontSize: { xs: '2rem', md: '3.5rem' },
                textShadow: '0 4px 20px rgba(0,0,0,0.2)'
              }}
            >
              Ready to Transform Your Finances?
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 5,
                opacity: 0.95,
                maxWidth: 700,
                mx: 'auto',
                lineHeight: 1.8,
                textShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}
            >
              Join thousands of users who have already started their journey to financial freedom. 
              It's completely free and takes less than 2 minutes to get started.
            </Typography>
            
            <Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ justifyContent: 'center', mb: 4 }}>
              <CustomButton
                component={Link}
                to="/register"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #ff0000 0%, #007fff 100%)',
                  color: 'white',
                  py: 2.5,
                  px: 6,
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  boxShadow: '0 12px 40px rgba(255,0,0,0.4)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #cc0000 0%, #0066cc 100%)',
                    boxShadow: '0 16px 50px rgba(255,0,0,0.5)',
                    transform: 'translateY(-3px)'
                  }
                }}
              >
                Get Started Free
              </CustomButton>
              
              <CustomButton
                component={Link}
                to="/login"
                variant="outlined"
                size="large"
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.5)',
                  backdropFilter: 'blur(10px)',
                  background: 'rgba(255,255,255,0.1)',
                  py: 2.5,
                  px: 6,
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  '&:hover': {
                    borderColor: 'white',
                    background: 'rgba(255,255,255,0.2)'
                  }
                }}
              >
                Sign In
              </CustomButton>
            </Stack>

            <Typography variant="body2" sx={{ opacity: 0.8, fontStyle: 'italic' }}>
              No credit card required • Free forever • Cancel anytime
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 4, background: theme.palette.background.paper, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Container maxWidth="lg">
          <Typography variant="body2" align="center" sx={{ color: theme.palette.text.secondary }}>
            © 2024 FinFreedom. Built with ❤️ for financial freedom.
          </Typography>
        </Container>
      </Box>

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `}
      </style>
    </Box>
  );
}

export default Home;
