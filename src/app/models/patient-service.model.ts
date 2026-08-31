export type ServiceStatus = 'Open' | 'Billed' | 'Partial' | 'Paid' | 'Denied';

export interface DiagnosisCode {
  icd_code: string;
  description: string;
}

export interface ServiceLine {
  cpt_code: string;
  description: string;
  modifier: string;
  units: number;
  amount: number;
}

export interface ServicePayment {
  pay_date: string;
  method: string;
  reference: string;
  amount: number;
}

export interface PatientService {
  svc_id: number;
  svc_date: string;
  facility_id: number | null;
  provider_id: number | null;
  facility_nm?: string;
  provider_nm?: string;
  status: ServiceStatus;
  notes: string;
  lines: ServiceLine[];
  payments: ServicePayment[];
}
