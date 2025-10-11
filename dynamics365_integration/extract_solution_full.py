#!/usr/bin/env python3
"""
Complete ExtractSpec Solution Inspector
Extracts full metadata for ALL entities in the solution
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dynamics365_integration.schema_inspector import SchemaInspector
import json


def main():
    """Extract complete metadata for all entities in ExtractSpec solution"""
    
    # First, load the solution components
    with open('ExtractSpec_components.json', 'r') as f:
        solution_data = json.load(f)
    
    print("=" * 70)
    print("EXTRACTSPEC SOLUTION - COMPLETE METADATA EXTRACTION")
    print("=" * 70)
    print(f"\nSolution: {solution_data['solution']['friendlyname']}")
    print(f"Version: {solution_data['solution']['version']}")
    print(f"Total Entities: {len(solution_data['entities'])}")
    
    # Separate Millennium entities from standard entities
    millennium_entities = [e for e in solution_data['entities'] if e['LogicalName'].startswith('cr694_')]
    standard_entities = [e for e in solution_data['entities'] if not e['LogicalName'].startswith('cr694_')]
    
    print(f"\n  • Millennium Roofing Custom: {len(millennium_entities)}")
    print(f"  • Dynamics 365 Standard: {len(standard_entities)}")
    
    # Initialize schema inspector
    inspector = SchemaInspector()
    
    # Build comprehensive report
    full_report = {
        'solution': solution_data['solution'],
        'component_summary': solution_data['component_summary'],
        'millennium_entities': [],
        'standard_entities': []
    }
    
    # Extract full metadata for Millennium entities
    print(f"\n{'=' * 70}")
    print("EXTRACTING MILLENNIUM ROOFING ENTITIES (Priority)")
    print(f"{'=' * 70}\n")
    
    for i, entity_info in enumerate(millennium_entities, 1):
        logical_name = entity_info['LogicalName']
        print(f"[{i}/{len(millennium_entities)}] {entity_info['DisplayName']} ({logical_name})")
        
        # Get detailed metadata
        metadata = inspector.get_entity_metadata(logical_name)
        if not metadata:
            print(f"    ⚠ Could not retrieve metadata")
            continue
        
        # Get relationships
        relationships = inspector.get_entity_relationships(logical_name)
        
        # Get forms
        forms = inspector.get_entity_forms(logical_name)
        
        # Process attributes
        attributes = []
        for attr in metadata.get('Attributes', []):
            attr_display_obj = attr.get('DisplayName')
            if attr_display_obj and isinstance(attr_display_obj, dict):
                attr_label_obj = attr_display_obj.get('UserLocalizedLabel')
                attr_display = attr_label_obj.get('Label', '') if attr_label_obj else ''
            else:
                attr_display = ''
            
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
            
            if attr.get('AttributeType') == 'String':
                attr_info['MaxLength'] = attr.get('MaxLength')
            elif attr.get('AttributeType') in ['Decimal', 'Double', 'Money']:
                attr_info['Precision'] = attr.get('Precision')
                attr_info['MinValue'] = attr.get('MinValue')
                attr_info['MaxValue'] = attr.get('MaxValue')
            elif attr.get('AttributeType') == 'Picklist':
                options = inspector.get_picklist_options(logical_name, attr.get('LogicalName'))
                attr_info['Options'] = options
            
            attributes.append(attr_info)
        
        desc_obj = metadata.get('Description')
        if desc_obj and isinstance(desc_obj, dict):
            desc_label_obj = desc_obj.get('UserLocalizedLabel')
            description = desc_label_obj.get('Label', '') if desc_label_obj else ''
        else:
            description = ''
        
        entity_data = {
            'LogicalName': logical_name,
            'DisplayName': entity_info['DisplayName'],
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
        
        full_report['millennium_entities'].append(entity_data)
        print(f"    ✓ Fields: {len(attributes)}, Forms: {len(forms)}, Relationships: {len(relationships['OneToMany']) + len(relationships['ManyToOne'])}")
    
    # Extract metadata for important standard entities
    print(f"\n{'=' * 70}")
    print("EXTRACTING KEY STANDARD ENTITIES")
    print(f"{'=' * 70}\n")
    
    # Focus on key CRM entities
    key_entities = ['account', 'contact', 'lead', 'opportunity', 'quote', 'salesorder', 
                   'invoice', 'product', 'appointment', 'email', 'task', 'phonecall']
    
    key_standard_entities = [e for e in standard_entities if e['LogicalName'] in key_entities]
    
    for i, entity_info in enumerate(key_standard_entities, 1):
        logical_name = entity_info['LogicalName']
        print(f"[{i}/{len(key_standard_entities)}] {entity_info['DisplayName']} ({logical_name})")
        
        metadata = inspector.get_entity_metadata(logical_name)
        if not metadata:
            full_report['standard_entities'].append(entity_info)
            continue
        
        relationships = inspector.get_entity_relationships(logical_name)
        forms = inspector.get_entity_forms(logical_name)
        
        # Get key attributes only (not all)
        key_attrs = [a for a in metadata.get('Attributes', []) 
                    if a.get('IsPrimaryId') or a.get('IsPrimaryName') or 
                    a.get('RequiredLevel', {}).get('Value') == 'ApplicationRequired']
        
        attributes = []
        for attr in key_attrs[:50]:  # Limit to 50 key attributes
            attr_display_obj = attr.get('DisplayName')
            if attr_display_obj and isinstance(attr_display_obj, dict):
                attr_label_obj = attr_display_obj.get('UserLocalizedLabel')
                attr_display = attr_label_obj.get('Label', '') if attr_label_obj else ''
            else:
                attr_display = ''
            
            attributes.append({
                'LogicalName': attr.get('LogicalName'),
                'DisplayName': attr_display,
                'AttributeType': attr.get('AttributeType')
            })
        
        entity_data = {
            'LogicalName': logical_name,
            'DisplayName': entity_info['DisplayName'],
            'SchemaName': entity_info['SchemaName'],
            'KeyAttributes': attributes,
            'RelationshipCount': len(relationships['OneToMany']) + len(relationships['ManyToOne']),
            'FormCount': len(forms)
        }
        
        full_report['standard_entities'].append(entity_data)
        print(f"    ✓ Key Fields: {len(attributes)}, Forms: {len(forms)}")
    
    # Save full report
    output_file = 'ExtractSpec_FULL_METADATA.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(full_report, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'=' * 70}")
    print("✅ COMPLETE EXTRACTION SUCCESSFUL")
    print(f"{'=' * 70}")
    print(f"\nFull metadata saved to: {output_file}")
    
    # Generate summary report
    summary_file = 'ExtractSpec_ANALYSIS.md'
    with open(summary_file, 'w', encoding='utf-8') as f:
        f.write("# ExtractSpec Solution - Complete Analysis\n\n")
        f.write(f"**Solution:** {full_report['solution']['friendlyname']}\n")
        f.write(f"**Version:** {full_report['solution']['version']}\n")
        f.write(f"**Total Components:** {sum(full_report['component_summary'].values())}\n\n")
        
        f.write("## Component Breakdown\n\n")
        for comp_type, count in sorted(full_report['component_summary'].items()):
            f.write(f"- **{comp_type}:** {count}\n")
        
        f.write("\n---\n\n")
        f.write("## Millennium Roofing Custom Entities (11)\n\n")
        
        for entity in full_report['millennium_entities']:
            f.write(f"### {entity['DisplayName']}\n\n")
            f.write(f"- **Logical Name:** `{entity['LogicalName']}`\n")
            f.write(f"- **Schema Name:** `{entity['SchemaName']}`\n")
            f.write(f"- **Primary ID:** `{entity['PrimaryIdAttribute']}`\n")
            f.write(f"- **Primary Name:** `{entity['PrimaryNameAttribute']}`\n")
            if entity['Description']:
                f.write(f"- **Description:** {entity['Description']}\n")
            f.write(f"- **Total Fields:** {len(entity['Attributes'])}\n")
            f.write(f"- **Forms:** {len(entity['Forms'])}\n")
            f.write(f"- **Relationships:** {len(entity['Relationships']['OneToMany']) + len(entity['Relationships']['ManyToOne']) + len(entity['Relationships']['ManyToMany'])}\n\n")
            
            # List key fields
            key_fields = [a for a in entity['Attributes'] 
                         if a.get('IsPrimaryId') or a.get('IsPrimaryName') or 
                         a.get('RequiredLevel') == 'ApplicationRequired' or
                         not a['LogicalName'].startswith(('created', 'modified', 'owner', 'statecode', 'statuscode'))]
            
            if key_fields[:20]:
                f.write("**Key Fields:**\n\n")
                for attr in key_fields[:20]:
                    req_marker = " *(Required)*" if attr.get('RequiredLevel') == 'ApplicationRequired' else ""
                    f.write(f"- `{attr['LogicalName']}` - {attr['DisplayName']} ({attr['AttributeType']}){req_marker}\n")
                f.write("\n")
        
        f.write("\n---\n\n")
        f.write("## Key Standard Entities Included\n\n")
        
        for entity in full_report['standard_entities']:
            if isinstance(entity, dict) and 'KeyAttributes' in entity:
                f.write(f"### {entity['DisplayName']}\n\n")
                f.write(f"- **Logical Name:** `{entity['LogicalName']}`\n")
                f.write(f"- **Forms:** {entity.get('FormCount', 0)}\n")
                f.write(f"- **Relationships:** {entity.get('RelationshipCount', 0)}\n\n")
    
    print(f"Analysis report saved to: {summary_file}")
    
    print(f"\n{'=' * 70}")
    print("📊 EXTRACTION SUMMARY")
    print(f"{'=' * 70}")
    print(f"\nMillennium Roofing Entities: {len(full_report['millennium_entities'])}")
    for entity in full_report['millennium_entities']:
        print(f"  • {entity['DisplayName']:30} {len(entity['Attributes']):3} fields")
    
    print(f"\nKey Standard Entities: {len([e for e in full_report['standard_entities'] if 'KeyAttributes' in e])}")
    

if __name__ == "__main__":
    main()
