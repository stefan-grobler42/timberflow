import { Stack, Text, CommandBar } from '@fluentui/react';
import type { ICommandBarItemProps } from '@fluentui/react';

interface StandardFormHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  onSave: () => void;
  onSaveAndClose?: () => void;
  onSaveAndNew?: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
  saving?: boolean;
  isNew?: boolean;
}

export const StandardFormHeader = ({
  title,
  subtitle,
  onBack,
  onSave,
  onSaveAndClose,
  onSaveAndNew,
  onDelete,
  onCancel,
  saving = false,
  isNew = false,
}: StandardFormHeaderProps) => {
  const commandBarItems: ICommandBarItemProps[] = [
    {
      key: 'back',
      iconProps: { iconName: 'Back' },
      onClick: onBack,
      disabled: saving,
      ariaLabel: 'Back',
    },
    {
      key: 'save',
      text: 'Save',
      iconProps: { iconName: 'Save' },
      onClick: onSave,
      disabled: saving,
    },
  ];

  if (onSaveAndClose) {
    commandBarItems.push({
      key: 'saveAndClose',
      text: 'Save & Close',
      iconProps: { iconName: 'SaveAndClose' },
      onClick: onSaveAndClose,
      disabled: saving,
    });
  }

  if (onSaveAndNew) {
    commandBarItems.push({
      key: 'saveAndNew',
      text: 'Save & New',
      iconProps: { iconName: 'SaveAndClose' },
      onClick: onSaveAndNew,
      disabled: saving,
    });
  }

  if (!isNew && onDelete) {
    commandBarItems.push({
      key: 'delete',
      text: 'Delete',
      iconProps: { iconName: 'Delete' },
      onClick: onDelete,
      disabled: saving,
    });
  }

  if (onCancel) {
    commandBarItems.push({
      key: 'cancel',
      text: 'Cancel',
      iconProps: { iconName: 'Cancel' },
      onClick: onCancel,
      disabled: saving,
    });
  }

  return (
    <Stack tokens={{ childrenGap: 0 }}>
      <Stack 
        horizontal 
        horizontalAlign="space-between" 
        verticalAlign="center" 
        styles={{ root: { padding: '12px 20px', borderBottom: '1px solid #edebe9' } }}
      >
        <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="center">
          <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="medium" styles={{ root: { color: '#605e5c' } }}>
              {subtitle}
            </Text>
          )}
        </Stack>
      </Stack>

      <CommandBar
        items={commandBarItems}
        styles={{ root: { borderBottom: '1px solid #edebe9' } }}
      />
    </Stack>
  );
};
