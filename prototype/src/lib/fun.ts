// Small bits of fun: an engineering one-liner that changes once a day.

export const ONE_LINERS = [
  'Measure twice, lift once.',
  'The load chart is not a suggestion.',
  'A plan without a lift study is just a wish with a crane.',
  'Gravity never takes a day off. Neither does the deadline.',
  'If it fits on the trailer, it fits on the bridge. Check anyway.',
  'Rigging is 10% steel and 90% paperwork.',
  'Safety factor: the number between "fine" and "front page".',
  'Every skid moves faster once the method statement is signed.',
  'Centre of gravity first, opinions second.',
  'The route survey found the low bridge so you did not have to.',
  'Torque it, mark it, sign it.',
  'Shutdowns end on time when tasks get ticked.',
  'The best jacking plan is the boring one.',
  'Weather is a stakeholder. Plan for its feedback.',
] as const;

/** The same line all day for everyone, a different one tomorrow. `day` is an ISO date (YYYY-MM-DD). */
export function oneLinerFor(day: string): string {
  let h = 0;
  for (const ch of day) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return ONE_LINERS[h % ONE_LINERS.length];
}

/** True when this tick finishes the last open task, which earns the big party. */
export function finishesAll(tasks: readonly { id: string; done: boolean }[], tickedId: string): boolean {
  return tasks.length > 0 && tasks.every((t) => t.done || t.id === tickedId) && tasks.some((t) => t.id === tickedId && !t.done);
}
