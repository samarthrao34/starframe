import ftplib
import os

FTP_HOST = "147.93.99.197"
FTP_USER = "u582259281.starframeanimationstudios.com"
FTP_PASS = "102719Mvp|"

files_to_upload = [
    "css/style-new.css",
    "js/script-new.js",
    "js/sparkle-star.js",
    "js/sparkle-effects.js",
    "index.html",
    "commission.html",
    "shop.html",
    "pay.html",
    "login.html",
    "dashboard.html",
    "track-commission.html",
    "terms-of-service.html",
    "refund-policy.html",
    "purchases.html",
    "privacy-policy.html",
    "pricing-guide.html",
    "buyer-guide.html",
    "accessibility.html",
    "logo.png"
]

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

def fast_deploy():
    print(f"Connecting to {FTP_HOST}...")
    try:
        ftp = ftplib.FTP(FTP_HOST, timeout=60)
        ftp.login(FTP_USER, FTP_PASS)
        print("Logged in successfully.")
        
        for file_path in files_to_upload:
            if not os.path.exists(file_path):
                print(f"Missing local file: {file_path}")
                continue
                
            remote_path = file_path.replace('\\', '/')
            remote_dir = '/'.join(remote_path.split('/')[:-1])
            
            if remote_dir:
                ensure_dir(ftp, remote_dir)
                
            print(f"Uploading {file_path}...")
            with open(file_path, 'rb') as f:
                ftp.storbinary(f'STOR {remote_path}', f)
                
        ftp.quit()
        print("Done pushing target updates!")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    fast_deploy()
