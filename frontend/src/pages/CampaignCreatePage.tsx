import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { campaignsApi } from '../api/endpoints';
import { RecoveryChannel, RecoveryAction } from '../types';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Card } from '../components/common/Card';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft,
  Megaphone,
  Layers,
  MessageSquare,
  Smartphone,
  Mail,
  RefreshCw,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

export const CampaignCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [name, setName] = useState('High-Value Enterprise 3DS Win-Back');
  const [description, setDescription] = useState('Automated recovery sequence for failed transactions above ₹10,000 from Enterprise & Mid-Market accounts.');
  const [targetSegment, setTargetSegment] = useState('ENTERPRISE');
  const [minAmount, setMinAmount] = useState(10000);
  const [maxAmount, setMaxAmount] = useState(250000);
  const [channels, setChannels] = useState<RecoveryChannel[]>(['WHATSAPP', 'SMS', 'WEBHOOK_RETRY']);
  const [workflowSteps, setWorkflowSteps] = useState<Array<{ step: number; action: RecoveryAction; delayMinutes: number }>>([
    { step: 1, action: 'WHATSAPP_PAYMENT_LINK', delayMinutes: 10 },
    { step: 2, action: 'SMART_AUTO_RETRY', delayMinutes: 45 },
    { step: 3, action: 'SMS_PAYMENT_LINK', delayMinutes: 180 },
  ]);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const toggleChannel = (ch: RecoveryChannel) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const addWorkflowStep = () => {
    setWorkflowSteps((prev) => [
      ...prev,
      { step: prev.length + 1, action: 'WHATSAPP_PAYMENT_LINK', delayMinutes: 60 },
    ]);
  };

  const removeWorkflowStep = (index: number) => {
    setWorkflowSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast({ type: 'error', title: 'Name Required', message: 'Please enter a campaign name.' });
      return;
    }
    if (channels.length === 0) {
      showToast({ type: 'error', title: 'Channel Required', message: 'Select at least one recovery channel.' });
      return;
    }

    setIsLoading(true);
    try {
      const campaign = await campaignsApi.create({
        name,
        description,
        targetSegment,
        minAmount: Number(minAmount),
        maxAmount: Number(maxAmount),
        channels,
        actionWorkflow: workflowSteps,
      });

      showToast({
        type: 'success',
        title: 'Campaign Created',
        message: `Campaign '${campaign.name}' successfully configured.`,
      });
      navigate(`/campaigns/${campaign.id}`);
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Creation Failed',
        message: error.response?.data?.error || 'Failed to create campaign.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/campaigns"
          className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Create Recovery Campaign
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure audience filters, recovery channels, and automated escalation workflows
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Basics */}
        <Card title="1. Campaign Overview" subtitle="General identity and target objectives">
          <div className="space-y-4">
            <Input
              label="Campaign Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Enterprise Mandate Recovery Blitz"
              required
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="Explain the strategy and audience for this campaign..."
              />
            </div>
          </div>
        </Card>

        {/* Step 2: Audience & Thresholds */}
        <Card title="2. Target Audience & Thresholds" subtitle="Select eligible customer segment and transaction value range">
          <div className="space-y-4">
            <Select
              label="Customer Segment"
              value={targetSegment}
              onChange={(e) => setTargetSegment(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Customer Segments' },
                { value: 'ENTERPRISE', label: 'Enterprise (High LTV / Tier 1)' },
                { value: 'MID_MARKET', label: 'Mid-Market' },
                { value: 'SME', label: 'SME' },
                { value: 'RETAIL', label: 'Retail Consumers' },
              ]}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Minimum Transaction Value (INR ₹)"
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(Number(e.target.value))}
                required
              />
              <Input
                label="Maximum Transaction Value (INR ₹)"
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(Number(e.target.value))}
                required
              />
            </div>
          </div>
        </Card>

        {/* Step 3: Multi-channel Routing */}
        <Card title="3. Enabled Delivery Channels" subtitle="Select communication channels permitted for this campaign">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                id: 'WHATSAPP' as RecoveryChannel,
                label: 'WhatsApp Business API',
                desc: 'Interactive 1-click UPI deep-link with dynamic QR',
                icon: <MessageSquare className="w-4 h-4 text-emerald-600" />,
              },
              {
                id: 'WEBHOOK_RETRY' as RecoveryChannel,
                label: 'Smart Gateway Webhook Retry',
                desc: 'Autonomous background switch retry',
                icon: <RefreshCw className="w-4 h-4 text-blue-600" />,
              },
              {
                id: 'SMS' as RecoveryChannel,
                label: 'SMS Fallback Link',
                desc: 'Instant short-link delivered via telecom route',
                icon: <Smartphone className="w-4 h-4 text-purple-600" />,
              },
              {
                id: 'EMAIL' as RecoveryChannel,
                label: 'Email Invoice & Mandate Prompt',
                desc: 'Formal invoice and digital re-auth button',
                icon: <Mail className="w-4 h-4 text-amber-600" />,
              },
            ].map((ch) => {
              const isChecked = channels.includes(ch.id);
              return (
                <div
                  key={ch.id}
                  onClick={() => toggleChannel(ch.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {ch.icon}
                      <span className="text-xs font-bold text-slate-900">{ch.label}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{ch.desc}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Step 4: Multi-Step Escalation Workflow */}
        <Card
          title="4. Escalation Workflow Sequence"
          subtitle="Define sequential recovery steps and delays between retry actions"
          headerAction={
            <Button type="button" variant="outline" size="xs" onClick={addWorkflowStep} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Step
            </Button>
          }
        >
          <div className="space-y-3">
            {workflowSteps.map((step, index) => (
              <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3 text-xs">
                <span className="font-bold text-slate-900 w-16">Step {index + 1}:</span>
                
                <div className="flex-1">
                  <select
                    value={step.action}
                    onChange={(e) => {
                      const val = e.target.value as RecoveryAction;
                      setWorkflowSteps((prev) =>
                        prev.map((s, i) => (i === index ? { ...s, action: val } : s))
                      );
                    }}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 text-xs"
                  >
                    <option value="WHATSAPP_PAYMENT_LINK">Dispatch WhatsApp Deep-Link</option>
                    <option value="SMART_AUTO_RETRY">Execute Smart Gateway Retry</option>
                    <option value="SMS_PAYMENT_LINK">Send SMS Fallback Link</option>
                    <option value="EMAIL_INVOICE_PROMPT">Send Email Invoice Prompt</option>
                    <option value="MANDATE_REAUTHORIZE">Prompt Mandate Re-authorization</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-slate-500">Delay:</span>
                  <input
                    type="number"
                    value={step.delayMinutes}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setWorkflowSteps((prev) =>
                        prev.map((s, i) => (i === index ? { ...s, delayMinutes: val } : s))
                      );
                    }}
                    className="w-16 border border-slate-300 rounded px-2 py-1 bg-white text-slate-900 text-xs"
                  />
                  <span className="text-slate-500">mins</span>
                </div>

                {workflowSteps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeWorkflowStep(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    title="Remove step"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Action Button */}
        <div className="flex justify-end gap-3">
          <Link to="/campaigns">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button variant="emerald" type="submit" isLoading={isLoading} leftIcon={<Sparkles className="w-4 h-4" />}>
            Create & Save Campaign
          </Button>
        </div>
      </form>
    </div>
  );
};
