import { PaymentSlip } from '@/types/slip';
import { calculateSlipTotal } from './supabase';

export function formatWhatsAppSummary(slip: PaymentSlip): string {
  const total = calculateSlipTotal(slip);
  const totalFormatted = total.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const hamzaApproved = slip.approvalSteps?.find((s) => s.step === 2)?.signed;
  const zohaVerified = slip.verifiedByZoha || slip.approvalSteps?.find((s) => s.step === 3)?.signed;

  let verificationText = '';
  if (zohaVerified && hamzaApproved) {
    verificationText = 'Verified by Ms. Zoha Khan (PC) & Approved by Hamza (PM) ✅';
  } else if (zohaVerified) {
    verificationText = 'Verified by Ms. Zoha Khan (PC) ✅ | Pending PM Approval';
  } else if (hamzaApproved) {
    verificationText = 'Approved by Hamza (PM) ✅ | Pending PC Verification';
  } else {
    verificationText = 'Pending Approvals';
  }

  const clientProject = slip.projectName
    ? `${slip.clientName || 'Client'} / ${slip.projectName}`
    : slip.clientName || 'N/A';

  const text = `📋 *AL ZAYED TENTS & SHADES LLC - PAYMENT RELEASE*
• *Request No:* ${slip.paymentRequestNo || 'N/A'}
• *Project / Client:* ${clientProject}
• *Supplier:* ${slip.supplier || 'N/A'}
• *Total Amount:* AED ${totalFormatted} (Incl. ${slip.vatRate ?? 5}% VAT & Transport)
• *Progress:* ${slip.currentProgress ?? 0}%
• *Verification:* ${verificationText}`;

  return text;
}
