"""
Dynamics 365 Integration Package
"""

from .auth import DynamicsAuthenticator
from .schema_inspector import SchemaInspector

__all__ = ['DynamicsAuthenticator', 'SchemaInspector']
