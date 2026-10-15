import React, { useState } from 'react';
import { X, Upload, Check, Sparkles, FileText, UserPlus, Info } from 'lucide-react';
import { DocumentType, SampleIdentity } from '../types/kyc';

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  samples: SampleIdentity[];
  onSubmit: (data: {
    fullName: string;
    dateOfBirth: string;
    documentType: DocumentType;
    documentId: string;
    nationality: string;
    address: string;
    selectedSampleId?: string;
    customFile?: File;
  }) => Promise<void>;
}

export const NewCaseModal: React.FC<NewCaseModalProps> = ({
  isOpen,
  onClose,
  samples,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'sample' | 'custom'>('sample');
  const [selectedSampleId, setSelectedSampleId] = useState<string>(
    samples[0]?.id || 'sample-alex-mercer'
  );

  // Form Fields
  const [fullName, setFullName] = useState('Alex Mercer');
  const [dateOfBirth, setDateOfBirth] = useState('1988-06-14');
  const [documentType, setDocumentType] = useState<DocumentType>('GENERIC_ID_CARD');
  const [documentId, setDocumentId] = useState('HZ-8849-2194');
  const [nationality, setNationality] = useState('Republic of Horizon');
  const [address, setAddress] = useState('742 Evergreen Terrace, Sector 4, Horizon City');

  const [customFile, setCustomFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handler for selecting a pre-configured sample
  const handleSelectSample = (sampleId: string) => {
    setSelectedSampleId(sampleId);
    const sample = samples.find((s) => s.id === sampleId);
    if (sample) {
      setFullName(sample.declaredData.fullName);
      setDateOfBirth(sample.declaredData.dateOfBirth);
      setDocumentType(sample.declaredData.documentType);
      setDocumentId(sample.declaredData.documentId);
      setNationality(sample.declaredData.nationality || 'Republic of Horizon');
      setAddress(sample.declaredData.address || '');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File exceeds 10MB limit.');
        return;
      }
      setCustomFile(file);
      setError(null);
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !dateOfBirth.trim() || !documentId.trim()) {
      setError('Please fill in all mandatory customer fields.');
      return;
    }

    if (mode === 'custom' && !customFile) {
      setError('Please attach an identity document image.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        fullName,
        dateOfBirth,
        documentType,
        documentId,
        nationality,
        address,
        selectedSampleId: mode === 'sample' ? selectedSampleId : undefined,
        customFile: mode === 'custom' && customFile ? customFile : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to initialize case');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header - Large & Clear */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-700 flex items-center justify-center text-indigo-400">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Create Onboarding &amp; Verification Case
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Declare customer application details and attach identity document for automated verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 text-sm bg-rose-950/80 border border-rose-800 text-rose-200 rounded-2xl font-medium">
              {error}
            </div>
          )}

          {/* Mode Selector - Big Pills */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('sample');
                handleSelectSample(selectedSampleId);
              }}
              className={`flex-1 py-3 text-sm sm:text-base font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'sample'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Benchmark Synthetic Scenarios (Instant Testing)
            </button>
            <button
              type="button"
              onClick={() => setMode('custom')}
              className={`flex-1 py-3 text-sm sm:text-base font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'custom'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Upload Custom Document File
            </button>
          </div>

          {/* Scenario Selection Grid if Mode == 'sample' */}
          {mode === 'sample' && (
            <div className="space-y-3">
              <label className="text-base font-bold text-slate-200">
                Choose Synthetic Test Identity &amp; Specimen
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {samples.map((s) => {
                  const isSelected = selectedSampleId === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSample(s.id)}
                      className={`p-5 rounded-2xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-950/50 shadow-md ring-2 ring-indigo-500/50'
                          : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-white">{s.name}</span>
                        {isSelected && <Check className="w-5 h-5 text-indigo-400" />}
                      </div>
                      <div className="text-xs font-bold text-indigo-300 font-mono mt-1">
                        {s.scenarioTitle.split(':')[1] || s.scenarioTitle}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                        {s.scenarioDescription}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom File Upload if Mode == 'custom' */}
          {mode === 'custom' && (
            <div className="space-y-3">
              <label className="text-base font-bold text-slate-200">
                Upload Identity Document (PNG, JPEG, WebP, SVG, Max 10MB)
              </label>
              <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-3xl p-8 text-center bg-slate-950/60 transition-colors">
                <input
                  type="file"
                  id="fileUploadInput"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="fileUploadInput" className="cursor-pointer space-y-3 block">
                  <Upload className="w-12 h-12 text-indigo-400 mx-auto" />
                  <div className="text-base font-bold text-slate-200">
                    {customFile ? customFile.name : 'Click to select or drag and drop image'}
                  </div>
                  <div className="text-xs text-slate-400">
                    MIME types verified. File is processed temporarily in memory.
                  </div>
                </label>
                {filePreviewUrl && (
                  <div className="mt-4 max-h-48 overflow-hidden rounded-2xl border border-slate-800 flex justify-center bg-slate-950 p-3">
                    <img
                      src={filePreviewUrl}
                      alt="Upload Preview"
                      className="max-h-48 object-contain rounded-xl"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Declared Customer Fields */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">
              Customer Declared Information (Application Form)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-200 mb-2">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-3 text-base bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-200 mb-2">
                  Date of Birth (YYYY-MM-DD) *
                </label>
                <input
                  type="text"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  placeholder="1990-05-12"
                  required
                  className="w-full px-4 py-3 text-base font-mono bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-200 mb-2">
                  Document Type *
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                  className="w-full px-4 py-3 text-base bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-inner"
                >
                  <option value="GENERIC_ID_CARD">Generic Identity Card</option>
                  <option value="GENERIC_PASSPORT_PAGE">Generic Passport Bio Page</option>
                  <option value="GENERIC_APPLICATION_FORM">Customer Application Form</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-200 mb-2">
                  Document ID Number *
                </label>
                <input
                  type="text"
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  placeholder="HZ-8849-2194"
                  required
                  className="w-full px-4 py-3 text-base font-mono bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-200 mb-2">
                  Nationality / Issuing State
                </label>
                <input
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full px-4 py-3 text-base bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-200 mb-2">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 text-base bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-3 text-sm font-semibold text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-3.5 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-2xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-95"
            >
              {submitting ? 'Creating Case & Running OCR...' : 'Create Case & Process OCR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
