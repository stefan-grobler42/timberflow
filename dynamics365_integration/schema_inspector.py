"""
Dynamics 365 Schema Inspector
Retrieves table definitions, field metadata, forms, and relationships from Dataverse
"""

import requests
import json
from typing import List, Dict, Any, Optional

try:
    from .auth import DynamicsAuthenticator
except ImportError:
    from auth import DynamicsAuthenticator


class SchemaInspector:
    """Inspects and retrieves schema information from Dynamics 365 Dataverse"""
    
    def __init__(self):
        self.auth = DynamicsAuthenticator()
        self.base_url = self.auth.get_api_base_url()
    
    def get_all_entities(self, filter_custom: bool = True) -> List[Dict[str, Any]]:
        """
        Retrieve all entity definitions (tables) from Dataverse
        
        Args:
            filter_custom: If True, only return custom entities (those not starting with standard prefixes)
        
        Returns:
            List of entity definitions
        """
        url = f"{self.base_url}/EntityDefinitions"
        params = {
            "$select": "LogicalName,DisplayName,Description,IsCustomEntity,PrimaryIdAttribute,PrimaryNameAttribute",
            "$filter": "IsValidForAdvancedFind eq true"
        }
        
        try:
            headers = self.auth.get_auth_headers()
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            entities = response.json().get('value', [])
            
            if filter_custom:
                # Filter to show custom entities and commonly used standard ones
                standard_sales_entities = [
                    'account', 'contact', 'lead', 'opportunity', 
                    'quote', 'salesorder', 'product', 'invoice'
                ]
                entities = [
                    e for e in entities 
                    if e.get('IsCustomEntity') or e.get('LogicalName') in standard_sales_entities
                ]
            
            return entities
            
        except Exception as e:
            print(f"Error retrieving entities: {str(e)}")
            return []
    
    def get_entity_metadata(self, entity_logical_name: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed metadata for a specific entity including all attributes
        
        Args:
            entity_logical_name: The logical name of the entity (e.g., 'account')
        
        Returns:
            Entity metadata with attributes
        """
        url = f"{self.base_url}/EntityDefinitions(LogicalName='{entity_logical_name}')"
        params = {
            "$expand": "Attributes($select=LogicalName,DisplayName,AttributeType,RequiredLevel,IsPrimaryId,IsPrimaryName,MaxLength,Precision,MinValue,MaxValue)",
            "$select": "LogicalName,DisplayName,Description,IsCustomEntity,PrimaryIdAttribute,PrimaryNameAttribute"
        }
        
        try:
            headers = self.auth.get_auth_headers()
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            print(f"Error retrieving metadata for {entity_logical_name}: {str(e)}")
            return None
    
    def get_picklist_options(self, entity_logical_name: str, attribute_name: str) -> List[Dict[str, Any]]:
        """
        Get picklist/choice options for a specific attribute
        
        Args:
            entity_logical_name: The entity logical name
            attribute_name: The attribute logical name
        
        Returns:
            List of picklist options
        """
        url = f"{self.base_url}/EntityDefinitions(LogicalName='{entity_logical_name}')/Attributes(LogicalName='{attribute_name}')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata"
        params = {
            "$select": "LogicalName",
            "$expand": "OptionSet($select=Options)"
        }
        
        try:
            headers = self.auth.get_auth_headers()
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            data = response.json()
            options = data.get('OptionSet', {}).get('Options', [])
            
            return [
                {
                    'Value': opt.get('Value'),
                    'Label': opt.get('Label', {}).get('UserLocalizedLabel', {}).get('Label', '')
                }
                for opt in options
            ]
            
        except Exception as e:
            print(f"Error retrieving picklist options for {entity_logical_name}.{attribute_name}: {str(e)}")
            return []
    
    def get_entity_relationships(self, entity_logical_name: str) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get relationships (1:N, N:1, N:N) for an entity
        
        Args:
            entity_logical_name: The entity logical name
        
        Returns:
            Dictionary with OneToManyRelationships, ManyToOneRelationships, and ManyToManyRelationships
        """
        url = f"{self.base_url}/EntityDefinitions(LogicalName='{entity_logical_name}')"
        params = {
            "$expand": "OneToManyRelationships($select=SchemaName,ReferencedEntity,ReferencingEntity,ReferencingAttribute),ManyToOneRelationships($select=SchemaName,ReferencedEntity,ReferencingEntity,ReferencingAttribute),ManyToManyRelationships($select=SchemaName,Entity1LogicalName,Entity2LogicalName)",
            "$select": "LogicalName"
        }
        
        try:
            headers = self.auth.get_auth_headers()
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            data = response.json()
            return {
                'OneToMany': data.get('OneToManyRelationships', []),
                'ManyToOne': data.get('ManyToOneRelationships', []),
                'ManyToMany': data.get('ManyToManyRelationships', [])
            }
            
        except Exception as e:
            print(f"Error retrieving relationships for {entity_logical_name}: {str(e)}")
            return {'OneToMany': [], 'ManyToOne': [], 'ManyToMany': []}
    
    def get_entity_forms(self, entity_logical_name: str) -> List[Dict[str, Any]]:
        """
        Get all forms for an entity
        
        Args:
            entity_logical_name: The entity logical name
        
        Returns:
            List of form definitions
        """
        url = f"{self.base_url}/systemforms"
        params = {
            "$filter": f"objecttypecode eq '{entity_logical_name}' and type eq 2 and formactivationstate eq 1",
            "$select": "formid,name,description,formxml,type",
            "$orderby": "name"
        }
        
        try:
            headers = self.auth.get_auth_headers()
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            return response.json().get('value', [])
            
        except Exception as e:
            print(f"Error retrieving forms for {entity_logical_name}: {str(e)}")
            return []
    
    def generate_schema_report(self, output_file: str = 'dynamics365_schema_report.json'):
        """
        Generate a comprehensive schema report for all entities
        
        Args:
            output_file: Path to save the JSON report
        """
        print("Starting Dynamics 365 schema inspection...")
        print(f"Connecting to: {self.auth.instance_url}")
        
        # Get all entities
        entities = self.get_all_entities()
        print(f"\nFound {len(entities)} entities to inspect")
        
        schema_report = {
            'instance_url': self.auth.instance_url,
            'total_entities': len(entities),
            'entities': []
        }
        
        for i, entity in enumerate(entities, 1):
            logical_name = entity.get('LogicalName')
            if not logical_name:
                continue
                
            display_name = entity.get('DisplayName', {}).get('UserLocalizedLabel', {}).get('Label', logical_name)
            
            print(f"\n[{i}/{len(entities)}] Inspecting: {display_name} ({logical_name})")
            
            # Get detailed metadata
            metadata = self.get_entity_metadata(logical_name)
            if not metadata:
                continue
            
            # Get relationships
            relationships = self.get_entity_relationships(logical_name)
            
            # Get forms
            forms = self.get_entity_forms(logical_name)
            
            # Process attributes
            attributes = []
            for attr in metadata.get('Attributes', []):
                attr_info = {
                    'LogicalName': attr.get('LogicalName'),
                    'DisplayName': attr.get('DisplayName', {}).get('UserLocalizedLabel', {}).get('Label', ''),
                    'AttributeType': attr.get('AttributeType'),
                    'RequiredLevel': attr.get('RequiredLevel', {}).get('Value'),
                    'IsPrimaryId': attr.get('IsPrimaryId'),
                    'IsPrimaryName': attr.get('IsPrimaryName')
                }
                
                # Add type-specific properties
                if attr.get('AttributeType') == 'String':
                    attr_info['MaxLength'] = attr.get('MaxLength')
                elif attr.get('AttributeType') in ['Decimal', 'Double', 'Money']:
                    attr_info['Precision'] = attr.get('Precision')
                    attr_info['MinValue'] = attr.get('MinValue')
                    attr_info['MaxValue'] = attr.get('MaxValue')
                elif attr.get('AttributeType') == 'Picklist':
                    # Get picklist options
                    attr_logical_name = attr.get('LogicalName')
                    if attr_logical_name:
                        options = self.get_picklist_options(logical_name, attr_logical_name)
                        attr_info['Options'] = options
                
                attributes.append(attr_info)
            
            entity_data = {
                'LogicalName': logical_name,
                'DisplayName': display_name,
                'Description': metadata.get('Description', {}).get('UserLocalizedLabel', {}).get('Label', ''),
                'IsCustom': metadata.get('IsCustomEntity'),
                'PrimaryIdAttribute': metadata.get('PrimaryIdAttribute'),
                'PrimaryNameAttribute': metadata.get('PrimaryNameAttribute'),
                'Attributes': attributes,
                'Relationships': relationships,
                'Forms': [
                    {
                        'FormId': f.get('formid'),
                        'Name': f.get('name'),
                        'Description': f.get('description'),
                        'Type': f.get('type')
                    }
                    for f in forms
                ]
            }
            
            schema_report['entities'].append(entity_data)
        
        # Save to file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(schema_report, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Schema report saved to: {output_file}")
        print(f"\nSummary:")
        print(f"  - Total entities: {len(entities)}")
        print(f"  - Custom entities: {sum(1 for e in schema_report['entities'] if e['IsCustom'])}")
        print(f"  - Standard entities: {sum(1 for e in schema_report['entities'] if not e['IsCustom'])}")
        
        return schema_report
