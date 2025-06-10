from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('budget', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='budget',
            name='savings',
            field=models.JSONField(default=list),
        ),
    ] 