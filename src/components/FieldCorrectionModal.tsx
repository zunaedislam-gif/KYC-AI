import React, { useState } from 'react';
import { X, Check, Edit3, ShieldAlert } from 'lucide-react';
import { ExtractedField } from '../types/kyc';

interface FieldCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: ExtractedField | null;
  reviewerId: string;
  onSubmit: (data: {
    fieldName: string;
    correctedValue: string;
    reason: string;
    reviewerId: string;
  }) => Promise<void>;
}

export const FieldCorrectionModal: React.FC<FieldCorrectionModalProps> = ({
  isOpen,
  onClose,
  field,
  reviewerId,
  onSubmit,
}) => {
  if (!isOpen || !field) return null;

  const [newValue, setNewValue] = useState(field.normalizedValue || field.rawValue || '');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) {
      setError('Corrected value cannot be blank.');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a mandatory audit explanation reason.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        fieldName: field.fieldName,
        correctedValue: newValue.trim(),
        reason: reason.trim(),
        reviewerId,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit correction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-700 flex items-center justify-center text-indigo-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Correct OCR Field: <span className="font-mono text-indigo-300">{field.fieldName}</span>
              </h3>
              <p className="text-xs text-slate-400">Human reviewer manual override &amp; audit annotation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3.5 text-sm bg-rose-950/80 border border-rose-800 text-rose-200 rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2 text-sm">
            <div className="text-slate-400 font-medium">Raw OCR Engine Readout:</div>
            <div className="font-mono text-white text-base bg-slate-900 p-3 rounded-xl border border-slate-800 font-bold">
              {field.rawValue || '[EMPTY / UNREADABLE]'}
            </div>
            {field.confidence !== null && (
              <div className="text-xs text-slate-400">
                OCR Confidence Score:{' '}
                <span className="font-mono font-bold text-indigo-300">{field.confidence}%</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-200 mb-2">
              Corrected Normalized Value *
            </label>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              required
              className="w-full px-4 py-3 text-base font-mono bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 shadow-inner"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-200 mb-2">
              Audit Justification / Correction Reason *
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Corrected character misread ('0' confused for 'O') verified by inspecting visual zone photo specimen."
              required
              className="w-full px-4 py-3 text-sm sm:text-base bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none shadow-inner"
            />
            <div className="mt-2 flex items-center gap-2 text-xs text-amber-400/90 font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Immutable audit event will be recorded under reviewer ID {reviewerId}.</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
            >
              {submitting ? 'Recording Correction...' : 'Save Correction & Re-evaluate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
