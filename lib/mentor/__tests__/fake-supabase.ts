// Test-only in-memory stand-in for the subset of the Supabase query builder
// used by /api/chat and lib/mentor/persistence.

type Row = Record<string, unknown>;
type Filter = { column: string; kind: "eq" | "neq" | "in"; value: unknown };

export type FakeWrite = { table: string; op: "insert" | "update" | "delete"; rows: Row[] };

export function createFakeSupabase(
  seed: Record<string, Row[]>,
  options: { user?: { id: string; user_metadata?: Record<string, unknown> } | null } = {}
) {
  const db: Record<string, Row[]> = {};
  let sequence = 0;
  for (const [table, rows] of Object.entries(seed)) {
    db[table] = rows.map((row) => ({ created_at: ++sequence, ...row }));
  }
  const writes: FakeWrite[] = [];
  const state = { user: options.user ?? null, failInsertInto: null as string | null };

  function from(table: string) {
    const query = {
      op: "select" as "select" | "insert" | "update" | "delete",
      filters: [] as Filter[],
      order: null as { column: string; ascending: boolean } | null,
      limit: null as number | null,
      payload: null as unknown,
    };
    const rows = () => (db[table] ??= []);
    const matches = (row: Row) =>
      query.filters.every(({ column, kind, value }) =>
        kind === "eq"
          ? row[column] === value
          : kind === "neq"
            ? row[column] !== value
            : (value as unknown[]).includes(row[column])
      );

    const run = (): { data: unknown; error: unknown } => {
      if (query.op === "insert") {
        if (state.failInsertInto === table) return { data: null, error: { message: "insert failed" } };
        const items = (Array.isArray(query.payload) ? query.payload : [query.payload]).map(
          (payload) => ({ id: `${table}-${++sequence}`, created_at: sequence, ...(payload as Row) })
        );
        rows().push(...items);
        writes.push({ table, op: "insert", rows: items });
        return { data: items, error: null };
      }
      if (query.op === "update") {
        const hit = rows().filter(matches);
        hit.forEach((row) => Object.assign(row, query.payload as Row));
        writes.push({ table, op: "update", rows: hit.map((row) => ({ ...row })) });
        return { data: null, error: null };
      }
      if (query.op === "delete") {
        const hit = rows().filter(matches);
        db[table] = rows().filter((row) => !matches(row));
        writes.push({ table, op: "delete", rows: hit });
        return { data: null, error: null };
      }

      let out = rows().filter(matches);
      if (query.order) {
        const { column, ascending } = query.order;
        out = [...out].sort((a, b) => {
          const diff = Number(a[column]) - Number(b[column]);
          return ascending ? diff : -diff;
        });
      }
      if (query.limit !== null) out = out.slice(0, query.limit);
      return { data: out.map((row) => ({ ...row })), error: null };
    };

    const single = async () => {
      const result = run();
      return { data: Array.isArray(result.data) ? (result.data[0] ?? null) : result.data, error: result.error };
    };

    const builder: Record<string, unknown> = {
      select: () => builder,
      eq: (column: string, value: unknown) => (query.filters.push({ column, kind: "eq", value }), builder),
      neq: (column: string, value: unknown) => (query.filters.push({ column, kind: "neq", value }), builder),
      in: (column: string, value: unknown[]) => (query.filters.push({ column, kind: "in", value }), builder),
      order: (column: string, opts?: { ascending?: boolean }) => {
        query.order = { column, ascending: opts?.ascending ?? true };
        return builder;
      },
      limit: (n: number) => ((query.limit = n), builder),
      insert: (payload: unknown) => ((query.op = "insert"), (query.payload = payload), builder),
      update: (payload: unknown) => ((query.op = "update"), (query.payload = payload), builder),
      delete: () => ((query.op = "delete"), builder),
      maybeSingle: single,
      single,
      then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
        Promise.resolve(run()).then(resolve, reject),
    };
    return builder;
  }

  const client = {
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from,
  };

  return {
    client,
    db,
    writes,
    state,
    messages: (conversationId: string) =>
      (db.messages ?? [])
        .filter((row) => row.conversation_id === conversationId)
        .sort((a, b) => Number(a.created_at) - Number(b.created_at))
        .map((row) => ({ role: row.role, content: row.content })),
  };
}
