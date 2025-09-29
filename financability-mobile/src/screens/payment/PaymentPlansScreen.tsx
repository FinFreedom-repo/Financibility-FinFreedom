import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
  popular?: boolean;
  description: string;
  icon: string;
  color: string;
}

const PaymentPlansScreen: React.FC = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const styles = createStyles(theme);

  const paymentPlans: PaymentPlan[] = [
    {
      id: 'free',
      name: 'Free Plan',
      price: 0,
      period: 'monthly',
      features: [
        'Basic budget tracking',
        'Up to 3 accounts',
        'Monthly reports',
        'Email support',
        'Mobile app access'
      ],
      description: 'Perfect for getting started with personal finance management',
      icon: 'gift-outline',
      color: theme.colors.textSecondary
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: 9.99,
      period: 'monthly',
      features: [
        'Advanced analytics',
        'Unlimited accounts',
        'Custom categories',
        'Export to Excel/PDF',
        'Priority support',
        'Advanced charts',
        'Goal tracking',
        'Bill reminders'
      ],
      popular: true,
      description: 'Most popular choice for serious budgeters',
      icon: 'star-outline',
      color: theme.colors.primary
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: 19.99,
      period: 'monthly',
      features: [
        'Everything in Premium',
        'Investment tracking',
        'Tax preparation tools',
        'Financial advisor access',
        'Custom reports',
        'API access',
        'White-label options',
        'Priority feature requests'
      ],
      description: 'For power users and small businesses',
      icon: 'diamond-outline',
      color: '#FF6B35'
    }
  ];

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = async (plan: PaymentPlan) => {
    if (plan.id === 'free') {
      Alert.alert('Free Plan', 'You are already on the free plan!');
      return;
    }

    setLoading(true);
    try {
      // Simulate subscription process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Subscription Successful!',
        `You have successfully subscribed to the ${plan.name} for $${plan.price}/${plan.period}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Handle successful subscription
              console.log('Subscription successful:', plan);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, period: string) => {
    if (price === 0) return 'Free';
    return `$${price}/${period}`;
  };

  const getPlanIcon = (iconName: string, color: string) => {
    return <Ionicons name={iconName as any} size={24} color={color} />;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
        <Text style={styles.headerSubtitle}>
          Select the perfect plan for your financial journey
        </Text>
      </View>

      {/* Payment Plans */}
      <View style={styles.plansContainer}>
        {paymentPlans.map((plan) => (
          <Card 
            key={plan.id} 
            style={[
              styles.planCard,
              plan.popular && styles.popularCard,
              selectedPlan === plan.id && styles.selectedCard
            ]}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Most Popular</Text>
              </View>
            )}

            {/* Plan Header */}
            <View style={styles.planHeader}>
              <View style={styles.planIconContainer}>
                {getPlanIcon(plan.icon, plan.color)}
              </View>
              <View style={styles.planInfo}>
                <Text style={[styles.planName, { color: plan.color }]}>
                  {plan.name}
                </Text>
                <Text style={styles.planPrice}>
                  {formatPrice(plan.price, plan.period)}
                </Text>
              </View>
            </View>

            {/* Plan Description */}
            <Text style={styles.planDescription}>{plan.description}</Text>

            {/* Features List */}
            <View style={styles.featuresContainer}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons 
                    name="checkmark-circle" 
                    size={16} 
                    color={theme.colors.success} 
                  />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={[
                styles.selectButton,
                selectedPlan === plan.id && styles.selectedButton,
                { backgroundColor: plan.color }
              ]}
              onPress={() => handleSelectPlan(plan.id)}
            >
              <Text style={styles.selectButtonText}>
                {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
              </Text>
            </TouchableOpacity>

            {/* Subscribe Button */}
            {selectedPlan === plan.id && (
              <Button
                title={loading ? 'Processing...' : 'Subscribe Now'}
                onPress={() => handleSubscribe(plan)}
                loading={loading}
                style={styles.subscribeButton}
                icon="card"
              />
            )}
          </Card>
        ))}
      </View>

      {/* Benefits Section */}
      <Card style={styles.benefitsCard}>
        <Text style={styles.benefitsTitle}>Why Choose Our Plans?</Text>
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Ionicons name="shield-checkmark" size={20} color={theme.colors.success} />
            <Text style={styles.benefitText}>Secure & Encrypted</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="sync" size={20} color={theme.colors.primary} />
            <Text style={styles.benefitText}>Real-time Sync</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="headset" size={20} color={theme.colors.primary} />
            <Text style={styles.benefitText}>24/7 Support</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="download" size={20} color={theme.colors.primary} />
            <Text style={styles.benefitText}>Easy Export</Text>
          </View>
        </View>
      </Card>

      {/* FAQ Section */}
      <Card style={styles.faqCard}>
        <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I change my plan anytime?</Text>
            <Text style={styles.faqAnswer}>
              Yes! You can upgrade or downgrade your plan at any time from your account settings.
            </Text>
          </View>
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Is there a free trial?</Text>
            <Text style={styles.faqAnswer}>
              All paid plans come with a 14-day free trial. No credit card required!
            </Text>
          </View>
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What payment methods do you accept?</Text>
            <Text style={styles.faqAnswer}>
              We accept all major credit cards, PayPal, and bank transfers.
            </Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  plansContainer: {
    padding: theme.spacing.lg,
  },
  planCard: {
    marginBottom: theme.spacing.lg,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  popularCard: {
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 20,
    zIndex: 1,
  },
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  planIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    ...theme.typography.h4,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  planPrice: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  planDescription: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  featuresContainer: {
    marginBottom: theme.spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  featureText: {
    ...theme.typography.body2,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  selectButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  selectedButton: {
    backgroundColor: theme.colors.success,
  },
  selectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subscribeButton: {
    marginTop: theme.spacing.sm,
  },
  benefitsCard: {
    margin: theme.spacing.lg,
  },
  benefitsTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  benefitsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: theme.spacing.md,
  },
  benefitText: {
    ...theme.typography.body2,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  faqCard: {
    margin: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  faqTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  faqList: {
    gap: theme.spacing.md,
  },
  faqItem: {
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.textSecondary + '20',
  },
  faqQuestion: {
    ...theme.typography.body1,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  faqAnswer: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});

export default PaymentPlansScreen;

