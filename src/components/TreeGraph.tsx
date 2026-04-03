import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Battalion, GuessResult } from "@/data/idfUnits";

// ─── Types ───────────────────────────────────────────────────────
interface MergedNode {
  id: string;
  label: string;
  depth: number;
  status: "correct" | "wrong" | "neutral";
  children: MergedNode[];
}

interface LayoutNode {
  id: string;
  label: string;
  depth: number;
  status: "correct" | "wrong" | "neutral";
  x: number;
  y: number;
  children: LayoutNode[];
  parent?: LayoutNode;
}

// ─── Path helpers ────────────────────────────────────────────────
function getPath(b: Battalion): string[] {
  return [
    "מטה כללי",
    b.command,
    `${b.division} (${b.divisionNumber})`,
    `${b.brigade} (${b.brigadeNumber})`,
    `${b.name} (${b.number})`,
  ];
}

// ─── Merge guesses into one tree ─────────────────────────────────
function buildMergedTree(guesses: GuessResult[], target: Battalion): MergedNode {
  const targetPath = getPath(target);
  const root: MergedNode = { id: "root", label: "מטה כללי", depth: 0, status: "correct", children: [] };

  for (const guess of guesses) {
    const guessPath = getPath(guess.battalion);
    let current = root;

    for (let i = 1; i < guessPath.length; i++) {
      const segment = guessPath[i];

      // Strict ancestor check: all ancestors must match for this node to be correct
      let allAncestorsMatch = true;
      for (let j = 1; j <= i; j++) {
        if (guessPath[j] !== targetPath[j]) {
          allAncestorsMatch = false;
          break;
        }
      }
      const isMatch = allAncestorsMatch && guessPath[i] === targetPath[i];

      // Check if parent was wrong — if so, this is also wrong and we stop after adding it
      const parentWrong = current.status === "wrong";

      let child = current.children.find((c) => c.label === segment);
      if (!child) {
        child = {
          id: `${current.id}-${segment}`,
          label: segment,
          depth: i,
          status: parentWrong ? "wrong" : isMatch ? "correct" : "wrong",
          children: [],
        };
        current.children.push(child);
      } else {
        // If this path proves it correct, upgrade
        if (isMatch && !parentWrong && child.status !== "correct") {
          child.status = "correct";
        }
      }

      // Divergence rule: stop if this node is wrong
      if (child.status === "wrong") break;

      current = child;
    }
  }

  return root;
}

// ─── Layout ──────────────────────────────────────────────────────
const NODE_W = 160;
const NODE_H = 40;
const H_GAP = 24;
const V_GAP = 72;

function countLeaves(node: MergedNode): number {
  if (node.children.length === 0) return 1;
  return node.children.reduce((s, c) => s + countLeaves(c), 0);
}

function layoutTree(node: MergedNode, xOffset: number, yOffset: number): LayoutNode {
  const totalLeaves = countLeaves(node);
  const totalWidth = totalLeaves * (NODE_W + H_GAP) - H_GAP;

  const layoutNode: LayoutNode = {
    id: node.id,
    label: node.label,
    depth: node.depth,
    status: node.status,
    x: xOffset + totalWidth / 2,
    y: yOffset,
    children: [],
  };

  let childX = xOffset;
  for (const child of node.children) {
    const childLeaves = countLeaves(child);
    const childWidth = childLeaves * (NODE_W + H_GAP) - H_GAP;
    const layoutChild = layoutTree(child, childX, yOffset + NODE_H + V_GAP);
    layoutChild.parent = layoutNode;
    layoutNode.children.push(layoutChild);
    childX += childWidth + H_GAP;
  }

  return layoutNode;
}

function collectNodes(node: LayoutNode): LayoutNode[] {
  const result: LayoutNode[] = [node];
  for (const child of node.children) {
    result.push(...collectNodes(child));
  }
  return result;
}

// ─── Component ───────────────────────────────────────────────────
interface TreeGraphProps {
  guesses: GuessResult[];
  target: Battalion;
}

export function TreeGraph({ guesses, target }: TreeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & zoom state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  // Tooltip
  const [tooltip, setTooltip] = useState<{ label: string; x: number; y: number } | null>(null);

  // Build tree
  const mergedTree = useMemo(() => buildMergedTree(guesses, target), [guesses, target]);
  const layoutRoot = useMemo(() => layoutTree(mergedTree, 0, 0), [mergedTree]);
  const allNodes = useMemo(() => collectNodes(layoutRoot), [layoutRoot]);

  // Compute bounds
  const bounds = useMemo(() => {
    if (allNodes.length === 0) return { minX: 0, maxX: 400, minY: 0, maxY: 200 };
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of allNodes) {
      minX = Math.min(minX, n.x - NODE_W / 2);
      maxX = Math.max(maxX, n.x + NODE_W / 2);
      minY = Math.min(minY, n.y);
      maxY = Math.max(maxY, n.y + NODE_H);
    }
    return { minX, maxX, minY, maxY };
  }, [allNodes]);

  // Zoom-to-fit on guess change
  useEffect(() => {
    if (!containerRef.current) return;
    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;
    const treeW = bounds.maxX - bounds.minX + 60;
    const treeH = bounds.maxY - bounds.minY + 60;
    const scale = Math.min(1.2, containerW / treeW, containerH / treeH, 1);
    const x = (containerW - treeW * scale) / 2 - bounds.minX * scale;
    const y = 30 * scale;
    setTransform({ x, y, scale: Math.max(0.15, scale) });
  }, [bounds, guesses.length]);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((prev) => {
      const newScale = Math.max(0.1, Math.min(3, prev.scale * delta));
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { ...prev, scale: newScale };
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      return {
        scale: newScale,
        x: mx - (mx - prev.x) * (newScale / prev.scale),
        y: my - (my - prev.y) * (newScale / prev.scale),
      };
    });
  }, []);

  // Pan handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest(".tree-node-rect")) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [transform]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setTransform((prev) => ({ ...prev, x: panStart.current.tx + dx, y: panStart.current.ty + dy }));
  }, [isPanning]);

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Colors
  const nodeColor = (status: string) => {
    if (status === "correct") return "hsl(var(--success))";
    if (status === "wrong") return "hsl(var(--miss))";
    return "hsl(var(--muted))";
  };
  const textColor = (status: string) => {
    if (status === "correct") return "hsl(var(--success-foreground))";
    if (status === "wrong") return "hsl(var(--miss-foreground))";
    return "hsl(var(--foreground))";
  };

  const handleNodeClick = (node: LayoutNode, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip((prev) =>
      prev?.label === node.label ? null : { label: node.label, x: e.clientX - rect.left, y: e.clientY - rect.top }
    );
  };

  if (guesses.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-16 text-muted-foreground">
        <p className="text-lg font-semibold mb-2">עץ הניחושים ריק</p>
        <p className="text-sm">נחשו גדוד כדי לראות את העץ מתפתח</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div
        ref={containerRef}
        className="relative w-full bg-card/50 border border-border rounded-xl overflow-hidden select-none"
        style={{ height: "min(70vh, 560px)", cursor: isPanning ? "grabbing" : "grab", touchAction: "none" }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={() => setTooltip(null)}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          style={{ overflow: "visible" }}
        >
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
            {/* Edges */}
            {allNodes.map((node) =>
              node.children.map((child) => {
                const x1 = node.x;
                const y1 = node.y + NODE_H;
                const x2 = child.x;
                const y2 = child.y;
                const midY = (y1 + y2) / 2;
                return (
                  <path
                    key={`edge-${node.id}-${child.id}`}
                    d={`M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}`}
                    fill="none"
                    stroke="hsl(var(--border))"
                    strokeWidth={2}
                    opacity={0.6}
                  />
                );
              })
            )}
            {/* Nodes */}
            {allNodes.map((node) => {
              const truncated = node.label.length > 18 ? node.label.slice(0, 16) + "…" : node.label;
              const fontSize = Math.max(10, 13 - node.depth);
              return (
                <g key={node.id} className="tree-node-rect" style={{ cursor: "pointer" }} onClick={(e) => handleNodeClick(node, e)}>
                  <rect
                    x={node.x - NODE_W / 2}
                    y={node.y}
                    width={NODE_W}
                    height={NODE_H}
                    rx={8}
                    ry={8}
                    fill={nodeColor(node.status)}
                    stroke={node.status === "correct" ? "hsl(var(--success) / 0.5)" : "hsl(var(--border))"}
                    strokeWidth={1.5}
                  />
                  <text
                    x={node.x}
                    y={node.y + NODE_H / 2 + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={textColor(node.status)}
                    fontSize={fontSize}
                    fontWeight={node.depth === 0 ? 700 : 500}
                    fontFamily="'Heebo', sans-serif"
                    direction="rtl"
                  >
                    {truncated}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-50 pointer-events-none px-3 py-2 bg-card border border-border rounded-lg shadow-lg text-sm font-medium text-foreground max-w-[220px] text-center"
            style={{
              left: tooltip.x,
              top: tooltip.y - 48,
              transform: "translateX(-50%)",
            }}
          >
            {tooltip.label}
          </div>
        )}

        {/* Zoom controls */}
        <div className="absolute bottom-3 left-3 flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setTransform((p) => ({ ...p, scale: Math.min(3, p.scale * 1.25) }));
            }}
            className="w-8 h-8 rounded-md bg-card border border-border text-foreground flex items-center justify-center text-lg font-bold hover:bg-muted transition-colors"
          >
            +
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setTransform((p) => ({ ...p, scale: Math.max(0.1, p.scale * 0.8) }));
            }}
            className="w-8 h-8 rounded-md bg-card border border-border text-foreground flex items-center justify-center text-lg font-bold hover:bg-muted transition-colors"
          >
            −
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Reset to fit
              if (!containerRef.current) return;
              const cW = containerRef.current.clientWidth;
              const cH = containerRef.current.clientHeight;
              const tW = bounds.maxX - bounds.minX + 60;
              const tH = bounds.maxY - bounds.minY + 60;
              const s = Math.min(1.2, cW / tW, cH / tH, 1);
              setTransform({ x: (cW - tW * s) / 2 - bounds.minX * s, y: 30 * s, scale: Math.max(0.15, s) });
            }}
            className="w-8 h-8 rounded-md bg-card border border-border text-foreground flex items-center justify-center text-xs font-bold hover:bg-muted transition-colors"
            title="התאם לגודל"
          >
            ⊞
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground mt-3 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "hsl(var(--success))" }} />
          <span>נכון</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "hsl(var(--miss))" }} />
          <span>שגוי</span>
        </div>
      </div>
    </div>
  );
}
