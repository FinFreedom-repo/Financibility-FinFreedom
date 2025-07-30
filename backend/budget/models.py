from django.db import models
from django.contrib.auth.models import User

class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Base income and expenses
    income = models.FloatField(default=0)
    housing = models.FloatField(default=0)
    debt_payments = models.FloatField(default=0)
    transportation = models.FloatField(default=0)
    utilities = models.FloatField(default=0)
    food = models.FloatField(default=0)
    healthcare = models.FloatField(default=0)
    entertainment = models.FloatField(default=0)
    shopping = models.FloatField(default=0)
    travel = models.FloatField(default=0)
    education = models.FloatField(default=0)
    childcare = models.FloatField(default=0)
    other = models.FloatField(default=0)

    # Additional items stored as JSON
    additional_items = models.JSONField(default=list)

    # Savings stored as JSON
    savings_items = models.JSONField(default=list)

    # Add month and year fields for better organization
    month = models.IntegerField(default=1)  # 1-12
    year = models.IntegerField(default=2024)

    class Meta:
        ordering = ['-updated_at']
        # Ensure each user can only have one budget per month/year combination
        unique_together = ['user', 'month', 'year']

    def __str__(self):
        return f"Budget for {self.user.username} - {self.month}/{self.year}"
