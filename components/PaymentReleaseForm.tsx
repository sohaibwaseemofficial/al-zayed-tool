import React, { forwardRef, useState } from 'react';
import { PaymentSlip, MaterialItem } from '@/types/slip';
import { calculateSlipSubtotal, calculateSlipVAT, calculateSlipTotal } from '@/lib/supabase';
import {
  MASTER_MATERIALS,
  MASTER_CLIENTS,
  MASTER_SUPPLIERS,
  MASTER_PROJECTS,
  PROJECT_TAG_SCOPES,
} from '@/lib/masterData';
import { SignatureModal } from './SignatureModal';
import { InlineDatePicker } from './InlineDatePicker';
import { CheckCircle2, ShieldCheck, PenTool } from 'lucide-react';

interface PaymentReleaseFormProps {
  slip: PaymentSlip;
  onChange: (updated: PaymentSlip) => void;
  isReadOnly?: boolean;
}

export const PaymentReleaseForm = forwardRef<HTMLDivElement, PaymentReleaseFormProps>(
  ({ slip, onChange, isReadOnly = false }, ref) => {
    const subtotal = calculateSlipSubtotal(slip);
    const vat = calculateSlipVAT(slip);
    const totalAmount = calculateSlipTotal(slip);

    // Active signature modal state
    const [signatureModalStep, setSignatureModalStep] = useState<number | null>(null);

    const updateField = <K extends keyof PaymentSlip>(key: K, value: PaymentSlip[K]) => {
      onChange({ ...slip, [key]: value });
    };

    const updateStage = (stageKey: keyof PaymentSlip['stages']) => {
      onChange({
        ...slip,
        stages: {
          ...slip.stages,
          [stageKey]: !slip.stages[stageKey],
        },
      });
    };

    const updateBenefit = (benefitKey: keyof PaymentSlip['benefits']) => {
      onChange({
        ...slip,
        benefits: {
          ...slip.benefits,
          [benefitKey]: !slip.benefits[benefitKey],
        },
      });
    };

    const handleItemChange = (index: number, field: keyof MaterialItem, val: any) => {
      const newItems = [...slip.items];
      const item = { ...newItems[index], [field]: val };

      // Autocomplete material price lookup
      if (field === 'description') {
        const found = MASTER_MATERIALS.find(
          (m: { description: string; defaultUnitPrice: number }) =>
            m.description.toLowerCase() === String(val).trim().toLowerCase()
        );
        if (found && (!item.unitPrice || item.unitPrice === 0 || item.unitPrice === 100)) {
          item.unitPrice = found.defaultUnitPrice;
        }
      }

      if (field === 'qty' || field === 'unitPrice' || field === 'description') {
        const qty = field === 'qty' ? Number(val) || 0 : Number(item.qty) || 0;
        const unitPrice = field === 'unitPrice' ? Number(val) || 0 : Number(item.unitPrice) || 0;
        item.amount = Number((qty * unitPrice).toFixed(2));
      }

      newItems[index] = item;
      onChange({ ...slip, items: newItems });
    };

    const handleApplySignatureStamp = (stepNum: number, token?: string) => {
      const nowStr = new Date().toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const updatedSteps = slip.approvalSteps.map((step) => {
        if (step.step === stepNum) {
          return {
            ...step,
            signed: true,
            signedAt: nowStr,
            signatureType: 'stamp' as const,
            signatureToken: token || `AZ-${Math.floor(1000 + Math.random() * 9000)}`,
          };
        }
        return step;
      });

      onChange({
        ...slip,
        approvalSteps: updatedSteps,
        verifiedByZoha: stepNum === 3 ? true : slip.verifiedByZoha,
        verifiedAt: stepNum === 3 ? nowStr : slip.verifiedAt,
      });
    };

    const handleApplySignatureDrawing = (stepNum: number, dataUrl: string) => {
      const nowStr = new Date().toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const updatedSteps = slip.approvalSteps.map((step) => {
        if (step.step === stepNum) {
          return {
            ...step,
            signed: true,
            signedAt: nowStr,
            signatureType: 'draw' as const,
            signatureDataUrl: dataUrl,
          };
        }
        return step;
      });

      onChange({
        ...slip,
        approvalSteps: updatedSteps,
        verifiedByZoha: stepNum === 3 ? true : slip.verifiedByZoha,
        verifiedAt: stepNum === 3 ? nowStr : slip.verifiedAt,
      });
    };

    const handleClearSignature = (stepNum: number) => {
      const updatedSteps = slip.approvalSteps.map((step) => {
        if (step.step === stepNum) {
          return {
            ...step,
            signed: false,
            signedAt: undefined,
            signatureType: undefined,
            signatureDataUrl: undefined,
            signatureToken: undefined,
          };
        }
        return step;
      });

      onChange({
        ...slip,
        approvalSteps: updatedSteps,
        verifiedByZoha: stepNum === 3 ? false : slip.verifiedByZoha,
        verifiedAt: stepNum === 3 ? undefined : slip.verifiedAt,
      });
    };

    const activeModalStepData = slip.approvalSteps.find((s) => s.step === signatureModalStep);

    return (
      <div
        ref={ref}
        id="payment-release-excel-form"
        className="w-[920px] bg-white text-black font-sans shadow-2xl border border-[#b8b8b8] select-text text-[11px] leading-normal mx-auto"
        style={{
          fontFamily: 'Arial, Calibri, sans-serif',
        }}
      >
        {/* SHARED DATALISTS FOR IN-CELL AUTOCOMPLETE & SELECTION */}
        <datalist id="excel-projects-list">
          {Array.from(new Set([...PROJECT_TAG_SCOPES, ...MASTER_PROJECTS])).map((p: string) => (
            <option key={p} value={p} />
          ))}
        </datalist>

        <datalist id="excel-clients-list">
          {MASTER_CLIENTS.map((c: string) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        <datalist id="excel-suppliers-list">
          {MASTER_SUPPLIERS.map((s: { id: string; name: string }) => (
            <option key={s.id} value={s.name} />
          ))}
        </datalist>

        <datalist id="excel-materials-list">
          {MASTER_MATERIALS.map((m: { id: string; description: string; defaultUnitPrice: number }) => (
            <option key={m.id} value={m.description}>
              {`AED ${m.defaultUnitPrice}`}
            </option>
          ))}
        </datalist>

        <datalist id="excel-tag-scopes-list">
          {PROJECT_TAG_SCOPES.map((tag: string) => (
            <option key={tag} value={tag} />
          ))}
        </datalist>

        {/* ROW 1 to 6: EXACT EXCEL NAVY HEADER (#001229) */}
        <div className="bg-[#001229] text-white p-3 border-b-2 border-black">
          <div className="grid grid-cols-12 gap-0 items-center">
            {/* Columns A-C: AZ AL ZAYED TENTS & SHADES LLC in Gold */}
            <div className="col-span-3 text-center flex flex-col justify-center py-1">
              <div className="text-xl font-black text-[#C8A96A] tracking-widest font-sans leading-none">
                AZ
              </div>
              <div className="text-base font-bold text-[#C8A96A] tracking-wider font-sans leading-tight mt-0.5">
                AL ZAYED
              </div>
              <div className="text-[10px] font-bold text-[#C8A96A] tracking-wider uppercase leading-tight">
                TENTS &amp; SHADES LLC
              </div>
            </div>

            {/* Columns D-I: Form Title & Motto Line */}
            <div className="col-span-6 text-center px-2">
              <h1 className="text-xl font-bold tracking-normal text-white uppercase leading-tight font-sans">
                PROJECT MATERIAL
              </h1>
              <h2 className="text-xl font-bold tracking-normal text-white uppercase leading-tight font-sans">
                PAYMENT RELEASE FORM
              </h2>
              <div className="text-[9.5px] text-slate-200 mt-2 font-medium tracking-tight">
                <span className="font-sans">☑ Ensure Right Payment</span>
                <span className="mx-1.5 text-slate-400">|</span>
                <span>Ensure Right Progress</span>
                <span className="mx-1.5 text-slate-400">|</span>
                <span>Ensure Next Collection</span>
              </div>
            </div>

            {/* Columns J-L: Department & Purpose Box */}
            <div className="col-span-3 pl-3 text-left space-y-1 text-[10px]">
              <div>
                <span className="text-[#a0c2e8] font-normal block leading-tight">Department</span>
                <span className="font-bold text-white text-[11px] leading-tight block">
                  Project Management
                </span>
              </div>
              <div className="pt-0.5">
                <span className="text-[#a0c2e8] font-normal block leading-tight">Purpose</span>
                <span className="font-bold text-[#C8A96A] text-[11px] leading-tight block">
                  Material Payment Release
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 7: EMPTY EXCEL GRID ROW */}
        <div className="h-4 bg-white border-b border-[#d4d4d4] grid grid-cols-12">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="border-r border-[#d4d4d4] h-full" />
          ))}
        </div>

        {/* SECTION 1: BASIC INFORMATION (ROW 8) */}
        <div className="bg-[#001229] text-white px-2 py-0.5 font-bold text-[11px] uppercase tracking-wide border-b border-black">
          BASIC INFORMATION
        </div>

        {/* ROWS 9-13: BASIC INFORMATION GRID (DIRECT IN-CELL EDITABLE) */}
        <div className="border-b border-[#d4d4d4] text-[11px]">
          {/* Row 9: Payment Request No. & proj value */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div className="col-span-2 px-2 py-1 font-normal border-r border-[#d4d4d4] flex items-center">
              Payment Request No.
            </div>
            <div className="col-span-4 px-2 py-0.5 border-r border-[#d4d4d4] font-bold flex items-center">
              <input
                type="text"
                value={slip.paymentRequestNo}
                onChange={(e) => updateField('paymentRequestNo', e.target.value)}
                className="w-full bg-transparent border-none outline-none font-bold font-mono focus:bg-amber-50 focus:ring-1 focus:ring-amber-300 rounded px-1"
                placeholder="AZTS-0007"
              />
            </div>
            <div className="col-span-2 px-2 py-1 font-normal border-r border-[#d4d4d4] flex items-center">
              proj value
            </div>
            <div className="col-span-4 px-2 py-0.5 font-bold flex items-center">
              <input
                type="number"
                value={slip.expectedInvoiceValue || 9975}
                onChange={(e) => updateField('expectedInvoiceValue', Number(e.target.value) || 0)}
                className="w-full bg-transparent border-none outline-none font-bold font-mono focus:bg-amber-50 focus:ring-1 focus:ring-amber-300 rounded px-1"
                placeholder="9975"
              />
            </div>
          </div>

          {/* Row 10: Project Name (Direct In-Cell Edit + Dropdown Scope) */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div className="col-span-2 px-2 py-1 font-normal border-r border-[#d4d4d4] flex items-center">
              Project Name
            </div>
            <div className="col-span-10 px-2 py-0.5 font-bold flex items-center">
              <input
                type="text"
                list="excel-projects-list"
                value={slip.projectName}
                onChange={(e) => updateField('projectName', e.target.value)}
                className="w-full bg-transparent border-none outline-none font-bold focus:bg-amber-50 focus:ring-1 focus:ring-amber-300 rounded px-1"
                placeholder="Type or select project scope..."
              />
            </div>
          </div>

          {/* Row 11: Project Code */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div className="col-span-2 px-2 py-1 font-normal border-r border-[#d4d4d4] flex items-center">
              Project Code
            </div>
            <div className="col-span-10 px-2 py-0.5 flex items-center text-slate-600 font-mono">
              <input
                type="text"
                value={slip.projectCode}
                onChange={(e) => updateField('projectCode', e.target.value)}
                className="w-full bg-transparent border-none outline-none font-mono focus:bg-amber-50 focus:ring-1 focus:ring-amber-300 rounded px-1"
                placeholder="Optional project code..."
              />
            </div>
          </div>

          {/* Row 12: Client (Direct In-Cell Edit + Dropdown) & Requested Amount (AED) (YELLOW HIGHLIGHT) */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div className="col-span-2 px-2 py-1 font-normal border-r border-[#d4d4d4] flex items-center">
              Client
            </div>
            <div className="col-span-4 px-2 py-0.5 border-r border-[#d4d4d4] font-bold flex items-center">
              <input
                type="text"
                list="excel-clients-list"
                value={slip.clientName}
                onChange={(e) => updateField('clientName', e.target.value)}
                className="w-full bg-transparent border-none outline-none font-bold focus:bg-amber-50 focus:ring-1 focus:ring-amber-300 rounded px-1"
                placeholder="Type or select client..."
              />
            </div>
            <div className="col-span-2 px-2 py-1 font-normal border-r border-[#d4d4d4] flex items-center">
              Requested Amount (AED)
            </div>
            {/* CELL I12: Exact bright yellow #FFFF00 highlight */}
            <div className="col-span-4 px-3 py-1 bg-[#FFFF00] font-black text-black text-xs flex items-center justify-end font-mono">
              {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Row 13: Supplier (Direct In-Cell Edit + Dropdown) & Currency */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div className="col-span-2 px-2 py-1 font-normal border-r border-[#d4d4d4] flex items-center">
              Supplier
            </div>
            <div className="col-span-4 px-2 py-0.5 border-r border-[#d4d4d4] font-bold flex items-center">
              <input
                type="text"
                list="excel-suppliers-list"
                value={slip.supplier}
                onChange={(e) => updateField('supplier', e.target.value)}
                className="w-full bg-transparent border-none outline-none font-bold focus:bg-amber-50 focus:ring-1 focus:ring-amber-300 rounded px-1"
                placeholder="Type or select supplier (Marhaba, First Source, Naaji, etc.)..."
              />
            </div>
            <div className="col-span-2 px-2 py-1 font-normal border-r border-[#d4d4d4] flex items-center">
              Currency
            </div>
            <div className="col-span-4 px-2 py-1 font-normal flex items-center font-mono">
              {slip.currency || 'AED'}
            </div>
          </div>
        </div>

        {/* ROW 14: EMPTY EXCEL GRID ROW */}
        <div className="h-4 bg-white border-b border-[#d4d4d4] grid grid-cols-12">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="border-r border-[#d4d4d4] h-full" />
          ))}
        </div>

        {/* SECTION 2: MATERIAL DETAILS (ROW 15) */}
        <div className="bg-[#001229] text-white px-2 py-0.5 font-bold text-[11px] uppercase tracking-wide border-b border-black">
          MATERIAL DETAILS
        </div>

        {/* MATERIAL TABLE (ROW 16 ONWARDS - DIRECT IN-CELL EDITABLE) */}
        <div className="border-b border-[#d4d4d4]">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              {/* Row 16: Table Headers with exact dark navy background */}
              <tr className="bg-[#001229] text-white font-bold text-center border-b border-black">
                <th className="py-1 px-2 text-center border-r border-[#3b4b61] font-bold" style={{ width: '45%' }}>
                  Description
                </th>
                <th className="py-1 px-1 text-center border-r border-[#3b4b61] font-bold" style={{ width: '8%' }}>
                  Qty
                </th>
                <th className="py-1 px-1 text-center border-r border-[#3b4b61] font-bold leading-tight" style={{ width: '14%' }}>
                  Unit Price
                  <br />
                  (AED)
                </th>
                <th className="py-1 px-1 text-center border-r border-[#3b4b61] font-bold leading-tight" style={{ width: '16%' }}>
                  Amount
                  <br />
                  (AED)
                </th>
                <th className="py-1 px-2 text-center font-bold" style={{ width: '17%' }}>
                  Project Name
                </th>
              </tr>
            </thead>
            <tbody>
              {slip.items.map((item, idx) => (
                <tr key={item.id || idx} className="border-b border-black">
                  {/* In-Cell Description with Autocomplete Catalog Picker */}
                  <td className="py-0.5 px-2 border-r border-black font-medium">
                    <input
                      type="text"
                      list="excel-materials-list"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      placeholder="Type or pick material..."
                      className="w-full bg-transparent border-none outline-none focus:bg-amber-50 focus:ring-1 focus:ring-amber-300 rounded px-1"
                    />
                  </td>

                  {/* In-Cell Qty with Instant Recalculation */}
                  <td className="py-0.5 px-1 border-r border-black text-center font-bold font-mono">
                    <input
                      type="number"
                      step="any"
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                      className="w-full text-center bg-transparent border-none outline-none font-bold font-mono focus:bg-amber-50 focus:ring-1 focus:ring-amber-300 rounded"
                    />
                  </td>

                  {/* In-Cell Unit Price with Instant Recalculation */}
                  <td className="py-0.5 px-1 border-r border-black text-center font-bold font-mono">
                    <input
                      type="number"
                      step="any"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                      className="w-full text-center bg-transparent border-none outline-none font-bold font-mono focus:bg-amber-50 focus:ring-1 focus:ring-amber-300 rounded"
                    />
                  </td>

                  {/* Amount (Auto-Calculated) */}
                  <td className="py-0.5 px-2 border-r border-black text-right font-mono font-bold">
                    {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* In-Cell Project Name Tag Scope */}
                  <td className="py-0.5 px-2 text-center font-normal">
                    <input
                      type="text"
                      list="excel-tag-scopes-list"
                      value={item.projectName}
                      onChange={(e) => handleItemChange(idx, 'projectName', e.target.value)}
                      placeholder="e.g. dogma"
                      className="w-full text-center bg-transparent border-none outline-none focus:bg-amber-50 focus:ring-1 focus:ring-amber-300 rounded"
                    />
                  </td>
                </tr>
              ))}

              {/* Row 30: TOTAL */}
              <tr className="border-b border-[#d4d4d4] font-bold">
                <td colSpan={3} className="py-0.5 px-2 text-right border-r border-[#d4d4d4] pr-4">
                  TOTAL
                </td>
                <td className="py-0.5 px-2 text-right font-mono font-bold border-r border-[#d4d4d4]">
                  {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="border-r border-[#d4d4d4]"></td>
              </tr>

              {/* Row 31: TOTAL with VAT */}
              <tr className="border-b border-[#d4d4d4] font-bold">
                <td colSpan={3} className="py-0.5 px-2 text-right border-r border-[#d4d4d4] pr-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <span>TOTAL with VAT</span>
                    {isReadOnly ? (
                      <span className="text-[10px] text-slate-600 font-semibold">({slip.vatRate !== undefined ? slip.vatRate : 5}%)</span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] bg-slate-100 hover:bg-amber-50 px-1 py-0.5 rounded border border-slate-300">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max="100"
                          value={slip.vatRate !== undefined ? slip.vatRate : 5}
                          onChange={(e) => updateField('vatRate', e.target.value === '' ? 0 : Number(e.target.value))}
                          className="w-7 text-center bg-transparent border-none outline-none font-bold text-[10px] text-slate-800 focus:bg-amber-100 rounded"
                          title="Click to edit VAT percentage"
                        />
                        <span className="text-slate-600 font-bold">%</span>
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-0.5 px-2 text-right font-mono font-bold border-r border-[#d4d4d4]">
                  {(subtotal + vat).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="border-r border-[#d4d4d4]"></td>
              </tr>

              {/* Row 32: Tranport (In-Cell Editable) */}
              <tr className="border-b border-[#d4d4d4] font-bold">
                <td colSpan={3} className="py-0.5 px-2 text-right border-r border-[#d4d4d4] pr-4">
                  Tranport
                </td>
                <td className="py-0.5 px-2 text-right font-mono font-bold border-r border-[#d4d4d4]">
                  <input
                    type="number"
                    step="any"
                    value={slip.transport}
                    onChange={(e) => updateField('transport', Number(e.target.value) || 0)}
                    className="w-full text-right bg-transparent border-none outline-none font-bold font-mono focus:bg-amber-50 focus:ring-1 focus:ring-amber-300 rounded"
                  />
                </td>
                <td className="border-r border-[#d4d4d4]"></td>
              </tr>

              {/* Row 33: TOTAL AMOUNT (YELLOW HIGHLIGHT) */}
              <tr className="border-b-2 border-black font-black">
                <td colSpan={3} className="py-1 px-2 text-right border-r border-[#d4d4d4] text-xs pr-4">
                  TOTAL AMOUNT
                </td>
                {/* Cell G33: Exact bright yellow #FFFF00 highlight */}
                <td className="py-1 px-2 text-right bg-[#FFFF00] font-black font-mono text-sm border-r border-black text-black">
                  {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="border-r border-[#d4d4d4]"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ROW 34: EMPTY EXCEL GRID ROW */}
        <div className="h-4 bg-white border-b border-[#d4d4d4] grid grid-cols-12">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="border-r border-[#d4d4d4] h-full" />
          ))}
        </div>

        {/* SECTION 5: PAYMENT RELEASE VERIFICATION (MOST IMPORTANT) (ROW 35) */}
        <div className="bg-[#001229] text-white py-0.5 font-bold text-[11px] uppercase tracking-wide border-b border-black grid grid-cols-12">
          <div className="col-span-1 text-center font-bold border-r border-[#3b4b61] text-[#C8A96A]">
            5
          </div>
          <div className="col-span-11 px-2">
            PAYMENT RELEASE VERIFICATION (MOST IMPORTANT)
          </div>
        </div>

        {/* ROWS 36-43: VERIFICATION SUB-TABLE (IN-CELL INTERACTIVE) */}
        <div className="border-b border-[#d4d4d4] text-[11px]">
          {/* Row 36: Progress */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div className="col-span-3 px-2 py-1 font-normal border-r border-[#d4d4d4] flex items-center">
              Current Project Progress
            </div>
            <div className="col-span-1 px-1 py-1 text-center font-bold border-r border-[#d4d4d4] flex items-center justify-center font-mono">
              <input
                type="number"
                value={slip.currentProgress ?? 90}
                onChange={(e) => updateField('currentProgress', Number(e.target.value) || 0)}
                className="w-8 text-center bg-transparent border-none outline-none font-bold font-mono focus:bg-amber-50"
              />
            </div>
            <div className="col-span-1 px-1 py-1 text-center font-normal border-r border-[#d4d4d4] flex items-center justify-center">
              %
            </div>
            <div className="col-span-4 px-2 py-1 font-normal border-r border-[#d4d4d4] flex items-center">
              If this payment is released:
            </div>
            <div className="col-span-3 px-2 py-1 font-normal flex items-center">
              Expected Benefit
            </div>
          </div>

          {/* Row 37: Arrival date & Production will continue (YELLOW) */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div className="col-span-5 px-2 py-1 border-r border-[#d4d4d4]"></div>
            <div className="col-span-4 px-2 py-0.5 border-r border-[#d4d4d4] flex items-center gap-1">
              <span className="whitespace-nowrap">📅Materials will arrive on:</span>
              <InlineDatePicker
                value={slip.materialsArrivalDate || '28-10-2026'}
                onChange={(val) => updateField('materialsArrivalDate', val)}
                className="font-bold flex-1"
                placeholder="28-10-2026"
              />
            </div>
            {/* Cell J37: Click directly to toggle Production will continue */}
            <div
              onClick={() => updateBenefit('productionWillContinue')}
              className={`col-span-3 px-2 py-1 font-bold flex items-center gap-1.5 cursor-pointer select-none transition-colors ${
                slip.benefits.productionWillContinue ? 'bg-[#FFFF00] text-black' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{slip.benefits.productionWillContinue ? '☑' : '☐'}</span>
              <span>Production will continue</span>
            </div>
          </div>

          {/* Row 38: Engineering | Painting | Production can start | Project delay */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div
              onClick={() => updateStage('engineering')}
              className={`col-span-3 px-2 py-1 border-r border-[#d4d4d4] flex items-center gap-1.5 cursor-pointer select-none ${
                slip.stages.engineering ? 'bg-[#FFFF00] font-bold text-black' : 'text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span>{slip.stages.engineering ? '☑' : '☐'}</span>
              <span>Engineering</span>
            </div>
            <div
              onClick={() => updateStage('painting')}
              className={`col-span-2 px-2 py-1 border-r border-[#d4d4d4] flex items-center gap-1.5 cursor-pointer select-none ${
                slip.stages.painting ? 'bg-[#FFFF00] font-bold text-black' : 'text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span>{slip.stages.painting ? '☑' : '☐'}</span>
              <span>Painting</span>
            </div>
            <div className="col-span-4 px-2 py-0.5 border-r border-[#d4d4d4] flex items-center gap-1">
              <span className="whitespace-nowrap">⚙ Production can start on:</span>
              <InlineDatePicker
                value={slip.productionStartDate || 'n/a'}
                onChange={(val) => updateField('productionStartDate', val)}
                className="font-bold flex-1"
                placeholder="n/a"
              />
            </div>
            <div
              onClick={() => updateBenefit('projectDelayAvoided')}
              className={`col-span-3 px-2 py-1 flex items-center gap-1.5 cursor-pointer select-none ${
                slip.benefits.projectDelayAvoided ? 'bg-[#FFFF00] font-bold text-black' : 'text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span>{slip.benefits.projectDelayAvoided ? '☑' : '☐'}</span>
              <span>Project delay will be avoided</span>
            </div>
          </div>

          {/* Row 39: Material Procurement (YELLOW) | Fabric | Delivery date | Client milestone */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            {/* Cell A39: Material Procurement (Click directly to toggle yellow highlight) */}
            <div
              onClick={() => updateStage('materialProcurement')}
              className={`col-span-3 px-2 py-1 border-r border-[#d4d4d4] flex items-center gap-1.5 cursor-pointer select-none ${
                slip.stages.materialProcurement ? 'bg-[#FFFF00] font-bold text-black' : 'text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span>{slip.stages.materialProcurement ? '☑' : '☐'}</span>
              <span>Material Procurement</span>
            </div>
            <div
              onClick={() => updateStage('fabric')}
              className={`col-span-2 px-2 py-1 border-r border-[#d4d4d4] flex items-center gap-1.5 cursor-pointer select-none ${
                slip.stages.fabric ? 'bg-[#FFFF00] font-bold text-black' : 'text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span>{slip.stages.fabric ? '☑' : '☐'}</span>
              <span>Fabric</span>
            </div>
            <div className="col-span-4 px-2 py-0.5 border-r border-[#d4d4d4] flex items-center gap-1 text-[10.5px]">
              <span className="whitespace-nowrap">🚚 Delivery date:</span>
              <InlineDatePicker
                value={slip.deliveryDate || 'Thursday 4rd'}
                onChange={(val) => updateField('deliveryDate', val)}
                className="font-bold flex-1"
                placeholder="Thursday 4rd"
              />
            </div>
            <div
              onClick={() => updateBenefit('clientMilestoneAchieved')}
              className={`col-span-3 px-2 py-1 flex items-center gap-1.5 cursor-pointer select-none ${
                slip.benefits.clientMilestoneAchieved ? 'bg-[#FFFF00] font-bold text-black' : 'text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span>{slip.benefits.clientMilestoneAchieved ? '☑' : '☐'}</span>
              <span>Client milestone will be achieved</span>
            </div>
          </div>

          {/* Row 40: Fabrication | Dispatch | Installation date | Client payment claimed */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div
              onClick={() => updateStage('fabrication')}
              className={`col-span-3 px-2 py-1 border-r border-[#d4d4d4] flex items-center gap-1.5 cursor-pointer select-none ${
                slip.stages.fabrication ? 'bg-[#FFFF00] font-bold text-black' : 'text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span>{slip.stages.fabrication ? '☑' : '☐'}</span>
              <span>Fabrication</span>
            </div>
            <div
              onClick={() => updateStage('dispatch')}
              className={`col-span-2 px-2 py-1 border-r border-[#d4d4d4] flex items-center gap-1.5 cursor-pointer select-none ${
                slip.stages.dispatch ? 'bg-[#FFFF00] font-bold text-black' : 'text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span>{slip.stages.dispatch ? '☑' : '☐'}</span>
              <span>Dispatch</span>
            </div>
            <div className="col-span-4 px-2 py-0.5 border-r border-[#d4d4d4] flex items-center gap-1 text-[10.5px]">
              <span className="whitespace-nowrap">👷 Installation date:</span>
              <InlineDatePicker
                value={slip.installationDate || 'next week'}
                onChange={(val) => updateField('installationDate', val)}
                className="font-bold flex-1"
                placeholder="next week"
              />
            </div>
            <div
              onClick={() => updateBenefit('clientPaymentClaimed')}
              className={`col-span-3 px-2 py-1 flex items-center gap-1.5 cursor-pointer select-none ${
                slip.benefits.clientPaymentClaimed ? 'bg-[#FFFF00] font-bold text-black' : 'text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span>{slip.benefits.clientPaymentClaimed ? '☑' : '☐'}</span>
              <span>Client payment can be claimed</span>
            </div>
          </div>

          {/* Row 41: Installation | NEXT CLIENT PAYMENT */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div
              onClick={() => updateStage('installation')}
              className={`col-span-5 px-2 py-1 border-r border-[#d4d4d4] flex items-center gap-1.5 cursor-pointer select-none ${
                slip.stages.installation ? 'bg-[#FFFF00] font-bold text-black' : 'text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span>{slip.stages.installation ? '☑' : '☐'}</span>
              <span>Installation</span>
            </div>
            <div className="col-span-7 px-2 py-1 font-bold text-center uppercase tracking-wide">
              NEXT CLIENT PAYMENT
            </div>
          </div>

          {/* Row 42: Expected Invoice Value & Expected Collection Date Headers */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div className="col-span-5 border-r border-[#d4d4d4]"></div>
            <div className="col-span-4 px-2 py-0.5 text-center font-normal border-r border-[#d4d4d4]">
              Expected Invoice Value (AED)
            </div>
            <div className="col-span-3 px-2 py-0.5 text-center font-normal">
              Expected Collection Date
            </div>
          </div>

          {/* Row 43: Values (BOTH HIGHLIGHTED IN YELLOW #FFFF00 - IN-CELL EDITABLE) */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div className="col-span-5 border-r border-[#d4d4d4]"></div>
            {/* Cell F43: 3,990.00 (YELLOW) */}
            <div className="col-span-4 px-2 py-0.5 bg-[#FFFF00] font-black text-black text-center border-r border-[#d4d4d4] font-mono">
              <input
                type="text"
                value="3,990.00"
                readOnly={isReadOnly}
                className="w-full text-center bg-transparent border-none outline-none font-black font-mono focus:bg-amber-100"
              />
            </div>
            {/* Cell I43: TBD after purchase (YELLOW) */}
            <div className="col-span-3 px-2 py-0.5 bg-[#FFFF00] font-bold text-black text-center font-sans">
              <InlineDatePicker
                value={slip.expectedCollectionDate || 'TBD after purchase'}
                onChange={(val) => updateField('expectedCollectionDate', val)}
                className="w-full text-center font-bold font-sans"
                align="right"
                placeholder="TBD after purchase"
              />
            </div>
          </div>
        </div>

        {/* ROW 44: EMPTY EXCEL GRID ROW */}
        <div className="h-4 bg-white border-b border-[#d4d4d4] grid grid-cols-12">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="border-r border-[#d4d4d4] h-full" />
          ))}
        </div>

        {/* SECTION 7: REMARKS (ROW 45) */}
        <div className="bg-[#001229] text-white py-0.5 font-bold text-[11px] uppercase tracking-wide border-b border-black grid grid-cols-12">
          <div className="col-span-1 text-center font-bold border-r border-[#3b4b61] text-[#C8A96A]">
            7
          </div>
          <div className="col-span-11 px-2">
            REMARKS
          </div>
        </div>

        {/* ROWS 46-50: REMARKS GRID */}
        <div className="border-b border-[#d4d4d4] text-[11px]">
          {/* Row 46: Budget Available */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div className="col-span-2 px-2 py-1 border-r border-[#d4d4d4]">
              Budget Available
            </div>
            <div
              onClick={() => updateField('budgetAvailable', slip.budgetAvailable === 'Yes' ? 'No' : 'Yes')}
              className="col-span-3 px-2 py-1 border-r border-[#d4d4d4] flex items-center gap-1 font-bold cursor-pointer select-none"
            >
              <span>{slip.budgetAvailable === 'Yes' ? '☑ Yes' : '☐ Yes'}</span>
            </div>
            <div className="col-span-7"></div>
          </div>

          {/* Row 47: Outstanding Supplier Balance (YELLOW AED= 0) */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div className="col-span-3 px-2 py-1 border-r border-[#d4d4d4]">
              Outstanding Supplier Balance
            </div>
            {/* Cell D47: AED= 0 (YELLOW HIGHLIGHT) */}
            <div className="col-span-2 px-2 py-0.5 bg-[#FFFF00] font-bold text-black border-r border-[#d4d4d4] flex items-center justify-center font-mono">
              <span className="mr-1">AED=</span>
              <input
                type="number"
                value={slip.outstandingBalance}
                onChange={(e) => updateField('outstandingBalance', Number(e.target.value) || 0)}
                className="w-12 bg-transparent border-none outline-none font-bold font-mono text-center focus:bg-amber-100"
              />
            </div>
            <div className="col-span-7"></div>
          </div>

          {/* Rows 48-50: Empty grid lines */}
          {[48, 49, 50].map((rNum) => (
            <div key={rNum} className="h-4 grid grid-cols-12 border-b border-[#d4d4d4]">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="border-r border-[#d4d4d4] h-full" />
              ))}
            </div>
          ))}
        </div>

        {/* SECTION 8: APPROVAL FLOW (ROW 51) */}
        <div className="bg-[#001229] text-white py-0.5 font-bold text-[11px] uppercase tracking-wide border-b border-black grid grid-cols-12">
          <div className="col-span-1 text-center font-bold border-r border-[#3b4b61] text-[#C8A96A]">
            8
          </div>
          <div className="col-span-11 px-2">
            APPROVAL FLOW
          </div>
        </div>

        {/* ROW 52: TABLE HEADER IN TAN / GOLD #C8A96A BACKGROUND */}
        <div className="bg-[#C8A96A] text-black font-bold text-[11px] border-b border-black grid grid-cols-12">
          <div className="col-span-1 py-1 text-center border-r border-black font-bold">
            STEP
          </div>
          <div className="col-span-4 py-1 text-center border-r border-black font-bold">
            POSITION
          </div>
          <div className="col-span-4 py-1 text-center border-r border-black font-bold">
            NAME
          </div>
          <div className="col-span-3 py-1 text-center font-bold">
            SIGNATURE
          </div>
        </div>

        {/* ROWS 53-58: 6-TIER APPROVAL FLOW ROWS (CLICK SIGNATURE TO SIGN/STAMP) */}
        <div className="border-b border-[#d4d4d4] text-[11px]">
          {slip.approvalSteps.map((step) => {
            const isStepSigned = step.signed;
            return (
              <div key={step.step} className="grid grid-cols-12 border-b border-black min-h-[30px]">
                {/* Step # */}
                <div className="col-span-1 py-1.5 text-center font-bold border-r border-black bg-[#001229] text-white flex items-center justify-center">
                  {step.step}
                </div>

                {/* Position */}
                <div className="col-span-4 px-2 py-1.5 border-r border-black flex items-center">
                  {step.position}
                </div>

                {/* Name */}
                <div className="col-span-4 px-2 py-1.5 text-center font-bold border-r border-black flex items-center justify-center">
                  {step.name}
                </div>

                {/* Interactive In-Cell Signature Block */}
                <div
                  onClick={() => setSignatureModalStep(step.step)}
                  className="col-span-3 px-2 py-1 text-center h-8 border-r border-[#d4d4d4] flex items-center justify-center cursor-pointer hover:bg-amber-50/60 transition-colors group relative"
                  title="Click to sign (One-Tap Stamp or Draw Signature)"
                >
                  {isStepSigned ? (
                    step.signatureType === 'draw' && step.signatureDataUrl ? (
                      /* Drawn signature */
                      <img
                        src={step.signatureDataUrl}
                        alt="Signature"
                        className="max-h-7 max-w-full object-contain"
                      />
                    ) : (
                      /* Official Green Stamp for Ms. Zoha Khan or Hamza */
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-emerald-600 bg-emerald-100 text-emerald-950 font-bold text-[9.5px] shadow-sm select-none">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700 stroke-[3]" />
                        <span className="font-mono tracking-wider">
                          {step.step === 3 ? 'VERIFIED' : 'APPROVED'}
                        </span>
                      </div>
                    )
                  ) : (
                    <span className="text-[10px] text-slate-400 group-hover:text-amber-700 font-sans italic opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to sign
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ROW 59: EMPTY EXCEL GRID ROW */}
        <div className="h-4 bg-white border-b border-[#d4d4d4] grid grid-cols-12">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="border-r border-[#d4d4d4] h-full" />
          ))}
        </div>

        {/* SECTION 9: FINAL DECISION (ROW 60) */}
        <div className="bg-[#001229] text-white py-0.5 font-bold text-[11px] uppercase tracking-wide border-b border-black grid grid-cols-12">
          <div className="col-span-1 text-center font-bold border-r border-[#3b4b61] text-[#C8A96A]">
            9
          </div>
          <div className="col-span-11 px-2">
            FINAL DECISION
          </div>
        </div>

        {/* ROWS 61-66: FINAL DECISION OPTIONS & REASON (DIRECT IN-CELL INTERACTIVE) */}
        <div className="border-b border-[#d4d4d4] text-[11px]">
          {/* Row 61: The 3 Choices mirroring Excel */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4] py-1.5">
            <div
              onClick={() => updateField('finalDecision', 'APPROVED FOR PAYMENT')}
              className={`col-span-4 text-center font-bold cursor-pointer select-none transition-colors ${
                slip.finalDecision === 'APPROVED FOR PAYMENT' ? 'text-black font-black' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ● APPROVED FOR PAYMENT
            </div>
            <div
              onClick={() => updateField('finalDecision', 'HOLD PAYMENT')}
              className={`col-span-4 text-center font-bold cursor-pointer select-none transition-colors ${
                slip.finalDecision === 'HOLD PAYMENT' ? 'text-black font-black' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Ⅱ HOLD PAYMENT
            </div>
            <div
              onClick={() => updateField('finalDecision', 'REJECTED')}
              className={`col-span-4 text-center font-bold cursor-pointer select-none transition-colors ${
                slip.finalDecision === 'REJECTED' ? 'text-black font-black' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ✕ REJECTED
            </div>
          </div>

          {/* Row 63: Reason (if Hold/Rejected) */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4] px-2 py-1">
            <div className="col-span-3 text-slate-700">
              Reason (if Hold/Rejected):
            </div>
            <div className="col-span-9 font-medium text-slate-900">
              <input
                type="text"
                value={slip.decisionReason || ''}
                onChange={(e) => updateField('decisionReason', e.target.value)}
                placeholder="Type reason here if Hold/Rejected..."
                className="w-full bg-transparent border-none outline-none focus:bg-amber-50 rounded px-1"
              />
            </div>
          </div>

          {/* Rows 64-66: Empty grid rows */}
          {[64, 65, 66].map((rNum) => (
            <div key={rNum} className="h-4 grid grid-cols-12 border-b border-[#d4d4d4]">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="border-r border-[#d4d4d4] h-full" />
              ))}
            </div>
          ))}
        </div>

        {/* ROW 67: FOOTER BANNER (#001229) */}
        <div className="bg-[#001229] text-white py-1.5 px-4 text-[10px] tracking-wider font-sans border-t border-black select-none">
          <div className="flex items-center justify-between">
            <span className="tracking-wide">~ QUALITY IN EVERY DETAIL</span>
            <span className="tracking-wide">❖ COMMITMENT IN EVERY PROJECT</span>
            <span className="tracking-wide">♡ TRUST IN EVERY PAYMENT</span>
          </div>
        </div>

        {/* SIGNATURE POPUP MODAL */}
        {activeModalStepData && (
          <SignatureModal
            isOpen={signatureModalStep !== null}
            onClose={() => setSignatureModalStep(null)}
            stepNumber={activeModalStepData.step}
            roleName={activeModalStepData.position}
            personName={activeModalStepData.name}
            isCurrentSigned={activeModalStepData.signed}
            onApplyStamp={(token) => handleApplySignatureStamp(activeModalStepData.step, token)}
            onApplyDrawing={(dataUrl) => handleApplySignatureDrawing(activeModalStepData.step, dataUrl)}
            onClearSignature={() => handleClearSignature(activeModalStepData.step)}
          />
        )}
      </div>
    );
  }
);

PaymentReleaseForm.displayName = 'PaymentReleaseForm';
