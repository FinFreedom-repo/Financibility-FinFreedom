from rest_framework import serializers
from .models import Budget
from datetime import datetime

class AdditionalItemSerializer(serializers.Serializer):
    name = serializers.CharField()
    amount = serializers.FloatField()

class SavingsItemSerializer(serializers.Serializer):
    name = serializers.CharField()
    amount = serializers.FloatField()

class BudgetSerializer(serializers.ModelSerializer):
    additional_items = AdditionalItemSerializer(many=True, required=False)
    savings_items = SavingsItemSerializer(many=True, required=False)

    class Meta:
        model = Budget
        fields = [
            'id', 'user', 'created_at', 'updated_at',
            'income', 'housing', 'debt_payments', 'transportation',
            'food', 'healthcare', 'entertainment', 'shopping',
            'travel', 'education', 'utilities', 'childcare',
            'other', 'additional_items', 'savings_items', 'month', 'year'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def create(self, validated_data):
        additional_items = validated_data.pop('additional_items', [])
        savings_items = validated_data.pop('savings_items', [])
        
        # Set current month and year if not provided
        if 'month' not in validated_data:
            validated_data['month'] = datetime.now().month
        if 'year' not in validated_data:
            validated_data['year'] = datetime.now().year
            
        budget = Budget.objects.create(**validated_data)
        budget.additional_items = additional_items
        budget.savings_items = savings_items
        budget.save()
        
        return budget

    def update(self, instance, validated_data):
        additional_items = validated_data.pop('additional_items', None)
        if additional_items is not None:
            instance.additional_items = additional_items
        
        savings_items = validated_data.pop('savings_items', None)
        if savings_items is not None:
            instance.savings_items = savings_items
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance 