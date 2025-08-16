
export enum ServiceType {
  DEPOSIT = 'Cash Deposit',
  WITHDRAWAL = 'Cash Withdrawal',
  UPDATE_DETAILS = 'Update Contact Details',
}

export interface TransactionData {
  accountNumber: string;
  customerName: string;
  serviceType: ServiceType;
  amount?: number;
  details?: string;
  timestamp: string;
}

export interface Customer {
  name: string;
  accountNumber: string;
  balance: number;
}
