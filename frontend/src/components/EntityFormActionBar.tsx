import { CommandBar } from '@fluentui/react';
import type { ICommandBarItemProps } from '@fluentui/react';

interface EntityFormActionBarProps {
  onBack: () => void;
  onSave: () => void;
  onSaveAndClose: () => void;
  onDelete?: () => void;
  isNew: boolean;
  disabled?: boolean;
}

export const EntityFormActionBar = ({
  onBack,
  onSave,
  onSaveAndClose,
  onDelete,
  isNew,
  disabled = false,
}: EntityFormActionBarProps) => {
  const items: ICommandBarItemProps[] = [
    {
      key: 'back',
      iconProps: { iconName: 'Back' },
      onClick: onBack,
      disabled,
      ariaLabel: 'Back',
    },
    {
      key: 'save',
      text: 'Save',
      iconProps: { iconName: 'Save' },
      onClick: onSave,
      disabled,
    },
    {
      key: 'saveAndClose',
      text: 'Save & Close',
      iconProps: { iconName: 'SaveAndClose' },
      onClick: onSaveAndClose,
      disabled,
    },
  ];

  if (!isNew && onDelete) {
    items.push({
      key: 'delete',
      text: 'Delete',
      iconProps: { iconName: 'Delete' },
      onClick: onDelete,
      disabled,
    });
  }

  return (
    <CommandBar
      items={items}
      styles={{ root: { borderBottom: '1px solid #edebe9' } }}
    />
  );
};
