import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  TextField,
  PrimaryButton,
  DefaultButton,
  Dropdown,
  Checkbox,
  MessageBar,
  MessageBarType,
  IconButton,
  DatePicker,
} from '@fluentui/react';
import type { IDropdownOption } from '@fluentui/react';
import { userService } from '../services';
import type { User, CreateUserDto, UpdateUserDto } from '../types';

interface UserFormFullScreenProps {
  user?: User;
  onDismiss: () => void;
  onSave: () => void;
}

export const UserFormFullScreen = ({ user, onDismiss, onSave }: UserFormFullScreenProps) => {
  const [formData, setFormData] = useState<Partial<CreateUserDto>>({
    userCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    role: 'user',
    hireDate: undefined,
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    isActive: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        userCode: user.userCode,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
        department: user.department || '',
        position: user.position || '',
        role: user.role,
        hireDate: user.hireDate || undefined,
        address: user.address || '',
        emergencyContact: user.emergencyContact || '',
        emergencyPhone: user.emergencyPhone || '',
        isActive: user.isActive,
      });
    }
    setError(null);
  }, [user]);

  const roleOptions: IDropdownOption[] = [
    { key: 'user', text: 'User' },
    { key: 'sales_representative', text: 'Sales Representative' },
    { key: 'manager', text: 'Manager' },
    { key: 'administrator', text: 'Administrator' },
  ];

  const departmentOptions: IDropdownOption[] = [
    { key: '', text: '(None)' },
    { key: 'Sales', text: 'Sales' },
    { key: 'Operations', text: 'Operations' },
    { key: 'Finance', text: 'Finance' },
    { key: 'Administration', text: 'Administration' },
    { key: 'IT', text: 'IT' },
  ];

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (user) {
        const updateDto: UpdateUserDto = { ...formData };
        await userService.update(user.id, updateDto);
      } else {
        const createDto: CreateUserDto = formData as CreateUserDto;
        await userService.create(createDto);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
      setSaving(false);
    }
  };

  return (
    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { height: '100%', padding: 20 } }}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Text variant="xxLarge">{user ? 'Edit User' : 'New User'}</Text>
        <IconButton iconProps={{ iconName: 'Cancel' }} onClick={onDismiss} />
      </Stack>

      {error && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
          {error}
        </MessageBar>
      )}

      <Stack
        horizontal
        tokens={{ childrenGap: 32 }}
        styles={{ root: { flex: 1, overflowY: 'auto' } }}
      >
        <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
          <Text variant="xLarge">Personal Information</Text>

          <TextField
            label="User Code"
            required
            value={formData.userCode}
            onChange={(_, value) => setFormData({ ...formData, userCode: value || '' })}
          />

          <TextField
            label="First Name"
            required
            value={formData.firstName}
            onChange={(_, value) => setFormData({ ...formData, firstName: value || '' })}
          />

          <TextField
            label="Last Name"
            required
            value={formData.lastName}
            onChange={(_, value) => setFormData({ ...formData, lastName: value || '' })}
          />

          <TextField
            label="Email"
            required
            type="email"
            value={formData.email}
            onChange={(_, value) => setFormData({ ...formData, email: value || '' })}
          />

          <TextField
            label="Phone"
            value={formData.phone}
            onChange={(_, value) => setFormData({ ...formData, phone: value || '' })}
          />

          <TextField
            label="Address"
            multiline
            rows={3}
            value={formData.address}
            onChange={(_, value) => setFormData({ ...formData, address: value || '' })}
          />
        </Stack>

        <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
          <Text variant="xLarge">Employment Information</Text>

          <Dropdown
            label="Department"
            options={departmentOptions}
            selectedKey={formData.department || ''}
            onChange={(_, option) => setFormData({ ...formData, department: option?.key as string })}
          />

          <TextField
            label="Position"
            value={formData.position}
            onChange={(_, value) => setFormData({ ...formData, position: value || '' })}
          />

          <Dropdown
            label="Role"
            required
            options={roleOptions}
            selectedKey={formData.role}
            onChange={(_, option) => setFormData({ ...formData, role: option?.key as string })}
          />

          <DatePicker
            label="Hire Date"
            value={formData.hireDate ? new Date(formData.hireDate) : undefined}
            onSelectDate={(date) =>
              setFormData({ ...formData, hireDate: date?.toISOString().split('T')[0] })
            }
          />

          <Text variant="xLarge" styles={{ root: { marginTop: 16 } }}>
            Emergency Contact
          </Text>

          <TextField
            label="Emergency Contact Name"
            value={formData.emergencyContact}
            onChange={(_, value) => setFormData({ ...formData, emergencyContact: value || '' })}
          />

          <TextField
            label="Emergency Contact Phone"
            value={formData.emergencyPhone}
            onChange={(_, value) => setFormData({ ...formData, emergencyPhone: value || '' })}
          />

          <Checkbox
            label="Active"
            checked={formData.isActive}
            onChange={(_, checked) => setFormData({ ...formData, isActive: checked || false })}
          />
        </Stack>
      </Stack>

      <Stack horizontal tokens={{ childrenGap: 8 }} horizontalAlign="end">
        <PrimaryButton onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </PrimaryButton>
        <DefaultButton onClick={onDismiss} disabled={saving}>
          Cancel
        </DefaultButton>
      </Stack>
    </Stack>
  );
};
