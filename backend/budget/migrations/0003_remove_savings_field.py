from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('budget', '0002_add_savings_field'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='budget',
            name='savings',
        ),
    ] 