import { actionRecordSchema, ActionError, ACTION_RETENTION_MS, type ActionLedger, type ActionRecord, type EventType } from "../../server/cooking-actions/ledger";

// Transactional test double: isolates drafts and rolls back both state and events on injected failure.
// Real PostgreSQL locks, uniqueness and cascade behavior are tested separately in E2E.
export class MemoryActionLedger implements ActionLedger {
  records = new Map<string, ActionRecord>();
  events: { id: string; event: EventType; reason: string }[] = [];
  sessions = new Map([[1, { uid: "pilot", active: true }], [2, { uid: "other", active: true }], [3, { uid: "pilot", active: true }]]);
  failEvent?: EventType;
  failCommit = false;
  private tail: Promise<void> = Promise.resolve();
  constructor(public now = () => Date.now()) {}
  async transaction<T>(uid: string, sessionId: number, work: Parameters<ActionLedger["transaction"]>[2]): Promise<T> {
    const previous = this.tail;
    let release!: () => void;
    this.tail = new Promise(resolve => { release = resolve; });
    await previous;
    try {
      const session = this.sessions.get(sessionId);
      if (!session || session.uid !== uid) throw new ActionError("not_found", 404);
      const records = structuredClone(this.records);
      const events = structuredClone(this.events);
      const result = await work({
        active: session.active,
        get: async id => {
          const row = records.get(id);
          return row?.scope.sessionId === sessionId ? row : undefined;
        },
        getByKey: async key => [...records.values()].find(row => row.scope.sessionId === sessionId && row.idempotencyKey === key),
        save: async (input, event, reason = input.reason) => {
          if (event === this.failEvent) throw new Error("synthetic audit failure");
          const record = actionRecordSchema.parse(input);
          records.set(record.actionId, record);
          events.push({ id: record.actionId, event, reason });
        },
      });
      if (this.failCommit) throw new Error("synthetic commit failure");
      this.records = records; this.events = events;
      return result as T;
    } finally { release(); }
  }
  async ownerSessionId(uid: string, actionId: string) {
    const record = this.records.get(actionId);
    return record && this.sessions.get(record.scope.sessionId)?.uid === uid ? record.scope.sessionId : undefined;
  }
  async prune() {
    for (const [id, record] of this.records) if (record.createdAt < this.now() - ACTION_RETENTION_MS) this.records.delete(id);
    this.events = this.events.filter(event => this.records.has(event.id));
  }
}
