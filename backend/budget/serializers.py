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

    def update(self, instance, validated_data):
        additional_items = validated_data.pop('additional_items', None)
        if additional_items is not None:
            instance.additional_items = additional_items
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance 