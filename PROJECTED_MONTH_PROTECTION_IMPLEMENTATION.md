# PROJECTED MONTH PROTECTION FROM MONTHLY BUDGET OVERWRITES

## Problem Statement

When users manually edit projected month cells in the "Editable Budget Projection" on the Debt Planning page, those cells should be protected from being overwritten by updates from the Monthly Budget page. Previously, saving the Monthly Budget would unconditionally overwrite ALL 12 projected months, erasing any user customizations made in the Debt Planning page.

## Solution Implemented

### 1. **Database Schema Enhancement**

Added `manually_edited_categories` field to budget documents to persist which categories have been manually edited by users.

```javascript
const budgetUpdate = {
  // ... existing fields
  manually_edited_categories: [], // Track categories manually edited by user
  month,
  year
};
```

### 2. **DebtPlanning.js Enhancements**

#### A. Track and Persist Locked Categories

**saveMonthChanges Function (Lines 1460-1471):**
```javascript
// Preserve existing manually edited categories and add new ones from current lockedCells
if (existingBudget && existingBudget.manually_edited_categories) {
  budgetUpdate.manually_edited_categories = [...existingBudget.manually_edited_categories];
}

// Add categories that are locked for this month (user-edited projected cells)
const lockedForThisMonth = lockedCells[monthIdx] || [];
lockedForThisMonth.forEach(category => {
  if (!budgetUpdate.manually_edited_categories.includes(category)) {
    budgetUpdate.manually_edited_categories.push(category);
  }
});
```

**saveMonthChangesDirectly Function (Lines 1383-1386):**
```javascript
// Mark this category as manually edited (for protection from Monthly Budget overwrites)
if (!budgetUpdate.manually_edited_categories.includes(category)) {
  budgetUpdate.manually_edited_categories.push(category);
}
```

#### B. Restore Locked Categories on Page Load

**loadBudgetData Function (Lines 743-756):**
```javascript
// Restore locked cells from manually_edited_categories in the database
const restoredLockedCells = {};
const months = generateMonths();
monthBudgets.forEach((budget, budgetIdx) => {
  if (budget.manually_edited_categories && budget.manually_edited_categories.length > 0) {
    // Find the corresponding month index in the grid
    const monthIdx = months.findIndex(m => m.month === budget.month && m.year === budget.year);
    if (monthIdx !== -1 && months[monthIdx].type === 'future') {
      restoredLockedCells[monthIdx] = [...budget.manually_edited_categories];
      console.log(`🔒 Restored locked categories for ${budget.month}/${budget.year} (monthIdx ${monthIdx}):`, budget.manually_edited_categories);
    }
  }
});
setLockedCells(restoredLockedCells);
```

### 3. **MonthlyBudget.js Protection Logic**

#### Enhanced Projected Month Creation (Lines 535-631)

**Before:**
```javascript
// Unconditionally overwrote all projected months
const projectedBudgetData = { ...baseBudgetForProjection, month: projectedMonth, year: projectedYear };
```

**After:**
```javascript
// Fetch existing budget to check for manually edited categories
let existingBudget = null;
try {
  const getMonthUrl = `${process.env.REACT_APP_API_URL}/api/mongodb/budgets/get-month/`;
  const existingResp = await axios.get(`${getMonthUrl}?month=${projectedMonth}&year=${projectedYear}`);
  existingBudget = existingResp.data;
} catch (getError) {
  existingBudget = null;
}

if (existingBudget && existingBudget.manually_edited_categories && existingBudget.manually_edited_categories.length > 0) {
  // Preserve manually edited categories
  console.log(`🔒 Preserving manually edited categories for ${projectedMonth}/${projectedYear}:`, existingBudget.manually_edited_categories);
  
  projectedBudgetData = { ...existingBudget };
  const lockedCategories = new Set(existingBudget.manually_edited_categories);

  // Update each category from base budget only if it's not manually edited
  Object.keys(categoryMapping).forEach(category => {
    if (!lockedCategories.has(category)) {
      // Update non-locked categories with new Monthly Budget values
    }
  });
} else {
  // No manually edited categories, use base budget entirely
  projectedBudgetData = { 
    ...baseBudgetForProjection, 
    month: projectedMonth, 
    year: projectedYear,
    manually_edited_categories: []
  };
}
```

## Protection Mechanism

### 1. **Automatic Locking**
- When a user edits a projected month cell in Debt Planning, the category is automatically added to `lockedCells` state
- This lock is persisted to the database in the `manually_edited_categories` field

### 2. **Persistence**
- Locked categories are stored in MongoDB as part of each month's budget document
- When the Debt Planning page loads, locked categories are restored from the database

### 3. **Monthly Budget Respect**
- When Monthly Budget saves, it checks each projected month for `manually_edited_categories`
- Categories in this list are preserved with their existing values
- Only non-locked categories are updated with new Monthly Budget values

## Category Mapping

The protection system uses this mapping to translate between grid categories and budget fields:

```javascript
const categoryMapping = {
  'Income': ['income', 'additional_income'],
  'Housing': ['expenses.housing'],
  'Debt payments': ['expenses.debt_payments'],
  'Transportation': ['expenses.transportation'],
  'Food': ['expenses.food'],
  'Healthcare': ['expenses.healthcare'],
  'Entertainment': ['expenses.entertainment'],
  'Shopping': ['expenses.shopping'],
  'Travel': ['expenses.travel'],
  'Education': ['expenses.education'],
  'Utilities': ['expenses.utilities'],
  'Childcare': ['expenses.childcare'],
  'Other': ['expenses.other']
};
```

## User Experience

### 1. **Seamless Protection**
- Users can edit projected months in Debt Planning without worrying about Monthly Budget overwrites
- Changes are automatically protected without manual intervention

### 2. **Visual Feedback**
- Console logs show when categories are locked/unlocked
- Clear indication of protection status during save operations

### 3. **Selective Updates**
- Monthly Budget updates only affect non-edited categories
- User customizations are preserved while allowing global updates to non-customized categories

## Files Modified

1. **`/home/abdur-raffay/Videos/financability/frontend/src/components/DebtPlanning.js`**
   - Added `manually_edited_categories` field to budget save structures
   - Enhanced `saveMonthChanges` and `saveMonthChangesDirectly` to persist locked categories
   - Added restoration of locked categories in `loadBudgetData`

2. **`/home/abdur-raffay/Videos/financability/frontend/src/components/MonthlyBudget.js`**
   - Completely rewrote projected month creation logic
   - Added protection mechanism to respect manually edited categories
   - Implemented selective update strategy

## Benefits

1. **Data Integrity**: User customizations are never lost due to Monthly Budget updates
2. **Workflow Flexibility**: Users can customize projected months without losing global update capability
3. **Automatic Protection**: No manual intervention required - protection is automatic
4. **Granular Control**: Category-level protection allows mixed manual/automatic updates
5. **Persistent State**: Protection survives page reloads and app restarts

## Testing Scenarios

1. **Initial State**: Monthly Budget updates propagate to all projected months
2. **After Manual Edit**: Edited categories in projected months are protected from Monthly Budget updates
3. **Mixed Updates**: Non-edited categories still receive Monthly Budget updates while edited ones remain protected
4. **Page Reload**: Protection state is restored from database
5. **Multiple Categories**: Different categories can have different protection states within the same month

This implementation ensures that user customizations in the Debt Planning page are fully protected while maintaining the ability to make global updates through the Monthly Budget page.