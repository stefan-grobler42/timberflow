import os
import requests
import base64
import json

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
            print(f'✅ {github_path}')
            return True
        else:
            print(f'❌ {github_path}: {response.status_code}')
            return False
    except Exception as e:
        print(f'❌ {file_path}: {str(e)}')
        return False

# Upload essential source directories
essential_dirs = [
    'src/',
    'components/',
    'server/',
    'shared/',
    'archive/',
    'api/',
    'utils/',
    'system/'
]

uploaded = 0
for root, dirs, files in os.walk('.'):
    # Skip hidden directories and node_modules
    dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']
    
    for file in files:
        if file.startswith('.'):
            continue
            
        file_path = os.path.join(root, file)
        github_path = file_path.replace('\\', '/').lstrip('./')
        
        # Only upload files in essential directories or root level
        if any(github_path.startswith(d) for d in essential_dirs) or '/' not in github_path:
            if upload_file(file_path, github_path):
                uploaded += 1
            if uploaded >= 100:  # Limit to avoid timeouts
                break
    if uploaded >= 100:
        break

print(f'\n📊 Uploaded {uploaded} essential files')
