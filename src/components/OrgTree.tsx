import { useState, useMemo } from "react";
import { battalions } from "@/data/idfUnits";
import { ChevronLeft, ChevronDown, ExternalLink } from "lucide-react";

interface TreeNode {
  label: string;
  children: TreeNode[];
  wikiUrl?: string;
}

// Mapping brigade keys "name (number)" to Hebrew Wikipedia articles
const brigadeWikiMap: Record<string, string> = {
  "חטיבת גולני (1)": "https://he.wikipedia.org/wiki/חטיבת_גולני",
  "חטיבת הצנחנים (35)": "https://he.wikipedia.org/wiki/חטיבת_הצנחנים",
  "חטיבת גבעתי (84)": "https://he.wikipedia.org/wiki/חטיבת_גבעתי",
  'חטיבת נח"ל (933)': "https://he.wikipedia.org/wiki/חטיבת_הנח%22ל",
  "חטיבת כפיר (900)": "https://he.wikipedia.org/wiki/חטיבת_כפיר",
  "חטיבת עוז (89)": "https://he.wikipedia.org/wiki/חטיבת_עוז",
  "חטיבה 7 (7)": "https://he.wikipedia.org/wiki/חטיבה_7",
  'חטיבה 188 "ברק" (188)': "https://he.wikipedia.org/wiki/חטיבה_188",
  'חטיבה 401 "עקבות הברזל" (401)': "https://he.wikipedia.org/wiki/חטיבה_401",
  'חטיבה 460 "בני אור" (460)': "https://he.wikipedia.org/wiki/חטיבה_460",
  "חטיבת האש 282 (282)": "https://he.wikipedia.org/wiki/חטיבת_האש_282",
  "חטיבת בסלמ\"ח (828)": "https://he.wikipedia.org/wiki/בית_הספר_לשריון",
  "חטיבת הבקעה (417)": "https://he.wikipedia.org/wiki/חטיבת_הבקעה",
  "חטיבת אורי (5096)": "https://he.wikipedia.org/wiki/חטיבת_אורי",
  "חטיבת תל-חי (5097)": "https://he.wikipedia.org/wiki/חטיבת_תל-חי",
  "חטיבת יזרעאלי (5098)": "https://he.wikipedia.org/wiki/חטיבת_יזרעאלי",
  "חטיבת יהונתן (5099)": "https://he.wikipedia.org/wiki/חטיבת_יהונתן",
  "חטיבת נגבה (5100)": "https://he.wikipedia.org/wiki/חטיבת_נגבה",
  "חטיבת עציון (274)": "https://he.wikipedia.org/wiki/חטמ%22ר_עציון",
  "חטיבת אפרים (578)": "https://he.wikipedia.org/wiki/חטמ%22ר_אפרים",
  "חטיבת בנימין (906)": "https://he.wikipedia.org/wiki/חטמ%22ר_בנימין",
  "חטיבת יהודה (433)": "https://he.wikipedia.org/wiki/חטמ%22ר_יהודה",
  "חטיבת האש 990 (990)": "https://he.wikipedia.org/wiki/חטיבת_האש_990",
  "חטיבת ברעם (300)": "https://he.wikipedia.org/wiki/חטיבת_ברעם",
  "חטיבת חירם (769)": "https://he.wikipedia.org/wiki/חטיבת_חירם",
  "חטיבת הגולן (474)": "https://he.wikipedia.org/wiki/חטיבת_הגולן",
  "חטיבת פארן (512)": "https://he.wikipedia.org/wiki/חטיבת_פארן",
  "חטיבת יואב (406)": "https://he.wikipedia.org/wiki/חטיבת_יואב",
  "חטיבת ההרים (810)": "https://he.wikipedia.org/wiki/חטיבת_ההרים",
  "חטיבת מנשה (431)": "https://he.wikipedia.org/wiki/חטמ%22ר_מנשה",
  "חטיבת שומרון (442)": "https://he.wikipedia.org/wiki/חטמ%22ר_שומרון",
  "חטיבת קטיף (6643)": "https://he.wikipedia.org/wiki/חטיבת_קטיף",
  "חטיבת גפן (7643)": "https://he.wikipedia.org/wiki/חטיבת_גפן",
  'חטיבה 55 "הצנחנים המילואימניקים" (55)': "https://he.wikipedia.org/wiki/חטיבה_55",
  'חטיבה 551 "חטיבת הגדולים" (551)': "https://he.wikipedia.org/wiki/חטיבה_551",
  'חטיבה 646 "שועלי מרום" (646)': "https://he.wikipedia.org/wiki/חטיבה_646",
  "חטיבת יפתח (11)": "https://he.wikipedia.org/wiki/חטיבת_יפתח_(מילואים)",
  'חטיבה 179 "עוצבת ראם" (179)': "https://he.wikipedia.org/wiki/חטיבה_179",
  "חטיבת הזקן (8)": "https://he.wikipedia.org/wiki/חטיבה_8",
  'חטיבה 205 "עקבות הברזל מילואים" (205)': "https://he.wikipedia.org/wiki/חטיבה_205",
  "חטיבת אלון (228)": "https://he.wikipedia.org/wiki/חטיבת_אלון",
  'חטיבה 5 "גבעתי מילואים" (5)': "https://he.wikipedia.org/wiki/חטיבה_5",
  'חטיבה 16 "גולני מילואים" (16)': "https://he.wikipedia.org/wiki/חטיבה_16",
  'חטיבה 6 "נח"ל מילואים" (6)': "https://he.wikipedia.org/wiki/חטיבה_6",
  'חטיבה 679 "שריון מילואים" (679)': "https://he.wikipedia.org/wiki/חטיבה_679",
  "חטיבת כרמלי (5146)": "https://he.wikipedia.org/wiki/חטיבת_כרמלי",
  "חטיבת קרייתי (4)": "https://he.wikipedia.org/wiki/חטיבת_קרייתי",
  "חטיבת אגרוף הברזל (200)": "https://he.wikipedia.org/wiki/חטיבה_200",
  "חטיבת עציוני (6)": "https://he.wikipedia.org/wiki/חטיבת_עציוני",
  'חטיבה 434 "יפתח" (434)': "https://he.wikipedia.org/wiki/חטיבה_434",
  "חטיבת עודד (5210)": "https://he.wikipedia.org/wiki/חטיבת_עודד",
  "חטיבת אלכסנדרוני (5300)": "https://he.wikipedia.org/wiki/חטיבת_אלכסנדרוני",
  "חטיבת קידון (209)": "https://he.wikipedia.org/wiki/חטיבת_קידון",
};

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
