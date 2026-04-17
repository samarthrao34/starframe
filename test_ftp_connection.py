import ftplib
import os

FTP_HOST = "147.93.99.197"
FTP_USER = "u582259281.starframeanimationstudios.com"
FTP_PASS = "102719Mvp|"

def test_connection():
    print(f"Connecting to {FTP_HOST}...")
    try:
        ftp = ftplib.FTP(FTP_HOST, timeout=60)
        ftp.login(FTP_USER, FTP_PASS)
        print("Logged in successfully.")
        print(f"Current directory: {ftp.pwd()}")
        print("Listing files in current directory:")
        ftp.retrlines('LIST')
        
        print("\nChecking nodejs directory for .env and other configs...")
        ftp.cwd('/nodejs')
        print(f"Current directory: {ftp.pwd()}")
        print("Listing files in nodejs directory:")
        ftp.retrlines('LIST -a')
        
        ftp.quit()
        print("Success!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    test_connection()
