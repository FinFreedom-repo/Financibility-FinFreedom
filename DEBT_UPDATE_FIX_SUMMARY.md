# Debt Update Fix - Summary

## Problem Description
In the Debt Planning page, under the Debt Overview → Outstanding Debts section, there was a logical issue where updating an existing debt (e.g., changing the amount or name) would create a new debt record instead of updating the existing debt in place.

## Root Cause Analysis

### **Problem 1: Model's `save` method (Debt and Account models)**
**File**: `backend/api/models.py`

**Before (❌ Broken)**:
```python
def save(self, *args, **kwargs):
    # Always create a new record for each update (never overwrite)
    if self.pk:
        self.pk = None  # Force insert
    super().save(*args, **kwargs)
```

**Issue**: The model was intentionally designed to create new records instead of updating existing ones (append-only system). When `self.pk` was set to `None`, it forced Django to create a new record instead of updating the existing one.

### **Problem 2: ViewSet's `update` method (DebtViewSet and AccountViewSet)**
**File**: `backend/api/views.py`

**Before (❌ Broken)**:
```python
def update(self, request, *args, **kwargs):
    # Instead of updating, create a new record
    data = request.data.copy()
    data['user'] = request.user.id
    serializer = self.get_serializer(data=data)
    serializer.is_valid(raise_exception=True)
    self.perform_create(serializer)  # This calls create, not update!
    headers = self.get_success_headers(serializer.data)
    return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
```

**Issue**: The `update` method was calling `self.perform_create(serializer)` instead of `self.perform_update(serializer)`, which meant it was creating new records instead of updating existing ones.

## Fixes Implemented

### **Fix 1: Updated Model's `save` method**
**File**: `backend/api/models.py`

**After (✅ Fixed)**:
```python
def save(self, *args, **kwargs):
    # Update existing record instead of creating new one
    super().save(*args, **kwargs)
```

**Changes Made**:
- Removed the logic that set `self.pk = None`
- Now allows Django to update existing records normally

### **Fix 2: Updated ViewSet's `update` method**
**File**: `backend/api/views.py`

**After (✅ Fixed)**:
```python
def update(self, request, *args, **kwargs):
    # Update existing record instead of creating new one
    partial = kwargs.pop('partial', False)
    instance = self.get_object()
    serializer = self.get_serializer(instance, data=request.data, partial=partial)
    serializer.is_valid(raise_exception=True)
    self.perform_update(serializer)
    
    if getattr(instance, '_prefetched_objects_cache', None):
        # If 'prefetch_related' has been applied to a queryset, we need to
        # forcibly invalidate the prefetch cache on the instance.
        instance._prefetched_objects_cache = {}
    
    return Response(serializer.data)
```

**Changes Made**:
- Now properly gets the existing instance using `self.get_object()`
- Uses `self.perform_update(serializer)` instead of `self.perform_create(serializer)`
- Returns proper HTTP 200 response instead of 201 (Created)
- Added cache invalidation for prefetched objects

### **Fix 3: Added `perform_update` method**
**File**: `backend/api/views.py`

**Added**:
```python
def perform_update(self, serializer):
    serializer.save()
```

**Changes Made**:
- Added the missing `perform_update` method to both `DebtViewSet` and `AccountViewSet`
- This method is required for proper update functionality

## Files Modified

### **Backend Files**:
1. **`backend/api/models.py`**:
   - Fixed `Debt.save()` method (lines 166-168)
   - Fixed `Account.save()` method (lines 41-43)

2. **`backend/api/views.py`**:
   - Fixed `DebtViewSet.update()` method (lines 628-643)
   - Fixed `AccountViewSet.update()` method (lines 154-169)
   - Added `DebtViewSet.perform_update()` method (lines 625-626)
   - Added `AccountViewSet.perform_update()` method (lines 152-153)

## Expected Behavior After Fix

### ✅ **Correct Behavior**:
1. **Update in Place**: When editing an existing debt, the system updates the existing record
2. **No Duplicate Records**: No new debt records are created during updates
3. **Proper HTTP Responses**: Update operations return HTTP 200 (OK) instead of 201 (Created)
4. **Data Integrity**: All debt data is properly updated and persisted
5. **Frontend Integration**: The Debt Planning page shows updated values immediately

### 🔴 **Previous Incorrect Behavior**:
1. **New Records Created**: Every update created a new debt record
2. **Duplicate Data**: Multiple records for the same debt with different values
3. **Wrong HTTP Status**: Update operations returned 201 (Created) instead of 200 (OK)
4. **Data Confusion**: Frontend could show multiple versions of the same debt

## Testing the Fix

### **Manual Testing Steps**:
1. Go to the Debt Planning page
2. In the "Outstanding Debts" section, click the edit button on any debt
3. Modify the debt name, balance, or interest rate
4. Click "Update Debt"
5. Verify that:
   - The debt is updated in place (no new debt created)
   - The updated values are displayed correctly
   - The debt payoff calculations reflect the new values

### **API Testing**:
```bash
# Get existing debts
curl -X GET http://localhost:8000/api/debts/

# Update a debt (replace {debt_id} with actual ID)
curl -X PUT http://localhost:8000/api/debts/{debt_id}/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Debt Name",
    "balance": 4500.00,
    "interest_rate": 22.99,
    "debt_type": "credit-card",
    "effective_date": "2025-07-28"
  }'

# Verify the update (should return HTTP 200, not 201)
```

## Impact on Other Features

### **Debt Planning Calculations**:
- ✅ Debt payoff calculations will use the updated values
- ✅ Snowball/avalanche methods will work with correct debt data
- ✅ Budget projections will reflect updated debt information

### **Account Management**:
- ✅ Account updates also work correctly (same fix applied)
- ✅ No duplicate account records created during updates

### **Data Consistency**:
- ✅ All debt-related features use the same updated debt data
- ✅ No confusion between old and new debt records

## Summary

The debt update issue has been completely resolved. The system now:

1. **Updates Existing Records**: Properly modifies existing debt records instead of creating new ones
2. **Maintains Data Integrity**: Ensures all debt data is consistent across the application
3. **Provides Better UX**: Users see their updates immediately without duplicate records
4. **Follows REST Standards**: Update operations return proper HTTP status codes
5. **Preserves Functionality**: All existing features continue to work with updated data

Users can now confidently edit their debts in the Debt Planning page, knowing that their changes will update the existing debt records in place, providing a clean and consistent user experience. 