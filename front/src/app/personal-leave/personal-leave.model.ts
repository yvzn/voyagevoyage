export enum LeaveType {
  Annual = 'annual',
  Sick = 'sick',
  Other = 'other',
}

export interface PersonalLeave {
  id: string;
  startDate: string; // ISO 8601 date: YYYY-MM-DD
  endDate: string; // ISO 8601 date: YYYY-MM-DD
  type: LeaveType;
  label: string;
}

export interface CreatePersonalLeaveRequest {
  startDate: string; // ISO 8601 date: YYYY-MM-DD
  endDate: string; // ISO 8601 date: YYYY-MM-DD
  type: LeaveType;
  label: string;
}

export interface UpdatePersonalLeaveRequest {
  startDate: string; // ISO 8601 date: YYYY-MM-DD
  endDate: string; // ISO 8601 date: YYYY-MM-DD
  type: LeaveType;
  label: string;
}
