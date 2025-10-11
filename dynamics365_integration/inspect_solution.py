#!/usr/bin/env python3
"""
Dynamics 365 Solution Inspector
Extracts all components from a specific solution
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dynamics365_integration.auth import DynamicsAuthenticator
import json
import requests


def get_solution_components(solution_name):
    """Extract all components from a Dynamics 365 solution"""
    auth = DynamicsAuthenticator()
    headers = auth.get_auth_headers()
    base_url = f"{auth.instance_url}/api/data/v9.2"
    
    print("=" * 70)
    print(f"DYNAMICS 365 SOLUTION INSPECTOR: {solution_name}")
    print("=" * 70)
    print(f"\nConnecting to: {auth.instance_url}")
    
    # Step 1: Find the solution
    print(f"\nStep 1: Searching for solution '{solution_name}'...")
    solution_url = f"{base_url}/solutions?$filter=uniquename eq '{solution_name}'"
    
    response = requests.get(solution_url, headers=headers)
    if response.status_code != 200:
        print(f"❌ Error finding solution: {response.status_code}")
        print(response.text)
        return None
    
    solutions = response.json().get('value', [])
    if not solutions:
        print(f"❌ Solution '{solution_name}' not found")
        print("\nSearching for similar solutions...")
        
        # Try partial match
        partial_url = f"{base_url}/solutions?$filter=contains(uniquename, '{solution_name.lower()}')"
        response = requests.get(partial_url, headers=headers)
        if response.status_code == 200:
            similar = response.json().get('value', [])
            if similar:
                print(f"\nFound {len(similar)} similar solutions:")
                for sol in similar[:10]:
                    print(f"  - {sol.get('uniquename')} (v{sol.get('version')})")
                    print(f"    Display Name: {sol.get('friendlyname')}")
                    print(f"    Publisher: {sol.get('publisherid')}")
        
        # List all custom solutions
        print("\nListing all custom solutions (non-Microsoft)...")
        all_solutions_url = f"{base_url}/solutions?$select=uniquename,friendlyname,version,publisherid&$orderby=createdon desc"
        response = requests.get(all_solutions_url, headers=headers)
        if response.status_code == 200:
            all_sols = response.json().get('value', [])
            custom_sols = [s for s in all_sols if not s.get('uniquename', '').startswith('msdyn') 
                          and not s.get('uniquename', '').startswith('Microsoft')]
            print(f"\nFound {len(custom_sols)} custom solutions:")
            for sol in custom_sols[:20]:
                print(f"  - {sol.get('uniquename')} (v{sol.get('version')})")
                print(f"    Name: {sol.get('friendlyname')}")
        
        return None
    
    solution = solutions[0]
    solution_id = solution.get('solutionid')
    
    print(f"✓ Found solution: {solution.get('friendlyname')}")
    print(f"  Unique Name: {solution.get('uniquename')}")
    print(f"  Version: {solution.get('version')}")
    print(f"  Solution ID: {solution_id}")
    
    # Step 2: Get all solution components
    print(f"\nStep 2: Retrieving solution components...")
    components_url = f"{base_url}/solutioncomponents?$filter=_solutionid_value eq {solution_id}&$select=componenttype,objectid"
    
    response = requests.get(components_url, headers=headers)
    if response.status_code != 200:
        print(f"❌ Error retrieving components: {response.status_code}")
        print(response.text)
        return None
    
    components = response.json().get('value', [])
    print(f"✓ Found {len(components)} components")
    
    # Component types mapping
    component_types = {
        1: 'Entity',
        2: 'Attribute',
        9: 'Option Set',
        10: 'Entity Relationship',
        24: 'Entity Form',
        25: 'Entity View',
        26: 'Entity Chart',
        29: 'Web Resource',
        31: 'Business Rule',
        60: 'System Form',
        62: 'Workflow',
        80: 'Plugin Assembly',
        90: 'Plugin Type',
        91: 'Plugin Step',
        92: 'SDK Message Processing Step Image'
    }
    
    # Group components by type
    grouped_components = {}
    for comp in components:
        comp_type = comp.get('componenttype')
        type_name = component_types.get(comp_type, f'Unknown ({comp_type})')
        
        if type_name not in grouped_components:
            grouped_components[type_name] = []
        grouped_components[type_name].append(comp.get('objectid'))
    
    print(f"\nStep 3: Component breakdown by type:")
    for comp_type, ids in sorted(grouped_components.items()):
        print(f"  - {comp_type}: {len(ids)}")
    
    # Step 4: Get detailed info for entities
    print(f"\nStep 4: Extracting entity details...")
    solution_data = {
        'solution': {
            'uniquename': solution.get('uniquename'),
            'friendlyname': solution.get('friendlyname'),
            'version': solution.get('version'),
            'solutionid': solution_id
        },
        'component_summary': {k: len(v) for k, v in grouped_components.items()},
        'entities': []
    }
    
    if 'Entity' in grouped_components:
        entity_ids = grouped_components['Entity']
        print(f"  Retrieving details for {len(entity_ids)} entities...")
        
        for i, entity_id in enumerate(entity_ids, 1):
            # Get entity metadata
            entity_url = f"{base_url}/EntityDefinitions({entity_id})?$select=LogicalName,DisplayName,SchemaName,Description,PrimaryIdAttribute,PrimaryNameAttribute"
            response = requests.get(entity_url, headers=headers)
            
            if response.status_code == 200:
                entity = response.json()
                
                # Extract display name
                display_name_obj = entity.get('DisplayName', {})
                label_obj = display_name_obj.get('UserLocalizedLabel', {})
                display_name = label_obj.get('Label', entity.get('LogicalName', ''))
                
                # Extract description
                desc_obj = entity.get('Description', {})
                desc_label_obj = desc_obj.get('UserLocalizedLabel', {})
                description = desc_label_obj.get('Label', '')
                
                entity_info = {
                    'LogicalName': entity.get('LogicalName'),
                    'DisplayName': display_name,
                    'SchemaName': entity.get('SchemaName'),
                    'Description': description,
                    'PrimaryIdAttribute': entity.get('PrimaryIdAttribute'),
                    'PrimaryNameAttribute': entity.get('PrimaryNameAttribute'),
                    'EntityId': entity_id
                }
                
                solution_data['entities'].append(entity_info)
                print(f"    [{i}/{len(entity_ids)}] {display_name} ({entity.get('LogicalName')})")
    
    # Save to file
    output_file = f"{solution_name}_components.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(solution_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'=' * 70}")
    print("✅ Solution inspection completed!")
    print(f"{'=' * 70}")
    print(f"\nReport saved to: {output_file}")
    
    # Print summary
    print(f"\n📊 SOLUTION SUMMARY")
    print(f"{'=' * 70}")
    print(f"Solution: {solution_data['solution']['friendlyname']}")
    print(f"Version: {solution_data['solution']['version']}")
    print(f"\nComponents:")
    for comp_type, count in sorted(solution_data['component_summary'].items()):
        print(f"  • {comp_type}: {count}")
    
    if solution_data['entities']:
        print(f"\n📋 ENTITIES IN SOLUTION:")
        print(f"{'=' * 70}")
        for entity in solution_data['entities']:
            print(f"\n  • {entity['DisplayName']}")
            print(f"      Logical Name: {entity['LogicalName']}")
            print(f"      Schema Name: {entity['SchemaName']}")
            if entity['Description']:
                print(f"      Description: {entity['Description']}")
    
    return solution_data


if __name__ == "__main__":
    solution_name = "ExtractSpec"
    
    if len(sys.argv) > 1:
        solution_name = sys.argv[1]
    
    get_solution_components(solution_name)
