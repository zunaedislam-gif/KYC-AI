import React, { useState } from 'react';
import { History, Shield, Filter, Search, User, Cpu, AlertCircle, ArrowUpRight } from 'lucide-react';
import { AuditEvent } from '../types/kyc';

interface AuditHistoryViewProps {
  events: AuditEvent[];
  selectedCaseId?: string;
  onSelectCaseId?: (caseId: string) => void;
}

export const AuditHistoryView: React.FC<AuditHistoryViewProps> = ({
  events,
  selectedCaseId,
  onSelectCaseId,
}) => {
  const [actorFilter, setActorFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const filteredEvents = events.filter((e) => {
    const matchesActor = actorFilter === 'ALL' || e.actor === actorFilter;
    const matchesCase = !selectedCaseId || e.caseId === selectedCaseId;
    const matchesSearch =
      e.summary.toLowerCase().includes(search.toLowerCase()) ||
      e.actionType.toLowerCase().includes(search.toLowerCase()) ||
      e.actor.toLowerCase().includes(search.toLowerCase()) ||
      e.caseId.toLowerCase().includes(search.toLowerCase());
    return matchesActor && matchesCase && matchesSearch;
  });

  const getActorBadge = (actor: string) => {
    if (actor === 'SYSTEM') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-200 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl">
          <Cpu className="w-4 h-4 text-slate-400" />
          <span>SYSTEM</span>
        </span>
      );
    }
    if (actor === 'OCR_ENGINE') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-300 bg-indigo-950 border border-indigo-700 px-3 py-1.5 rounded-xl">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>OCR_ENGINE</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-300 bg-emerald-950 border border-emerald-700 px-3 py-1.5 rounded-xl">
        <User className="w-4 h-4 text-emerald-400" />
        <span>{actor}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 w-full">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3 tracking-tight">
              <History className="w-7 h-7 text-indigo-400" />
              <span>Immutable Audit Trail &amp; Governance Ledger</span>
            </h1>
            <p className="text-base text-slate-300 leading-relaxed max-w-3xl">
              Chronological ledger tracking document ingestion, OCR verdicts, human reviewer
              corrections, and case workflow state transitions.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm sm:text-base text-slate-300 font-mono tabular-nums bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-800">
              Total Log Entries: <strong className="text-white font-bold">{events.length}</strong>
            </span>
          </div>
        </div>

        {/* Filter Toolbar - Large & Roomy */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 pt-4 border-t border-slate-800">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit actions, descriptions, case IDs, actors..."
              className="w-full pl-12 pr-4 py-3 text-sm sm:text-base bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
            />
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-400 font-bold whitespace-nowrap">Filter Actor:</span>
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
            >
              <option value="ALL">All Actors</option>
              <option value="SYSTEM">SYSTEM</option>
              <option value="OCR_ENGINE">OCR Engine</option>
              <option value="APPLICANT">Applicant</option>
              <option value="REV-401">REV-401 (Sarah K.)</option>
              <option value="REV-802">REV-802 (Marcus V.)</option>
              <option value="REV-999">REV-999 (Lead)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Table - Large, High Contrast, Clear */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {filteredEvents.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-base">
            No audit records match the current filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm sm:text-base border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-wider text-xs sm:text-sm font-bold">
                  <th className="py-4.5 px-6">Timestamp (UTC)</th>
                  <th className="py-4.5 px-6">Actor</th>
                  <th className="py-4.5 px-6">Action Type</th>
                  <th className="py-4.5 px-6">Audit Summary</th>
                  <th className="py-4.5 px-6">Case Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="py-4.5 px-6 font-mono tabular-nums text-slate-400 text-xs sm:text-sm whitespace-nowrap">
                      {new Date(evt.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>

                    <td className="py-4.5 px-6 whitespace-nowrap">
                      {getActorBadge(evt.actor)}
                    </td>

                    <td className="py-4.5 px-6 font-mono font-bold text-white whitespace-nowrap text-xs sm:text-sm">
                      {evt.actionType}
                    </td>

                    <td className="py-4.5 px-6 text-slate-200">
                      <div className="font-semibold text-white text-sm sm:text-base">
                        {evt.summary}
                      </div>
                      <div className="text-xs text-indigo-400 font-mono mt-0.5">
                        Case: {evt.caseId}
                      </div>
                    </td>

                    <td className="py-4.5 px-6 font-mono text-xs text-slate-400">
                      {evt.detailsMasked ? (
                        <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 max-w-sm truncate text-slate-300">
                          {JSON.stringify(evt.detailsMasked)}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
