import { Stack, Text, CommandBar } from '@fluentui/react';
import type { ICommandBarItemProps } from '@fluentui/react';

interface StandardFormHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onSave: () => void;
  onSaveAndExit: () => void;
  onDelete?: () => void;
  onCancel: () => void;
  saving?: boolean;
  isNew?: boolean;
  onSaveAndNew?: () => void;
}

export const StandardFormHeader = ({
  title,
  subtitle,
  onBack,
  onSave,
  onSaveAndExit,
  onDelete,
  onCancel,
  saving = false,
  isNew = false,
  onSaveAndNew,
}: StandardFormHeaderProps) => {
  const commandBarItems: ICommandBarItemProps[] = [];

  if (onBack) {
    commandBarItems.push({
      key: 'back',
      iconProps: { iconName: 'Back' },
      onClick: onBack,
      disabled: saving,
      ariaLabel: 'Back',
    });
  }

  commandBarItems.push({
    key: 'save',
    text: 'Save',
    iconProps: { iconName: 'Save' },
    onClick: onSave,
    disabled: saving,
  });

  commandBarItems.push({
    key: 'saveAndExit',
    text: 'Save & Exit',
    iconProps: { iconName: 'SaveAndClose' },
    onClick: onSaveAndExit,
    disabled: saving,
  });

  if (!isNew && onDelete) {
    commandBarItems.push({
      key: 'delete',
      text: 'Delete',
      iconProps: { iconName: 'Delete' },
      onClick: onDelete,
      disabled: saving,
    });
  }

  commandBarItems.push({
    key: 'cancel',
    text: 'Cancel',
    iconProps: { iconName: 'Cancel' },
    onClick: onCancel,
    disabled: saving,
  });

  if (onSaveAndNew) {
    commandBarItems.push({
      key: 'saveAndNew',
      text: 'Save & New',
      iconProps: { iconName: 'AddToShoppingList' },
      onClick: onSaveAndNew,
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
