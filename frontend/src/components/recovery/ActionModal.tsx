import React, { useState } from 'react';
import { Transaction, RecoveryChannel, RecoveryAction } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatINR, getChannelLabel, getActionLabel } from '../../utils/formatters';
import { transactionsApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { MessageSquare, Mail, Smartphone, RefreshCw, Send, CheckCircle2, ShieldAlert } from 'lucide-react';

export interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  onSuccess: () => void;
}

export const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const defaultChannel = (transaction.recommendation?.recommendedChannel || 'WHATSAPP') as RecoveryChannel;
  const defaultAction = (transaction.recommendation?.recommendedAction || 'WHATSAPP_PAYMENT_LINK') as RecoveryAction;

  const [channel, setChannel] = useState<RecoveryChannel>(defaultChannel);
  const [actionType, setActionType] = useState<RecoveryAction>(defaultAction);
  const [forceSuccess, setForceSuccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleExecute = async () => {
    setIsLoading(true);
    try {
      const res = await transactionsApi.executeRecovery(transaction.id, {
        channel,
        actionType,
        forceSuccess: forceSuccess !== null ? forceSuccess : undefined,
      });

      if (res.data.success) {
        showToast({
          type: 'recovery',
          title: 'Payment Successfully Recovered!',
          message: `Recovered ${formatINR(transaction.amount)} from ${transaction.customer.name} via ${getChannelLabel(channel)}.`,
        });
      } else {
        showToast({
          type: 'error',
          title: 'Recovery Attempt Failed',
          message: 'Payment retry was declined by the customer or issuing bank.',
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Recovery Execution Failed',
        message: error.response?.data?.error || 'Network error occurred during recovery attempt.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const channelOptions: { value: RecoveryChannel; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      value: 'WHATSAPP',
      label: 'WhatsApp Interactive Link',
      icon: <MessageSquare className="w-4 h-4 text-emerald-600" />,
      desc: 'Interactive 1-click UPI deep-link. 88% Indian consumer open rate.',
    },
    {
      value: 'WEBHOOK_RETRY',
      label: 'Smart Gateway Webhook Retry',
      icon: <RefreshCw className="w-4 h-4 text-blue-600" />,
      desc: 'Autonomous background retry against acquirer switch.',
    },
    {
      value: 'SMS',
      label: 'SMS Fallback Link',
      icon: <Smartphone className="w-4 h-4 text-purple-600" />,
      desc: 'Direct payment link delivered via telecom SMS gateway.',
    },
    {
      value: 'EMAIL',
      label: 'Email Invoice & Mandate Prompt',
      icon: <Mail className="w-4 h-4 text-slate-600" />,
      desc: 'Detailed invoice breakdown and one-click authorization button.',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Execute Recovery Action"
      description={`Recover failed payment ${transaction.externalTxnId} for ${transaction.customer.name}`}
      maxWidth="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="emerald"
            onClick={handleExecute}
            isLoading={isLoading}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Dispatch Recovery ({formatINR(transaction.amount)})
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Payment Summary */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500">Customer:</span>{' '}
            <strong className="text-slate-900">{transaction.customer.name}</strong> ({transaction.customer.phone})
          </div>
          <div>
            <span className="text-slate-500">Amount:</span>{' '}
            <strong className="text-emerald-700 text-sm font-bold">{formatINR(transaction.amount)}</strong>
          </div>
        </div>

        {/* Channel Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Select Recovery Channel</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {channelOptions.map((opt) => (
              <div
                key={opt.value}
                onClick={() => setChannel(opt.value)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  channel === opt.value
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  {opt.icon}
                  <span className="text-xs font-semibold text-slate-900">{opt.label}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{opt.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Action Strategy</label>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value as RecoveryAction)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800"
          >
            <option value="WHATSAPP_PAYMENT_LINK">Instant WhatsApp Deep-Link</option>
            <option value="SMART_AUTO_RETRY">Smart Gateway Auto-Retry</option>
            <option value="SMS_PAYMENT_LINK">SMS Fallback Payment Link</option>
            <option value="EMAIL_INVOICE_PROMPT">Email Invoice & Mandate Prompt</option>
            <option value="MANDATE_REAUTHORIZE">eNACH Mandate Re-authorization</option>
            <option value="MANUAL_CALL_ESCALATION">Manual VIP Account Outreach</option>
          </select>
        </div>

        {/* Live Channel Template Preview */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Message / Action Preview</label>
          <div className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono space-y-1">
            {channel === 'WHATSAPP' && (
              <>
                <p className="text-emerald-400 font-semibold">[WhatsApp Business API]</p>
                <p>Hi {transaction.customer.name}, your payment of {formatINR(transaction.amount)} for Order #{transaction.orderId} could not be completed.</p>
                <p className="text-emerald-300 underline">Tap here to complete instantly with 1-click UPI / Card: https://pay.nexuspay.tech/r/{transaction.id.substring(0, 8)}</p>
              </>
            )}
            {channel === 'WEBHOOK_RETRY' && (
              <>
                <p className="text-blue-400 font-semibold">[Acquirer Gateway Switch Protocol]</p>
                <p>POST /v1/acquirer/retry-tokenized</p>
                <p>Payload: &#123; "order_id": "{transaction.orderId}", "amount": {transaction.amount}, "switch": "PRIMARY_GATEWAY" &#125;</p>
              </>
            )}
            {channel === 'SMS' && (
              <>
                <p className="text-purple-400 font-semibold">[SMS DLT Template: RECOV_PAY]</p>
                <p>Dear {transaction.customer.name}, your payment of {formatINR(transaction.amount)} was unsuccessful. Click to complete payment: https://pay.nexuspay.tech/r/{transaction.id.substring(0, 8)} - NexusPay</p>
              </>
            )}
            {channel === 'EMAIL' && (
              <>
                <p className="text-amber-400 font-semibold">[HTML Email: Payment Authorization Required]</p>
                <p>Subject: Action Required: Complete payment for {transaction.orderId}</p>
                <p>Dear {transaction.customer.name}, we were unable to process your recurring billing of {formatINR(transaction.amount)}.</p>
              </>
            )}
          </div>
        </div>

        {/* Simulation Override Control */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span className="text-[11px] text-slate-500">Simulation Outcome:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setForceSuccess(null)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                forceSuccess === null ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              Deterministic Roll ({Math.round(transaction.recommendation?.recoveryProbability || 75)}%)
            </button>
            <button
              type="button"
              onClick={() => setForceSuccess(true)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                forceSuccess === true ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              Force Success
            </button>
            <button
              type="button"
              onClick={() => setForceSuccess(false)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                forceSuccess === false ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              Force Decline
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
