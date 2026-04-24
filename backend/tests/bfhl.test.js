const request = require('supertest');
const app = require('../index');

describe('POST /bfhl', () => {

  // ── 1. Valid single tree ────────────────────────────────
  test('valid single tree (A->B, A->C, B->D)', async () => {
    const res = await request(app)
      .post('/bfhl')
      .send({ data: ['A->B', 'A->C', 'B->D'] });

    expect(res.status).toBe(200);
    expect(res.body.hierarchies).toHaveLength(1);
    expect(res.body.hierarchies[0].root).toBe('A');
    expect(res.body.hierarchies[0].depth).toBe(3);
    expect(res.body.hierarchies[0].has_cycle).toBeUndefined();
    expect(res.body.summary.total_trees).toBe(1);
    expect(res.body.summary.total_cycles).toBe(0);
    expect(res.body.summary.largest_tree_root).toBe('A');
    expect(res.body.invalid_entries).toEqual([]);
    expect(res.body.duplicate_edges).toEqual([]);
  });

  // ── 2. Duplicate edges ─────────────────────────────────
  test('duplicate edges pushed only once', async () => {
    const res = await request(app)
      .post('/bfhl')
      .send({ data: ['G->H', 'G->H', 'G->H', 'G->I'] });

    expect(res.status).toBe(200);
    expect(res.body.duplicate_edges).toEqual(['G->H']);
    expect(res.body.hierarchies).toHaveLength(1);
    expect(res.body.hierarchies[0].root).toBe('G');
    expect(res.body.hierarchies[0].depth).toBe(2);
  });

  // ── 3. Invalid entries ─────────────────────────────────
  test('invalid entries detected correctly', async () => {
    const res = await request(app)
      .post('/bfhl')
      .send({ data: ['hello', '1->2', 'AB->C', 'A-B', 'A->', '', 'A->A'] });

    expect(res.status).toBe(200);
    expect(res.body.invalid_entries).toHaveLength(7);
    expect(res.body.hierarchies).toHaveLength(0);
  });

  // ── 4. Self-loop ───────────────────────────────────────
  test('self-loop A->A treated as invalid', async () => {
    const res = await request(app)
      .post('/bfhl')
      .send({ data: ['A->A'] });

    expect(res.status).toBe(200);
    expect(res.body.invalid_entries).toEqual(['A->A']);
    expect(res.body.hierarchies).toHaveLength(0);
  });

  // ── 5. Pure cycle ──────────────────────────────────────
  test('pure cycle detected (X->Y, Y->Z, Z->X)', async () => {
    const res = await request(app)
      .post('/bfhl')
      .send({ data: ['X->Y', 'Y->Z', 'Z->X'] });

    expect(res.status).toBe(200);
    expect(res.body.hierarchies).toHaveLength(1);
    const cycleGroup = res.body.hierarchies[0];
    expect(cycleGroup.has_cycle).toBe(true);
    expect(cycleGroup.tree).toEqual({});
    expect(cycleGroup.depth).toBeUndefined();
    expect(cycleGroup.root).toBe('X'); // lexicographically smallest
    expect(res.body.summary.total_cycles).toBe(1);
    expect(res.body.summary.total_trees).toBe(0);
  });

  // ── 6. Multi-parent: first parent wins ─────────────────
  test('multi-parent — first parent wins, second discarded', async () => {
    const res = await request(app)
      .post('/bfhl')
      .send({ data: ['A->D', 'B->D', 'A->E'] });

    expect(res.status).toBe(200);
    // D should be a child of A only; B->D discarded silently
    // Two components: {A, D, E} and {B}
    // Actually B has no edges left, but B is in the nodes set from the B->D edge
    // After discard, B is an isolated node with no parent and no children
    const trees = res.body.hierarchies;
    // A-tree should contain D
    const aTree = trees.find(h => h.root === 'A');
    expect(aTree).toBeDefined();
    expect(aTree.tree['A']['D']).toBeDefined();
  });

  // ── 7. Tie-break largest_tree_root ─────────────────────
  test('tie-break: equal depth → lexicographically smaller root', async () => {
    const res = await request(app)
      .post('/bfhl')
      .send({ data: ['B->C', 'A->D'] });

    expect(res.status).toBe(200);
    expect(res.body.summary.total_trees).toBe(2);
    // Both trees have depth 2, so largest_tree_root = "A"
    expect(res.body.summary.largest_tree_root).toBe('A');
  });

  // ── 8. Whitespace-trimmed inputs ───────────────────────
  test('whitespace trimmed before validation', async () => {
    const res = await request(app)
      .post('/bfhl')
      .send({ data: [' A->B ', '  C->D  '] });

    expect(res.status).toBe(200);
    expect(res.body.invalid_entries).toEqual([]);
    expect(res.body.hierarchies).toHaveLength(2);
  });

  // ── 9. Malformed request ───────────────────────────────
  test('missing data field returns 400', async () => {
    const res = await request(app)
      .post('/bfhl')
      .send({ notdata: [] });

    expect(res.status).toBe(400);
  });

  test('non-array data returns 400', async () => {
    const res = await request(app)
      .post('/bfhl')
      .send({ data: 'A->B' });

    expect(res.status).toBe(400);
  });

  // ── 10. Full PDF example ───────────────────────────────
  test('full PDF example produces expected output', async () => {
    const res = await request(app)
      .post('/bfhl')
      .send({
        data: [
          'A->B', 'A->C', 'B->D', 'C->E', 'E->F',
          'X->Y', 'Y->Z', 'Z->X',
          'P->Q', 'Q->R',
          'G->H', 'G->H', 'G->I',
          'hello', '1->2', 'A->',
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.summary.total_trees).toBe(3);
    expect(res.body.summary.total_cycles).toBe(1);
    expect(res.body.summary.largest_tree_root).toBe('A');
    expect(res.body.invalid_entries).toEqual(['hello', '1->2', 'A->']);
    expect(res.body.duplicate_edges).toEqual(['G->H']);
    expect(res.body.hierarchies).toHaveLength(4);

    // Check cycle group
    const cycleGroup = res.body.hierarchies.find(h => h.has_cycle === true);
    expect(cycleGroup).toBeDefined();
    expect(cycleGroup.root).toBe('X');
    expect(cycleGroup.tree).toEqual({});
    expect(cycleGroup.depth).toBeUndefined();

    // Check A-tree depth
    const aTree = res.body.hierarchies.find(h => h.root === 'A');
    expect(aTree.depth).toBe(4);
    expect(aTree.tree).toEqual({
      A: { B: { D: {} }, C: { E: { F: {} } } },
    });
  });

  // ── 11. 404 fallback ───────────────────────────────────
  test('GET /bfhl returns 404', async () => {
    const res = await request(app).get('/bfhl');
    expect(res.status).toBe(404);
  });

  test('unknown route returns 404', async () => {
    const res = await request(app).get('/unknown');
    expect(res.status).toBe(404);
  });
});
