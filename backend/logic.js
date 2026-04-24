/**
 * Core logic for processing edge data.
 * STRICT implementation per SRM Full Stack Engineering Challenge spec:
 *
 * 1. Validation: X->Y where X,Y are single uppercase A-Z letters
 * 2. Duplicate: first occurrence used, repeats go to duplicate_edges
 * 3. Multi-parent: first parent wins, later parents SILENTLY discarded
 * 4. Build graph from all accepted edges
 * 5. Detect cycles via DFS in the FINAL graph (SCC-based)
 * 6. Cycle groups: { root: lex-smallest, tree: {}, has_cycle: true }
 * 7. Non-cycle trees: { root, tree, depth } — NO has_cycle field
 * 8. Summary: { total_trees, total_cycles, largest_tree_root }
 */

const NODE_REGEX = /^[A-Z]$/;

/**
 * Parse and validate a single edge string.
 * @param {string} entry
 * @returns {{ valid: boolean, parent?: string, child?: string, reason?: string }}
 */
function parseEdge(entry) {
  if (typeof entry !== "string") {
    return { valid: false, reason: "Not a string" };
  }

  const parts = entry.split("->");
  if (parts.length !== 2) {
    return { valid: false, reason: "Invalid format (must be 'X->Y')" };
  }

  const parent = parts[0].trim();
  const child = parts[1].trim();

  if (!parent || !child) {
    return { valid: false, reason: "Empty parent or child node" };
  }

  if (!NODE_REGEX.test(parent)) {
    return { valid: false, reason: `Invalid node '${parent}': must be a single uppercase letter A-Z` };
  }

  if (!NODE_REGEX.test(child)) {
    return { valid: false, reason: `Invalid node '${child}': must be a single uppercase letter A-Z` };
  }

  if (parent === child) {
    return { valid: false, reason: "Self-loop detected" };
  }

  return { valid: true, parent, child };
}

/**
 * Find all strongly connected components using Tarjan's algorithm.
 * @param {Map<string, string[]>} adjList
 * @param {Set<string>} allNodes
 * @returns {string[][]} array of SCCs (each is an array of node names)
 */
function findSCCs(adjList, allNodes) {
  let index = 0;
  const stack = [];
  const onStack = new Set();
  const indices = new Map();
  const lowlinks = new Map();
  const sccs = [];

  function strongconnect(v) {
    indices.set(v, index);
    lowlinks.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    const neighbors = adjList.get(v) || [];
    for (const w of neighbors) {
      if (!indices.has(w)) {
        strongconnect(w);
        lowlinks.set(v, Math.min(lowlinks.get(v), lowlinks.get(w)));
      } else if (onStack.has(w)) {
        lowlinks.set(v, Math.min(lowlinks.get(v), indices.get(w)));
      }
    }

    if (lowlinks.get(v) === indices.get(v)) {
      const scc = [];
      let w;
      do {
        w = stack.pop();
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);
      sccs.push(scc);
    }
  }

  // Process all nodes (sorted for determinism)
  const sortedNodes = Array.from(allNodes).sort();
  for (const v of sortedNodes) {
    if (!indices.has(v)) {
      strongconnect(v);
    }
  }

  return sccs;
}

/**
 * Build a hierarchy tree object from the adjacency list starting from a root.
 * Format: { nodeName: { childName: {...} } }
 * @param {string} node
 * @param {Map<string, string[]>} adjList
 * @param {Set<string>} allowedNodes
 * @returns {object}
 */
function buildTree(node, adjList, allowedNodes) {
  const children = (adjList.get(node) || []).filter((c) => allowedNodes.has(c));
  const treeObj = {};
  
  if (children.length === 0) {
    return { [node]: {} };
  }

  const childrenObj = {};
  for (const child of children) {
    const subTree = buildTree(child, adjList, allowedNodes);
    // subTree is { child: { ... } }, we want to merge children
    Object.assign(childrenObj, subTree);
  }
  
  treeObj[node] = childrenObj;
  return treeObj;
}

/**
 * Calculate the maximum depth of a tree (root-to-leaf by node count).
 * @param {object} treeObj - { name: { ...children } }
 * @returns {number}
 */
function calcDepth(treeObj) {
  const nodeName = Object.keys(treeObj)[0];
  const children = treeObj[nodeName];
  const childKeys = Object.keys(children);
  
  if (childKeys.length === 0) return 1;
  
  const depths = childKeys.map(key => calcDepth({ [key]: children[key] }));
  return 1 + Math.max(...depths);
}

/**
 * Count all nodes in a tree.
 * @param {object} treeObj - { name: { ...children } }
 * @returns {number}
 */
function countNodes(treeObj) {
  const nodeName = Object.keys(treeObj)[0];
  const children = treeObj[nodeName];
  const childKeys = Object.keys(children);
  
  if (childKeys.length === 0) return 1;
  
  return 1 + childKeys.reduce((sum, key) => sum + countNodes({ [key]: children[key] }), 0);
}

/**
 * Main processing function.
 * @param {string[]} data - array of edge strings
 * @returns {object}
 */
function processEdges(data) {
  const invalidEntries = [];
  const duplicateEdgesSet = new Set(); // Using Set to ensure each unique duplicate is added only once
  const seenEdges = new Set();
  const adjList = new Map(); // parent -> [children]
  const childToParent = new Map(); // child -> first parent (first-edge-wins)
  const allNodes = new Set();

  // Phase 1: Parse, validate, deduplicate, and enforce single-parent
  for (const entry of data) {
    const parsed = parseEdge(entry);

    if (!parsed.valid) {
      invalidEntries.push({
        entry,
        reason: parsed.reason,
      });
      continue;
    }

    const { parent, child } = parsed;
    const edgeKey = `${parent}->${child}`;

    // Check for duplicate edges
    if (seenEdges.has(edgeKey)) {
      duplicateEdgesSet.add(edgeKey); // Set handles uniqueness automatically
      continue;
    }
    seenEdges.add(edgeKey);

    // Multi-parent first-edge-wins: if child already has a DIFFERENT parent, SILENTLY discard
    if (childToParent.has(child)) {
      const existingParent = childToParent.get(child);
      if (existingParent !== parent) {
        // SILENT discard — do NOT add to invalid_entries
        continue;
      }
      // Same parent, same edge — already in seenEdges, so this path is unreachable
      // unless the edge was added above. In that case it's a dup. Safe to skip.
      continue;
    }

    // Accept the edge
    childToParent.set(child, parent);
    allNodes.add(parent);
    allNodes.add(child);

    if (!adjList.has(parent)) {
      adjList.set(parent, []);
    }
    adjList.get(parent).push(child);
  }

  // Phase 2: Detect cycles in the FINAL accepted graph using Tarjan's SCC
  const sccs = findSCCs(adjList, allNodes);

  // SCCs with size > 1 are cycles; size == 1 may have self-loop (already filtered)
  const cycleNodeSet = new Set();
  const cycleSCCs = [];
  for (const scc of sccs) {
    if (scc.length > 1) {
      cycleSCCs.push(scc);
      for (const node of scc) {
        cycleNodeSet.add(node);
      }
    }
  }

  // Phase 3: Separate acyclic trees and cycle groups
  const acyclicNodes = new Set();
  for (const node of allNodes) {
    if (!cycleNodeSet.has(node)) {
      acyclicNodes.add(node);
    }
  }

  // Find roots for acyclic trees: nodes that have no parent (not a child of anyone in acyclic set)
  const acyclicChildNodes = new Set();
  for (const [child, parent] of childToParent.entries()) {
    if (acyclicNodes.has(child) && acyclicNodes.has(parent)) {
      acyclicChildNodes.add(child);
    }
  }

  const treeRoots = [];
  for (const node of acyclicNodes) {
    if (!acyclicChildNodes.has(node)) {
      treeRoots.push(node);
    }
  }
  treeRoots.sort(); // Alphabetical for deterministic output

  // Build tree hierarchies (non-cycle)
  const hierarchies = [];

  for (const root of treeRoots) {
    const tree = buildTree(root, adjList, acyclicNodes);
    const depth = calcDepth(tree);
    hierarchies.push({
      root,
      tree,
      depth,
    });
  }

  // Build cycle hierarchies
  for (const scc of cycleSCCs) {
    scc.sort(); // Sort to find lexicographically smallest
    const root = scc[0];
    hierarchies.push({
      root,
      tree: {},
      has_cycle: true,
    });
  }

  // Sort hierarchies: non-cycle first (by root), then cycles (by root)
  hierarchies.sort((a, b) => {
    // Non-cycle entries first, then cycle entries
    const aCycle = a.has_cycle === true;
    const bCycle = b.has_cycle === true;
    if (aCycle !== bCycle) return aCycle ? 1 : -1;
    return a.root.localeCompare(b.root);
  });

  // Phase 4: Build summary
  const treeCount = hierarchies.filter((h) => !h.has_cycle).length;
  const cycleCount = hierarchies.filter((h) => h.has_cycle === true).length;

  // Find largest tree root (by depth, lex tiebreaker)
  let largestTreeRoot = null;
  let maxDepth = 0;
  for (const h of hierarchies) {
    if (!h.has_cycle) {
      if (h.depth > maxDepth || (h.depth === maxDepth && (largestTreeRoot === null || h.root < largestTreeRoot))) {
        maxDepth = h.depth;
        largestTreeRoot = h.root;
      }
    }
  }

  const summary = {
    total_trees: treeCount,
    total_cycles: cycleCount,
    largest_tree_root: largestTreeRoot || "",
  };

  return {
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: Array.from(duplicateEdgesSet),
    summary,
  };
}

module.exports = { processEdges };
