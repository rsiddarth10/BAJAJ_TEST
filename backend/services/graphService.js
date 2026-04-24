/**
 * Graph processing service for BFHL hierarchy analysis.
 * Implements: dedup, multi-parent resolution, DFS cycle detection,
 * tree construction, and depth calculation.
 */

const { validateEntry } = require('../utils/validators');

/**
 * Main processing function — takes the raw data array and returns
 * the full analysis result (hierarchies, invalid_entries, duplicate_edges, summary).
 *
 * @param {string[]} data - Array of raw edge strings
 * @returns {object} Analysis result
 */
function processGraph(data) {
  const invalid_entries = [];
  const duplicate_edges = [];
  const seenEdges = new Set();
  const duplicateSet = new Set();  // track which edges already pushed as duplicates
  const validEdges = [];

  // ── Step 1: Validate, dedup ─────────────────────────
  for (const rawItem of data) {
    const result = validateEntry(rawItem);
    if (!result.valid) {
      invalid_entries.push(typeof rawItem === 'string' ? rawItem : String(rawItem));
      continue;
    }
    const normalized = result.trimmed;
    if (seenEdges.has(normalized)) {
      // Only push to duplicate_edges once per unique duplicate
      if (!duplicateSet.has(normalized)) {
        duplicateSet.add(normalized);
        duplicate_edges.push(normalized);
      }
    } else {
      seenEdges.add(normalized);
      validEdges.push({ parent: result.parent, child: result.child });
    }
  }

  // ── Step 2: Build directed graph (multi-parent rule) ─
  const adj = {};          // parent -> [children]
  const parentOf = {};     // child -> parent (first parent wins)
  const undirectedAdj = {}; // for connected component discovery
  const allNodes = new Set();

  for (const { parent, child } of validEdges) {
    allNodes.add(parent);
    allNodes.add(child);

    if (!undirectedAdj[parent]) undirectedAdj[parent] = [];
    if (!undirectedAdj[child]) undirectedAdj[child] = [];

    if (parentOf[child] !== undefined) {
      // Multi-parent: silently discard subsequent parent edges
      continue;
    }

    parentOf[child] = parent;
    if (!adj[parent]) adj[parent] = [];
    adj[parent].push(child);

    undirectedAdj[parent].push(child);
    undirectedAdj[child].push(parent);
  }

  // ── Step 3: Find weakly connected components ─────────
  const visited = new Set();
  const components = [];

  for (const node of allNodes) {
    if (visited.has(node)) continue;
    const comp = [];
    const queue = [node];
    visited.add(node);
    while (queue.length > 0) {
      const curr = queue.shift();
      comp.push(curr);
      if (undirectedAdj[curr]) {
        for (const neighbor of undirectedAdj[curr]) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
    }
    components.push(comp);
  }

  // ── Step 4: Process each component ───────────────────
  const hierarchies = [];
  let total_trees = 0;
  let total_cycles = 0;
  let largest_tree_root = null;
  let max_depth = -1;

  for (const comp of components) {
    // Identify roots: nodes that are never a child
    const roots = comp.filter(n => parentOf[n] === undefined);

    // DFS-based cycle detection on this component's directed edges
    const hasCycle = detectCycle(comp, adj);

    if (hasCycle) {
      total_cycles++;
      const sortedComp = [...comp].sort();
      hierarchies.push({
        root: sortedComp[0],
        tree: {},
        has_cycle: true,
      });
    } else {
      // Non-cyclic tree — there should be exactly one root
      const root = roots.length > 0 ? roots.sort()[0] : [...comp].sort()[0];
      const tree = buildTree(root, adj);
      const depth = getDepth(root, adj);

      hierarchies.push({ root, tree, depth });
      total_trees++;

      if (depth > max_depth || (depth === max_depth && (largest_tree_root === null || root < largest_tree_root))) {
        max_depth = depth;
        largest_tree_root = root;
      }
    }
  }

  return {
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees,
      total_cycles,
      largest_tree_root,
    },
  };
}

// ── DFS Cycle Detection (white-gray-black) ───────────────
const WHITE = 0, GRAY = 1, BLACK = 2;

/**
 * Returns true if any cycle exists among the directed edges
 * within the given set of nodes.
 */
function detectCycle(componentNodes, adj) {
  const color = {};
  for (const n of componentNodes) color[n] = WHITE;

  function dfs(node) {
    color[node] = GRAY;
    if (adj[node]) {
      for (const child of adj[node]) {
        if (color[child] === GRAY) return true;   // back-edge → cycle
        if (color[child] === WHITE && dfs(child)) return true;
      }
    }
    color[node] = BLACK;
    return false;
  }

  for (const n of componentNodes) {
    if (color[n] === WHITE && dfs(n)) return true;
  }
  return false;
}

// ── Tree Construction ────────────────────────────────────
/**
 * Recursively builds a nested object: { [node]: { [child1]: subtree, ... } }
 */
function buildTree(node, adj) {
  const children = {};
  if (adj[node]) {
    for (const child of adj[node]) {
      const subtree = buildTree(child, adj);
      children[child] = subtree[child];
    }
  }
  return { [node]: children };
}

// ── Depth Calculation ────────────────────────────────────
/**
 * Returns the number of nodes on the longest root-to-leaf path.
 */
function getDepth(node, adj) {
  if (!adj[node] || adj[node].length === 0) return 1;
  let maxChildDepth = 0;
  for (const child of adj[node]) {
    maxChildDepth = Math.max(maxChildDepth, getDepth(child, adj));
  }
  return maxChildDepth + 1;
}

module.exports = { processGraph, detectCycle, buildTree, getDepth };
