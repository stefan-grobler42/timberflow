import { useEffect } from 'react';
import { Stack, TextField, Text } from '@fluentui/react';

declare global {
  interface Window {
    google: any;
  }
}

declare const google: any;

interface StandardAddressFieldsProps {
  street?: string;
  stateOrProvince?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  onStreetChange: (value: string) => void;
  onStateOrProvinceChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onLatitudeChange: (value: number | undefined) => void;
  onLongitudeChange: (value: number | undefined) => void;
  disabled?: boolean;
  sectionTitle?: string;
  uniqueId?: string;
}

export const StandardAddressFields = ({
  street = '',
  stateOrProvince = '',
  postalCode = '',
  country = '',
  latitude,
  longitude,
  onStreetChange,
  onStateOrProvinceChange,
  onPostalCodeChange,
  onCountryChange,
  onLatitudeChange,
  onLongitudeChange,
  disabled = false,
  sectionTitle = 'ADDRESS',
  uniqueId = 'standard-address',
}: StandardAddressFieldsProps) => {
  const streetInputId = `${uniqueId}-street-input`;

  useEffect(() => {
    initializeGoogleMaps();
  }, []);

  const initializeGoogleMaps = () => {
    if (typeof google === 'undefined' || !google.maps) {
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => setupAutocomplete());
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${
        import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
      }&libraries=places`;
      script.async = true;
      script.onload = () => setupAutocomplete();
      document.head.appendChild(script);
    } else {
      setupAutocomplete();
    }
  };

  const setupAutocomplete = () => {
    const streetInput = document.getElementById(streetInputId) as HTMLInputElement;
    
    if (!streetInput || !google?.maps?.places) {
      setTimeout(setupAutocomplete, 100);
      return;
    }

    const autocompleteInstance = new google.maps.places.Autocomplete(
      streetInput,
      {
        types: ['address'],
        fields: ['address_components', 'formatted_address', 'geometry'],
      }
    );

    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace();

      if (!place.geometry || !place.geometry.location) {
        return;
      }

      const addressComponents = place.address_components || [];
      let streetValue = '';
      let stateValue = '';
      let postalCodeValue = '';
      let countryValue = '';

      addressComponents.forEach((component: any) => {
        const types = component.types;
        if (types.includes('street_number')) {
          streetValue = component.long_name + ' ';
        }
        if (types.includes('route')) {
          streetValue += component.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          stateValue = component.long_name;
        }
        if (types.includes('postal_code')) {
          postalCodeValue = component.long_name;
        }
        if (types.includes('country')) {
          countryValue = component.long_name;
        }
      });

      const location = place.geometry.location;
      
      onStreetChange(streetValue.trim());
      onStateOrProvinceChange(stateValue);
      onPostalCodeChange(postalCodeValue);
      onCountryChange(countryValue);
      onLatitudeChange(location.lat());
      onLongitudeChange(location.lng());
    });
  };

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      <Text variant="mediumPlus" styles={{ root: { fontWeight: 600, marginBottom: 8 } }}>
        {sectionTitle}
      </Text>

      <TextField
        id={streetInputId}
        label="Street"
        value={street}
        onChange={(_, value) => onStreetChange(value || '')}
        disabled={disabled}
        placeholder="Start typing to search..."
        iconProps={{ iconName: 'MapPin' }}
      />

      <TextField
        label="State/Province"
        value={stateOrProvince}
        onChange={(_, value) => onStateOrProvinceChange(value || '')}
        disabled={disabled}
      />

      <TextField
        label="ZIP/Postal Code"
        value={postalCode}
        onChange={(_, value) => onPostalCodeChange(value || '')}
        disabled={disabled}
      />

      <TextField
        label="Country"
        value={country}
        onChange={(_, value) => onCountryChange(value || '')}
        disabled={disabled}
      />

      <Stack horizontal tokens={{ childrenGap: 16 }}>
        <TextField
          label="Latitude"
          value={latitude?.toString() || ''}
          onChange={(_, value) => {
            const parsed = parseFloat(value || '');
            onLatitudeChange(isNaN(parsed) ? undefined : parsed);
          }}
          disabled={disabled}
          readOnly
        />

        <TextField
          label="Longitude"
          value={longitude?.toString() || ''}
          onChange={(_, value) => {
            const parsed = parseFloat(value || '');
            onLongitudeChange(isNaN(parsed) ? undefined : parsed);
          }}
          disabled={disabled}
          readOnly
        />
      </Stack>
    </Stack>
  );
};
