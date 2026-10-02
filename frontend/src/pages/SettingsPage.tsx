import React, { useState, useEffect } from 'react';
import { settingsApi } from '../api/endpoints';
import { OrgSettings, User, UserRole } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { TableSkeleton } from '../components/common/Skeleton';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  Settings,
  Building,
  Key,
  ShieldCheck,
  Users,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Save,
  Lock,
} from 'lucide-react';
import { formatDate } from '../utils/formatters';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [orgData, setOrgData] = useState<any>(null);
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  // Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [inviteName, setInviteName] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<UserRole>('ANALYST');
  const [isInviting, setIsInviting] = useState<boolean>(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await settingsApi.get();
      setOrgData(data.organization);
      setSettings(data.settings);
      setTeamMembers(data.users);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    try {
      const res = await settingsApi.update({
        organizationName: orgData.name,
        industry: orgData.industry,
        autoRecoveryEnabled: orgData.autoRecoveryEnabled,
        retryWindowMinutes: Number(settings.retryWindowMinutes),
        autoExecuteRecovery: Boolean(settings.autoExecuteRecovery),
        minConfidenceThreshold: Number(settings.minConfidenceThreshold),
        enabledChannels: settings.enabledChannels,
        webhookUrl: settings.webhookUrl,
        slackWebhookUrl: settings.slackWebhookUrl,
        supportEmail: settings.supportEmail,
      });

      showToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Organization preferences successfully persisted to database.',
      });
      fetchSettings();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: error.response?.data?.error || 'Unable to update settings.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateSecret = async () => {
    if (!window.confirm('Are you sure you want to regenerate the webhook secret? Existing webhooks will need to be updated.')) return;
    try {
      const res = await settingsApi.regenerateWebhookSecret();
      setSettings((prev) => (prev ? { ...prev, webhookSecret: res.webhookSecret } : null));
      showToast({
        type: 'success',
        title: 'Secret Regenerated',
        message: 'New webhook signature secret generated.',
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Regeneration Failed',
        message: error.response?.data?.error || 'Failed to regenerate secret.',
      });
    }
  };

  const handleCopySecret = () => {
    if (settings?.webhookSecret) {
      navigator.clipboard.writeText(settings.webhookSecret);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
      showToast({
        type: 'info',
        title: 'Secret Copied',
        message: 'Webhook signing secret copied to clipboard.',
      });
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      const res = await settingsApi.inviteMember({
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
      });
      showToast({
        type: 'success',
        title: 'Team Member Added',
        message: res.message,
      });
      setIsInviteModalOpen(false);
      setInviteName('');
      setInviteEmail('');
      fetchSettings();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Invite Failed',
        message: error.response?.data?.error || 'Failed to add team member.',
      });
    } finally {
      setIsInviting(false);
    }
  };

  if (isLoading || !settings) {
    return <TableSkeleton rows={8} cols={4} />;
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Platform Settings & Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization profile, deterministic engine thresholds, webhooks, and team access
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Organization Information */}
        <Card title="Organization Profile" subtitle="Your business profile and settlement preferences">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Organization Legal Name"
                value={orgData?.name || ''}
                disabled={!isAdmin}
                onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                required
              />
              <Input
                label="Industry Domain"
                value={orgData?.industry || ''}
                disabled={!isAdmin}
                onChange={(e) => setOrgData({ ...orgData, industry: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Default Currency" value="INR (₹)" disabled />
              <Input label="System Timezone" value="Asia/Kolkata (IST)" disabled />
            </div>
          </div>
        </Card>

        {/* Recovery Engine Settings */}
        <Card title="Recovery Engine Preferences" subtitle="Deterministic decision thresholds and automated retry policies">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <p className="text-xs font-bold text-slate-900">Autonomous Payment Win-Back</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Automatically dispatch recovery links without requiring manual analyst approval
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoExecuteRecovery}
                disabled={!isAdmin}
                onChange={(e) => setSettings({ ...settings, autoExecuteRecovery: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Default Retry Window (Minutes)"
                type="number"
                value={settings.retryWindowMinutes}
                disabled={!isAdmin}
                onChange={(e) => setSettings({ ...settings, retryWindowMinutes: Number(e.target.value) })}
                helperText="Optimal interval between initial failure and automated win-back"
              />

              <Input
                label="Minimum Confidence Threshold (%)"
                type="number"
                step="0.1"
                value={settings.minConfidenceThreshold}
                disabled={!isAdmin}
                onChange={(e) => setSettings({ ...settings, minConfidenceThreshold: Number(e.target.value) })}
                helperText="Minimum model confidence required to execute automated retries"
              />
            </div>
          </div>
        </Card>

        {/* Webhooks & API Integration */}
        <Card title="API & Webhook Integrations" subtitle="Gateway event ingestion and real-time incident alerting">
          <div className="space-y-4">
            <Input
              label="Inbound Gateway Webhook URL"
              value={settings.webhookUrl || ''}
              disabled={!isAdmin}
              onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
              placeholder="https://api.yourdomain.com/webhooks/recoverai"
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Webhook Signature Secret</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={settings.webhookSecret || 'whsec_...'}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopySecret}
                  leftIcon={copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copiedKey ? 'Copied' : 'Copy'}
                </Button>
                {isAdmin && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateSecret}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Regenerate
                  </Button>
                )}
              </div>
            </div>

            <Input
              label="Slack Incident Alerts Webhook URL"
              value={settings.slackWebhookUrl || ''}
              disabled={!isAdmin}
              onChange={(e) => setSettings({ ...settings, slackWebhookUrl: e.target.value })}
              placeholder="https://hooks.slack.com/services/..."
            />
          </div>
        </Card>

        {/* Save Bar */}
        {isAdmin && (
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="emerald"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        )}
      </form>

      {/* Team Members & Role Access */}
      <Card
        title="Team Members & Roles"
        subtitle="Manage authorized staff access and operational permissions"
        headerAction={
          isAdmin && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => setIsInviteModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Team Member
            </Button>
          )
        }
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Team Member</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role Permission</th>
                <th className="py-3 px-4">Added On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {member.name}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {member.email}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={member.role === 'ADMIN' ? 'purple' : member.role === 'ANALYST' ? 'info' : 'neutral'} size="sm">
                      {member.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {formatDate(member.createdAt, false)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Add New Team Member"
        description="Grant a colleague access to RecoverAI with specific role permissions."
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="emerald"
              onClick={handleInviteUser}
              isLoading={isInviting}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Member
            </Button>
          </>
        }
      >
        <form onSubmit={handleInviteUser} className="space-y-4">
          <Input
            label="Full Name"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="e.g. Shalini Roy"
            required
          />
          <Input
            label="Work Email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="e.g. shalini@recoverai.in"
            required
          />
          <Select
            label="Role Authorization"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as UserRole)}
            options={[
              { value: 'ANALYST', label: 'Analyst — View analytics, transactions, create campaigns' },
              { value: 'ADMIN', label: 'Admin — Full administrative controls & team management' },
              { value: 'SUPPORT', label: 'Support — View transactions and execute recovery' },
            ]}
          />
        </form>
      </Modal>
    </div>
  );
};
