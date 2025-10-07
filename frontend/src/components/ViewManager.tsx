import { useState } from 'react';
import {
  Dropdown,
  Dialog,
  DialogType,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
  TextField,
  Stack,
  IconButton,
  Text,
} from '@fluentui/react';
import type { IDropdownOption } from '@fluentui/react';
import type { GridView } from '../types/gridView';

interface ViewManagerProps {
  currentView: GridView;
  views: GridView[];
  onViewChange: (view: GridView) => void;
  onSaveView: (view: GridView) => void;
  onDeleteView: (viewId: string) => void;
  onSetDefaultView: (viewId: string) => void;
}

export const ViewManager = ({
  currentView,
  views,
  onViewChange,
  onSaveView,
  onDeleteView,
  onSetDefaultView,
}: ViewManagerProps) => {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [saveAsNew, setSaveAsNew] = useState(true);

  const viewOptions: IDropdownOption[] = views.map((view) => ({
    key: view.id,
    text: view.name,
    data: view,
  }));

  const handleSaveView = () => {
    if (!newViewName.trim() && saveAsNew) return;

    const viewToSave: GridView = {
      ...currentView,
      id: saveAsNew ? `view-${Date.now()}` : currentView.id,
      name: saveAsNew ? newViewName : currentView.name,
      isDefault: saveAsNew ? false : currentView.isDefault,
    };

    onSaveView(viewToSave);
    setIsSaveDialogOpen(false);
    setNewViewName('');
    setSaveAsNew(true);
  };

  const handleResetDefaultView = () => {
    const defaultView = views.find((v) => v.isDefault);
    if (defaultView) {
      onViewChange(defaultView);
    }
  };

  return (
    <>
      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
        <Dropdown
          placeholder="Select view"
          selectedKey={currentView.id}
          options={viewOptions}
          onChange={(_, option) => {
            if (option?.data) {
              onViewChange(option.data as GridView);
            }
          }}
          styles={{
            root: { minWidth: 200 },
            title: { fontWeight: 600 },
          }}
          onRenderTitle={(items) => {
            const selectedItem = items?.[0];
            const view = views.find((v) => v.id === selectedItem?.key);
            return (
              <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }}>
                <Text>{selectedItem?.text}</Text>
                {view?.isDefault && (
                  <Text variant="small" styles={{ root: { color: '#0078d4' } }}>
                    Default
                  </Text>
                )}
              </Stack>
            );
          }}
        />
        <IconButton
          iconProps={{ iconName: 'Save' }}
          title="Save current view"
          onClick={() => {
            setSaveAsNew(false);
            setIsSaveDialogOpen(true);
          }}
        />
        <IconButton
          iconProps={{ iconName: 'SaveAs' }}
          title="Save as new view"
          onClick={() => {
            setSaveAsNew(true);
            setIsSaveDialogOpen(true);
          }}
        />
        <IconButton
          iconProps={{ iconName: 'Settings' }}
          title="Manage and share views"
          onClick={() => setIsManageDialogOpen(true)}
        />
        <IconButton
          iconProps={{ iconName: 'Undo' }}
          title="Reset to default view"
          onClick={handleResetDefaultView}
        />
      </Stack>

      {/* Save View Dialog */}
      <Dialog
        hidden={!isSaveDialogOpen}
        onDismiss={() => setIsSaveDialogOpen(false)}
        dialogContentProps={{
          type: DialogType.normal,
          title: saveAsNew ? 'Save as New View' : 'Save Current View',
        }}
      >
        <Stack tokens={{ childrenGap: 16 }}>
          {saveAsNew && (
            <TextField
              label="View Name"
              value={newViewName}
              onChange={(_, value) => setNewViewName(value || '')}
              required
              placeholder="Enter view name..."
            />
          )}
          <Text variant="small">
            This will save the current column visibility, order, filters, and sort settings.
          </Text>
        </Stack>
        <DialogFooter>
          <PrimaryButton
            onClick={handleSaveView}
            text="Save"
            disabled={saveAsNew && !newViewName.trim()}
          />
          <DefaultButton onClick={() => setIsSaveDialogOpen(false)} text="Cancel" />
        </DialogFooter>
      </Dialog>

      {/* Manage Views Dialog */}
      <Dialog
        hidden={!isManageDialogOpen}
        onDismiss={() => setIsManageDialogOpen(false)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Manage Views',
        }}
        minWidth={500}
      >
        <Stack tokens={{ childrenGap: 8 }}>
          {views.map((view) => (
            <Stack
              key={view.id}
              horizontal
              verticalAlign="center"
              tokens={{ childrenGap: 8 }}
              styles={{
                root: {
                  padding: 8,
                  borderRadius: 4,
                  backgroundColor: view.id === currentView.id ? '#f3f2f1' : 'transparent',
                },
              }}
            >
              <Text styles={{ root: { flex: 1 } }}>
                {view.name}
                {view.isDefault && (
                  <Text variant="small" styles={{ root: { color: '#0078d4', marginLeft: 8 } }}>
                    (Default)
                  </Text>
                )}
              </Text>
              {!view.isDefault && (
                <DefaultButton
                  text="Set as Default"
                  onClick={() => {
                    onSetDefaultView(view.id);
                    setIsManageDialogOpen(false);
                  }}
                />
              )}
              <IconButton
                iconProps={{ iconName: 'Delete' }}
                title="Delete view"
                onClick={() => {
                  onDeleteView(view.id);
                  if (view.id === currentView.id) {
                    const defaultView = views.find((v) => v.isDefault);
                    if (defaultView) onViewChange(defaultView);
                  }
                }}
                disabled={view.isDefault}
              />
            </Stack>
          ))}
        </Stack>
        <DialogFooter>
          <DefaultButton onClick={() => setIsManageDialogOpen(false)} text="Close" />
        </DialogFooter>
      </Dialog>
    </>
  );
};
