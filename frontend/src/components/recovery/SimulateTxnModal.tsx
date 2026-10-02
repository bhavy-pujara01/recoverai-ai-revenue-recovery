import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Customer } from '../../types';
import { customersApi, transactionsApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { PlusCircle, Sparkles, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface SimulateTxnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const SimulateTxnModal: React.FC<SimulateTxnModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [amount, setAmount] = useState<number>(4999);
  const [failureCategory, setFailureCategory] = useState<string>('TRANSIENT_GATEWAY');
  const [failureReason, setFailureReason] = useState<string>('Gateway 504 Timeout on Acquirer Switch');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI_INTENT');
  const [cardIssuer, setCardIssuer] = useState<string>('HDFC Bank');
  const [upiApp, setUpiApp] = useState<string>('Google Pay');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      customersApi.list({ limit: 50 }).then((res) => {
        setCustomers(res.data);
        if (res.data.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(res.data[0].id);
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  const presetScenarios = [
    {
      label: '₹24,999 Enterprise Mandate Lapsed',
      amount: 24999,
      category: 'MANDATE_ISSUE',
      reason: 'eNACH Standing Mandate Authorization Lapsed by Issuing Bank',
      method: 'ENACH_MANDATE',
      issuer: 'State Bank of India',
    },
    {
      label: '₹4,999 UPI Timeout (Google Pay)',
      amount: 4999,
      category: 'TRANSIENT_GATEWAY',
      reason: 'Gateway Timeout (504 on NPCI Switch)',
      method: 'UPI_INTENT',
      upiApp: 'Google Pay',
    },
    {
      label: '₹18,750 Credit Card 3DS Drop-off',
      amount: 18750,
      category: 'CUSTOMER_DROPOFF',
      reason: '3DS OTP Verification Expired during checkout',
      method: 'CREDIT_CARD',
      issuer: 'ICICI Bank',
    },
    {
      label: '₹85,000 High-Value Fraud Velocity Block',
      amount: 85000,
      category: 'FRAUD_RESTRICTION',
      reason: 'High Velocity Risk Shield Block Triggered',
      method: 'CREDIT_CARD',
      issuer: 'Standard Chartered',
    },
  ];

  const applyPreset = (preset: any) => {
    setAmount(preset.amount);
    setFailureCategory(preset.category);
    setFailureReason(preset.reason);
    setPaymentMethod(preset.method);
    if (preset.issuer) setCardIssuer(preset.issuer);
    if (preset.upiApp) setUpiApp(preset.upiApp);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const createdTxn = await transactionsApi.simulate({
        customerId: selectedCustomerId,
        amount: Number(amount),
        failureCategory,
        failureReason,
        paymentMethod,
        cardIssuer: paymentMethod.includes('CARD') ? cardIssuer : undefined,
        upiApp: paymentMethod.startsWith('UPI') ? upiApp : undefined,
      });

      showToast({
        type: 'info',
        title: 'Failed Payment Injected',
        message: `Created txn ${createdTxn.externalTxnId}. Recovery Engine generated real-time recommendation.`,
      });

      if (onCreated) onCreated();
      onClose();
      navigate(`/transactions/${createdTxn.id}`);
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Failed to Inject Transaction',
        message: error.response?.data?.error || 'Error creating test payment.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulate / Inject Failed Payment"
      description="Create a real failed transaction in the ledger to test the recovery intelligence pipeline live."
      maxWidth="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="emerald"
            onClick={handleSubmit}
            isLoading={isLoading}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Inject & Analyze Payment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick Presets */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Quick Test Presets</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {presetScenarios.map((p, i) => (
              <button
                type="button"
                key={i}
                onClick={() => applyPreset(p)}
                className="text-left p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-xs text-slate-800 transition-all truncate"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Customer select */}
        <Select
          label="Customer Account"
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
          options={customers.map((c) => ({
            value: c.id,
            label: `${c.name} (${c.businessName || c.segment}) — LTV: ₹${c.lifetimeValue.toLocaleString('en-IN')}`,
          }))}
        />

        {/* Amount */}
        <Input
          label="Failed Amount (INR ₹)"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="e.g. 4999"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Failure Category */}
          <Select
            label="Failure Classification"
            value={failureCategory}
            onChange={(e) => setFailureCategory(e.target.value)}
            options={[
              { value: 'TRANSIENT_GATEWAY', label: 'Transient Gateway Error' },
              { value: 'BANK_DECLINE', label: 'Issuer Bank Declined' },
              { value: 'BALANCE_LIMIT', label: 'Insufficient Funds / Balance' },
              { value: 'CUSTOMER_DROPOFF', label: '3DS OTP Drop-off' },
              { value: 'MANDATE_ISSUE', label: 'eNACH Mandate Lapsed' },
              { value: 'FRAUD_RESTRICTION', label: 'Fraud Shield Velocity Block' },
            ]}
          />

          {/* Payment Method */}
          <Select
            label="Payment Instrument"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { value: 'UPI_INTENT', label: 'UPI Intent (Google Pay / PhonePe)' },
              { value: 'UPI_COLLECT', label: 'UPI Collect' },
              { value: 'CREDIT_CARD', label: 'Credit Card' },
              { value: 'DEBIT_CARD', label: 'Debit Card' },
              { value: 'NET_BANKING', label: 'Net Banking' },
              { value: 'ENACH_MANDATE', label: 'eNACH Mandate' },
            ]}
          />
        </div>

        {/* Failure Reason Text */}
        <Input
          label="Gateway Error Description"
          value={failureReason}
          onChange={(e) => setFailureReason(e.target.value)}
          placeholder="e.g. Gateway Timeout (504 Gateway Timeout)"
          required
        />
      </form>
    </Modal>
  );
};
