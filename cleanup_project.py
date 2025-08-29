#!/usr/bin/env python3
"""
Project Cleanup Script
Removes all unnecessary test files, debug files, and documentation files
while keeping only the essential project files.
"""

import os
import shutil

def cleanup_project():
    """Remove all unnecessary files from the project"""
    
    # Essential files and directories to KEEP
    essential_files = {
        # Core project files
        'README.md',
        'requirements.txt',
        'setup.sh',
        'migration_plan.md',
        'mongodb_migration_summary.md',
        'sqlite_removal_summary.md',
        
        # Backend directory (keep entire directory)
        'backend/',
        
        # Frontend directory (keep entire directory)
        'frontend/',
        
        # Config directory (keep entire directory)
        'config/',
        
        # Git directory
        '.git/',
        
        # Environment files
        'env.example',
        'token.txt',  # Keep as it might contain important tokens
    }
    
    # Files to DELETE (all test files, debug files, documentation files)
    files_to_delete = [
        # Test files
        'test_*.py',
        '*_test.py',
        '*_test_*.py',
        'test_*.md',
        '*_test_report.json',
        'qa_test_script.py',
        'final_verification_test.py',
        'final_frontend_test.py',
        'frontend_integration_test.py',
        'frontend_backend_integration_test.py',
        'final_monthly_budget_verification.py',
        'comprehensive_qa_report.md',
        'simple_frontend_qa_test_results.json',
        'qa_test_results.json',
        
        # Debug files
        'debug_*.py',
        'fix_*.py',
        'fix_*.js',
        'check_*.py',
        'inspect_*.py',
        'cleanup_*.py',
        'verify_*.py',
        'grid_debug.js',
        'test_grid_*.js',
        'test_grid_*.py',
        
        # Documentation files (keep only essential ones)
        'DEBT_PLANNING_*.md',
        'MONTHLYBUDGET_*.md',
        'FRONTEND_*.md',
        'BACKEND_*.md',
        'FINAL_*.md',
        'MANUAL_*.md',
        'database_solution.md',
        'database_analysis.py',
        
        # Temporary files
        '*.tmp',
        '*.log',
        '*.bak',
        '*.old',
        
        # This cleanup script itself (will be deleted at the end)
        'cleanup_project.py'
    ]
    
    print("🧹 Starting Project Cleanup...")
    print("=" * 50)
    
    deleted_count = 0
    kept_count = 0
    
    # Get all files in current directory
    for filename in os.listdir('.'):
        file_path = os.path.join('.', filename)
        
        # Skip directories for now
        if os.path.isdir(file_path):
            if filename in essential_files:
                print(f"✅ Keeping directory: {filename}/")
                kept_count += 1
            else:
                print(f"⚠️  Directory not in essential list: {filename}/ (keeping for safety)")
                kept_count += 1
            continue
        
        # Check if file should be kept
        should_keep = False
        for essential in essential_files:
            if filename == essential or filename.startswith(essential):
                should_keep = True
                break
        
        # Check if file should be deleted
        should_delete = False
        for pattern in files_to_delete:
            if filename.endswith(pattern.replace('*', '')) or filename.startswith(pattern.replace('*', '')) or pattern.replace('*', '') in filename:
                should_delete = True
                break
        
        if should_keep:
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
    
    print("\n" + "=" * 50)
    print(f"🎉 Cleanup Complete!")
    print(f"📊 Summary:")
    print(f"   ✅ Kept: {kept_count} files/directories")
    print(f"   🗑️  Deleted: {deleted_count} files")
    print(f"\n📁 Essential Project Structure:")
    print(f"   📂 backend/ - Django backend with MongoDB")
    print(f"   📂 frontend/ - React frontend")
    print(f"   📂 config/ - Configuration files")
    print(f"   📄 README.md - Project documentation")
    print(f"   📄 requirements.txt - Python dependencies")
    print(f"   📄 setup.sh - Setup script")
    print(f"   📄 migration_plan.md - Migration documentation")
    print(f"\n✨ Project is now clean and ready for production!")

if __name__ == "__main__":
    cleanup_project() 