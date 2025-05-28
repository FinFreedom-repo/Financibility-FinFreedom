from rest_framework import serializers
from .models import Budget

class AdditionalItemSerializer(serializers.Serializer):
    type = serializers.CharField()
    name = serializers.CharField()
    amount = serializers.FloatField()

class BudgetSerializer(serializers.ModelSerializer):
    additional_items = AdditionalItemSerializer(many=True, required=False)

    class Meta:
        model = Budget
        fields = [
            'id', 'user', 'created_at', 'updated_at',
            'income', 'rent', 'credit_card_debt', 'transportation',
            'utilities', 'internet', 'groceries', 'healthcare',
            'childcare', 'additional_items'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at'] 