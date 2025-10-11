#!/usr/bin/env python3
"""
Main script to inspect Dynamics 365 schema and generate a comprehensive report
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from dynamics365_integration.schema_inspector import SchemaInspector


def main():
    """Run the schema inspection"""
    try:
        inspector = SchemaInspector()
        
        # Generate comprehensive schema report
        report = inspector.generate_schema_report('millennium_roofing_schema.json')
        
        print("\n" + "="*60)
        print("Schema inspection completed successfully!")
        print("="*60)
        
        # Print quick summary
        print("\nQuick Summary of Entities Found:")
        print("-" * 60)
        
        for entity in report['entities'][:10]:  # Show first 10
            entity_type = "CUSTOM" if entity['IsCustom'] else "STANDARD"
            print(f"  [{entity_type}] {entity['DisplayName']} ({entity['LogicalName']})")
            print(f"           Fields: {len(entity['Attributes'])}, Forms: {len(entity['Forms'])}")
        
        if len(report['entities']) > 10:
            print(f"\n  ... and {len(report['entities']) - 10} more entities")
        
        print("\n" + "="*60)
        print(f"Full report saved to: millennium_roofing_schema.json")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Error during schema inspection: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
