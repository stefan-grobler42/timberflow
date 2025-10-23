#!/usr/bin/env node
import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';

let connectionSettings;

async function getAccessToken() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('GitHub authentication not available');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function pushToGitHub() {
  try {
    console.log('🔐 Getting GitHub authentication...');
    const token = await getAccessToken();
    const octokit = new Octokit({ auth: token });
    const { data: user } = await octokit.users.getAuthenticated();
    
    console.log(`✅ Authenticated as: ${user.login}`);
    console.log('📤 Pushing to GitHub...\n');
    
    const authenticatedUrl = `https://${user.login}:${token}@github.com/DaleTiley/millennium-timber-erp.git`;
    
    // Update origin with authenticated URL
    try {
      execSync(`git remote set-url origin "${authenticatedUrl}"`, { stdio: 'inherit' });
    } catch (e) {
      // If remote doesn't exist, add it
      execSync(`git remote add origin "${authenticatedUrl}"`, { stdio: 'inherit' });
    }
    
    // Configure user
    execSync('git config user.name "DaleTiley"', { stdio: 'inherit' });
    execSync('git config user.email "dale@millenniumtimber.co.za"', { stdio: 'inherit' });
    
    // Stage all files
    execSync('git add -A', { stdio: 'inherit' });
    
    // Commit
    try {
      execSync('git commit -m "Initial commit: Millennium Timber Roof ERP with standardized forms and D365 migration"', { stdio: 'inherit' });
    } catch (e) {
      console.log('No new changes to commit');
    }
    
    // Push
    execSync('git push -u origin main', { stdio: 'inherit' });
    
    // Clean up - remove token from URL
    execSync('git remote set-url origin https://github.com/DaleTiley/millennium-timber-erp.git', { stdio: 'ignore' });
    
    console.log('\n✅ Successfully pushed to GitHub!');
    console.log('🔗 https://github.com/DaleTiley/millennium-timber-erp');
    
  } catch (error) {
    if (error.message.includes('main')) {
      console.log('Trying with master branch...');
      try {
        execSync('git push -u origin master', { stdio: 'inherit' });
        execSync('git remote set-url origin https://github.com/DaleTiley/millennium-timber-erp.git', { stdio: 'ignore' });
        console.log('\n✅ Successfully pushed to GitHub!');
        console.log('🔗 https://github.com/DaleTiley/millennium-timber-erp');
      } catch (e) {
        console.error('❌ Failed to push:', e.message);
      }
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

pushToGitHub();
