import React from 'react';
import { VersionRecord } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, History, User, Calendar, FileText, Image } from 'lucide-react';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  versions?: VersionRecord[];
  currentValue?: {
    title?: string;
    description?: string;
    text?: string;
    image?: string;
  };
}

export function VersionHistoryModal({ isOpen, onClose, title, versions = [], currentValue }: VersionHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-left">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white text-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl relative flex flex-col max-h-[85vh]"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 hover:bg-slate-100 text-slate-400 hover:text-slate-900 p-2 rounded-full transition-colors cursor-pointer z-10"
            title="Close"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="border-b border-slate-100 pb-4 shrink-0">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
              <History size={16} className="text-blue-600" />
              Auditable Version History
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Revision log for <strong className="text-slate-700 font-bold">"{title}"</strong>. All previous modifications are fully preserved for transparency.
            </p>
          </div>

          {/* Versions List */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            {versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 font-mono text-xs text-center space-y-2">
                <span>📝 Original Version</span>
                <p className="text-[10px] text-slate-400 italic font-sans max-w-[280px]">
                  This record hasn't been modified yet. Its current text represents the pristine first draft.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Current Version */}
                {currentValue && (
                  <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl relative space-y-2">
                    <span className="absolute top-3 right-3 text-[8px] font-black uppercase bg-blue-600 text-white px-2 py-0.5 rounded-md tracking-wider">
                      Current Version
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-blue-700 font-bold uppercase tracking-wider">
                      <span>⚡ Present State</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-800">
                      {currentValue.title && (
                        <h4 className="font-bold text-slate-900">Title: {currentValue.title}</h4>
                      )}
                      {currentValue.description && (
                        <p className="leading-relaxed whitespace-pre-wrap"><span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Description:</span> {currentValue.description}</p>
                      )}
                      {currentValue.text && (
                        <p className="leading-relaxed whitespace-pre-wrap">{currentValue.text}</p>
                      )}
                      {currentValue.image && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1 font-mono">
                          <Image size={12} />
                          <span>Image URL: <span className="underline">{currentValue.image.substring(0, 45)}...</span></span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Previous Versions Timeline */}
                <div className="space-y-3.5 relative border-l-2 border-slate-100 pl-4 ml-2">
                  {versions.slice().reverse().map((version, idx) => {
                    return (
                      <div key={version.id || idx} className="relative space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 hover:bg-slate-100/50 transition-colors">
                        {/* Timeline dot */}
                        <div className="absolute -left-[23px] top-4 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white" />
                        
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] text-slate-500 font-mono">
                          <span className="flex items-center gap-1 bg-slate-200/75 px-1.5 py-0.5 rounded text-slate-700 font-bold uppercase">
                            v{versions.length - idx}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {version.timestamp}
                          </span>
                          <span className="flex items-center gap-1">
                            <User size={11} />
                            Edited by u/{version.editor}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-700">
                          {version.title && (
                            <h4 className="font-bold text-slate-950 font-sans">Title: {version.title}</h4>
                          )}
                          {version.description && (
                            <p className="leading-relaxed font-sans whitespace-pre-wrap">
                              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-0.5">Description:</span>
                              {version.description}
                            </p>
                          )}
                          {version.text && (
                            <p className="leading-relaxed font-sans whitespace-pre-wrap">{version.text}</p>
                          )}
                          {version.image && (
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono mt-1 bg-slate-200/40 p-1.5 rounded border border-slate-200">
                              <Image size={11} className="text-slate-400" />
                              <span className="truncate">Prev Image: {version.image}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
            <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">
              🛡️ Decentralized Revision Audit Log
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
