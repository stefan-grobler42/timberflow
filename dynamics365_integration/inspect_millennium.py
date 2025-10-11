#!/usr/bin/env python3
"""
Millennium Roofing Schema Inspector
Only inspects entities with the cr694_ prefix (your custom entities)
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dynamics365_integration.schema_inspector import SchemaInspector
import json


def main():
    """Run the schema inspection for Millennium Roofing custom entities only"""
    try:
        inspector = SchemaInspector()
        
        print("=" * 70)
        print("MILLENNIUM ROOFING - Custom Entities Schema Inspection")
        print("=" * 70)
        print(f"\nConnecting to: {inspector.auth.instance_url}")
        
        # Get all custom entities
        print("\nRetrieving all custom entities...")
        all_entities = inspector.get_all_entities(filter_custom=False, custom_only=True)
        print(f"  Found {len(all_entities)} total custom entities")
        
        # Filter to only cr694_ prefix (Millennium Roofing custom entities)
        millennium_prefix = 'cr694_'
        millennium_entities = [
            e for e in all_entities 
            if e.get('LogicalName', '').startswith(millennium_prefix)
        ]
        
        print(f"\nFiltering to {millennium_prefix} prefix...")
        print(f"  Found {len(millennium_entities)} MILLENNIUM ROOFING custom entities")
        
        if len(millennium_entities) == 0:
            print("\n⚠ No entities found with cr694_ prefix")
            print("Showing first 20 custom entity prefixes found:")
            prefixes = {}
            for e in all_entities[:100]:
                name = e.get('LogicalName', '')
                if '_' in name:
                    prefix = name.split('_')[0] + '_'
                    prefixes[prefix] = prefixes.get(prefix, 0) + 1
            for prefix, count in sorted(prefixes.items(), key=lambda x: x[1], reverse=True)[:20]:
                print(f"    {prefix}: {count} entities")
            return
        
        # Build report
        print("\nRetrieving detailed metadata for each entity...")
        schema_report = {
            'instance_url': inspector.auth.instance_url,
            'publisher_prefix': millennium_prefix,
            'total_entities': len(millennium_entities),
            'entities': []
        }
        
        for i, entity in enumerate(millennium_entities, 1):
            logical_name = entity.get('LogicalName')
            if not logical_name:
                continue
            
            # Extract display name
            display_name_obj = entity.get('DisplayName')
            if display_name_obj and isinstance(display_name_obj, dict):
                label_obj = display_name_obj.get('UserLocalizedLabel')
                display_name = label_obj.get('Label', logical_name) if label_obj else logical_name
            else:
                display_name = logical_name
            
            print(f"  [{i}/{len(millennium_entities)}] {display_name} ({logical_name})")
            
            # Get detailed metadata
            metadata = inspector.get_entity_metadata(logical_name)
            if not metadata:
                print(f"      ⚠ Could not retrieve metadata")
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
            print(f"      ✓ Fields: {len(attributes)}, Forms: {len(forms)}, Relationships: {len(relationships['OneToMany']) + len(relationships['ManyToOne'])}")
        
        # Save to file
        output_file = 'millennium_roofing_schema.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(schema_report, f, indent=2, ensure_ascii=False)
        
        print(f"\n{'=' * 70}")
        print("✅ Schema inspection completed successfully!")
        print(f"{'=' * 70}")
        print(f"\nReport saved to: {output_file}")
        print(f"\nSummary:")
        print(f"  - Publisher prefix: {millennium_prefix}")
        print(f"  - Total entities: {len(millennium_entities)}")
        print(f"  - Successfully inspected: {len(schema_report['entities'])}")
        
        print(f"\n{'=' * 70}")
        print("Your Custom Entities:")
        print(f"{'=' * 70}")
        for entity in schema_report['entities']:
            print(f"\n  • {entity['DisplayName']}")
            print(f"      Logical Name: {entity['LogicalName']}")
            print(f"      Fields: {len(entity['Attributes'])}")
            print(f"      Forms: {len(entity['Forms'])}")
            print(f"      Relationships: {len(entity['Relationships']['OneToMany']) + len(entity['Relationships']['ManyToOne']) + len(entity['Relationships']['ManyToMany'])}")
            if entity['Description']:
                print(f"      Description: {entity['Description']}")
        
    except Exception as e:
        print(f"\n❌ Error during schema inspection: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
