import React, { useState } from 'react';
import { DocumentAnalysis } from '../types';
import { Icons } from './ui/Icons';
import ReactMarkdown from 'react-markdown';

interface AnalysisResultProps {
  data: DocumentAnalysis;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'data' | 'raw'>('summary');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data.keyEntities, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'summary' 
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'data' 
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          Structured Data
        </button>
        <button
          onClick={() => setActiveTab('raw')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'raw' 
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          Raw Text
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        {activeTab === 'summary' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                {data.documentType}
              </span>
            </div>
            <div className="prose prose-slate prose-sm max-w-none">
              <p className="text-slate-700 leading-relaxed text-base">
                {data.summary}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="relative animate-in fade-in duration-300">
             <div className="flex justify-end mb-2">
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  {copied ? <Icons.Check className="w-3.5 h-3.5" /> : <Icons.Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy JSON'}
                </button>
             </div>
            
            {data.keyEntities ? (
              <div className="grid gap-3">
                {Object.entries(data.keyEntities).map(([key, value]) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-baseline justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 sm:mb-0">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-medium text-slate-800 break-all sm:text-right pl-0 sm:pl-4">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                No structured entities found.
              </div>
            )}
          </div>
        )}

        {activeTab === 'raw' && (
          <div className="animate-in fade-in duration-300">
            <pre className="whitespace-pre-wrap font-mono text-xs text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200 leading-relaxed">
              {data.rawText || "No text extracted."}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
