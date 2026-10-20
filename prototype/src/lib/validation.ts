import type { Client, ISODate, Priority, Project, ScopeType, Status } from '../types';
import { NUMBER_RE } from './rules';

export interface ScopeDraft {
  id?: string;
  type: ScopeType;
  engineerId: string;
  start: ISODate;
  due: ISODate;
  priority: Priority;
}

export interface ProjectDraft {
  number: string;
  name: string;
  clientId: string;
  description: string;
  requested: ISODate;
  start: ISODate;
  due: ISODate;
  priority: Priority;
  status: Status;
  salesId: string;
  pmId: string;
  scopes: ScopeDraft[];
}

export type Errors = Partial<Record<string, string>>;

export function validateProject(d: ProjectDraft, projects: Project[], editingId?: string): Errors {
  const e: Errors = {};
  const num = d.number.trim().toUpperCase();
  if (!num) e.number = 'Enter a project number.';
  else if (!NUMBER_RE.test(num)) e.number = 'Use the format CRM-YYYY-NNNN, for example CRM-2026-0151.';
  else {
    const clash = projects.find((p) => p.number === num && p.id !== editingId);
    if (clash) e.number = `${num} is already used by “${clash.name}”.`;
  }
  if (!d.name.trim()) e.name = 'Enter a project name.';
  if (!d.clientId) e.clientId = 'Choose a client.';
  if (!d.requested) e.requested = 'Enter the date requested.';
  if (!d.due) e.due = 'Enter the project due date.';
  if (d.start && d.due && d.due < d.start) e.due = 'The due date is before the start date.';
  if (d.requested && d.start && d.start < d.requested) e.start = 'The start date is before the date requested.';
  if (!d.salesId) e.salesId = 'Choose the salesperson.';
  if (!d.pmId) e.pmId = 'Choose the project manager.';
  if (d.scopes.length === 0) e.scopes = 'Tick at least one engineering scope.';
  d.scopes.forEach((s) => {
    if (s.start && s.due && s.due < s.start) e[`scope:${s.type}`] = `${s.type}: due date is before its start date.`;
    else if (s.due && d.due && s.due > d.due) e[`scope:${s.type}`] = `${s.type}: due date is after the project due date.`;
  });
  return e;
}

export type ClientDraft = Omit<Client, 'id'>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s()-]+$/;
const squash = (v: string) => v.trim().replace(/\s+/g, ' ').toLowerCase();

export function validateClient(d: ClientDraft, clients: Client[], editingId?: string): Errors {
  const e: Errors = {};
  if (!d.name.trim()) e.name = 'Enter the client name.';
  else {
    const clash = clients.find((c) => c.id !== editingId && squash(c.name) === squash(d.name));
    if (clash) e.name = `“${clash.name}” is already in the client list.`;
  }
  if (!d.contact.trim()) e.contact = 'Enter a contact person.';
  if (!d.email.trim()) e.email = 'Enter an email address.';
  else if (!EMAIL_RE.test(d.email.trim())) e.email = 'This does not look like an email address.';
  const digits = d.phone.replace(/\D/g, '').length;
  if (!d.phone.trim()) e.phone = 'Enter a phone number.';
  else if (!PHONE_RE.test(d.phone.trim()) || digits < 7 || digits > 15) e.phone = 'Use 7 to 15 digits, with an optional + and spaces or dashes, for example +63 917 000 0000.';
  if (!d.salesId) e.salesId = 'Choose the salesperson who handles this client.';
  return e;
}
