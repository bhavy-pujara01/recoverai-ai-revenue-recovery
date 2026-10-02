import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatINR, getChannelLabel } from '../../utils/formatters';
import { transactionsApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { Zap, Layers, MessageSquare, RefreshCw, Send } from 'lucide-react';
import { RecoveryChannel } from '../../types';

export interface BatchActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  totalSelectedAmount: number;
  onSuccess: () => void;
}

export const BatchActionModal: React.FC<BatchActionModalProps> = ({
  isOpen,
  onClose,
  selectedIds,
  totalSelectedAmount,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [channel, setChannel] = useState<RecoveryChannel>('WHATSAPP');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleBatchExecute = async () => {
    setIsLoading(true);
    try {
      const res = await transactionsApi.batchRecover({
        transactionIds: selectedIds,
        channel,
      });

      showToast({
        type: 'recovery',
        title: 'Batch Recovery Completed',
        message: `Successfully recovered ${res.summary.recoveredCount} of ${res.summary.total} payments (${formatINR(res.summary.recoveredAmount)}).`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Batch Recovery Failed',
        message: error.response?.data?.error || 'Failed to execute batch recovery.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Batch Revenue Recovery"
      description={`Trigger multi-channel recovery for ${selectedIds.length} selected failed transactions`}
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="emerald"
            onClick={handleBatchExecute}
            isLoading={isLoading}
            leftIcon={<Zap className="w-4 h-4" />}
          >
            Recover {selectedIds.length} Payments ({formatINR(totalSelectedAmount)})
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-950">{selectedIds.length} Transactions Selected</p>
              <p className="text-[11px] text-emerald-800">Deterministic routing applied to all items</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-emerald-800">Total Volume:</span>
            <div className="text-sm font-bold text-emerald-900">{formatINR(totalSelectedAmount)}</div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Primary Routing Channel</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'WHATSAPP' as RecoveryChannel, label: 'WhatsApp', icon: <MessageSquare className="w-4 h-4 text-emerald-600" /> },
              { id: 'WEBHOOK_RETRY' as RecoveryChannel, label: 'Gateway Webhook', icon: <RefreshCw className="w-4 h-4 text-blue-600" /> },
            ].map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => setChannel(c.id)}
                className={`p-3 rounded-lg border text-left flex items-center gap-2 text-xs font-medium transition-all ${
                  channel === c.id
                    ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {c.icon}
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
          RecoverAI will evaluate each transaction against our explainability matrix and dispatch personalized recovery sequences with real-time state synchronization.
        </p>
      </div>
    </Modal>
  );
};
