from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Account, Transaction, Category, UserProfile, Debt, FinancialStep, AccountAudit, TransactionAudit, DebtAudit
from datetime import date

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs

class UpdateUsernameSerializer(serializers.Serializer):
    new_username = serializers.CharField(required=True, min_length=3, max_length=150)

class DeleteAccountSerializer(serializers.Serializer):
    password = serializers.CharField(required=True)
    confirm_delete = serializers.BooleanField(required=True)

    def validate_confirm_delete(self, value):
        if not value:
            raise serializers.ValidationError("You must confirm account deletion")
        return value

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
    email = serializers.CharField(source='user.email', read_only=True)
    profile_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'username', 'email', 'age', 'sex', 
            'marital_status', 'profile_image', 'profile_image_url', 
            'date_of_birth', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_profile_image_url(self, obj):
        if obj.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_image.url)
            return obj.profile_image.url
        return None

class DebtSerializer(serializers.ModelSerializer):
    effective_date = serializers.DateField(required=False)
    payoff_date = serializers.DateField(required=False)
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
