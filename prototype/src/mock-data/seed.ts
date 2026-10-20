// DEMO DATA. Every person, client and project here is fictional.
// Dates are relative to the day the prototype is opened, so "due today" and "overdue" always show.
import type { Activity, Client, Milestone, Priority, Project, Scope, ScopeType, Status, Task, User } from '../types';
import { DEFAULT_MILESTONES } from '../types';
import { addDays, todayISO } from '../lib/dates';

export const USERS: User[] = [
  { id: 'u-admin', name: 'Carmen Uy', role: 'Administrator', email: 'carmen.uy@example.com' },
  { id: 'u-pm1', name: 'Leo Santos', role: 'Project Manager', email: 'leo.santos@example.com' },
  { id: 'u-pm2', name: 'Grace Mendoza', role: 'Project Manager', email: 'grace.mendoza@example.com' },
  { id: 'u-e1', name: 'Jun Cruz', role: 'Engineer', email: 'jun.cruz@example.com' },
  { id: 'u-e2', name: 'Mia Tan', role: 'Engineer', email: 'mia.tan@example.com' },
  { id: 'u-e3', name: 'Ramon Lim', role: 'Engineer', email: 'ramon.lim@example.com' },
  { id: 'u-e4', name: 'Kat Bautista', role: 'Engineer', email: 'kat.bautista@example.com' },
  { id: 'u-s1', name: 'Ana Reyes', role: 'Salesperson', email: 'ana.reyes@example.com' },
  { id: 'u-s2', name: 'Dan Ocampo', role: 'Salesperson', email: 'dan.ocampo@example.com' },
  { id: 'u-s3', name: 'Sara Villanueva', role: 'Salesperson', email: 'sara.villanueva@example.com' },
];

export const CLIENTS: Client[] = [
  { id: 'c1', name: 'Meridian Petrochem Inc.', contact: 'Elena Navarro', email: 'e.navarro@meridian.example', phone: '+63 917 000 0142', address: 'Bataan Refinery Complex, Limay', notes: 'Prefers weekly progress emails.', salesId: 'u-s1' },
  { id: 'c2', name: 'Northgrid Power Corp.', contact: 'Paolo Ramos', email: 'p.ramos@northgrid.example', phone: '+63 917 000 0138', address: 'Substation B, Calaca, Batangas', notes: '', salesId: 'u-s2' },
  { id: 'c3', name: 'Coastal Refining Co.', contact: 'Iris Domingo', email: 'i.domingo@coastal.example', phone: '+63 917 000 0131', address: 'Pier 4, Batangas Port', notes: 'Site access needs 48 h notice.', salesId: 'u-s3' },
  { id: 'c4', name: 'Vista Chemicals', contact: 'Noel Garcia', email: 'n.garcia@vista.example', phone: '+63 917 000 0127', address: 'Unit 3 Plant, Laguna Technopark', notes: '', salesId: 'u-s2' },
  { id: 'c5', name: 'Harbor Fabricators', contact: 'Rina Castro', email: 'r.castro@harborfab.example', phone: '+63 917 000 0124', address: 'Yard 2, Subic Bay Freeport', notes: '', salesId: 'u-s3' },
  { id: 'c6', name: 'Pacific Cement Works', contact: 'Tomas Aquino', email: 't.aquino@pacem.example', phone: '+63 917 000 0147', address: 'Kiln Line 2, Teresa, Rizal', notes: '', salesId: 'u-s1' },
  { id: 'c7', name: 'Southbay Shipyard', contact: 'Lea Flores', email: 'l.flores@southbay.example', phone: '+63 917 000 0150', address: 'Dry Dock 1, Mariveles', notes: '', salesId: 'u-s2' },
];

let seq = 0;
const id = (p: string) => `${p}-${++seq}`;

type ScopeSpec = [ScopeType, string | null, number, number, number, Status, string?];

export function buildSeed(): { projects: Project[]; clients: Client[] } {
  seq = 0;
  const T = todayISO();
  const d = (n: number) => addDays(T, n);
  const ago = (mins: number) => new Date(Date.now() - mins * 6e4).toISOString();

  function scopes(specs: ScopeSpec[], pri: Priority): Scope[] {
    const out: Scope[] = [];
    for (const [type, eng, s, e, prog, status, dep] of specs) {
      out.push({
        id: id('s'), type, engineerId: eng, description: '', requested: null,
        start: d(s), due: d(e), priority: pri, status, progress: prog,
        dependsOn: dep ? [out.find((x) => x.type === dep)!.id] : [], notes: '',
        completed: status === 'Completed' ? d(e - 1) : null,
      });
    }
    return out;
  }

  // Milestones are spread from request to due date; those already past are reached (all of them for closed projects).
  function milestones(req: number, due: number, closed: boolean): Milestone[] {
    const span = due - req;
    return DEFAULT_MILESTONES.map((name, i) => {
      const off = Math.round(req + (span * i) / (DEFAULT_MILESTONES.length - 1));
      return { id: id('m'), name, date: d(off), done: closed || off < 0 };
    });
  }

  function project(o: {
    num: string; name: string; client: string; sales: string; pm: string; req: number; start: number | null; due: number;
    pri: Priority; status: Status; sc: ScopeSpec[]; desc?: string; tasks?: [string, ScopeType | null, string | null, number, boolean][];
    activity?: [number, string, string, string?, string?][]; finish?: number;
  }): Project {
    const sc = scopes(o.sc, o.pri);
    const tasks: Task[] = (o.tasks ?? []).map(([name, st, who, due, done]) => ({
      id: id('t'), name, scopeId: st ? sc.find((x) => x.type === st)!.id : null, assigneeId: who, due: d(due), done,
    }));
    const activity: Activity[] = [
      ...(o.activity ?? []).map(([mins, userId, action, from, to]) => ({ id: id('a'), at: ago(mins), userId, action, from, to })),
      { id: id('a'), at: new Date(`${d(o.req)}T09:00:00`).toISOString(), userId: o.sales, action: 'Project created' },
    ];
    return {
      id: o.num, number: o.num, name: o.name, clientId: o.client,
      description: o.desc ?? 'Engineering support for the scopes listed below. Site constraints and client documents are in Attachments.',
      createdAt: activity[activity.length - 1].at, createdBy: o.sales, updatedAt: activity[0].at, updatedBy: activity[0].userId,
      salesId: o.sales, pmId: o.pm, requested: d(o.req), start: o.start == null ? null : d(o.start), due: d(o.due),
      plannedFinish: d(o.due - 1), actualFinish: o.finish != null ? d(o.finish) : null, priority: o.pri, status: o.status, archived: false,
      scopes: sc, tasks, milestones: milestones(o.req, o.due, o.status === 'Completed' || o.status === 'Cancelled'), notes: [], attachments: [], activity,
    };
  }

  const projects: Project[] = [
    project({
      num: 'CRM-2026-0142', name: 'Reactor Vessel R-301 Lift', client: 'c1', sales: 'u-s1', pm: 'u-pm1', req: -22, start: -19, due: 4, pri: 'High', status: 'In Progress',
      desc: 'Tandem lift of a 186 t reactor vessel onto plinth P-3 inside the live unit. Includes route check for the 750 t crawler crane, lift plan, method statement and drawings.',
      sc: [
        ['Route Survey', 'u-e2', -19, -11, 100, 'Completed'],
        ['Lifting', 'u-e1', -8, 2, 60, 'In Progress', 'Route Survey'],
        ['MS Study', 'u-e1', -8, 1, 50, 'In Progress'],
        ['DWG', 'u-e4', -5, 4, 20, 'In Progress', 'Lifting'],
      ],
      tasks: [
        ['Confirm crane capacity chart at 38 m radius', 'Lifting', 'u-e1', -4, true],
        ['Ground bearing check against GBP data', 'Lifting', 'u-e1', 1, false],
        ['Draft method statement', 'MS Study', 'u-e1', 1, false],
        ['Lift plan drawing LP-301-01', 'DWG', 'u-e4', 3, false],
        ['Send lift plan to client for approval', null, 'u-pm1', 3, false],
      ],
      activity: [
        [12, 'u-e1', 'Progress updated · Lifting', '45%', '60%'],
        [75, 'u-pm1', 'Due date changed', d(2), d(4)],
        [60 * 26, 'u-e2', 'Scope completed · Route Survey'],
        [60 * 50, 'u-pm1', 'Engineer assigned · DWG', '—', 'Kat Bautista'],
      ],
    }),
    project({
      num: 'CRM-2026-0138', name: 'Substation B Transformer Move', client: 'c2', sales: 'u-s2', pm: 'u-pm1', req: -29, start: -22, due: 0, pri: 'Critical', status: 'In Progress',
      sc: [
        ['Route Survey', 'u-e2', -22, -12, 100, 'Completed'],
        ['Bridging', 'u-e1', -15, -4, 100, 'Completed'],
        ['Transport', 'u-e2', -14, 0, 80, 'In Progress', 'Route Survey'],
      ],
      tasks: [['Final axle-load sheet for 14-line SPMT', 'Transport', 'u-e2', 0, false]],
      activity: [[95, 'u-e2', 'Progress updated · Transport', '70%', '80%']],
    }),
    project({
      num: 'CRM-2026-0131', name: 'Heat Exchanger E-12 Skid-in', client: 'c3', sales: 'u-s1', pm: 'u-pm2', req: -36, start: -28, due: -5, pri: 'High', status: 'Waiting for Client',
      sc: [
        ['Jacking & Skidding', 'u-e3', -28, -5, 60, 'Waiting for Client'],
        ['GBP Calculation', 'u-e4', -19, -10, 100, 'Completed'],
      ],
      activity: [[60 * 30, 'u-pm2', 'Status changed', 'In Progress', 'Waiting for Client']],
    }),
    project({
      num: 'CRM-2026-0116', name: 'Tank T-7 Jacking Procedure', client: 'c3', sales: 'u-s3', pm: 'u-pm1', req: -61, start: -54, due: -4, pri: 'High', status: 'In Progress',
      sc: [
        ['Jacking & Skidding', 'u-e3', -50, -4, 70, 'In Progress'],
        ['MS Study', 'u-e4', -31, -12, 100, 'Completed'],
        ['DWG', 'u-e3', -8, -4, 30, 'In Progress', 'Jacking & Skidding'],
      ],
      activity: [[60 * 5, 'u-e3', 'Progress updated · Jacking & Skidding', '60%', '70%']],
    }),
    project({
      num: 'CRM-2026-0147', name: 'Kiln Shell Section Lift', client: 'c6', sales: 'u-s1', pm: 'u-pm2', req: -10, start: -3, due: 2, pri: 'High', status: 'In Progress',
      sc: [
        ['Route Survey', 'u-e2', -3, -1, 80, 'In Progress'],
        ['Lifting', 'u-e3', -3, 2, 45, 'In Progress'],
      ],
      activity: [[60 * 3, 'u-e3', 'Progress updated · Lifting', '30%', '45%']],
    }),
    project({
      num: 'CRM-2026-0127', name: 'Unit 3 Shutdown Lift Plan', client: 'c4', sales: 'u-s2', pm: 'u-pm2', req: -15, start: -8, due: 10, pri: 'Normal', status: 'For Review',
      sc: [
        ['Shutdown', 'u-e4', -8, 6, 30, 'In Progress'],
        ['Lifting', 'u-e1', -2, 8, 10, 'In Progress'],
        ['DWG', 'u-e4', 3, 10, 0, 'For Review'],
      ],
    }),
    project({
      num: 'CRM-2026-0150', name: 'Barge Load-out Bridging Study', client: 'c7', sales: 'u-s2', pm: 'u-pm1', req: -6, start: -1, due: 18, pri: 'Normal', status: 'Waiting for Engineering',
      sc: [
        ['Bridging', 'u-e1', -1, 12, 10, 'In Progress'],
        ['GBP Calculation', 'u-e4', 2, 9, 0, 'For Review'],
        ['DWG', 'u-e4', 10, 18, 0, 'New Request'],
      ],
    }),
    project({
      num: 'CRM-2026-0124', name: 'Pipe Rack Module Transport', client: 'c5', sales: 'u-s3', pm: 'u-pm2', req: -48, start: -35, due: 17, pri: 'Normal', status: 'On Hold',
      sc: [
        ['Transport', 'u-e2', -35, 17, 40, 'On Hold'],
        ['GBP Calculation', 'u-e4', -30, -20, 100, 'Completed'],
      ],
      activity: [[60 * 72, 'u-pm2', 'Status changed', 'In Progress', 'On Hold']],
    }),
    project({
      num: 'CRM-2026-0153', name: 'Generator Skid Transport', client: 'c2', sales: 'u-s2', pm: 'u-pm2', req: -2, start: 3, due: 14, pri: 'Low', status: 'For Review',
      sc: [
        ['Route Survey', 'u-e2', 3, 7, 0, 'For Review'],
        ['Transport', 'u-e2', 6, 14, 0, 'For Review', 'Route Survey'],
      ],
    }),
    project({
      num: 'CRM-2026-0145', name: 'Column C-4 Erection Study', client: 'c1', sales: 'u-s1', pm: 'u-pm1', req: -4, start: 6, due: 25, pri: 'Normal', status: 'New Request',
      sc: [['MS Study', null, 6, 25, 0, 'New Request']],
      activity: [[60 * 4, 'u-s1', 'Request submitted']],
    }),
    project({
      num: 'CRM-2026-0129', name: 'Cooling Tower Fan Lift', client: 'c4', sales: 'u-s2', pm: 'u-pm1', req: -40, start: -30, due: -12, pri: 'Normal', status: 'Cancelled',
      sc: [['Lifting', 'u-e1', -30, -12, 20, 'Cancelled']],
    }),
    project({
      num: 'CRM-2026-0119', name: 'Module Route Bridge Check', client: 'c2', sales: 'u-s2', pm: 'u-pm1', req: -56, start: -49, due: -8, pri: 'Low', status: 'Completed', finish: -8,
      sc: [
        ['Bridging', 'u-e1', -49, -9, 100, 'Completed'],
        ['Route Survey', 'u-e2', -49, -30, 100, 'Completed'],
      ],
    }),
  ];

  // Completed history for the monthly charts: [number, name, client, scope, engineer, due offset, finish offset]
  const history: [string, string, string, ScopeType, string, number, number][] = [
    ['CRM-2026-0118', 'Silo S-2 Demolition Lift', 'c6', 'Lifting', 'u-e1', -20, -18],
    ['CRM-2026-0115', 'Compressor Skid Load-out', 'c5', 'Jacking & Skidding', 'u-e3', -30, -31],
    ['CRM-2026-0112', 'Flare Tip Replacement', 'c1', 'Lifting', 'u-e1', -40, -40],
    ['CRM-2026-0110', 'Transformer T-4 Delivery Route', 'c2', 'Route Survey', 'u-e2', -47, -44],
    ['CRM-2026-0108', 'Ship Block Transfer', 'c7', 'Transport', 'u-e2', -60, -61],
    ['CRM-2026-0106', 'Boiler Drum Erection Plan', 'c4', 'MS Study', 'u-e4', -68, -66],
    ['CRM-2026-0105', 'Crane Mat GBP Check, Yard 2', 'c5', 'GBP Calculation', 'u-e4', -80, -80],
    ['CRM-2026-0104', 'Kiln Tyre Jacking', 'c6', 'Jacking & Skidding', 'u-e3', -95, -92],
    ['CRM-2026-0103', 'Unit 1 Shutdown Rigging Study', 'c4', 'Shutdown', 'u-e4', -105, -106],
    ['CRM-2026-0102', 'Jetty Bridging Assessment', 'c7', 'Bridging', 'u-e1', -125, -125],
    ['CRM-2026-0101', 'Vessel V-9 Lift Drawings', 'c1', 'DWG', 'u-e4', -150, -147],
  ];
  for (const [num, name, client, scope, eng, due, fin] of history) {
    const c = CLIENTS.find((x) => x.id === client)!;
    projects.push(project({
      num, name, client, sales: c.salesId, pm: due % 2 ? 'u-pm1' : 'u-pm2', req: due - 30, start: due - 25, due, pri: 'Normal', status: 'Completed', finish: fin,
      sc: [[scope, eng, due - 25, due, 100, 'Completed']],
    }));
  }

  return { projects, clients: CLIENTS.map((c) => ({ ...c })) };
}
