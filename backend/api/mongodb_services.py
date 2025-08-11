"""
MongoDB services for Django integration.
This module provides services to access MongoDB data while maintaining Django ORM compatibility.
"""

import mongoengine
from mongoengine import connect, Document, StringField, IntField, FloatField, DateTimeField, DateField, BooleanField, ListField, DictField, DecimalField
from decimal import Decimal
from datetime import datetime, date
from backend.mongodb_settings import MONGODB_CONNECTION

# Connect to MongoDB
connect(
    db=MONGODB_CONNECTION['db'],
    host=MONGODB_CONNECTION['host'],
    port=MONGODB_CONNECTION.get('port', 27017)
)

# MongoDB Models
class MongoUser(Document):
    id = IntField(primary_key=True)
    username = StringField(required=True, unique=True)
    email = StringField()
    first_name = StringField()
    last_name = StringField()
    is_active = BooleanField(default=True)
    date_joined = DateTimeField()
    password = StringField()
    
    meta = {'collection': 'auth_user'}

class MongoAccount(Document):
    id = IntField(primary_key=True)
    user_id = IntField(required=True)
    name = StringField(required=True)
    account_type = StringField()
    balance = DecimalField(precision=2)
    interest_rate = DecimalField(precision=2)
    effective_date = DateField()
    created_at = DateTimeField()
    updated_at = DateTimeField()
    
    meta = {'collection': 'api_account'}

class MongoDebt(Document):
    id = IntField(primary_key=True)
    user_id = IntField(required=True)
    name = StringField(required=True)
    debt_type = StringField()
    balance = DecimalField(precision=2)
    interest_rate = DecimalField(precision=2)
    effective_date = DateField()
    payoff_date = DateField()
    created_at = DateTimeField()
    updated_at = DateTimeField()
    
    meta = {'collection': 'api_debt'}

class MongoBudget(Document):
    id = IntField(primary_key=True)
    user_id = IntField(required=True)
    created_at = DateTimeField()
    updated_at = DateTimeField()
    income = FloatField()
    additional_income = FloatField()
    housing = FloatField()
    debt_payments = FloatField()
    transportation = FloatField()
    utilities = FloatField()
    food = FloatField()
    healthcare = FloatField()
    entertainment = FloatField()
    shopping = FloatField()
    travel = FloatField()
    education = FloatField()
    childcare = FloatField()
    other = FloatField()
    additional_items = ListField(DictField())
    savings_items = ListField(DictField())
    month = IntField()
    year = IntField()
    
    meta = {'collection': 'budget_budget'}

class MongoTransaction(Document):
    id = IntField(primary_key=True)
    amount = DecimalField(precision=2)
    description = StringField()
    transaction_type = StringField()
    account_id = IntField(required=True)
    category_id = IntField(required=True)
    date = DateField()
    effective_date = DateField()
    user_id = IntField(required=True)
    created_at = DateTimeField()
    updated_at = DateTimeField()
    
    meta = {'collection': 'api_transaction'}

class MongoCategory(Document):
    id = IntField(primary_key=True)
    name = StringField(required=True)
    user_id = IntField(required=True)
    created_at = DateTimeField()
    updated_at = DateTimeField()
    
    meta = {'collection': 'api_category'}

class MongoFinancialStep(Document):
    id = IntField(primary_key=True)
    user_id = IntField(required=True)
    current_step = IntField()
    emergency_fund_goal = DecimalField(precision=2)
    emergency_fund_current = DecimalField(precision=2)
    monthly_expenses = DecimalField(precision=2)
    retirement_contribution_percent = DecimalField(precision=2)
    has_children = BooleanField()
    college_fund_goal = DecimalField(precision=2)
    college_fund_current = DecimalField(precision=2)
    mortgage_balance = DecimalField(precision=2)
    updated_at = DateTimeField()
    
    meta = {'collection': 'api_financialstep'}

class MongoUserProfile(Document):
    id = IntField(primary_key=True)
    user_id = IntField(required=True, unique=True)
    age = IntField()
    sex = StringField(max_length=10)  # M, F, O
    marital_status = StringField(max_length=20)  # single, married, divorced, widowed
    profile_image = StringField()  # File path/URL
    bio = StringField(max_length=500)
    phone = StringField(max_length=20)
    address = StringField(max_length=200)
    date_of_birth = DateField()
    created_at = DateTimeField()
    updated_at = DateTimeField()
    
    meta = {'collection': 'api_userprofile'}

# MongoDB Services
class MongoDBService:
    """Service class for MongoDB operations"""
    
    @staticmethod
    def get_user_accounts(user_id):
        """Get accounts for a user from MongoDB"""
        try:
            accounts = MongoAccount.objects.filter(user_id=user_id)
            return list(accounts)
        except Exception as e:
            print(f"Error getting accounts from MongoDB: {e}")
            return []
    
    @staticmethod
    def get_user_debts(user_id):
        """Get debts for a user from MongoDB"""
        try:
            debts = MongoDebt.objects.filter(user_id=user_id)
            return list(debts)
        except Exception as e:
            print(f"Error getting debts from MongoDB: {e}")
            return []
    
    @staticmethod
    def get_user_budgets(user_id):
        """Get budgets for a user from MongoDB"""
        try:
            budgets = MongoBudget.objects.filter(user_id=user_id)
            return list(budgets)
        except Exception as e:
            print(f"Error getting budgets from MongoDB: {e}")
            return []
    
    @staticmethod
    def get_user_financial_step(user_id):
        """Get user's financial step data from MongoDB"""
        try:
            return MongoFinancialStep.objects.get(user_id=user_id)
        except MongoFinancialStep.DoesNotExist:
            return None

    @staticmethod
    def get_user_transactions(user_id):
        try:
            return list(MongoTransaction.objects.filter(user_id=user_id))
        except Exception as e:
            print(f"Error getting transactions from MongoDB: {e}")
            return []

    @staticmethod
    def get_user_categories(user_id):
        try:
            return list(MongoCategory.objects.filter(user_id=user_id))
        except Exception as e:
            print(f"Error getting categories from MongoDB: {e}")
            return []

    @staticmethod
    def get_user_profile(user_id):
        """Get user's profile data from MongoDB"""
        try:
            return MongoUserProfile.objects.get(user_id=user_id)
        except MongoUserProfile.DoesNotExist:
            return None

    @staticmethod
    def create_user_profile(user_id, profile_data):
        """Create a new user profile in MongoDB"""
        try:
            # Process data with proper type conversion
            processed_data = {}
            for field, value in profile_data.items():
                if field == 'date_of_birth' and value:
                    try:
                        if isinstance(value, str):
                            processed_data[field] = datetime.strptime(value, '%Y-%m-%d').date()
                        else:
                            processed_data[field] = value
                    except (ValueError, TypeError):
                        print(f"Warning: Invalid date format for {field}: {value}")
                        processed_data[field] = None
                elif field == 'age' and value:
                    try:
                        processed_data[field] = int(value) if value else None
                    except (ValueError, TypeError):
                        print(f"Warning: Invalid age value: {value}")
                        processed_data[field] = None
                else:
                    processed_data[field] = value
            
            profile = MongoUserProfile(
                id=user_id,  # Use user_id as the primary key
                user_id=user_id,
                age=processed_data.get('age'),
                sex=processed_data.get('sex'),
                marital_status=processed_data.get('marital_status'),
                profile_image=processed_data.get('profile_image'),
                bio=processed_data.get('bio'),
                phone=processed_data.get('phone'),
                address=processed_data.get('address'),
                date_of_birth=processed_data.get('date_of_birth'),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            profile.save()
            return profile
        except Exception as e:
            print(f"Error creating user profile: {e}")
            return None

    @staticmethod
    def update_user_profile(user_id, profile_data):
        """Update user's profile data in MongoDB"""
        try:
            profile = MongoUserProfile.objects.get(user_id=user_id)
            
            # Process each field with proper type conversion
            for field, value in profile_data.items():
                if hasattr(profile, field):
                    # Handle date conversion
                    if field == 'date_of_birth' and value:
                        try:
                            if isinstance(value, str):
                                # Convert string date to datetime object
                                value = datetime.strptime(value, '%Y-%m-%d').date()
                        except (ValueError, TypeError):
                            print(f"Warning: Invalid date format for {field}: {value}")
                            value = None
                    
                    # Handle age conversion
                    elif field == 'age' and value:
                        try:
                            value = int(value) if value else None
                        except (ValueError, TypeError):
                            print(f"Warning: Invalid age value: {value}")
                            value = None
                    
                    # Set the field value
                    setattr(profile, field, value)
            
            profile.updated_at = datetime.now()
            profile.save()
            return profile
        except MongoUserProfile.DoesNotExist:
            # Create profile if it doesn't exist
            return MongoDBService.create_user_profile(user_id, profile_data)
        except Exception as e:
            print(f"Error updating user profile: {e}")
            return None

    @staticmethod
    def delete_user_profile(user_id):
        """Delete user's profile from MongoDB"""
        try:
            profile = MongoUserProfile.objects.get(user_id=user_id)
            profile.delete()
            return True
        except MongoUserProfile.DoesNotExist:
            return False
        except Exception as e:
            print(f"Error deleting user profile: {e}")
            return False
    
    @staticmethod
    def get_all_users():
        """Get all users from MongoDB"""
        try:
            users = MongoUser.objects.all()
            return list(users)
        except Exception as e:
            print(f"Error getting users from MongoDB: {e}")
            return []
    
    @staticmethod
    def get_user_by_id(user_id):
        """Get a specific user from MongoDB"""
        try:
            user = MongoUser.objects.filter(id=user_id).first()
            return user
        except Exception as e:
            print(f"Error getting user from MongoDB: {e}")
            return None
    
    @staticmethod
    def get_user_by_username(username):
        """Get a user by username from MongoDB"""
        try:
            user = MongoUser.objects.filter(username=username).first()
            return user
        except Exception as e:
            print(f"Error getting user by username from MongoDB: {e}")
            return None
    
    @staticmethod
    def create_user(user_data):
        """Create a new user in MongoDB"""
        try:
            mongo_user = MongoUser(**user_data)
            mongo_user.save()
            return mongo_user
        except Exception as e:
            print(f"Error creating user in MongoDB: {e}")
            return None

# Hybrid Data Access
class HybridDataService:
    """Service that combines Django ORM and MongoDB data"""
    
    @staticmethod
    def get_user_data(user_id):
        """Get all user data from MongoDB"""
        try:
            # Get user from Django ORM
            from django.contrib.auth.models import User
            user = User.objects.get(id=user_id)
            
            # Get data from MongoDB
            accounts = MongoDBService.get_user_accounts(user_id)
            debts = MongoDBService.get_user_debts(user_id)
            budgets = MongoDBService.get_user_budgets(user_id)
            financial_step = MongoDBService.get_user_financial_step(user_id)
            profile = MongoDBService.get_user_profile(user_id)
            
            return {
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'date_joined': user.date_joined.isoformat() if user.date_joined else None
                },
                'accounts': [DataConverter.mongo_account_to_dict(account) for account in accounts] if accounts else [],
                'debts': [DataConverter.mongo_debt_to_dict(debt) for debt in debts] if debts else [],
                'budgets': [DataConverter.mongo_budget_to_dict(budget) for budget in budgets] if budgets else [],
                'financial_step': DataConverter.mongo_financialstep_to_dict(financial_step) if financial_step else None,
                'profile': DataConverter.mongo_userprofile_to_dict(profile) if profile else None
            }
        except User.DoesNotExist:
            return None
        except Exception as e:
            print(f"Error getting user data: {e}")
            return None
    
    @staticmethod
    def get_all_accounts():
        """Get all accounts from MongoDB"""
        try:
            accounts = MongoAccount.objects.all()
            return list(accounts)
        except Exception as e:
            print(f"Error getting all accounts from MongoDB: {e}")
            return []
    
    @staticmethod
    def get_all_debts():
        """Get all debts from MongoDB"""
        try:
            debts = MongoDebt.objects.all()
            return list(debts)
        except Exception as e:
            print(f"Error getting all debts from MongoDB: {e}")
            return []
    
    @staticmethod
    def get_all_budgets():
        """Get all budgets from MongoDB"""
        try:
            budgets = MongoBudget.objects.all()
            return list(budgets)
        except Exception as e:
            print(f"Error getting all budgets from MongoDB: {e}")
            return []

# Data Conversion Utilities
class DataConverter:
    """Convert between Django ORM and MongoDB formats"""
    
    @staticmethod
    def mongo_account_to_dict(mongo_account):
        """Convert MongoDB account to dictionary"""
        return {
            'id': mongo_account.id,
            'user_id': mongo_account.user_id,
            'name': mongo_account.name,
            'account_type': mongo_account.account_type,
            'balance': float(mongo_account.balance) if mongo_account.balance else 0.0,
            'interest_rate': float(mongo_account.interest_rate) if mongo_account.interest_rate else 0.0,
            'effective_date': mongo_account.effective_date.isoformat() if mongo_account.effective_date else None,
            'created_at': mongo_account.created_at.isoformat() if mongo_account.created_at else None,
            'updated_at': mongo_account.updated_at.isoformat() if mongo_account.updated_at else None,
        }
    
    @staticmethod
    def mongo_debt_to_dict(mongo_debt):
        """Convert MongoDB debt to dictionary"""
        return {
            'id': mongo_debt.id,
            'user_id': mongo_debt.user_id,
            'name': mongo_debt.name,
            'debt_type': mongo_debt.debt_type,
            'balance': float(mongo_debt.balance) if mongo_debt.balance else 0.0,
            'interest_rate': float(mongo_debt.interest_rate) if mongo_debt.interest_rate else 0.0,
            'effective_date': mongo_debt.effective_date.isoformat() if mongo_debt.effective_date else None,
            'payoff_date': mongo_debt.payoff_date.isoformat() if mongo_debt.payoff_date else None,
            'created_at': mongo_debt.created_at.isoformat() if mongo_debt.created_at else None,
            'updated_at': mongo_debt.updated_at.isoformat() if mongo_debt.updated_at else None,
        }
    
    @staticmethod
    def mongo_budget_to_dict(mongo_budget):
        """Convert MongoDB budget to dictionary"""
        if not mongo_budget:
            return None
        
        return {
            'id': mongo_budget.id,
            'user_id': mongo_budget.user_id,
            'income': float(mongo_budget.income) if mongo_budget.income else 0,
            'additional_income': float(mongo_budget.additional_income) if getattr(mongo_budget, 'additional_income', None) else 0,
            'housing': float(mongo_budget.housing) if mongo_budget.housing else 0,
            'debt_payments': float(mongo_budget.debt_payments) if mongo_budget.debt_payments else 0,
            'transportation': float(mongo_budget.transportation) if mongo_budget.transportation else 0,
            'utilities': float(mongo_budget.utilities) if mongo_budget.utilities else 0,
            'food': float(mongo_budget.food) if mongo_budget.food else 0,
            'healthcare': float(mongo_budget.healthcare) if mongo_budget.healthcare else 0,
            'entertainment': float(mongo_budget.entertainment) if mongo_budget.entertainment else 0,
            'shopping': float(mongo_budget.shopping) if mongo_budget.shopping else 0,
            'travel': float(mongo_budget.travel) if mongo_budget.travel else 0,
            'education': float(mongo_budget.education) if mongo_budget.education else 0,
            'childcare': float(mongo_budget.childcare) if mongo_budget.childcare else 0,
            'other': float(mongo_budget.other) if mongo_budget.other else 0,
            'additional_items': mongo_budget.additional_items or [],
            'savings_items': mongo_budget.savings_items or [],
            'month': mongo_budget.month,
            'year': mongo_budget.year,
            'created_at': mongo_budget.created_at.isoformat() if mongo_budget.created_at else None,
            'updated_at': mongo_budget.updated_at.isoformat() if mongo_budget.updated_at else None
        }

    @staticmethod
    def mongo_transaction_to_dict(mongo_txn):
        return {
            'id': mongo_txn.id,
            'user_id': mongo_txn.user_id,
            'amount': float(mongo_txn.amount) if mongo_txn.amount else 0.0,
            'description': mongo_txn.description,
            'transaction_type': mongo_txn.transaction_type,
            'account': mongo_txn.account_id,
            'category': mongo_txn.category_id,
            'date': mongo_txn.date.isoformat() if mongo_txn.date else None,
            'effective_date': mongo_txn.effective_date.isoformat() if mongo_txn.effective_date else None,
            'created_at': mongo_txn.created_at.isoformat() if mongo_txn.created_at else None,
            'updated_at': mongo_txn.updated_at.isoformat() if mongo_txn.updated_at else None,
        }

    @staticmethod
    def mongo_category_to_dict(mongo_cat):
        return {
            'id': mongo_cat.id,
            'user_id': mongo_cat.user_id,
            'name': mongo_cat.name,
            'created_at': mongo_cat.created_at.isoformat() if mongo_cat.created_at else None,
            'updated_at': mongo_cat.updated_at.isoformat() if mongo_cat.updated_at else None,
        }

    @staticmethod
    def mongo_userprofile_to_dict(mongo_profile):
        """Convert MongoDB user profile to dictionary"""
        if not mongo_profile:
            return None
        
        return {
            'id': mongo_profile.id,
            'user_id': mongo_profile.user_id,
            'age': mongo_profile.age,
            'sex': mongo_profile.sex,
            'marital_status': mongo_profile.marital_status,
            'profile_image': mongo_profile.profile_image,
            'bio': mongo_profile.bio,
            'phone': mongo_profile.phone,
            'address': mongo_profile.address,
            'date_of_birth': mongo_profile.date_of_birth.isoformat() if hasattr(mongo_profile.date_of_birth, 'isoformat') and mongo_profile.date_of_birth else None,
            'created_at': mongo_profile.created_at.isoformat() if hasattr(mongo_profile.created_at, 'isoformat') and mongo_profile.created_at else None,
            'updated_at': mongo_profile.updated_at.isoformat() if hasattr(mongo_profile.updated_at, 'isoformat') and mongo_profile.updated_at else None
        }

    @staticmethod
    def mongo_financialstep_to_dict(mongo_step):
        """Convert MongoDB financial step to dictionary"""
        if not mongo_step:
            return None
        
        return {
            'id': mongo_step.id,
            'user_id': mongo_step.user_id,
            'current_step': mongo_step.current_step,
            'emergency_fund_goal': float(mongo_step.emergency_fund_goal) if mongo_step.emergency_fund_goal else 0,
            'emergency_fund_current': float(mongo_step.emergency_fund_current) if mongo_step.emergency_fund_current else 0,
            'monthly_expenses': float(mongo_step.monthly_expenses) if mongo_step.monthly_expenses else 0,
            'retirement_contribution_percent': float(mongo_step.retirement_contribution_percent) if mongo_step.retirement_contribution_percent else 0,
            'has_children': mongo_step.has_children,
            'college_fund_goal': float(mongo_step.college_fund_goal) if mongo_step.college_fund_goal else 0,
            'college_fund_current': float(mongo_step.college_fund_current) if mongo_step.college_fund_current else 0,
            'mortgage_balance': float(mongo_step.mortgage_balance) if mongo_step.mortgage_balance else 0,
            'updated_at': mongo_step.updated_at.isoformat() if mongo_step.updated_at else None
        } 