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
            'income', 'housing', 'debt_payments', 'transportation',
            'food', 'healthcare', 'entertainment', 'shopping',
            'travel', 'education', 'utilities', 'childcare',
            'other', 'additional_items', 'savings'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def update(self, instance, validated_data):
        additional_items = validated_data.pop('additional_items', None)
        if additional_items is not None:
            instance.additional_items = additional_items
        
        savings = validated_data.pop('savings', None)
        if savings is not None:
            instance.savings = savings
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

    def get_fields(self):
        print("Getting fields for BudgetSerializer")
        fields = super().get_fields()
        print("Fields:", fields)
        return fields

    def build_field(self, field_name, info, model_class, nested_depth):
        print(f"Building field: {field_name}")
        # if field_name == 'savings':
        #     import pdb; pdb.set_trace()
        print(f"Info: {info}")
        print(f"Model class: {model_class}")
        return super().build_field(field_name, info, model_class, nested_depth)

    def build_unknown_field(self, field_name, model_class):
        print(f"Building unknown field: {field_name}")
        print(f"Model class: {model_class}")
        print(f"Model fields: {model_class._meta.get_fields()}")
        return super().build_unknown_field(field_name, model_class) 