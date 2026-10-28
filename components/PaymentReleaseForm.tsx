import React, { forwardRef } from 'react';
import { PaymentSlip, MaterialItem } from '@/types/slip';
import { calculateSlipSubtotal, calculateSlipVAT, calculateSlipTotal } from '@/lib/supabase';
import {
  MASTER_MATERIALS,
  MASTER_PROJECTS,
  MASTER_CLIENTS,
  MASTER_SUPPLIERS,
} from '@/lib/masterData';
import { Plus, Trash2 } from 'lucide-react';

interface PaymentReleaseFormProps {
  slip: PaymentSlip;
  onChange: (updated: PaymentSlip) => void;
  onToggleZohaStamp?: () => void;
  isReadOnly?: boolean;
}

export const PaymentReleaseForm = forwardRef<HTMLDivElement, PaymentReleaseFormProps>(
  ({ slip, onChange, isReadOnly = false }, ref) => {
    const subtotal = calculateSlipSubtotal(slip);
    const vat = calculateSlipVAT(slip);
    const totalAmount = calculateSlipTotal(slip);

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

      // If user picked a material from master list, suggest default unit price
      if (field === 'description') {
        const found = MASTER_MATERIALS.find(
          (m) => m.description.toLowerCase() === String(val).trim().toLowerCase()
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

    const addItem = () => {
      const newItem: MaterialItem = {
        id: `item-${Date.now()}`,
        description: '',
        qty: 1,
        unitPrice: 0,
        amount: 0,
        projectName: slip.clientName || 'dogma',
      };
      onChange({ ...slip, items: [...slip.items, newItem] });
    };

    const removeItem = (index: number) => {
      if (slip.items.length <= 1) return;
      const newItems = slip.items.filter((_, i) => i !== index);
      onChange({ ...slip, items: newItems });
    };

    return (
      <div
        ref={ref}
        id="payment-release-excel-form"
        className="w-[920px] mx-auto bg-white text-black font-sans shadow-2xl border border-[#b8b8b8] select-text text-[11px] leading-normal"
        style={{
          fontFamily: 'Arial, Calibri, sans-serif',
        }}
      >
        {/* SHARED DATALISTS FOR PRE-FED DROPDOWNS */}
        <datalist id="master-projects-list">
          {MASTER_PROJECTS.map((proj) => (
            <option key={proj} value={proj} />
          ))}
        </datalist>

        <datalist id="master-clients-list">
          {MASTER_CLIENTS.map((client) => (
            <option key={client} value={client} />
          ))}
        </datalist>

        <datalist id="master-suppliers-list">
          {MASTER_SUPPLIERS.map((sup) => (
            <option key={sup} value={sup} />
          ))}
        </datalist>

        <datalist id="master-materials-list">
          {MASTER_MATERIALS.map((mat) => (
            <option key={mat.description} value={mat.description}>
              {`AED ${mat.defaultUnitPrice}`}
            </option>
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

        {/* ROWS 9-13: BASIC INFORMATION GRID */}
        <div className="border-b border-[#d4d4d4] text-[11px]">
          {/* Row 9: Payment Request No. & proj value */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div className="col-span-2 px-2 py-1 font-normal border-r border-[#d4d4d4] flex items-center">
              Payment Request No.
            </div>
            <div className="col-span-4 px-2 py-1 border-r border-[#d4d4d4] font-bold flex items-center">
              <input
                type="text"
                value={slip.paymentRequestNo}
                onChange={(e) => updateField('paymentRequestNo', e.target.value)}
                readOnly={isReadOnly}
                className="w-full bg-transparent font-bold focus:outline-none"
              />
            </div>
            <div className="col-span-2 px-2 py-1 font-normal border-r border-[#d4d4d4] flex items-center">
              proj value
            </div>
            <div className="col-span-4 px-2 py-1 font-bold flex items-center">
              <input
                type="text"
                value={slip.expectedInvoiceValue || 9975}
                onChange={(e) => updateField('expectedInvoiceValue', Number(e.target.value) || 0)}
                readOnly={isReadOnly}
                className="w-full bg-transparent font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* Row 10: Project Name with Dropdown Autocomplete */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div className="col-span-2 px-2 py-1 font-normal border-r border-[#d4d4d4] flex items-center">
              Project Name
            </div>
            <div className="col-span-10 px-2 py-1 font-bold flex items-center">
              <input
                type="text"
                list="master-projects-list"
                value={slip.projectName}
                onChange={(e) => updateField('projectName', e.target.value)}
                readOnly={isReadOnly}
                placeholder="Select or type project name..."
                className="w-full bg-transparent font-bold focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Row 11: Project Code */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div className="col-span-2 px-2 py-1 font-normal border-r border-[#d4d4d4] flex items-center">
              Project Code
            </div>
            <div className="col-span-10 px-2 py-1 flex items-center text-slate-500">
              <input
                type="text"
                value={slip.projectCode}
                onChange={(e) => updateField('projectCode', e.target.value)}
                readOnly={isReadOnly}
                className="w-full bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Row 12: Client with Dropdown & Requested Amount (AED) (YELLOW HIGHLIGHT) */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div className="col-span-2 px-2 py-1 font-normal border-r border-[#d4d4d4] flex items-center">
              Client
            </div>
            <div className="col-span-4 px-2 py-1 border-r border-[#d4d4d4] font-bold flex items-center">
              <input
                type="text"
                list="master-clients-list"
                value={slip.clientName}
                onChange={(e) => updateField('clientName', e.target.value)}
                readOnly={isReadOnly}
                placeholder="Select or type client name..."
                className="w-full bg-transparent font-bold focus:outline-none cursor-pointer"
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

          {/* Row 13: Supplier with Dropdown & Currency */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div className="col-span-2 px-2 py-1 font-normal border-r border-[#d4d4d4] flex items-center">
              Supplier
            </div>
            <div className="col-span-4 px-2 py-1 border-r border-[#d4d4d4] font-bold flex items-center">
              <input
                type="text"
                list="master-suppliers-list"
                value={slip.supplier}
                onChange={(e) => updateField('supplier', e.target.value)}
                readOnly={isReadOnly}
                placeholder="Select or type supplier..."
                className="w-full bg-transparent font-bold focus:outline-none cursor-pointer"
              />
            </div>
            <div className="col-span-2 px-2 py-1 font-normal border-r border-[#d4d4d4] flex items-center">
              Currency
            </div>
            <div className="col-span-4 px-2 py-1 font-normal flex items-center">
              AED
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

        {/* MATERIAL TABLE (ROW 16 ONWARDS) */}
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
                <tr key={item.id || idx} className="border-b border-black hover:bg-slate-50/50">
                  <td className="py-0.5 px-2 border-r border-black font-medium">
                    <input
                      type="text"
                      list="master-materials-list"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      readOnly={isReadOnly}
                      placeholder="Type or select material..."
                      className="w-full bg-transparent focus:outline-none cursor-pointer"
                    />
                  </td>
                  <td className="py-0.5 px-1 border-r border-black text-center font-bold">
                    <input
                      type="number"
                      step="any"
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                      readOnly={isReadOnly}
                      className="w-full text-center bg-transparent font-bold focus:outline-none"
                    />
                  </td>
                  <td className="py-0.5 px-1 border-r border-black text-center font-bold">
                    <input
                      type="number"
                      step="any"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                      readOnly={isReadOnly}
                      className="w-full text-center bg-transparent font-bold focus:outline-none"
                    />
                  </td>
                  <td className="py-0.5 px-2 border-r border-black text-right font-mono font-bold">
                    {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-0.5 px-2 text-center font-normal">
                    <input
                      type="text"
                      list="master-projects-list"
                      value={item.projectName}
                      onChange={(e) => handleItemChange(idx, 'projectName', e.target.value)}
                      readOnly={isReadOnly}
                      className="w-full text-center bg-transparent focus:outline-none"
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
                  TOTAL with VAT
                </td>
                <td className="py-0.5 px-2 text-right font-mono font-bold border-r border-[#d4d4d4]">
                  {(subtotal + vat).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="border-r border-[#d4d4d4]"></td>
              </tr>

              {/* Row 32: Tranport */}
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
                    readOnly={isReadOnly}
                    className="w-full text-right bg-transparent font-bold focus:outline-none"
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

          {/* Quick subtle Add Row action button under table */}
          {!isReadOnly && (
            <div className="flex items-center justify-between p-1 bg-slate-50 border-t border-[#d4d4d4] text-[10px] text-slate-500 print:hidden">
              <span>{slip.items.length} items listed (click any description to select from master material library)</span>
              <button
                type="button"
                onClick={addItem}
                className="px-2 py-0.5 rounded bg-slate-200 hover:bg-[#C8A96A] text-slate-800 font-bold transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Material Row
              </button>
            </div>
          )}
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

        {/* ROWS 36-43: VERIFICATION SUB-TABLE */}
        <div className="border-b border-[#d4d4d4] text-[11px]">
          {/* Row 36: Headers */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div className="col-span-3 px-2 py-1 font-normal border-r border-[#d4d4d4] flex items-center">
              Current Project Progress
            </div>
            <div className="col-span-1 px-1 py-1 text-center font-bold border-r border-[#d4d4d4] flex items-center justify-center">
              <input
                type="number"
                value={slip.currentProgress}
                onChange={(e) => updateField('currentProgress', Number(e.target.value) || 0)}
                readOnly={isReadOnly}
                className="w-8 text-center font-bold bg-transparent focus:outline-none"
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
            <div className="col-span-4 px-2 py-1 border-r border-[#d4d4d4] flex items-center gap-1">
              <span>📅Materials will arrive on:</span>
              <input
                type="text"
                value={slip.materialsArrivalDate}
                onChange={(e) => updateField('materialsArrivalDate', e.target.value)}
                readOnly={isReadOnly}
                className="font-bold flex-1 bg-transparent focus:outline-none"
              />
            </div>
            {/* Cell J37: Production will continue (YELLOW HIGHLIGHT) */}
            <div
              onClick={() => updateBenefit('productionWillContinue')}
              className="col-span-3 px-2 py-1 bg-[#FFFF00] font-bold text-black flex items-center gap-1.5 cursor-pointer select-none"
            >
              <span>{slip.benefits.productionWillContinue ? '☑' : '☐'}</span>
              <span>Production will continue</span>
            </div>
          </div>

          {/* Row 38: Engineering | Painting | Production can start | Project delay */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div
              onClick={() => updateStage('engineering')}
              className="col-span-3 px-2 py-1 border-r border-[#d4d4d4] flex items-center gap-1.5 cursor-pointer select-none"
            >
              <span>{slip.stages.engineering ? '☑' : '☐'}</span>
              <span>Engineering</span>
            </div>
            <div
              onClick={() => updateStage('painting')}
              className="col-span-2 px-2 py-1 border-r border-[#d4d4d4] flex items-center gap-1.5 cursor-pointer select-none"
            >
              <span>{slip.stages.painting ? '☑' : '☐'}</span>
              <span>Painting</span>
            </div>
            <div className="col-span-4 px-2 py-1 border-r border-[#d4d4d4] flex items-center gap-1">
              <span>⚙ Production can start on:</span>
              <input
                type="text"
                value={slip.productionStartDate}
                onChange={(e) => updateField('productionStartDate', e.target.value)}
                readOnly={isReadOnly}
                className="font-bold flex-1 bg-transparent focus:outline-none"
              />
            </div>
            <div
              onClick={() => updateBenefit('projectDelayAvoided')}
              className="col-span-3 px-2 py-1 flex items-center gap-1.5 cursor-pointer select-none hover:bg-slate-50"
            >
              <span>{slip.benefits.projectDelayAvoided ? '☑' : '☐'}</span>
              <span>Project delay will be avoided</span>
            </div>
          </div>

          {/* Row 39: Material Procurement (YELLOW) | Fabric | Delivery date | Client milestone */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            {/* Cell A39: Material Procurement (YELLOW HIGHLIGHT) */}
            <div
              onClick={() => updateStage('materialProcurement')}
              className="col-span-3 px-2 py-1 bg-[#FFFF00] font-bold text-black border-r border-[#d4d4d4] flex items-center gap-1.5 cursor-pointer select-none"
            >
              <span>{slip.stages.materialProcurement ? '☑' : '☐'}</span>
              <span>Material Procurement</span>
            </div>
            <div
              onClick={() => updateStage('fabric')}
              className="col-span-2 px-2 py-1 border-r border-[#d4d4d4] flex items-center gap-1.5 cursor-pointer select-none"
            >
              <span>{slip.stages.fabric ? '☑' : '☐'}</span>
              <span>Fabric</span>
            </div>
            <div className="col-span-4 px-2 py-1 border-r border-[#d4d4d4] flex items-center gap-1 text-[10.5px]">
              <span>🚚 Delivery date:</span>
              <span className="font-bold">Thursday 4rd</span>
            </div>
            <div
              onClick={() => updateBenefit('clientMilestoneAchieved')}
              className="col-span-3 px-2 py-1 flex items-center gap-1.5 cursor-pointer select-none hover:bg-slate-50"
            >
              <span>{slip.benefits.clientMilestoneAchieved ? '☑' : '☐'}</span>
              <span>Client milestone will be achieved</span>
            </div>
          </div>

          {/* Row 40: Fabrication | Dispatch | Installation date | Client payment claimed */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div
              onClick={() => updateStage('fabrication')}
              className="col-span-3 px-2 py-1 border-r border-[#d4d4d4] flex items-center gap-1.5 cursor-pointer select-none"
            >
              <span>{slip.stages.fabrication ? '☑' : '☐'}</span>
              <span>Fabrication</span>
            </div>
            <div
              onClick={() => updateStage('dispatch')}
              className="col-span-2 px-2 py-1 border-r border-[#d4d4d4] flex items-center gap-1.5 cursor-pointer select-none"
            >
              <span>{slip.stages.dispatch ? '☑' : '☐'}</span>
              <span>Dispatch</span>
            </div>
            <div className="col-span-4 px-2 py-1 border-r border-[#d4d4d4] flex items-center gap-1 text-[10.5px]">
              <span>👷 Installation date:</span>
              <span className="font-bold">next week</span>
            </div>
            <div
              onClick={() => updateBenefit('clientPaymentClaimed')}
              className="col-span-3 px-2 py-1 flex items-center gap-1.5 cursor-pointer select-none hover:bg-slate-50"
            >
              <span>{slip.benefits.clientPaymentClaimed ? '☑' : '☐'}</span>
              <span>Client payment can be claimed</span>
            </div>
          </div>

          {/* Row 41: Installation | NEXT CLIENT PAYMENT */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div
              onClick={() => updateStage('installation')}
              className="col-span-5 px-2 py-1 border-r border-[#d4d4d4] flex items-center gap-1.5 cursor-pointer select-none"
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

          {/* Row 43: Values (BOTH HIGHLIGHTED IN YELLOW #FFFF00) */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div className="col-span-5 border-r border-[#d4d4d4]"></div>
            {/* Cell F43: 3,990.00 (YELLOW) */}
            <div className="col-span-4 px-2 py-1 bg-[#FFFF00] font-black text-black text-center border-r border-[#d4d4d4]">
              <input
                type="text"
                value="3,990.00"
                readOnly={isReadOnly}
                className="w-full text-center bg-transparent font-black focus:outline-none"
              />
            </div>
            {/* Cell I43: TBD after purchase (YELLOW) */}
            <div className="col-span-3 px-2 py-1 bg-[#FFFF00] font-bold text-black text-center">
              <input
                type="text"
                value="TBD after purchase"
                readOnly={isReadOnly}
                className="w-full text-center bg-transparent font-bold focus:outline-none"
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
            <div className="col-span-3 px-2 py-1 border-r border-[#d4d4d4] flex items-center gap-1 font-bold">
              <span>☐ Yes</span>
            </div>
            <div className="col-span-7"></div>
          </div>

          {/* Row 47: Outstanding Supplier Balance (YELLOW AED= 0) */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4]">
            <div className="col-span-3 px-2 py-1 border-r border-[#d4d4d4]">
              Outstanding Supplier Balance
            </div>
            {/* Cell D47: AED= 0 (YELLOW HIGHLIGHT) */}
            <div className="col-span-2 px-2 py-1 bg-[#FFFF00] font-bold text-black border-r border-[#d4d4d4] flex items-center justify-center">
              AED= 0
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

        {/* ROWS 53-58: 6-TIER APPROVAL FLOW ROWS (SIGNATURE COLUMN EMPTY FOR SIGNING) */}
        <div className="border-b border-[#d4d4d4] text-[11px]">
          {/* Step 1: Requested By -> Usman */}
          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-1 py-1.5 text-center font-bold border-r border-black bg-[#001229] text-white flex items-center justify-center">
              1
            </div>
            <div className="col-span-4 px-2 py-1.5 border-r border-black flex items-center">
              Requested By
            </div>
            <div className="col-span-4 px-2 py-1.5 text-center font-bold border-r border-black flex items-center justify-center">
              Usman
            </div>
            {/* Signature Cell Clean & Empty */}
            <div className="col-span-3 px-2 py-1.5 text-center h-7 border-r border-[#d4d4d4]"></div>
          </div>

          {/* Step 2: Approved By (Project Manager) -> Hamza */}
          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-1 py-1.5 text-center font-bold border-r border-black bg-[#001229] text-white flex items-center justify-center">
              2
            </div>
            <div className="col-span-4 px-2 py-1.5 border-r border-black flex items-center">
              Approved By (Project Manager)
            </div>
            <div className="col-span-4 px-2 py-1.5 text-center font-bold border-r border-black flex items-center justify-center">
              Hamza
            </div>
            {/* Signature Cell Clean & Empty */}
            <div className="col-span-3 px-2 py-1.5 text-center h-7 border-r border-[#d4d4d4]"></div>
          </div>

          {/* Step 3: Verified By (Project Coordinator) -> Ms. Zoha Khan (Normal Font, Signature Empty) */}
          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-1 py-1.5 text-center font-bold border-r border-black bg-[#001229] text-white flex items-center justify-center">
              3
            </div>
            <div className="col-span-4 px-2 py-1.5 border-r border-black flex items-center">
              Verified By (Project Coordinator)
            </div>
            <div className="col-span-4 px-2 py-1.5 text-center font-bold border-r border-black flex items-center justify-center">
              Ms. Zoha Khan
            </div>
            {/* Signature Cell Clean & Empty */}
            <div className="col-span-3 px-2 py-1.5 text-center h-7 border-r border-[#d4d4d4]"></div>
          </div>

          {/* Step 4: Accounts Verification -> Zain */}
          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-1 py-1.5 text-center font-bold border-r border-black bg-[#001229] text-white flex items-center justify-center">
              4
            </div>
            <div className="col-span-4 px-2 py-1.5 border-r border-black flex items-center">
              Accounts Verification
            </div>
            <div className="col-span-4 px-2 py-1.5 text-center font-bold border-r border-black flex items-center justify-center">
              Zain
            </div>
            {/* Signature Cell Clean & Empty */}
            <div className="col-span-3 px-2 py-1.5 text-center h-7 border-r border-[#d4d4d4]"></div>
          </div>

          {/* Step 5: Final Approval -> Sadiya */}
          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-1 py-1.5 text-center font-bold border-r border-black bg-[#001229] text-white flex items-center justify-center">
              5
            </div>
            <div className="col-span-4 px-2 py-1.5 border-r border-black flex items-center">
              Final Approval
            </div>
            <div className="col-span-4 px-2 py-1.5 text-center font-bold border-r border-black flex items-center justify-center">
              Sadiya
            </div>
            {/* Signature Cell Clean & Empty */}
            <div className="col-span-3 px-2 py-1.5 text-center h-7 border-r border-[#d4d4d4]"></div>
          </div>

          {/* Step 6: Payment Released By -> Javeriya */}
          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-1 py-1.5 text-center font-bold border-r border-black bg-[#001229] text-white flex items-center justify-center">
              6
            </div>
            <div className="col-span-4 px-2 py-1.5 border-r border-black flex items-center">
              Payment Released By
            </div>
            <div className="col-span-4 px-2 py-1.5 text-center font-bold border-r border-black flex items-center justify-center">
              Javeriya
            </div>
            {/* Signature Cell Clean & Empty */}
            <div className="col-span-3 px-2 py-1.5 text-center h-7 border-r border-[#d4d4d4]"></div>
          </div>
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

        {/* ROWS 61-66: FINAL DECISION OPTIONS & REASON */}
        <div className="border-b border-[#d4d4d4] text-[11px]">
          {/* Row 61: The 3 Choices mirroring Excel */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4] py-1.5">
            <div
              onClick={() => updateField('finalDecision', 'APPROVED FOR PAYMENT')}
              className={`col-span-4 text-center font-bold cursor-pointer select-none ${
                slip.finalDecision === 'APPROVED FOR PAYMENT' ? 'text-black font-black' : 'text-slate-600'
              }`}
            >
              ● APPROVED FOR PAYMENT
            </div>
            <div
              onClick={() => updateField('finalDecision', 'HOLD PAYMENT')}
              className={`col-span-4 text-center font-bold cursor-pointer select-none ${
                slip.finalDecision === 'HOLD PAYMENT' ? 'text-black font-black' : 'text-slate-600'
              }`}
            >
              Ⅱ HOLD PAYMENT
            </div>
            <div
              onClick={() => updateField('finalDecision', 'REJECTED')}
              className={`col-span-4 text-center font-bold cursor-pointer select-none ${
                slip.finalDecision === 'REJECTED' ? 'text-black font-black' : 'text-slate-600'
              }`}
            >
              ✕ REJECTED
            </div>
          </div>

          {/* Row 63: Reason (if Hold/Rejected): */}
          <div className="grid grid-cols-12 border-b border-[#d4d4d4] px-2 py-1">
            <div className="col-span-3 text-slate-700">
              Reason (if Hold/Rejected):
            </div>
            <div className="col-span-9">
              <input
                type="text"
                value={slip.decisionReason || ''}
                onChange={(e) => updateField('decisionReason', e.target.value)}
                readOnly={isReadOnly}
                className="w-full bg-transparent focus:outline-none"
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
      </div>
    );
  }
);

PaymentReleaseForm.displayName = 'PaymentReleaseForm';
