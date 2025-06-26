from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Account, Transaction, Category, UserProfile, Debt, FinancialStep

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'name', 'account_type', 'balance', 'interest_rate', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'age', 'sex', 'marital_status']

class DebtSerializer(serializers.ModelSerializer):
    class Meta:
        model = Debt
        fields = ['id', 'name', 'debt_type', 'balance', 'interest_rate', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class FinancialStepSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    step_progress = serializers.SerializerMethodField()
    
    class Meta:
        model = FinancialStep
        fields = [
            'id', 'username', 'current_step', 'emergency_fund_goal', 'emergency_fund_current',
            'monthly_expenses', 'retirement_contribution_percent', 'has_children',
            'college_fund_goal', 'college_fund_current', 'mortgage_balance', 'updated_at',
            'step_progress'
        ]
        read_only_fields = ['updated_at']
    
    def get_step_progress(self, obj):
        """Calculate and return the progress for the current step."""
        return obj.calculate_step_progress()
