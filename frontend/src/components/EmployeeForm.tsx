import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  TextField,
  Checkbox,
  MessageBar,
  MessageBarType,
  DefaultButton,
  CommandBar,
  DatePicker,
} from '@fluentui/react';
import type { ICommandBarItemProps } from '@fluentui/react';
import { employeeService } from '../services';
import type { Employee } from '../types/millennium';

interface EmployeeFormProps {
  employee?: Employee;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export const EmployeeForm = ({
  employee,
  onDismiss,
  onSave,
  onDelete,
}: EmployeeFormProps) => {
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    employeeNo: '',
    idNo: '',
    jobDescription: '',
    driversLicenseNo: '',
    pdpNo: '',
    pdpExpiryDate: '',
    pdp: false,
    allowDriving: false,
    hourlyRate: 0,
    newCellNo: '',
    newEmailAddress: '',
    newIncomeTaxNumber: '',
    newActiveEmployee: true,
    newCommissionPayable: false,
    newContractOnFile: false,
    newStartDate: '',
    newUnionMember: false,
    newDisplayNameCalculated: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        employeeNo: employee.employeeNo || '',
        idNo: employee.idNo || '',
        jobDescription: employee.jobDescription || '',
        driversLicenseNo: employee.driversLicenseNo || '',
        pdpNo: employee.pdpNo || '',
        pdpExpiryDate: employee.pdpExpiryDate || '',
        pdp: employee.pdp || false,
        allowDriving: employee.allowDriving || false,
        hourlyRate: employee.hourlyRate || 0,
        newCellNo: employee.newCellNo || '',
        newEmailAddress: employee.newEmailAddress || '',
        newIncomeTaxNumber: employee.newIncomeTaxNumber || '',
        newActiveEmployee: employee.newActiveEmployee ?? true,
        newCommissionPayable: employee.newCommissionPayable || false,
        newContractOnFile: employee.newContractOnFile || false,
        newStartDate: employee.newStartDate || '',
        newUnionMember: employee.newUnionMember || false,
        newDisplayNameCalculated: employee.newDisplayNameCalculated || '',
      });
    }
    setError(null);
  }, [employee]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (employee) {
        await employeeService.update(employee.id, formData);
      } else {
        await employeeService.create(formData);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save employee');
      setSaving(false);
    }
  };

  const handleSaveAndNew = async () => {
    try {
      setSaving(true);
      setError(null);

      if (employee) {
        await employeeService.update(employee.id, formData);
      } else {
        await employeeService.create(formData);
      }

      setFormData({
        name: '',
        employeeNo: '',
        idNo: '',
        jobDescription: '',
        driversLicenseNo: '',
        pdpNo: '',
        pdpExpiryDate: '',
        pdp: false,
        allowDriving: false,
        hourlyRate: 0,
        newCellNo: '',
        newEmailAddress: '',
        newIncomeTaxNumber: '',
        newActiveEmployee: true,
        newCommissionPayable: false,
        newContractOnFile: false,
        newStartDate: '',
        newUnionMember: false,
        newDisplayNameCalculated: '',
      });
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save employee');
      setSaving(false);
    }
  };

  const commandBarItems: ICommandBarItemProps[] = [
    {
      key: 'save',
      text: 'Save',
      iconProps: { iconName: 'Save' },
      onClick: handleSubmit,
      disabled: saving,
    },
    {
      key: 'saveAndNew',
      text: 'Save & New',
      iconProps: { iconName: 'SaveAndClose' },
      onClick: handleSaveAndNew,
      disabled: saving,
    },
    ...(employee && onDelete
      ? [
          {
            key: 'delete',
            text: 'Delete',
            iconProps: { iconName: 'Delete' },
            onClick: onDelete,
            disabled: saving,
          },
        ]
      : []),
    {
      key: 'cancel',
      text: 'Cancel',
      iconProps: { iconName: 'Cancel' },
      onClick: onDismiss,
      disabled: saving,
    },
  ];

  return (
    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { height: '100%' } }}>
      <Text variant="xxLarge" styles={{ root: { padding: '20px 20px 0 20px' } }}>
        {employee ? 'Edit Employee' : 'New Employee'}
      </Text>

      <CommandBar items={commandBarItems} />

      <Stack styles={{ root: { flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px' } }}>
        {error && (
          <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
            {error}
          </MessageBar>
        )}

        <Stack styles={{ root: { flex: 1, display: 'flex', flexDirection: 'column' } }}>
          <Stack horizontal styles={{ root: { borderBottom: '1px solid #edebe9' } }}>
            <DefaultButton
              text="Basic Information"
              iconProps={{ iconName: 'Info' }}
              onClick={() => setActiveTab('basic')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'basic' ? '#0078d4' : 'transparent',
                  color: activeTab === 'basic' ? 'white' : '#323130',
                  fontWeight: activeTab === 'basic' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'basic' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'basic' ? 'white' : '#323130',
                },
              }}
            />
            <DefaultButton
              text="Contact & Employment"
              iconProps={{ iconName: 'Contact' }}
              onClick={() => setActiveTab('contact')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'contact' ? '#0078d4' : 'transparent',
                  color: activeTab === 'contact' ? 'white' : '#323130',
                  fontWeight: activeTab === 'contact' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'contact' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'contact' ? 'white' : '#323130',
                },
              }}
            />
            <DefaultButton
              text="Driving & Licenses"
              iconProps={{ iconName: 'Car' }}
              onClick={() => setActiveTab('driving')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'driving' ? '#0078d4' : 'transparent',
                  color: activeTab === 'driving' ? 'white' : '#323130',
                  fontWeight: activeTab === 'driving' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'driving' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'driving' ? 'white' : '#323130',
                },
              }}
            />
            <DefaultButton
              text="Financial & Status"
              iconProps={{ iconName: 'Money' }}
              onClick={() => setActiveTab('financial')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'financial' ? '#0078d4' : 'transparent',
                  color: activeTab === 'financial' ? 'white' : '#323130',
                  fontWeight: activeTab === 'financial' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'financial' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'financial' ? 'white' : '#323130',
                },
              }}
            />
          </Stack>

          <Stack styles={{ root: { flex: 1, overflowY: 'auto', padding: '20px 0' } }}>
            {activeTab === 'basic' && (
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 600 } }}>
                <TextField
                  label="Name"
                  required
                  value={formData.name}
                  onChange={(_, value) => setFormData({ ...formData, name: value || '' })}
                />

                <TextField
                  label="Employee No"
                  value={formData.employeeNo}
                  onChange={(_, value) => setFormData({ ...formData, employeeNo: value || '' })}
                />

                <TextField
                  label="ID Number"
                  value={formData.idNo}
                  onChange={(_, value) => setFormData({ ...formData, idNo: value || '' })}
                />

                <TextField
                  label="Job Description"
                  multiline
                  rows={3}
                  value={formData.jobDescription}
                  onChange={(_, value) =>
                    setFormData({ ...formData, jobDescription: value || '' })
                  }
                />

                <TextField
                  label="Display Name"
                  value={formData.newDisplayNameCalculated}
                  onChange={(_, value) =>
                    setFormData({ ...formData, newDisplayNameCalculated: value || '' })
                  }
                />
              </Stack>
            )}

            {activeTab === 'contact' && (
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 600 } }}>
                <TextField
                  label="Cell Number"
                  value={formData.newCellNo}
                  onChange={(_, value) => setFormData({ ...formData, newCellNo: value || '' })}
                />

                <TextField
                  label="Email Address"
                  type="email"
                  value={formData.newEmailAddress}
                  onChange={(_, value) =>
                    setFormData({ ...formData, newEmailAddress: value || '' })
                  }
                />

                <DatePicker
                  label="Start Date"
                  value={formData.newStartDate ? new Date(formData.newStartDate) : undefined}
                  onSelectDate={(date) =>
                    setFormData({ ...formData, newStartDate: date?.toISOString() || '' })
                  }
                />

                <Checkbox
                  label="Active Employee"
                  checked={formData.newActiveEmployee}
                  onChange={(_, checked) =>
                    setFormData({ ...formData, newActiveEmployee: checked || false })
                  }
                />

                <Checkbox
                  label="Contract On File"
                  checked={formData.newContractOnFile}
                  onChange={(_, checked) =>
                    setFormData({ ...formData, newContractOnFile: checked || false })
                  }
                />

                <Checkbox
                  label="Union Member"
                  checked={formData.newUnionMember}
                  onChange={(_, checked) =>
                    setFormData({ ...formData, newUnionMember: checked || false })
                  }
                />
              </Stack>
            )}

            {activeTab === 'driving' && (
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 600 } }}>
                <TextField
                  label="Driver's License No"
                  value={formData.driversLicenseNo}
                  onChange={(_, value) =>
                    setFormData({ ...formData, driversLicenseNo: value || '' })
                  }
                />

                <Checkbox
                  label="Allow Driving"
                  checked={formData.allowDriving}
                  onChange={(_, checked) =>
                    setFormData({ ...formData, allowDriving: checked || false })
                  }
                />

                <TextField
                  label="PDP No"
                  value={formData.pdpNo}
                  onChange={(_, value) => setFormData({ ...formData, pdpNo: value || '' })}
                />

                <DatePicker
                  label="PDP Expiry Date"
                  value={formData.pdpExpiryDate ? new Date(formData.pdpExpiryDate) : undefined}
                  onSelectDate={(date) =>
                    setFormData({ ...formData, pdpExpiryDate: date?.toISOString() || '' })
                  }
                />

                <Checkbox
                  label="PDP"
                  checked={formData.pdp}
                  onChange={(_, checked) => setFormData({ ...formData, pdp: checked || false })}
                />
              </Stack>
            )}

            {activeTab === 'financial' && (
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 600 } }}>
                <TextField
                  label="Hourly Rate"
                  type="number"
                  value={String(formData.hourlyRate)}
                  onChange={(_, value) =>
                    setFormData({ ...formData, hourlyRate: Number(value) || 0 })
                  }
                />

                <TextField
                  label="Income Tax Number"
                  value={formData.newIncomeTaxNumber}
                  onChange={(_, value) =>
                    setFormData({ ...formData, newIncomeTaxNumber: value || '' })
                  }
                />

                <Checkbox
                  label="Commission Payable"
                  checked={formData.newCommissionPayable}
                  onChange={(_, checked) =>
                    setFormData({ ...formData, newCommissionPayable: checked || false })
                  }
                />
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};
