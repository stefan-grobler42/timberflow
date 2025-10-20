import { TextField } from '@fluentui/react';

interface StandardPhoneFieldProps {
  label: string;
  value?: string;
  onChange: (phone: string) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export const StandardPhoneField = ({
  label,
  value = '',
  onChange,
  required = false,
  error,
  disabled = false,
}: StandardPhoneFieldProps) => {
  // Extract digits only from any phone input format (for display purposes)
  const parsePhoneValue = (input: string): string => {
    // Remove all non-digit characters except + at the start
    let cleaned = input.replace(/[\s\-()]/g, '');
    
    if (!cleaned) {
      return '';
    }
    
    // If starts with +27, extract just the digits after it
    if (cleaned.startsWith('+27')) {
      const digits = cleaned.substring(3).replace(/\D/g, '');
      return digits;
    }
    
    // Remove all non-digit characters
    cleaned = cleaned.replace(/\D/g, '');
    
    if (!cleaned) {
      return '';
    }

    // If starts with 27 (country code without +)
    if (cleaned.startsWith('27') && cleaned.length > 2) {
      return cleaned.substring(2);
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
    
    // Pass E.164 format (+27 + digits) to parent
    if (cleanDigits.length > 0) {
      onChange(`+27${cleanDigits}`);
    } else {
      onChange('');
    }
  };

  // Display the formatted version with +27
  const displayValue = formatPhoneDisplay(parsePhoneValue(value));

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
