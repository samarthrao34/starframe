import ftplib
import os
import sys
from pathlib import Path

# Configuration
FTP_HOST = "147.93.99.197"
FTP_USER = "u582259281.starframeanimationstudios.com"
FTP_PASS = "102719Mvp|"

# Patterns to exclude from upload
EXCLUDE_DIRS = {
    '.git', '.github', 'node_modules', '.vscode',
    'logs', 'data', '__pycache__', '.pytest_cache', '.agent'
}
EXCLUDE_FILES = {
    '.env.local', 'test_ftp_connection.py', 'deploy_full.py', 
    'remote_htaccess.txt', 'temp_diff_css.patch', 'temp_diff.patch'
}

def should_skip(path):
    p = Path(path)
    for part in p.parts:
        if part in EXCLUDE_DIRS or part.startswith('.'):
            if part == '.htaccess': continue # Don't skip .htaccess if it's explicitly needed
            return True
    if p.name in EXCLUDE_FILES:
        return True
    return False

def ensure_dir(ftp, dir_path):
    parts = dir_path.replace('\\', '/').split('/')
    current = ''
    for p in parts:
        if not p: continue
        current = f"{current}/{p}" if current else p
        try:
            ftp.mkd(current)
        except ftplib.error_perm:
            pass

def upload_file(ftp, local_path, remote_path):
    remote_dir = '/'.join(remote_path.split('/')[:-1])
    if remote_dir:
        ensure_dir(ftp, remote_dir)
    
    # Check if it's a file
    if os.path.isfile(local_path):
        print(f"Uploading {local_path} -> {remote_path}...")
        with open(local_path, 'rb') as f:
            ftp.storbinary(f'STOR {remote_path}', f)

def deploy():
    print(f"Connecting to {FTP_HOST}...")
    try:
        ftp = ftplib.FTP(FTP_HOST, timeout=120)
        ftp.login(FTP_USER, FTP_PASS)
        print("Logged in successfully.")

        # 1. Deploy Static Files to /public_html
        print("\n--- Deploying Static Files to /public_html ---")
        static_files = [
            "index.html", "commission.html", "shop.html", "pay.html", "login.html",
            "dashboard.html", "track-commission.html", "terms-of-service.html",
            "refund-policy.html", "purchases.html", "privacy-policy.html",
            "pricing-guide.html", "buyer-guide.html", "accessibility.html",
            "logo.png", "qrcode.png"
        ]
        static_dirs = ["css", "js", "admin", "assets", "images", "pages"]

        for f in static_files:
            if os.path.exists(f):
                upload_file(ftp, f, f"public_html/{f}")

        for d in static_dirs:
            for root, dirs, files in os.walk(d):
                for file in files:
                    rel_path = os.path.relpath(os.path.join(root, file), ".").replace("\\", "/")
                    if not should_skip(rel_path):
                        upload_file(ftp, rel_path, f"public_html/{rel_path}")

        # 2. Deploy Backend Files to /nodejs
        print("\n--- Deploying Backend Files to /nodejs ---")
        backend_dirs = ["server", "api", "middleware", "models", "routes", "utils"] # Some of these are inside server/
        # Just walk everything and upload to /nodejs if not skipped
        for root, dirs, files in os.walk("."):
            # Filter dirs in place
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith('.')]
            
            for file in files:
                rel_path = os.path.relpath(os.path.join(root, file), ".").replace("\\", "/")
                if not should_skip(rel_path):
                    upload_file(ftp, rel_path, f"nodejs/{rel_path}")

        ftp.quit()
        print("\nDeployment complete!")
        print("Note: If the backend changes don't reflect, please restart the Node.js application in your Hostinger Panel.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    deploy()
