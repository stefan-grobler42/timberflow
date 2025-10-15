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
  Dropdown,
} from '@fluentui/react';
import type { ICommandBarItemProps, IDropdownOption } from '@fluentui/react';
import { tenderService } from '../services';
import type { Tender } from '../types/millennium';

interface TenderFormProps {
  tender?: Tender;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export const TenderForm = ({
  tender,
  onDismiss,
  onSave,
  onDelete,
}: TenderFormProps) => {
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [formData, setFormData] = useState<Partial<Tender>>({
    name: '',
    description: '',
    fileLink: '',
    streetAddress: '',
    closingDate: '',
    distanceToSite: 0,
    contact: '',
    customer: '',
    quoteNo: '',
    roofCoveringSheeting: false,
    roofCoveringTiles: false,
    timberStructure: false,
    totalValueExcl: 0,
    totalValueExclBase: 0,
    exchangeRate: 1,
    newDesigner: '',
    newNotes: '',
    newPricingSubmitted: false,
    newSubmissionDate: '',
    newTenderStatus: 0,
    transactionCurrencyId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tender) {
      setFormData({
        name: tender.name || '',
        description: tender.description || '',
        fileLink: tender.fileLink || '',
        streetAddress: tender.streetAddress || '',
        closingDate: tender.closingDate || '',
        distanceToSite: tender.distanceToSite || 0,
        contact: tender.contact || '',
        customer: tender.customer || '',
        quoteNo: tender.quoteNo || '',
        roofCoveringSheeting: tender.roofCoveringSheeting || false,
        roofCoveringTiles: tender.roofCoveringTiles || false,
        timberStructure: tender.timberStructure || false,
        totalValueExcl: tender.totalValueExcl || 0,
        totalValueExclBase: tender.totalValueExclBase || 0,
        exchangeRate: tender.exchangeRate || 1,
        newDesigner: tender.newDesigner || '',
        newNotes: tender.newNotes || '',
        newPricingSubmitted: tender.newPricingSubmitted || false,
        newSubmissionDate: tender.newSubmissionDate || '',
        newTenderStatus: tender.newTenderStatus || 0,
        transactionCurrencyId: tender.transactionCurrencyId || '',
      });
    }
    setError(null);
  }, [tender]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (tender) {
        await tenderService.update(tender.id, formData);
      } else {
        await tenderService.create(formData);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tender');
      setSaving(false);
    }
  };

  const handleSaveAndNew = async () => {
    try {
      setSaving(true);
      setError(null);

      if (tender) {
        await tenderService.update(tender.id, formData);
      } else {
        await tenderService.create(formData);
      }

      setFormData({
        name: '',
        description: '',
        fileLink: '',
        streetAddress: '',
        closingDate: '',
        distanceToSite: 0,
        contact: '',
        customer: '',
        quoteNo: '',
        roofCoveringSheeting: false,
        roofCoveringTiles: false,
        timberStructure: false,
        totalValueExcl: 0,
        totalValueExclBase: 0,
        exchangeRate: 1,
        newDesigner: '',
        newNotes: '',
        newPricingSubmitted: false,
        newSubmissionDate: '',
        newTenderStatus: 0,
        transactionCurrencyId: '',
      });
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tender');
      setSaving(false);
    }
  };

  const statusOptions: IDropdownOption[] = [
    { key: 0, text: 'Draft' },
    { key: 1, text: 'Submitted' },
    { key: 2, text: 'Won' },
    { key: 3, text: 'Lost' },
    { key: 4, text: 'Cancelled' },
  ];

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
    ...(tender && onDelete
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
        {tender ? 'Edit Tender' : 'New Tender'}
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
              text="Location & Details"
              iconProps={{ iconName: 'MapPin' }}
              onClick={() => setActiveTab('location')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'location' ? '#0078d4' : 'transparent',
                  color: activeTab === 'location' ? 'white' : '#323130',
                  fontWeight: activeTab === 'location' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'location' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'location' ? 'white' : '#323130',
                },
              }}
            />
            <DefaultButton
              text="Scope"
              iconProps={{ iconName: 'CheckboxComposite' }}
              onClick={() => setActiveTab('scope')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'scope' ? '#0078d4' : 'transparent',
                  color: activeTab === 'scope' ? 'white' : '#323130',
                  fontWeight: activeTab === 'scope' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'scope' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'scope' ? 'white' : '#323130',
                },
              }}
            />
            <DefaultButton
              text="Financial"
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
            <DefaultButton
              text="Submission"
              iconProps={{ iconName: 'Send' }}
              onClick={() => setActiveTab('submission')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'submission' ? '#0078d4' : 'transparent',
                  color: activeTab === 'submission' ? 'white' : '#323130',
                  fontWeight: activeTab === 'submission' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'submission' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'submission' ? 'white' : '#323130',
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
                  label="Description"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={(_, value) => setFormData({ ...formData, description: value || '' })}
                />

                <TextField
                  label="Customer"
                  value={formData.customer}
                  onChange={(_, value) => setFormData({ ...formData, customer: value || '' })}
                />

                <TextField
                  label="Contact"
                  value={formData.contact}
                  onChange={(_, value) => setFormData({ ...formData, contact: value || '' })}
                />

                <TextField
                  label="Quote No"
                  value={formData.quoteNo}
                  onChange={(_, value) => setFormData({ ...formData, quoteNo: value || '' })}
                />
              </Stack>
            )}

            {activeTab === 'location' && (
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 600 } }}>
                <TextField
                  label="Street Address"
                  multiline
                  rows={2}
                  value={formData.streetAddress}
                  onChange={(_, value) =>
                    setFormData({ ...formData, streetAddress: value || '' })
                  }
                />

                <TextField
                  label="Distance to Site (km)"
                  type="number"
                  value={String(formData.distanceToSite)}
                  onChange={(_, value) =>
                    setFormData({ ...formData, distanceToSite: Number(value) || 0 })
                  }
                />

                <TextField
                  label="File Link"
                  value={formData.fileLink}
                  onChange={(_, value) => setFormData({ ...formData, fileLink: value || '' })}
                />
              </Stack>
            )}

            {activeTab === 'scope' && (
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 600 } }}>
                <Checkbox
                  label="Roof Covering - Sheeting"
                  checked={formData.roofCoveringSheeting}
                  onChange={(_, checked) =>
                    setFormData({ ...formData, roofCoveringSheeting: checked || false })
                  }
                />

                <Checkbox
                  label="Roof Covering - Tiles"
                  checked={formData.roofCoveringTiles}
                  onChange={(_, checked) =>
                    setFormData({ ...formData, roofCoveringTiles: checked || false })
                  }
                />

                <Checkbox
                  label="Timber Structure"
                  checked={formData.timberStructure}
                  onChange={(_, checked) =>
                    setFormData({ ...formData, timberStructure: checked || false })
                  }
                />
              </Stack>
            )}

            {activeTab === 'financial' && (
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 600 } }}>
                <TextField
                  label="Total Value (Excl)"
                  type="number"
                  value={String(formData.totalValueExcl)}
                  onChange={(_, value) =>
                    setFormData({ ...formData, totalValueExcl: Number(value) || 0 })
                  }
                />

                <TextField
                  label="Total Value Base (Excl)"
                  type="number"
                  value={String(formData.totalValueExclBase)}
                  onChange={(_, value) =>
                    setFormData({ ...formData, totalValueExclBase: Number(value) || 0 })
                  }
                />

                <TextField
                  label="Exchange Rate"
                  type="number"
                  value={String(formData.exchangeRate)}
                  onChange={(_, value) =>
                    setFormData({ ...formData, exchangeRate: Number(value) || 1 })
                  }
                />

                <TextField
                  label="Transaction Currency ID"
                  value={formData.transactionCurrencyId}
                  onChange={(_, value) =>
                    setFormData({ ...formData, transactionCurrencyId: value || '' })
                  }
                />
              </Stack>
            )}

            {activeTab === 'submission' && (
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 600 } }}>
                <DatePicker
                  label="Closing Date"
                  value={formData.closingDate ? new Date(formData.closingDate) : undefined}
                  onSelectDate={(date) =>
                    setFormData({ ...formData, closingDate: date?.toISOString() || '' })
                  }
                />

                <TextField
                  label="Designer"
                  value={formData.newDesigner}
                  onChange={(_, value) => setFormData({ ...formData, newDesigner: value || '' })}
                />

                <Dropdown
                  label="Tender Status"
                  options={statusOptions}
                  selectedKey={formData.newTenderStatus}
                  onChange={(_, option) =>
                    setFormData({ ...formData, newTenderStatus: Number(option?.key) || 0 })
                  }
                />

                <Checkbox
                  label="Pricing Submitted"
                  checked={formData.newPricingSubmitted}
                  onChange={(_, checked) =>
                    setFormData({ ...formData, newPricingSubmitted: checked || false })
                  }
                />

                <DatePicker
                  label="Submission Date"
                  value={
                    formData.newSubmissionDate ? new Date(formData.newSubmissionDate) : undefined
                  }
                  onSelectDate={(date) =>
                    setFormData({ ...formData, newSubmissionDate: date?.toISOString() || '' })
                  }
                />

                <TextField
                  label="Notes"
                  multiline
                  rows={4}
                  value={formData.newNotes}
                  onChange={(_, value) => setFormData({ ...formData, newNotes: value || '' })}
                />
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};
