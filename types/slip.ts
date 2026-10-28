export interface MaterialItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
  projectName: string;
}

export interface ApprovalStep {
  step: number;
  position: string;
  name: string;
  signed: boolean;
  signedAt?: string;
  signatureToken?: string;
  signatureType?: 'stamp' | 'draw';
  signatureDataUrl?: string;
}

export interface PaymentSlip {
  id: string;
  paymentRequestNo: string;
  date: string;
  department: string;
  purpose: string;
  projectName: string;
  projectCode: string;
  clientName: string;
  supplier: string;
  currency: string;
  items: MaterialItem[];
  transport: number;
  vatRate: number; // default 5%
  
  // Verification details
  currentProgress: number; // e.g. 90%
  materialsArrivalDate: string;
  productionStartDate: string;
  deliveryDate?: string;
  installationDate?: string;
  
  // Checkboxes
  stages: {
    engineering: boolean;
    painting: boolean;
    materialProcurement: boolean;
    fabric: boolean;
    fabrication: boolean;
    dispatch: boolean;
    installation: boolean;
  };
  benefits: {
    productionWillContinue: boolean;
    projectDelayAvoided: boolean;
    clientMilestoneAchieved: boolean;
    clientPaymentClaimed: boolean;
  };
  
  // Next client payment
  expectedInvoiceValue: number;
  expectedCollectionDate: string;
  
  // Remarks
  budgetAvailable: 'Yes' | 'No' | 'Pending';
  outstandingBalance: number;
  
  // Approval Flow
  approvalSteps: ApprovalStep[];
  
  // Final decision
  finalDecision: 'APPROVED FOR PAYMENT' | 'HOLD PAYMENT' | 'REJECTED';
  decisionReason?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  verifiedByZoha: boolean;
  verifiedAt?: string;
  syncedToSupabase?: boolean;
}
