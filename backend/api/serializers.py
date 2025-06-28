from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Account, Transaction, Category, UserProfile, Debt, FinancialStep, AccountAudit, TransactionAudit, DebtAudit
from datetime import date

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class AccountSerializer(serializers.ModelSerializer):
    effective_date = serializers.DateField(required=False)
    balance = serializers.DecimalField(max_digits=15, decimal_places=2)
    interest_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    
    class Meta:
        model = Account
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def validate_effective_date(self, value):
        """Validate effective_date field"""
        if value is None:
            return date.today()
        return value

class AccountAuditSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountAudit
        fields = '__all__'

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'

class TransactionAuditSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionAudit
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'age', 'sex', 'marital_status']

class DebtSerializer(serializers.ModelSerializer):
    effective_date = serializers.DateField(required=False)
    balance = serializers.DecimalField(max_digits=15, decimal_places=2)
    interest_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    
    class Meta:
        model = Debt
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def validate_effective_date(self, value):
        """Validate effective_date field"""
        if value is None:
            return date.today()
        return value

class DebtAuditSerializer(serializers.ModelSerializer):
    class Meta:
        model = DebtAudit
        fields = '__all__'

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
