
## Tree Graph View — Implementation Plan

### Concept
A new tab ("עץ ניחושים") showing an SVG-based tree that visualizes all guesses as branching paths from "מטה כללי" (General Staff) down through Command → Division → Brigade → Battalion. Paths are compared against the target unit — matching nodes are green, the first wrong node is red, and nothing renders below it.

### Data Model — Path Construction
Each battalion has a natural 4-level path:
```
מטה כללי → command → division (+ divisionNumber) → brigade (+ brigadeNumber) → battalion name (+ number)
```
The target unit defines the "correct" path. Each guess generates a path that's compared level-by-level using **strict ancestor matching** (a Division is only green if its parent Command also matches).

### Tree Merging Logic
All guesses merge into a single tree structure (a "forest" rooted at "מטה כללי"). Shared path segments collapse into a single node. When paths diverge, branches split visually.

### SVG Rendering
- **Layout**: Top-down vertical tree. Each level has a fixed Y offset. X positions are calculated based on the number of leaf nodes in each subtree.
- **Nodes**: Rounded rectangles with Hebrew text (RTL-safe via `text-anchor="middle"` + `direction: rtl`).
- **Edges**: Curved paths (`quadratic bezier`) connecting parent to child.
- **Colors**: Green (`--success`) for correct path nodes, red/grey (`--miss`/`--muted`) for wrong nodes.

### Interactivity
- **Pan & Zoom**: Mouse wheel to zoom, click-drag to pan (transform matrix on a `<g>` wrapper).
- **Zoom-to-Fit**: On each new guess, auto-calculate bounding box and fit the tree in the viewport.
- **Tooltips**: Click/tap any node to see the full name in a tooltip overlay (solves readability when zoomed out).
- **Dynamic viewBox**: SVG dimensions recalculate based on tree width/depth.

### Mobile
- Compact vertical spacing on small screens.
- Touch gestures for pan (single finger drag) and zoom (pinch).
- Minimum node size ensures readability.
- No scrollbars — all navigation via pan/zoom.

### Files to Create/Modify
1. **`src/components/TreeGraph.tsx`** — The main SVG tree component with all logic.
2. **`src/pages/Index.tsx`** — Add a third tab "עץ ניחושים" that renders `<TreeGraph>` with the current guesses and target.

### Divergence Rule
Once a node doesn't match the target at that level, the branch stops — no children are rendered below it for that guess path.
