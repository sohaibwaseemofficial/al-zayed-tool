import { PaymentSlip } from '@/types/slip';
import { calculateSlipSubtotal, calculateSlipVAT, calculateSlipTotal } from './supabase';

export function formatWhatsAppSummary(slip: PaymentSlip): string {
  const subtotal = calculateSlipSubtotal(slip);
  const vat = calculateSlipVAT(slip);
  const total = calculateSlipTotal(slip);

  const formattedItems = (slip.items || [])
    .map(
      (item, idx) =>
        `  ${idx + 1}. *${item.description}*\n     • Qty: ${item.qty} | Rate: AED ${item.unitPrice.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} | Amount: AED ${item.amount.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
    )
    .join('\n');

  const zohaStep = slip.approvalSteps?.find((s) => s.step === 3);
  const hamzaStep = slip.approvalSteps?.find((s) => s.step === 2);

  const zohaStatus = slip.verifiedByZoha || zohaStep?.signed
    ? '✅ *VERIFIED* (Ms. Zoha Khan - Project Coordinator)'
    : '⏳ *Pending Verification* (Ms. Zoha Khan)';

  const hamzaStatus = hamzaStep?.signed
    ? '✅ *Approved* (Hamza - Project Manager)'
    : '⏳ *Pending Approval* (Hamza)';

  const statusEmoji =
    slip.finalDecision === 'APPROVED FOR PAYMENT'
      ? '🟢'
      : slip.finalDecision === 'HOLD PAYMENT'
      ? '🟡'
      : '🔴';

  const text = `📋 *AL ZAYED TENTS & SHADES LLC*
*PROJECT MATERIAL PAYMENT RELEASE*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 *Client:* ${slip.clientName || 'N/A'}
📁 *Project:* ${slip.projectName || 'N/A'} [${slip.projectCode || 'N/A'}]
📄 *Request No:* ${slip.paymentRequestNo || 'N/A'}
📅 *Date:* ${slip.date || new Date().toISOString().split('T')[0]}
🏷️ *Supplier:* ${slip.supplier || 'N/A'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 *MATERIAL ITEMS BREAKDOWN:*
${formattedItems || '  No items listed'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 *PAYMENT CALCULATIONS:*
• *Subtotal:* AED ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
• *5% VAT:* AED ${vat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
• *Transport:* AED ${(Number(slip.transport) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
⭐ *TOTAL AMOUNT: AED ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 *PROJECT PROGRESS & IMPACT:*
• *Current Progress:* ${slip.currentProgress || 0}%
• *Materials Arrival:* ${slip.materialsArrivalDate || 'TBD'}
• *Production Start:* ${slip.productionStartDate || 'TBD'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ *APPROVAL VERIFICATION:*
• ${hamzaStatus}
• ${zohaStatus}
• ${statusEmoji} *Final Decision:* ${slip.finalDecision}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Generated via Al Zayed Payment System_`;

  return text;
}
