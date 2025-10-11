"""
Dynamics 365 Authentication Module
Handles OAuth 2.0 authentication using Microsoft Authentication Library (MSAL)
"""

import os
import msal
from typing import Optional


class DynamicsAuthenticator:
    """Authenticates to Dynamics 365 using OAuth 2.0 Client Credentials Flow"""
    
    def __init__(self):
        self.tenant_id = os.environ.get('DYNAMICS_TENANT_ID')
        self.client_id = os.environ.get('DYNAMICS_CLIENT_ID')
        self.client_secret = os.environ.get('DYNAMICS_CLIENT_SECRET')
        self.instance_url = os.environ.get('DYNAMICS_INSTANCE_URL')
        
        if not all([self.tenant_id, self.client_id, self.client_secret, self.instance_url]):
            raise ValueError("Missing required Dynamics 365 credentials in environment variables")
        
        # Remove trailing slash from instance URL if present
        if self.instance_url:
            self.instance_url = self.instance_url.rstrip('/')
        
        # Authority URL for token acquisition
        self.authority = f"https://login.microsoftonline.com/{self.tenant_id}"
        
        # Scope for Dynamics 365 / Dataverse
        self.scope = [f"{self.instance_url}/.default"]
        
        # Create MSAL confidential client application
        self.app = msal.ConfidentialClientApplication(
            client_id=self.client_id,
            client_credential=self.client_secret,
            authority=self.authority
        )
    
    def get_access_token(self) -> Optional[str]:
        """
        Acquire an access token for Dynamics 365 API calls
        
        Returns:
            Access token string if successful, None otherwise
        """
        try:
            # Try to get token from cache first
            result = self.app.acquire_token_silent(self.scope, account=None)
            
            # If no cached token, acquire a new one
            if not result:
                result = self.app.acquire_token_for_client(scopes=self.scope)
            
            if result and "access_token" in result:
                return result["access_token"]
            elif result:
                error = result.get("error")
                error_description = result.get("error_description")
                print(f"Authentication failed: {error}")
                print(f"Description: {error_description}")
                return None
            else:
                print("Failed to acquire token: no result returned")
                return None
                
        except Exception as e:
            print(f"Error acquiring token: {str(e)}")
            return None
    
    def get_api_base_url(self) -> str:
        """Returns the base URL for Dataverse Web API"""
        return f"{self.instance_url}/api/data/v9.2"
    
    def get_auth_headers(self) -> dict:
        """
        Get HTTP headers required for Dataverse API calls
        
        Returns:
            Dictionary of headers including Authorization and OData headers
        """
        token = self.get_access_token()
        if not token:
            raise Exception("Failed to acquire access token")
        
        return {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            "Content-Type": "application/json"
        }
