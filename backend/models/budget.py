from django.db import models
from django.contrib.auth.models import User

class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Base income and expenses
    income = models.FloatField(default=0)
    rent = models.FloatField(default=0)
    credit_card_debt = models.FloatField(default=0)
    transportation = models.FloatField(default=0)
    utilities = models.FloatField(default=0)
    internet = models.FloatField(default=0)
    groceries = models.FloatField(default=0)
    healthcare = models.FloatField(default=0)
    childcare = models.FloatField(default=0)

    # Additional items stored as JSON
    additional_items = models.JSONField(default=list)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Budget for {self.user.username} - {self.updated_at}" 