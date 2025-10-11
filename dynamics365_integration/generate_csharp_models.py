#!/usr/bin/env python3
"""
Generate C# Entity Framework Core models from Dynamics 365 metadata
"""

import json
import os

# Type mapping from Dynamics 365 to C#
TYPE_MAPPING = {
    'String': 'string',
    'Integer': 'int',
    'Decimal': 'decimal',
    'Money': 'decimal',
    'Double': 'double',
    'Boolean': 'bool',
    'DateTime': 'DateTime',
    'Uniqueidentifier': 'Guid',
    'Lookup': 'Guid',  # Foreign key
    'Customer': 'Guid',  # Polymorphic lookup
    'Owner': 'Guid',
    'Picklist': 'int',
    'BigInt': 'long',
    'Memo': 'string',
    'Virtual': 'string',
    'EntityName': 'string',
    'PartyList': 'string'
}

def get_csharp_type(attr):
    """Convert Dynamics attribute type to C# type"""
    attr_type = attr.get('AttributeType')
    csharp_type = TYPE_MAPPING.get(attr_type, 'string')
    
    # Make nullable if not required and not primary
    if attr.get('RequiredLevel') != 'SystemRequired' and not attr.get('IsPrimaryId'):
        if csharp_type in ['int', 'decimal', 'double', 'bool', 'DateTime', 'Guid', 'long']:
            csharp_type += '?'
    
    return csharp_type

def sanitize_property_name(name):
    """Convert logical name to C# property name"""
    # Remove cr694_ prefix
    name = name.replace('cr694_', '')
    
    # Capitalize first letter
    parts = name.split('_')
    return ''.join(word.capitalize() for word in parts)

def generate_entity_model(entity):
    """Generate C# class for an entity"""
    class_name = entity['DisplayName'].replace(' ', '').replace('-', '')
    
    # Start class
    lines = []
    lines.append('using System;')
    lines.append('using System.ComponentModel.DataAnnotations;')
    lines.append('using System.ComponentModel.DataAnnotations.Schema;')
    lines.append('')
    lines.append('namespace MillenniumERP.API.Models')
    lines.append('{')
    
    if entity.get('Description'):
        lines.append(f'    /// <summary>')
        lines.append(f'    /// {entity["Description"]}')
        lines.append(f'    /// </summary>')
    
    lines.append(f'    [Table("{entity["LogicalName"].lower()}")]')
    lines.append(f'    public class {class_name}')
    lines.append('    {')
    
    # Get custom attributes (skip standard CRM fields)
    skip_fields = ['createdby', 'createdon', 'modifiedby', 'modifiedon', 'ownerid', 
                   'statecode', 'statuscode', 'versionnumber', 'importsequencenumber',
                   'overriddencreatedon', 'timezoneruleversionnumber', 'utcconversiontimezonecode',
                   'owningbusinessunit', 'owninguser', 'owningteam', 'createdonbehalfby', 'modifiedonbehalfby']
    
    skip_suffixes = ['name', 'yominame', 'type']
    
    custom_attrs = []
    for attr in entity['Attributes']:
        logical_name = attr['LogicalName']
        
        # Skip standard fields
        if logical_name in skip_fields:
            continue
        
        # Skip name/yominame fields (these are virtual fields for lookups)
        if any(logical_name.endswith(suffix) for suffix in skip_suffixes) and not attr.get('IsPrimaryName'):
            continue
        
        custom_attrs.append(attr)
    
    # Generate properties
    for attr in custom_attrs:
        logical_name = attr['LogicalName']
        display_name = attr['DisplayName']
        csharp_type = get_csharp_type(attr)
        prop_name = sanitize_property_name(logical_name)
        
        # Add comment
        if display_name:
            lines.append(f'        /// <summary>{display_name}</summary>')
        
        # Add primary key attribute
        if attr.get('IsPrimaryId'):
            lines.append('        [Key]')
            prop_name = 'Id'
        
        # Add required attribute
        if attr.get('RequiredLevel') == 'ApplicationRequired':
            lines.append('        [Required]')
        
        # Add max length for strings
        if attr.get('MaxLength'):
            lines.append(f'        [MaxLength({attr["MaxLength"]})]')
        
        # Add column attribute with original name
        lines.append(f'        [Column("{logical_name}")]')
        
        # Add property
        lines.append(f'        public {csharp_type} {prop_name} {{ get; set; }}')
        lines.append('')
    
    # Add audit fields
    lines.append('        // Audit fields')
    lines.append('        public DateTime? CreatedOn { get; set; }')
    lines.append('        public Guid? CreatedBy { get; set; }')
    lines.append('        public DateTime? ModifiedOn { get; set; }')
    lines.append('        public Guid? ModifiedBy { get; set; }')
    
    # Close class
    lines.append('    }')
    lines.append('}')
    
    return '\n'.join(lines)

def main():
    # Load metadata
    with open('ExtractSpec_FULL_METADATA.json', 'r') as f:
        data = json.load(f)
    
    # Create output directory
    output_dir = '../backend/MillenniumERP.API/Models/Millennium'
    os.makedirs(output_dir, exist_ok=True)
    
    print("=" * 70)
    print("GENERATING C# ENTITY MODELS")
    print("=" * 70)
    
    # Generate models for each Millennium entity
    for entity in data['millennium_entities']:
        class_name = entity['DisplayName'].replace(' ', '').replace('-', '')
        filename = f'{class_name}.cs'
        filepath = os.path.join(output_dir, filename)
        
        print(f"\nGenerating: {class_name}")
        print(f"  File: {filepath}")
        print(f"  Fields: {len([a for a in entity['Attributes'] if not a['LogicalName'] in ['createdby', 'createdon', 'modifiedby', 'modifiedon']])}")
        
        # Generate C# code
        csharp_code = generate_entity_model(entity)
        
        # Write to file
        with open(filepath, 'w') as f:
            f.write(csharp_code)
        
        print(f"  ✓ Generated successfully")
    
    print(f"\n{'=' * 70}")
    print("✅ All entity models generated!")
    print(f"{'=' * 70}")
    print(f"\nOutput directory: {output_dir}")
    print(f"Files created: {len(data['millennium_entities'])}")

if __name__ == '__main__':
    main()
