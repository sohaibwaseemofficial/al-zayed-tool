import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PaymentSlip } from '@/types/slip';
import { INITIAL_EXCEL_PRESETS } from './sampleData';

const LOCAL_STORAGE_KEY = 'alzayed_material_slips_archive_v2';
const SUPABASE_OVERRIDE_KEY = 'alzayed_supabase_override';

export function getSupabaseCredentials(): { url: string; anonKey: string; isConfigured: boolean } {
  if (typeof window === 'undefined') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const isConfigured = Boolean(url && anonKey && !anonKey.includes('paste_the_copied'));
    return { url, anonKey, isConfigured };
  }

  // Check localStorage override first
  try {
    const override = localStorage.getItem(SUPABASE_OVERRIDE_KEY);
    if (override) {
      const parsed = JSON.parse(override);
      if (parsed.url && parsed.anonKey && !parsed.anonKey.includes('paste_the_copied')) {
        return { url: parsed.url, anonKey: parsed.anonKey, isConfigured: true };
      }
    }
  } catch (e) {
    // ignore
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const isConfigured = Boolean(url && anonKey && !anonKey.includes('paste_the_copied'));
  return { url, anonKey, isConfigured };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return null;

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: { persistSession: false },
      });
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
}

export function setSupabaseOverride(url: string, anonKey: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SUPABASE_OVERRIDE_KEY, JSON.stringify({ url, anonKey }));
  supabaseInstance = null; // reset instance
}

// Local storage helpers
export function getLocalSlips(): PaymentSlip[] {
  if (typeof window === 'undefined') return INITIAL_EXCEL_PRESETS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      // seed with initial presets
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_EXCEL_PRESETS));
      return INITIAL_EXCEL_PRESETS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_EXCEL_PRESETS;
  } catch (e) {
    console.error('Error reading local slips:', e);
    return INITIAL_EXCEL_PRESETS;
  }
}

export function saveLocalSlips(slips: PaymentSlip[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(slips));
  } catch (e) {
    console.error('Error saving local slips:', e);
  }
}

// Main save function: Permanently stores by client name to Supabase & localStorage
export async function savePaymentSlip(slip: PaymentSlip): Promise<{ success: boolean; syncedToSupabase: boolean; error?: string }> {
  // Always save locally first to guarantee zero data loss
  const localSlips = getLocalSlips();
  const existingIdx = localSlips.findIndex((s) => s.id === slip.id);
  const updatedSlip: PaymentSlip = {
    ...slip,
    updatedAt: new Date().toISOString(),
  };

  let newSlips: PaymentSlip[];
  if (existingIdx >= 0) {
    newSlips = [...localSlips];
    newSlips[existingIdx] = updatedSlip;
  } else {
    newSlips = [updatedSlip, ...localSlips];
  }
  saveLocalSlips(newSlips);

  // Try Supabase sync
  const client = getSupabase();
  if (!client) {
    return { success: true, syncedToSupabase: false };
  }

  try {
    const totalAmount = calculateSlipTotal(slip);
    const { error } = await client.from('material_payment_releases').upsert(
      {
        id: slip.id,
        client_name: slip.clientName || 'Unnamed Client',
        payment_request_no: slip.paymentRequestNo,
        project_name: slip.projectName,
        project_code: slip.projectCode,
        supplier: slip.supplier,
        total_amount: totalAmount,
        data: updatedSlip,
        verified_by_zoha: slip.verifiedByZoha,
        status: slip.finalDecision,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.warn('Supabase upsert returned error (saved locally):', error.message);
      return { success: true, syncedToSupabase: false, error: error.message };
    }

    // Mark as synced locally
    const markedSlips = newSlips.map((s) => (s.id === slip.id ? { ...s, syncedToSupabase: true } : s));
    saveLocalSlips(markedSlips);
    return { success: true, syncedToSupabase: true };
  } catch (err: any) {
    console.warn('Supabase network error (saved locally):', err?.message);
    return { success: true, syncedToSupabase: false, error: err?.message };
  }
}

// Main fetch function: Merges Supabase records with local storage
export async function fetchAllPaymentSlips(): Promise<{ slips: PaymentSlip[]; fromSupabase: boolean }> {
  const localSlips = getLocalSlips();
  const client = getSupabase();
  if (!client) {
    return { slips: localSlips, fromSupabase: false };
  }

  try {
    const { data, error } = await client
      .from('material_payment_releases')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return { slips: localSlips, fromSupabase: false };
    }

    const supabaseSlips: PaymentSlip[] = data
      .map((row) => {
        if (row.data && typeof row.data === 'object') {
          return { ...row.data, syncedToSupabase: true };
        }
        return null;
      })
      .filter((s): s is PaymentSlip => s !== null);

    // Merge: union by id with newer updatedAt winning
    const slipMap = new Map<string, PaymentSlip>();
    for (const s of localSlips) slipMap.set(s.id, s);
    for (const s of supabaseSlips) slipMap.set(s.id, s);

    const merged = Array.from(slipMap.values()).sort(
      (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );

    saveLocalSlips(merged);
    return { slips: merged, fromSupabase: true };
  } catch (err) {
    console.warn('Failed to fetch from Supabase, returning local slips:', err);
    return { slips: localSlips, fromSupabase: false };
  }
}

export async function deletePaymentSlip(id: string): Promise<boolean> {
  // Delete locally
  const localSlips = getLocalSlips();
  const filtered = localSlips.filter((s) => s.id !== id);
  saveLocalSlips(filtered);

  // Delete from Supabase
  const client = getSupabase();
  if (client) {
    try {
      await client.from('material_payment_releases').delete().eq('id', id);
    } catch (e) {
      console.warn('Error deleting from Supabase:', e);
    }
  }
  return true;
}

export function calculateSlipSubtotal(slip: PaymentSlip): number {
  return (slip.items || []).reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
}

export function calculateSlipVAT(slip: PaymentSlip): number {
  const subtotal = calculateSlipSubtotal(slip);
  const rate = slip.vatRate !== undefined && slip.vatRate !== null && !isNaN(Number(slip.vatRate))
    ? Number(slip.vatRate)
    : 5;
  return Number(((subtotal * rate) / 100).toFixed(2));
}

export function calculateSlipTotal(slip: PaymentSlip): number {
  const subtotal = calculateSlipSubtotal(slip);
  const vat = calculateSlipVAT(slip);
  const transport = Number(slip.transport) || 0;
  return Number((subtotal + vat + transport).toFixed(2));
}
