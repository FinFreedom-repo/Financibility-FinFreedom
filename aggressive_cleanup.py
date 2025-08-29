#!/usr/bin/env python3
"""
Aggressive Project Cleanup Script
Removes ALL unnecessary files including test files, debug files, and documentation files.
"""

import os
import glob

def aggressive_cleanup():
    """Remove ALL unnecessary files from the project"""
    
    print("🧹 Starting Aggressive Project Cleanup...")
    print("=" * 60)
    
    # Files to DELETE (all test files, debug files, documentation files)
    patterns_to_delete = [
        # Test files
        "test_*.py",
        "*_test.py", 
        "*_test_*.py",
        "test_*.md",
        "*_test_report.json",
        "qa_test_script.py",
        "final_verification_test.py",
        "final_frontend_test.py",
        "frontend_integration_test.py",
        "frontend_backend_integration_test.py",
        "final_monthly_budget_verification.py",
        "comprehensive_qa_report.md",
        "simple_frontend_qa_test_results.json",
        "qa_test_results.json",
        "frontend_qa_test.py",
        "mongodb_functionality_test.py",
        "database_analysis.py",
        "test_debt_planning_monthly_saving.py",
        "test_fix_verification.md",
        "check_current_budgets.py",
        "test_debt_planning_final_verification.py",
        "test_debt_planning_complete_implementation.py",
        "test_debt_planning_complete_fix.py",
        "test_debt_planning_final_fix.py",
        "test_debt_planning_fix.py",
        "test_debt_planning_performance.py",
        "test_grid_debug.js",
        "test_grid_data_fix.py",
        "debug_budget_data.py",
        "verify_debt_planning_implementation.py",
        "test_frontend_simulation.py",
        "test_frontend_backend_connection.py",
        "test_frontend_data_structure.py",
        "test_frontend_data_display.py",
        "test_frontend_login.py",
        "test_frontend_authentication_state.py",
        "test_frontend_token_issue.py",
        "test_frontend_update_simulation.py",
        "test_frontend_update.py",
        "test_frontend_fix.py",
        "test_frontend_data.py",
        "test_frontend_fetch.py",
        "test_frontend_access.py",
        "test_frontend_monthly_budget*.py",
        "test_monthly_budget*.py",
        "test_settings_integration.py",
        "test_profile_integration.py",
        "test_profile_with_images.py",
        "test_accounts_debts_integration.py",
        "test_mongodb_atlas*.py",
        "test_user_login_required.py",
        "test_clean_database_frontend.py",
        "test_complete_*.py",
        "test_simple_fix.py",
        "test_budget_update.py",
        "test_api_response.py",
        "test_direct_update.py",
        "test_update_fix.py",
        "test_monthly_budget_loading.py",
        "test_complete_budget_fields.py",
        "test_complete_frontend_fix.py",
        "test_monthly_budget_debug.py",
        "test_monthly_budget_crud.py",
        "test_monthly_budget_complete_crud.py",
        "test_monthly_budget_fix.py",
        "test_monthly_budget_mongodb.py",
        "test_monthly_budget_update.py",
        "test_monthly_budget_ui.py",
        "test_monthly_budget_simple.py",
        "test_monthly_budget_final.py",
        "test_monthly_budget_complete.py",
        "test_monthly_budget_crud.py",
        
        # Debug files
        "debug_*.py",
        "fix_*.py",
        "fix_*.js",
        "check_*.py",
        "inspect_*.py",
        "verify_*.py",
        "grid_debug.js",
        "test_grid_*.js",
        "test_grid_*.py",
        "fix_initialization_error.py",
        "fix_debt_planning_initialization.js",
        "fix_all_budget_duplicates.py",
        "fix_mongodb_atlas_duplicates.py",
        "fix_mongodb_atlas_final.py",
        "fix_budget_duplicates.py",
        "fix_budget_index.py",
        "fix_user_mapping.py",
        "fix_data_structures.py",
        "inspect_data_structures.py",
        "check_mongodb_collections.py",
        "cleanup_duplicate_collections.py",
        
        # Documentation files
        "DEBT_PLANNING_*.md",
        "MONTHLYBUDGET_*.md", 
        "FRONTEND_*.md",
        "BACKEND_*.md",
        "FINAL_*.md",
        "MANUAL_*.md",
        "database_solution.md",
        "comprehensive_qa_report.md",
        "test_fix_verification.md",
        "DEBT_PLANNING_PERFORMANCE_OPTIMIZATION.md",
        "DEBT_PLANNING_BUDGET_GRID_FIX_SUMMARY.md",
        "DEBT_PLANNING_MONGODB_INTEGRATION_SUMMARY.md",
        "DEBT_PLANNING_FINAL_STATUS.md",
        "DEBT_PLANNING_EDITABLE_GRID_FIX_SUMMARY.md",
        "DEBT_PLANNING_COMPLETE_SUCCESS.md",
        "DEBT_PLANNING_MONTHLY_SAVING_IMPLEMENTATION.md",
        "MONTHLYBUDGET_EXPENSE_CATEGORIES_CORRECTION.md",
        "MONTHLYBUDGET_SAVE_BUTTON_CORRECTION.md",
        "MONTHLYBUDGET_UI_CHANGES_SUMMARY.md",
        "FRONTEND_MONTHLYBUDGET_TEST_SUMMARY.md",
        "MONTHLYBUDGET_DUPLICATE_KEY_FIX_SUMMARY.md",
        "MONTHLYBUDGET_UPDATE_FIX_SUMMARY.md",
        "MONTHLYBUDGET_COMPLETE_IMPLEMENTATION_SUMMARY.md",
        "FINAL_MONTHLYBUDGET_TEST_RESULTS.md",
        "FINAL_COMPLETE_FIX_SUMMARY.md",
        "FINAL_UPDATE_FIX_SUMMARY.md",
        "BACKEND_MONTHLYBUDGET_CODE_STRUCTURE.md",
        "MANUAL_FRONTEND_TEST_GUIDE.md",
        
        # Test reports
        "*_test_report.json",
        "settings_integration_test_report.json",
        "profile_with_images_test_report.json",
        "profile_integration_test_report.json",
        "accounts_debts_integration_test_report.json",
        "simple_frontend_qa_test_results.json",
        "qa_test_results.json",
        
        # Temporary files
        "*.tmp",
        "*.log",
        "*.bak",
        "*.old",
        "test_login.html",
        
        # This cleanup script itself
        "aggressive_cleanup.py"
    ]
    
    deleted_count = 0
    kept_count = 0
    
    # Get all files in current directory
    for filename in os.listdir('.'):
        file_path = os.path.join('.', filename)
        
        # Skip directories
        if os.path.isdir(file_path):
            if filename in ['.git', 'backend', 'frontend', 'config']:
                print(f"✅ Keeping directory: {filename}/")
                kept_count += 1
            else:
                print(f"⚠️  Directory: {filename}/ (keeping for safety)")
                kept_count += 1
            continue
        
        # Check if file should be deleted
        should_delete = False
        for pattern in patterns_to_delete:
            if filename == pattern or filename.startswith(pattern.replace('*', '')) or filename.endswith(pattern.replace('*', '')) or pattern.replace('*', '') in filename:
                should_delete = True
                break
        
        # Essential files to keep
        essential_files = [
            'README.md', 'requirements.txt', 'setup.sh', 'migration_plan.md', 
            'mongodb_migration_summary.md', 'sqlite_removal_summary.md',
            'env.example', 'token.txt', '.env', '.gitignore'
        ]
        
        if filename in essential_files:
            print(f"✅ Keeping: {filename}")
            kept_count += 1
        elif should_delete:
            try:
                os.remove(file_path)
                print(f"🗑️  Deleted: {filename}")
                deleted_count += 1
            except Exception as e:
                print(f"❌ Failed to delete {filename}: {str(e)}")
        else:
            print(f"⚠️  Unknown file: {filename} (keeping for safety)")
            kept_count += 1
    
    print("\n" + "=" * 60)
    print(f"🎉 Aggressive Cleanup Complete!")
    print(f"📊 Summary:")
    print(f"   ✅ Kept: {kept_count} files/directories")
    print(f"   🗑️  Deleted: {deleted_count} files")
    print(f"\n📁 Clean Project Structure:")
    print(f"   📂 backend/ - Django backend with MongoDB")
    print(f"   📂 frontend/ - React frontend") 
    print(f"   📂 config/ - Configuration files")
    print(f"   📄 README.md - Project documentation")
    print(f"   📄 requirements.txt - Python dependencies")
    print(f"   📄 setup.sh - Setup script")
    print(f"   📄 migration_plan.md - Migration documentation")
    print(f"   📄 mongodb_migration_summary.md - MongoDB migration info")
    print(f"   📄 sqlite_removal_summary.md - SQLite removal info")
    print(f"\n✨ Project is now clean and production-ready!")

if __name__ == "__main__":
    aggressive_cleanup() 