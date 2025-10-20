import { TextField } from '@fluentui/react';

interface SouthAfricanPhoneInputProps {
  label: string;
  value?: string;
  onChange: (phone: string) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export const SouthAfricanPhoneInput = ({
  label,
  value = '',
  onChange,
  required = false,
  error,
  disabled = false,
}: SouthAfricanPhoneInputProps) => {
  // Extract digits only from any phone input format
  const parsePhoneValue = (input: string): string => {
    // Remove all non-digit characters
    const cleaned = input.replace(/\D/g, '');
    
    if (!cleaned) {
      return '';
    }

    // Remove leading +27 if present
    if (cleaned.startsWith('27')) {
      const withoutCountryCode = cleaned.substring(2);
      if (withoutCountryCode.length > 0) {
        // Remove leading 0 if present after removing country code
        if (withoutCountryCode.startsWith('0')) {
          return withoutCountryCode.substring(1);
        }
        return withoutCountryCode;
      }
    }

    // Remove leading 0 if present
    if (cleaned.startsWith('0')) {
      return cleaned.substring(1);
    }

    return cleaned;
  };

  // Format digits for display as "+27 XX XXX XXXX"
  const formatPhoneDisplay = (digits: string): string => {
    if (!digits) {
      return '';
    }

    const parts: string[] = ['+27'];
    
    if (digits.length > 0) {
      parts.push(digits.substring(0, Math.min(2, digits.length)));
    }
    if (digits.length > 2) {
      parts.push(digits.substring(2, Math.min(5, digits.length)));
    }
    if (digits.length > 5) {
      parts.push(digits.substring(5, Math.min(9, digits.length)));
    }

    return parts.join(' ');
  };

  const handleChange = (_: any, newValue?: string) => {
    if (!newValue) {
      onChange('');
      return;
    }

    // Parse to get clean digits
    const cleanDigits = parsePhoneValue(newValue);
    
    // Pass clean digits (no +27 prefix) to parent
    onChange(cleanDigits);
  };

  // Display the formatted version with +27
  const displayValue = formatPhoneDisplay(value);

  return (
    <TextField
      label={label}
      value={displayValue}
      onChange={handleChange}
      required={required}
      disabled={disabled}
      errorMessage={error}
      placeholder="+27 XX XXX XXXX"
    />
  );
};
