#!/usr/bin/env python3
"""
Optimized script to inspect only MILLENNIUM ROOFING custom entities
Filters by publisher prefix to get only user-created tables
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dynamics365_integration.schema_inspector import SchemaInspector


def main():
    """Run the schema inspection for custom entities only"""
    try:
        inspector = SchemaInspector()
        
        print("=" * 70)
        print("MILLENNIUM ROOFING - Custom Entities Schema Inspection")
        print("=" * 70)
        print(f"\nConnecting to: {inspector.auth.instance_url}")
        
        # Get ALL entities first to identify the publisher prefix
        print("\nStep 1: Identifying custom entity prefixes...")
        all_entities = inspector.get_all_entities(filter_custom=False, custom_only=False)
        
        # Find custom entity prefixes (usually start with publisher prefix like cr6f9_)
        custom_prefixes = set()
        for entity in all_entities:
            logical_name = entity.get('LogicalName', '')
            is_custom = entity.get('IsCustomEntity', False)
            
            if is_custom and '_' in logical_name:
                prefix = logical_name.split('_')[0] + '_'
                if not prefix.startswith(('new_', 'sys', 'adx_', 'msdyn_', 'msfp_', 'mspp_')):
                    custom_prefixes.add(prefix)
        
        print(f"  Found custom prefixes: {', '.join(sorted(custom_prefixes)) if custom_prefixes else 'None'}")
        
        # Filter to only custom entities with user prefixes
        print("\nStep 2: Filtering to user-created custom entities...")
        custom_entities = []
        for entity in all_entities:
            logical_name = entity.get('LogicalName', '')
            is_custom = entity.get('IsCustomEntity', False)
            
            # Include if it has a custom prefix we identified
            if is_custom:
                has_custom_prefix = any(logical_name.startswith(prefix) for prefix in custom_prefixes)
                if has_custom_prefix or not '_' in logical_name:  # Also include custom entities without prefix
                    custom_entities.append(entity)
        
        print(f"  Found {len(custom_entities)} MILLENNIUM ROOFING custom entities")
        
        if len(custom_entities) == 0:
            print("\n⚠ No custom entities found. Showing all IsCustomEntity=true instead...")
            custom_entities = [e for e in all_entities if e.get('IsCustomEntity', False)]
            print(f"  Found {len(custom_entities)} total custom entities")
        
        # Build report for just these entities
        print("\nStep 3: Retrieving detailed metadata...")
        schema_report = {
            'instance_url': inspector.auth.instance_url,
            'custom_prefixes': list(custom_prefixes),
            'total_entities': len(custom_entities),
            'entities': []
        }
        
        for i, entity in enumerate(custom_entities, 1):
            logical_name = entity.get('LogicalName')
            if not logical_name:
                continue
                
            display_name_obj = entity.get('DisplayName')
            if display_name_obj and isinstance(display_name_obj, dict):
                label_obj = display_name_obj.get('UserLocalizedLabel')
                display_name = label_obj.get('Label', logical_name) if label_obj else logical_name
            else:
                display_name = logical_name
            
            print(f"  [{i}/{len(custom_entities)}] {display_name} ({logical_name})")
            
            # Get detailed metadata
            metadata = inspector.get_entity_metadata(logical_name)
            if not metadata:
                continue
            
            # Get relationships
            relationships = inspector.get_entity_relationships(logical_name)
            
            # Get forms
            forms = inspector.get_entity_forms(logical_name)
            
            # Process attributes safely
            attributes = []
            for attr in metadata.get('Attributes', []):
                # Safely extract display name
                attr_display_obj = attr.get('DisplayName')
                if attr_display_obj and isinstance(attr_display_obj, dict):
                    attr_label_obj = attr_display_obj.get('UserLocalizedLabel')
                    attr_display = attr_label_obj.get('Label', '') if attr_label_obj else ''
                else:
                    attr_display = ''
                
                # Safely extract required level
                req_level_obj = attr.get('RequiredLevel')
                required_level = req_level_obj.get('Value') if req_level_obj and isinstance(req_level_obj, dict) else None
                
                attr_info = {
                    'LogicalName': attr.get('LogicalName'),
                    'DisplayName': attr_display,
                    'AttributeType': attr.get('AttributeType'),
                    'RequiredLevel': required_level,
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
                    attr_logical_name = attr.get('LogicalName')
                    if attr_logical_name:
                        options = inspector.get_picklist_options(logical_name, attr_logical_name)
                        attr_info['Options'] = options
                
                attributes.append(attr_info)
            
            # Safely extract description
            desc_obj = metadata.get('Description')
            if desc_obj and isinstance(desc_obj, dict):
                desc_label_obj = desc_obj.get('UserLocalizedLabel')
                description = desc_label_obj.get('Label', '') if desc_label_obj else ''
            else:
                description = ''
            
            entity_data = {
                'LogicalName': logical_name,
                'DisplayName': display_name,
                'Description': description,
                'IsCustom': metadata.get('IsCustomEntity'),
                'SchemaName': metadata.get('SchemaName'),
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
        import json
        output_file = 'millennium_roofing_schema.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(schema_report, f, indent=2, ensure_ascii=False)
        
        print(f"\n{'=' * 70}")
        print("✅ Schema inspection completed successfully!")
        print(f"{'=' * 70}")
        print(f"\nReport saved to: {output_file}")
        print(f"\nSummary:")
        print(f"  - Custom entity prefixes: {', '.join(sorted(custom_prefixes)) if custom_prefixes else 'None'}")
        print(f"  - Total custom entities: {len(custom_entities)}")
        print(f"  - Successfully inspected: {len(schema_report['entities'])}")
        
        print(f"\n{'=' * 70}")
        print("Your Custom Entities:")
        print(f"{'=' * 70}")
        for entity in schema_report['entities']:
            print(f"  • {entity['DisplayName']} ({entity['LogicalName']})")
            print(f"      Fields: {len(entity['Attributes'])}, Forms: {len(entity['Forms'])}, Relationships: {len(entity['Relationships']['OneToMany']) + len(entity['Relationships']['ManyToOne'])}")
        
    except Exception as e:
        print(f"\n❌ Error during schema inspection: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
