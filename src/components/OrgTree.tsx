import { useState, useMemo } from "react";
import { battalions } from "@/data/idfUnits";
import { ChevronLeft, ChevronDown } from "lucide-react";

interface TreeNode {
  label: string;
  children: TreeNode[];
}

function buildTree(): TreeNode[] {
  const commandMap = new Map<string, Map<string, Map<string, string[]>>>();

  for (const b of battalions) {
    if (!commandMap.has(b.command)) commandMap.set(b.command, new Map());
    const divMap = commandMap.get(b.command)!;
    const divKey = `${b.division} (${b.divisionNumber})`;
    if (!divMap.has(divKey)) divMap.set(divKey, new Map());
    const brigMap = divMap.get(divKey)!;
    const brigKey = `${b.brigade} (${b.brigadeNumber})`;
    if (!brigMap.has(brigKey)) brigMap.set(brigKey, []);
    brigMap.get(brigKey)!.push(`${b.name} (${b.number})`);
  }

  const tree: TreeNode[] = [];
  for (const [cmd, divMap] of commandMap) {
    const cmdNode: TreeNode = { label: cmd, children: [] };
    for (const [div, brigMap] of divMap) {
      const divNode: TreeNode = { label: div, children: [] };
      for (const [brig, bns] of brigMap) {
        const brigNode: TreeNode = {
          label: brig,
          children: bns.map((name) => ({ label: name, children: [] })),
        };
        divNode.children.push(brigNode);
      }
      cmdNode.children.push(divNode);
    }
    tree.push(cmdNode);
  }
  return tree;
}

const depthColors = [
  "border-primary",
  "border-accent",
  "border-success",
  "border-muted-foreground",
];

const depthBg = [
  "bg-primary/10",
  "bg-accent/10",
  "bg-success/10",
  "bg-muted/50",
];

function TreeNodeComponent({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isLeaf = node.children.length === 0;
  const colorClass = depthColors[Math.min(depth, depthColors.length - 1)];
  const bgClass = depthBg[Math.min(depth, depthBg.length - 1)];

  if (isLeaf) {
    return (
      <div className={`mr-4 py-1.5 px-3 rounded-md text-sm text-foreground ${bgClass} border-r-2 ${colorClass}`}>
        {node.label}
      </div>
    );
  }

  return (
    <div className="mr-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold text-foreground hover:bg-muted/60 transition-colors w-full text-right ${bgClass} border-r-2 ${colorClass}`}
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-4 h-4 shrink-0 text-muted-foreground" />
        )}
        <span>{node.label}</span>
        <span className="text-xs text-muted-foreground mr-auto">
          ({node.children.length})
        </span>
      </button>
      {expanded && (
        <div className="mr-4 mt-1 space-y-1 border-r border-border pr-2">
          {node.children.map((child, i) => (
            <TreeNodeComponent key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function OrgTree() {
  const tree = useMemo(buildTree, []);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-2">
      <div className="flex gap-4 text-xs text-muted-foreground mb-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-primary" />
          <span>פיקוד</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-accent" />
          <span>אוגדה</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-success" />
          <span>חטיבה</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-muted-foreground" />
          <span>גדוד</span>
        </div>
      </div>
      {tree.map((node, i) => (
        <TreeNodeComponent key={i} node={node} depth={0} />
      ))}
    </div>
  );
}
