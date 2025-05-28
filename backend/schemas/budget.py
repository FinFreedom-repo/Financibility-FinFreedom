from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AdditionalItem(BaseModel):
    type: str
    name: str
    amount: float

class BudgetBase(BaseModel):
    income: float = 0
    rent: float = 0
    credit_card_debt: float = 0
    transportation: float = 0
    utilities: float = 0
    internet: float = 0
    groceries: float = 0
    healthcare: float = 0
    childcare: float = 0
    additional_items: List[AdditionalItem] = []

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BudgetBase):
    pass

class BudgetResponse(BudgetBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 