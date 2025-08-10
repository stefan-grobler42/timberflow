import os
import requests
import base64
import json
from pathlib import Path

# GitHub settings
GITHUB_TOKEN = os.environ['GITHUB_TOKEN']
REPO_OWNER = 'DaleTiley'
REPO_NAME = 'timberflow'
BRANCH = 'main'

headers = {
    'Authorization': f'token {GITHUB_TOKEN}',
    'Accept': 'application/vnd.github.v3+json'
}

def upload_file(file_path, github_path):
    """Upload a single file to GitHub"""
    try:
        with open(file_path, 'rb') as f:
            content = base64.b64encode(f.read()).decode('utf-8')
        
        data = {
            'message': f'Add {github_path}',
            'content': content,
            'branch': BRANCH
        }
        
        url = f'https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/contents/{github_path}'
        response = requests.put(url, headers=headers, json=data)
        
        if response.status_code in [200, 201]:
            print(f'✅ Uploaded: {github_path}')
            return True
        else:
            print(f'❌ Failed to upload {github_path}: {response.status_code} - {response.text}')
            return False
    except Exception as e:
        print(f'❌ Error uploading {file_path}: {str(e)}')
        return False

def should_skip_file(file_path):
    """Check if file should be skipped"""
    skip_patterns = [
        '.git/', 'node_modules/', '.env', '.replit', '.config/',
        '.upm/', 'replit.nix', '__pycache__/', '.pyc', 'uv.lock'
    ]
    
    for pattern in skip_patterns:
        if pattern in str(file_path):
            return True
    return False

def main():
    """Upload all project files to GitHub"""
    base_path = Path('.')
    uploaded_files = []
    failed_files = []
    
    # Get all files
    for file_path in base_path.rglob('*'):
        if file_path.is_file() and not should_skip_file(file_path):
            # Convert to relative path for GitHub
            github_path = str(file_path.relative_to(base_path)).replace('\\', '/')
            
            if upload_file(file_path, github_path):
                uploaded_files.append(github_path)
            else:
                failed_files.append(github_path)
    
    print(f'\n📊 Upload Summary:')
    print(f'✅ Successfully uploaded: {len(uploaded_files)} files')
    print(f'❌ Failed uploads: {len(failed_files)} files')
    
    if failed_files:
        print(f'\nFailed files:')
        for file in failed_files[:10]:  # Show first 10 failures
            print(f'  - {file}')

if __name__ == '__main__':
    main()
