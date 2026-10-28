import React, { useState } from 'react';
import { X, Database, Check, AlertCircle, Copy, ExternalLink, Shield } from 'lucide-react';
import { getSupabaseCredentials, setSupabaseOverride, getSupabase } from '@/lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCredentialsUpdated: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onCredentialsUpdated,
}) => {
  const currentCreds = getSupabaseCredentials();
  const [url, setUrl] = useState(currentCreds.url);
  const [anonKey, setAnonKey] = useState(
    currentCreds.anonKey === 'paste_the_copied_anon_key_here' ? '' : currentCreds.anonKey
  );
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const sqlSchema = `-- Run this in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS material_payment_releases (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  payment_request_no TEXT,
  project_name TEXT,
  project_code TEXT,
  supplier TEXT,
  total_amount NUMERIC,
  data JSONB NOT NULL,
  verified_by_zoha BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'APPROVED FOR PAYMENT',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable open read/write for this tool (or configure RLS):
ALTER TABLE material_payment_releases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all" ON material_payment_releases;
CREATE POLICY "Allow anon all" ON material_payment_releases
  FOR ALL TO anon USING (true) WITH CHECK (true);`;

  const handleSave = () => {
    setSupabaseOverride(url.trim(), anonKey.trim());
    onCredentialsUpdated();
    testConnection();
  };

  const testConnection = async () => {
    setTestStatus('testing');
    setStatusMsg('Testing connection to Supabase...');
    try {
      const client = getSupabase();
      if (!client) {
        setTestStatus('error');
        setStatusMsg('Supabase credentials incomplete or invalid.');
        return;
      }

      // Test query
      const { data, error } = await client
        .from('material_payment_releases')
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist yet
          setTestStatus('error');
          setStatusMsg(
            'Connected to Supabase project! However, the table "material_payment_releases" is not created yet. Please copy the SQL below and run it in the Supabase SQL Editor.'
          );
        } else {
          setTestStatus('error');
          setStatusMsg(`Supabase error: ${error.message}`);
        }
      } else {
        setTestStatus('success');
        setStatusMsg('Connected successfully! Table "material_payment_releases" is ready.');
      }
    } catch (err: any) {
      setTestStatus('error');
      setStatusMsg(`Connection failed: ${err?.message || 'Network error'}`);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100 z-10">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Supabase Cloud Database</h3>
              <p className="text-xs text-slate-400">Permanent cloud storage for all payment slips</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 my-5 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyz.supabase.co"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-[#C8A96A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Supabase Anon Key
            </label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-[#C8A96A] focus:outline-none font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Found in your Supabase Dashboard under Project Settings &gt; API.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#C8A96A] hover:bg-[#d4b779] text-slate-950 font-bold rounded-lg transition-colors shadow-md"
            >
              Save &amp; Connect
            </button>
            <button
              onClick={testConnection}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition-colors border border-slate-700"
            >
              Test Connection
            </button>
          </div>

          {testStatus !== 'idle' && (
            <div
              className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs ${
                testStatus === 'success'
                  ? 'bg-emerald-950/40 border-emerald-700 text-emerald-300'
                  : testStatus === 'error'
                  ? 'bg-amber-950/40 border-amber-700 text-amber-200'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              {testStatus === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              ) : testStatus === 'error' ? (
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              ) : (
                <Database className="w-4 h-4 text-slate-400 animate-spin mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 leading-relaxed">{statusMsg}</div>
            </div>
          )}

          {/* SQL Snippet */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#C8A96A]" />
                Supabase SQL Table Setup (Run once)
              </span>
              <button
                onClick={handleCopySql}
                className="text-[11px] text-[#C8A96A] hover:underline flex items-center gap-1"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy SQL</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-400 overflow-x-auto max-h-36">
              {sqlSchema}
            </pre>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
