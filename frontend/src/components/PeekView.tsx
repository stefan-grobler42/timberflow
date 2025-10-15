import React from 'react';
import { Stack, Text, Separator } from '@fluentui/react';

interface PeekViewField {
  label: string;
  value?: string | number | boolean | null;
  render?: () => React.ReactNode;
}

interface PeekViewProps {
  title: string;
  fields: PeekViewField[];
}

export const PeekView: React.FC<PeekViewProps> = ({ title, fields }) => {
  const formatValue = (value?: string | number | boolean | null): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toLocaleString();
    return value.toString();
  };

  return (
    <Stack tokens={{ childrenGap: 12 }}>
      <Text variant="mediumPlus" styles={{ root: { fontWeight: 600, color: '#323130' } }}>
        {title}
      </Text>
      
      <Separator />
      
      <Stack tokens={{ childrenGap: 8 }}>
        {fields.map((field, index) => (
          <Stack key={index} tokens={{ childrenGap: 2 }}>
            <Text variant="small" styles={{ root: { color: '#605e5c', fontWeight: 600 } }}>
              {field.label}
            </Text>
            {field.render ? (
              field.render()
            ) : (
              <Text variant="medium" styles={{ root: { color: '#323130' } }}>
                {formatValue(field.value)}
              </Text>
            )}
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};
