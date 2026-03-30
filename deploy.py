#!/usr/bin/env python3
"""
Hostinger FTP Deployment Script
Syncs repository files to Hostinger FTP server
"""

import ftplib
import os
import sys
from pathlib import Path

# Configuration
FTP_HOST = '147.93.99.197'
FTP_USER = os.environ.get('FTP_USER', '')
FTP_PASS = os.environ.get('FTP_PASS', '')
LOCAL_DIR = '.'

# Patterns to exclude from upload
EXCLUDE_DIRS = {
    '.git', '.github', 'node_modules', '.vscode',
    'server', 'api', 'scripts', 'logs', 'data',
    '__pycache__', '.pytest_cache'
}
EXCLUDE_FILES = {
    '.env', '.env.local', '.env.example',
    'test_ftp.py', 'package-lock.json'
}
EXCLUDE_EXTENSIONS = {'.md', '.pyc'}


def should_skip(path):
    """Check if a path should be skipped"""
    p = Path(path)
    
    # Check file extensions
    if p.suffix in EXCLUDE_EXTENSIONS:
        return True
    
    # Check file name
    if p.name in EXCLUDE_FILES:
        return True
    
    # Check path parts
    for part in p.parts:
        if part in EXCLUDE_DIRS or part.startswith('.'):
            return True
    
    return False


def deploy():
    """Deploy files to Hostinger FTP"""
    
    if not FTP_USER or not FTP_PASS:
        print("✗ Error: FTP_USER or FTP_PASS not set")
        return False
    
    try:
        print(f"Connecting to {FTP_HOST}...")
        ftp = ftplib.FTP(FTP_HOST, timeout=30)
        ftp.login(FTP_USER, FTP_PASS)
        print(f"✓ Logged in as {FTP_USER}")
        
        # Collect files to upload
        files_to_upload = []
        
        for root, dirs, files in os.walk(LOCAL_DIR):
            # Filter directories
            dirs[:] = [d for d in dirs if not should_skip(d)]
            
            # Process files
            for file in files:
                rel_path = os.path.relpath(os.path.join(root, file), LOCAL_DIR)
                
                if not should_skip(rel_path):
                    files_to_upload.append(rel_path)
        
        print(f"Found {len(files_to_upload)} files to upload\n")
        
        # Upload files
        uploaded = 0
        failed = 0
        
        for rel_path in sorted(files_to_upload):
            local_path = os.path.join(LOCAL_DIR, rel_path)
            remote_path = rel_path.replace('\\', '/')
            remote_dir = '/'.join(remote_path.split('/')[:-1])
            
            try:
                # Create remote directory if needed
                if remote_dir:
                    try:
                        ftp.mkd(remote_dir)
                    except ftplib.error_perm:
                        pass  # Directory already exists
                
                # Upload file
                with open(local_path, 'rb') as f:
                    ftp.storbinary(f'STOR {remote_path}', f)
                
                print(f"✓ {remote_path}")
                uploaded += 1
                
            except Exception as e:
                print(f"✗ {remote_path}: {e}")
                failed += 1
        
        ftp.quit()
        
        print(f"\n✓ Deployment complete")
        print(f"  Uploaded: {uploaded}")
        print(f"  Failed: {failed}")
        
        return failed == 0
        
    except ftplib.all_errors as e:
        print(f"✗ FTP Error: {e}")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = deploy()
    sys.exit(0 if success else 1)
