# UI Standards - Millennium ERP

This document defines the standardized UI components and patterns for the Millennium ERP system to ensure consistency across all forms and modules.

## Overview

All standardized components are located in `frontend/src/components/standards/` and can be imported as:

```typescript
import { 
  StandardLookupField, 
  StandardPhoneField, 
  StandardAddressFields, 
  StandardFormHeader,
  type LookupOption 
} from './standards';
```

---

## StandardLookupField

### When to Use

Use `StandardLookupField` for all entity lookup fields (searching and selecting Accounts, Contacts, Employees, etc.).

### Features

- Real-time search with debouncing (300ms)
- Shows top 3 results in dropdown
- Advanced Search option within dropdown (no external button)
- Displays selected value as a removable chip
- Full dialog with searchable list for advanced lookup

### Implementation

```typescript
<StandardLookupField
  label="Company Name"
  value={formData.parentCustomerId}
  selectedText={companyNameText}
  entityName="Account"
  onChange={(id) => {
    setFormData({ ...formData, parentCustomerId: id || '' });
    if (id) {
      // Optionally fetch and set the display text
      accountService.getById(id).then(account => {
        setCompanyNameText(account.name || '');
      });
    } else {
      setCompanyNameText('');
    }
  }}
  onSearch={async (searchTerm: string): Promise<LookupOption[]> => {
    const results = await lookupService.searchAccounts(searchTerm);
    return results.map(r => ({ id: r.id, text: r.text }));
  }}
  required={false}
  disabled={false}
  error={undefined}
/>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | `string` | Yes | Field label |
| `value` | `string` | No | Selected entity ID |
| `selectedText` | `string` | No | Display text for selected entity |
| `entityName` | `string` | Yes | Name of entity type (e.g., "Account", "Contact") |
| `onChange` | `(id: string \| undefined) => void` | Yes | Callback when selection changes |
| `onSearch` | `(searchTerm: string) => Promise<LookupOption[]>` | No | Search function returning matching entities |
| `required` | `boolean` | No | Whether field is required |
| `disabled` | `boolean` | No | Whether field is disabled |
| `error` | `string` | No | Error message to display |

### LookupOption Type

```typescript
interface LookupOption {
  id: string;
  text: string;
}
```

### Design Notes

- **No External IconButton**: Unlike `AsyncLookupField`, the Advanced Search feature is accessed from within the dropdown suggestions, not via an external button
- This creates a cleaner, more streamlined UI while maintaining full search functionality

---

## StandardPhoneField

### When to Use

Use `StandardPhoneField` for all phone number inputs across the application.

### Features

- Automatic formatting to South African format: `+27 XX XXX XXXX`
- E.164 compliant output: `+27XXXXXXXXX`
- Accepts multiple input formats and normalizes them
- Removes leading zeros and country code variations
- Validates to 9 digits (after country code)

### Implementation

```typescript
<StandardPhoneField
  label="Business Phone"
  value={formData.telephone1 || ''}
  onChange={(phone) => setFormData({ ...formData, telephone1: phone })}
  required={false}
  disabled={false}
  error={undefined}
/>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | `string` | Yes | Field label |
| `value` | `string` | No | Phone number value (E.164 format) |
| `onChange` | `(phone: string) => void` | Yes | Callback with normalized phone number |
| `required` | `boolean` | No | Whether field is required |
| `disabled` | `boolean` | No | Whether field is disabled |
| `error` | `string` | No | Error message to display |

### Input Formats Accepted

The component accepts and normalizes these input formats:
- `+27 12 345 6789` → `+27123456789`
- `012 345 6789` → `+27123456789`
- `27123456789` → `+27123456789`
- `0123456789` → `+27123456789`

### Display Format

The field displays phone numbers as: `+27 XX XXX XXXX`

Example: `+27123456789` displays as `+27 12 345 6789`

### Database Storage

Always store phone numbers in E.164 format: `+27XXXXXXXXX`

---

## StandardAddressFields

### When to Use

Use `StandardAddressFields` for all address input sections across the application.

### Features

- Google Maps autocomplete on Street field
- Automatically populates: Street, State/Province, ZIP/Postal Code, Country
- Captures geographic coordinates (Latitude, Longitude)
- Read-only coordinate fields
- Simplified address structure (no Address Type, Street 2/3, City, or Phone)

### Implementation

```typescript
<StandardAddressFields
  sectionTitle="ADDRESS INFORMATION"
  uniqueId="contact-address"
  street={formData.address1Line1}
  stateOrProvince={formData.address1StateOrProvince}
  postalCode={formData.address1PostalCode}
  country={formData.address1Country}
  latitude={formData.address1Latitude}
  longitude={formData.address1Longitude}
  onStreetChange={(value) => setFormData({ ...formData, address1Line1: value })}
  onStateOrProvinceChange={(value) => setFormData({ ...formData, address1StateOrProvince: value })}
  onPostalCodeChange={(value) => setFormData({ ...formData, address1PostalCode: value })}
  onCountryChange={(value) => setFormData({ ...formData, address1Country: value })}
  onLatitudeChange={(value) => setFormData({ ...formData, address1Latitude: value })}
  onLongitudeChange={(value) => setFormData({ ...formData, address1Longitude: value })}
  disabled={false}
/>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `sectionTitle` | `string` | No | Section header (default: "ADDRESS") |
| `uniqueId` | `string` | No | Unique ID prefix for autocomplete (default: "standard-address") |
| `street` | `string` | No | Street address |
| `stateOrProvince` | `string` | No | State/Province |
| `postalCode` | `string` | No | ZIP/Postal Code |
| `country` | `string` | No | Country |
| `latitude` | `number` | No | Geographic latitude |
| `longitude` | `number` | No | Geographic longitude |
| `onStreetChange` | `(value: string) => void` | Yes | Callback for street changes |
| `onStateOrProvinceChange` | `(value: string) => void` | Yes | Callback for state changes |
| `onPostalCodeChange` | `(value: string) => void` | Yes | Callback for postal code changes |
| `onCountryChange` | `(value: string) => void` | Yes | Callback for country changes |
| `onLatitudeChange` | `(value: number \| undefined) => void` | Yes | Callback for latitude changes |
| `onLongitudeChange` | `(value: number \| undefined) => void` | Yes | Callback for longitude changes |
| `disabled` | `boolean` | No | Whether fields are disabled |

### Google Maps API Key

Requires `VITE_GOOGLE_MAPS_API_KEY` environment variable to be set.

### Fields Included

✅ **Included:**
- Street (with autocomplete)
- State/Province
- ZIP/Postal Code
- Country
- Latitude (read-only)
- Longitude (read-only)

❌ **NOT Included:**
- Address Type dropdown
- Street 2
- Street 3
- City
- Phone

### Design Rationale

The simplified address structure focuses on essential address components. The Google Maps autocomplete ensures data quality and consistency, while geographic coordinates enable location-based features.

---

## StandardFormHeader

### When to Use

Use `StandardFormHeader` for all entity form headers to ensure consistent command bar functionality.

### Features

- Consistent header layout with title and subtitle
- Standard action buttons: Back, Save, Save & Close, Save & New, Delete, Cancel
- Automatic button state management during save operations
- Conditional Delete button (hidden for new records)

### Implementation

```typescript
<StandardFormHeader
  title={contact ? 'Edit Contact' : 'New Contact'}
  subtitle="Contact"
  onBack={onDismiss}
  onSave={handleSubmit}
  onSaveAndNew={handleSaveAndNew}
  onSaveAndClose={handleSaveAndClose}
  onDelete={contact && onDelete ? handleDelete : undefined}
  onCancel={onDismiss}
  saving={saving}
  isNew={!contact}
/>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | Yes | Main header title (entity name or "New Entity") |
| `subtitle` | `string` | No | Entity type label |
| `onBack` | `() => void` | Yes | Back navigation handler |
| `onSave` | `() => void` | Yes | Save handler |
| `onSaveAndClose` | `() => void` | No | Save & Close handler |
| `onSaveAndNew` | `() => void` | No | Save & New handler |
| `onDelete` | `() => void` | No | Delete handler (not shown if undefined or isNew=true) |
| `onCancel` | `() => void` | No | Cancel handler |
| `saving` | `boolean` | No | Whether save is in progress (disables buttons) |
| `isNew` | `boolean` | No | Whether this is a new record (hides Delete button) |

### Button Behavior

| Button | Always Shown | Condition |
|--------|--------------|-----------|
| Back | Yes | Always available |
| Save | Yes | Always available |
| Save & Close | No | If `onSaveAndClose` provided |
| Save & New | No | If `onSaveAndNew` provided |
| Delete | No | If `onDelete` provided AND `isNew=false` |
| Cancel | No | If `onCancel` provided |

All buttons are automatically disabled when `saving=true`.

---

## Consistency Guidelines for New Modules

### 1. Form Structure

All entity forms should follow this structure:

```typescript
<Stack tokens={{ childrenGap: 0 }} styles={{ root: { height: '100%' } }}>
  <StandardFormHeader
    // ... header props
  />

  <Stack styles={{ root: { flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px' } }}>
    {/* Form content */}
  </Stack>
</Stack>
```

### 2. Lookup Fields

✅ **Do:** Use `StandardLookupField` for all entity lookups
```typescript
<StandardLookupField
  label="Company Name"
  entityName="Account"
  // ... other props
/>
```

❌ **Don't:** Use `LookupField` or `AsyncLookupField` directly

### 3. Phone Fields

✅ **Do:** Use `StandardPhoneField` for all phone inputs
```typescript
<StandardPhoneField
  label="Business Phone"
  value={formData.telephone1 || ''}
  onChange={(phone) => setFormData({ ...formData, telephone1: phone })}
/>
```

❌ **Don't:** Use `TextField` or `SouthAfricanPhoneInput` for phone numbers

### 4. Address Sections

✅ **Do:** Use `StandardAddressFields` for all address sections
```typescript
<StandardAddressFields
  uniqueId="entity-address"
  // ... address field props
/>
```

❌ **Don't:** Create custom address field layouts

### 5. Form Headers

✅ **Do:** Use `StandardFormHeader` for all entity forms
```typescript
<StandardFormHeader
  title={entity ? 'Edit Entity' : 'New Entity'}
  subtitle="Entity"
  // ... action handlers
/>
```

❌ **Don't:** Use `EntityFormActionBar`, `CommandBar`, or custom header implementations

---

## Migration Path

When updating existing forms to use standard components:

1. **Import standard components**
   ```typescript
   import { 
     StandardLookupField, 
     StandardPhoneField, 
     StandardAddressFields, 
     StandardFormHeader 
   } from './standards';
   ```

2. **Replace header** - Remove `EntityFormActionBar` or `CommandBar`, use `StandardFormHeader`

3. **Replace lookup fields** - Change all `LookupField` and `AsyncLookupField` to `StandardLookupField`

4. **Replace phone fields** - Change all phone `TextField` to `StandardPhoneField`

5. **Replace address sections** - Replace address field groups with `StandardAddressFields`

6. **Update imports** - Remove unused component imports

7. **Test thoroughly** - Verify all form operations work correctly

---

## Example: Complete Form Implementation

```typescript
import { useState } from 'react';
import { Stack, TextField } from '@fluentui/react';
import { 
  StandardLookupField, 
  StandardPhoneField, 
  StandardAddressFields, 
  StandardFormHeader,
  type LookupOption 
} from './standards';

export const EntityForm = ({ entity, onDismiss, onSave }) => {
  const [formData, setFormData] = useState({
    name: entity?.name || '',
    parentId: entity?.parentId || '',
    phone: entity?.phone || '',
    address1Line1: entity?.address1Line1 || '',
    // ... other fields
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const searchParents = async (searchTerm: string): Promise<LookupOption[]> => {
    // Implement search logic
    return [];
  };

  return (
    <Stack tokens={{ childrenGap: 0 }} styles={{ root: { height: '100%' } }}>
      <StandardFormHeader
        title={entity ? 'Edit Entity' : 'New Entity'}
        subtitle="Entity"
        onBack={onDismiss}
        onSave={handleSubmit}
        onSaveAndClose={() => {
          handleSubmit();
          onDismiss();
        }}
        saving={saving}
        isNew={!entity}
      />

      <Stack styles={{ root: { flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px' } }}>
        <TextField
          label="Name"
          value={formData.name}
          onChange={(_, value) => setFormData({ ...formData, name: value || '' })}
          required
        />

        <StandardLookupField
          label="Parent Entity"
          value={formData.parentId}
          selectedText={formData.parentName}
          entityName="Entity"
          onChange={(id) => setFormData({ ...formData, parentId: id })}
          onSearch={searchParents}
        />

        <StandardPhoneField
          label="Phone"
          value={formData.phone}
          onChange={(phone) => setFormData({ ...formData, phone })}
        />

        <StandardAddressFields
          uniqueId="entity-address"
          street={formData.address1Line1}
          stateOrProvince={formData.address1StateOrProvince}
          postalCode={formData.address1PostalCode}
          country={formData.address1Country}
          latitude={formData.address1Latitude}
          longitude={formData.address1Longitude}
          onStreetChange={(value) => setFormData({ ...formData, address1Line1: value })}
          onStateOrProvinceChange={(value) => setFormData({ ...formData, address1StateOrProvince: value })}
          onPostalCodeChange={(value) => setFormData({ ...formData, address1PostalCode: value })}
          onCountryChange={(value) => setFormData({ ...formData, address1Country: value })}
          onLatitudeChange={(value) => setFormData({ ...formData, address1Latitude: value })}
          onLongitudeChange={(value) => setFormData({ ...formData, address1Longitude: value })}
        />
      </Stack>
    </Stack>
  );
};
```

---

## Benefits of Standardization

1. **Consistency** - Uniform user experience across all modules
2. **Maintainability** - Single source of truth for common patterns
3. **Development Speed** - Faster implementation of new forms
4. **Quality** - Tested, validated components reduce bugs
5. **Scalability** - Easy to enhance functionality system-wide

---

## Support

For questions or issues with standard components:
1. Check this documentation first
2. Review example implementations in `AccountForm.tsx` and `D365ContactForm.tsx`
3. Examine the component source code in `frontend/src/components/standards/`

Last Updated: October 20, 2025
