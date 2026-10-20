export type Role = 'Administrator' | 'Project Manager' | 'Engineer' | 'Salesperson';

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
}

export const STATUSES = [
  'New Request',
  'For Review',
  'In Progress',
  'On Hold',
  'Waiting for Client',
  'Waiting for Engineering',
  'Completed',
  'Cancelled',
] as const;
export type Status = (typeof STATUSES)[number];

export const PRIORITIES = ['Low', 'Normal', 'High', 'Critical'] as const;
export type Priority = (typeof PRIORITIES)[number];

// Q1: the nine engineering scopes, in this order.
export const SCOPE_TYPES = [
  'Lifting',
  'Transport',
  'Jacking & Skidding',
  'Shutdown',
  'Bridging',
  'GBP Calculation',
  'Route Survey',
  'MS Study',
  'DWG',
] as const;
export type ScopeType = (typeof SCOPE_TYPES)[number];

// Q6: default milestones added to every new project.
export const DEFAULT_MILESTONES = [
  'Request Received',
  'Engineering Review',
  'Scope Confirmation',
  'Calculation Completed',
  'Drawing Completed',
  'Client Approval',
  'Project Completion',
] as const;

/** Dates are local calendar dates as YYYY-MM-DD strings. */
export type ISODate = string;

export interface Scope {
  id: string;
  type: ScopeType;
  engineerId: string | null;
  description: string;
  requested: ISODate | null;
  start: ISODate | null;
  due: ISODate | null;
  priority: Priority;
  status: Status;
  progress: number;
  dependsOn: string[];
  notes: string;
  completed: ISODate | null;
}

export interface Task {
  id: string;
  name: string;
  scopeId: string | null;
  assigneeId: string | null;
  due: ISODate | null;
  done: boolean;
}

export interface Milestone {
  id: string;
  name: string;
  date: ISODate | null;
  done: boolean;
}

export interface Activity {
  id: string;
  at: string; // ISO date-time
  userId: string;
  action: string;
  from?: string;
  to?: string;
}

export interface Note {
  id: string;
  at: string;
  userId: string;
  text: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  at: string;
  userId: string;
}

export interface Project {
  id: string;
  number: string;
  name: string;
  clientId: string;
  description: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  salesId: string;
  pmId: string;
  requested: ISODate;
  start: ISODate | null;
  due: ISODate;
  plannedFinish: ISODate | null;
  actualFinish: ISODate | null;
  priority: Priority;
  status: Status;
  archived: boolean;
  scopes: Scope[];
  tasks: Task[];
  milestones: Milestone[];
  notes: Note[];
  attachments: Attachment[];
  activity: Activity[];
}

export interface Client {
  id: string;
  name: string;
  /** Registered company name, when it differs from the client name. */
  company?: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  salesId: string;
}

export type ReminderStep = '7d' | '3d' | '1d' | 'today' | 'overdue';

export interface Notice {
  key: string;
  itemType: 'project' | 'scope';
  projectId: string;
  scopeId?: string;
  step: ReminderStep;
  recipientId: string;
  trigger: ISODate;
  due: ISODate;
}
