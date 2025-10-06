import { useState, useEffect } from 'react';
import {
  Panel,
  PanelType,
  TextField,
  PrimaryButton,
  DefaultButton,
  Stack,
  Dropdown,
  Checkbox,
  MessageBar,
  MessageBarType,
} from '@fluentui/react';
import type { IDropdownOption } from '@fluentui/react';
import { userService } from '../services';
import type { User, CreateUserDto, UpdateUserDto } from '../types';

interface UserFormProps {
  isOpen: boolean;
  user?: User;
  onDismiss: () => void;
  onSave: () => void;
}

export const UserForm = ({ isOpen, user, onDismiss, onSave }: UserFormProps) => {
  const [formData, setFormData] = useState<Partial<CreateUserDto>>({
    userCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    role: 'user',
    isActive: true,
    hireDate: new Date().toISOString().split('T')[0],
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
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
        phone: user.phone,
        department: user.department,
        position: user.position,
        role: user.role,
        isActive: user.isActive,
        hireDate: user.hireDate.split('T')[0],
        address: user.address,
        emergencyContact: user.emergencyContact || '',
        emergencyPhone: user.emergencyPhone || '',
      });
    } else {
      setFormData({
        userCode: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        role: 'user',
        isActive: true,
        hireDate: new Date().toISOString().split('T')[0],
        address: '',
        emergencyContact: '',
        emergencyPhone: '',
      });
    }
    setError(null);
  }, [user, isOpen]);

  const departmentOptions: IDropdownOption[] = [
    { key: 'Sales', text: 'Sales' },
    { key: 'Operations', text: 'Operations' },
    { key: 'Finance', text: 'Finance' },
    { key: 'Administration', text: 'Administration' },
    { key: 'IT', text: 'IT' },
  ];

  const roleOptions: IDropdownOption[] = [
    { key: 'user', text: 'User' },
    { key: 'sales', text: 'Sales Representative' },
    { key: 'manager', text: 'Manager' },
    { key: 'admin', text: 'Administrator' },
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
      onDismiss();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const onRenderFooterContent = () => (
    <Stack horizontal tokens={{ childrenGap: 8 }}>
      <PrimaryButton onClick={handleSubmit} disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </PrimaryButton>
      <DefaultButton onClick={onDismiss} disabled={saving}>
        Cancel
      </DefaultButton>
    </Stack>
  );

  return (
    <Panel
      isOpen={isOpen}
      onDismiss={onDismiss}
      type={PanelType.medium}
      headerText={user ? 'Edit User' : 'New User'}
      onRenderFooterContent={onRenderFooterContent}
      isFooterAtBottom={true}
    >
      <Stack tokens={{ childrenGap: 16 }} styles={{ root: { marginTop: 16 } }}>
        {error && (
          <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
            {error}
          </MessageBar>
        )}

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
          required
          value={formData.phone}
          onChange={(_, value) => setFormData({ ...formData, phone: value || '' })}
        />

        <Dropdown
          label="Department"
          required
          options={departmentOptions}
          selectedKey={formData.department}
          onChange={(_, option) => setFormData({ ...formData, department: option?.key as string })}
        />

        <TextField
          label="Position"
          required
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

        <TextField
          label="Hire Date"
          required
          type="date"
          value={formData.hireDate}
          onChange={(_, value) => setFormData({ ...formData, hireDate: value || '' })}
        />

        <TextField
          label="Address"
          required
          multiline
          rows={3}
          value={formData.address}
          onChange={(_, value) => setFormData({ ...formData, address: value || '' })}
        />

        <TextField
          label="Emergency Contact"
          value={formData.emergencyContact}
          onChange={(_, value) => setFormData({ ...formData, emergencyContact: value || '' })}
        />

        <TextField
          label="Emergency Phone"
          value={formData.emergencyPhone}
          onChange={(_, value) => setFormData({ ...formData, emergencyPhone: value || '' })}
        />

        <Checkbox
          label="Active"
          checked={formData.isActive}
          onChange={(_, checked) => setFormData({ ...formData, isActive: checked || false })}
        />
      </Stack>
    </Panel>
  );
};
