import os
import requests
import base64

GITHUB_TOKEN = os.environ['GITHUB_TOKEN']
REPO_OWNER = 'DaleTiley'
REPO_NAME = 'timberflow'
BRANCH = 'main'

headers = {
    'Authorization': f'token {GITHUB_TOKEN}',
    'Accept': 'application/vnd.github.v3+json'
}

def upload_file(file_path, github_path):
    try:
        # Check if file exists
        check_url = f'https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/contents/{github_path}'
        check_response = requests.get(check_url, headers=headers)
        
        with open(file_path, 'rb') as f:
            content = base64.b64encode(f.read()).decode('utf-8')
        
        data = {
            'message': f'Charter Update: {github_path}',
            'content': content,
            'branch': BRANCH
        }
        
        # If file exists, include SHA for update
        if check_response.status_code == 200:
            data['sha'] = check_response.json()['sha']
        
        response = requests.put(check_url, headers=headers, json=data)
        
        if response.status_code in [200, 201]:
            print(f'✅ {github_path}')
            return True
        else:
            print(f'❌ {github_path}: {response.status_code}')
            return False
    except Exception as e:
        print(f'❌ {file_path}: {str(e)}')
        return False

# Upload charter-compliant files
charter_files = [
    'src/platform/components/ModularApp.jsx',
    'src/platform/components/TabbedForm.jsx', 
    'src/platform/loader.js',
    'app.js',
    'index.html',
    'replit.md'
]

uploaded = 0
for file_path in charter_files:
    if os.path.exists(file_path):
        github_path = file_path
        if upload_file(file_path, github_path):
            uploaded += 1

print(f'\n📊 Charter Update: {uploaded}/{len(charter_files)} files uploaded')
