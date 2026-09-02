export interface FiscalRule {
  id: string;
  startDate: string; // ISO 8601 date: YYYY-MM-DD
  endDate: string; // ISO 8601 date: YYYY-MM-DD
  mealAllowance: number;
  mealVoucherFaceValue: number;
  mealVoucherEmployerContributionPercentage: number;
  remoteWorkAllowance: number;
}

export interface CreateFiscalRuleRequest {
  startDate: string;
  endDate: string;
  mealAllowance: number;
  mealVoucherFaceValue: number;
  mealVoucherEmployerContributionPercentage: number;
  remoteWorkAllowance: number;
}

export interface UpdateFiscalRuleRequest {
  startDate: string;
  endDate: string;
  mealAllowance: number;
  mealVoucherFaceValue: number;
  mealVoucherEmployerContributionPercentage: number;
  remoteWorkAllowance: number;
}
