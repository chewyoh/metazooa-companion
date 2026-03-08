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
  // סדיר - פיקוד צפון / אוגדה 36
  "חטיבת גולני (1)": "https://he.wikipedia.org/wiki/חטיבת_גולני",
  "חטיבה 7 (7)": "https://he.wikipedia.org/wiki/חטיבה_7",
  "חטיבת האש 282 (282)": "https://he.wikipedia.org/wiki/חטיבת_האש_282",
  // אוגדה 98
  "חטיבת הצנחנים (35)": "https://he.wikipedia.org/wiki/חטיבת_הצנחנים",
  "חטיבת עוז (89)": "https://he.wikipedia.org/wiki/חטיבת_עוז",
  // אוגדה 162
  "חטיבת גבעתי (84)": "https://he.wikipedia.org/wiki/חטיבת_גבעתי",
  'חטיבת נח"ל (933)': "https://he.wikipedia.org/wiki/חטיבת_הנח%22ל",
  // אוגדה 99
  "חטיבת כפיר (900)": "https://he.wikipedia.org/wiki/חטיבת_כפיר",
  // שריון
  "חטיבת ברק (188)": "https://he.wikipedia.org/wiki/חטיבה_188",
  "חטיבת עקבות הברזל (401)": "https://he.wikipedia.org/wiki/חטיבה_401",
  // אוגדה 38 - הכשרות
  "חטיבת בני אור (460)": "https://he.wikipedia.org/wiki/חטיבה_460",
  'חטיבת בסלמ"ח (828)': "https://he.wikipedia.org/wiki/חטיבת_ביסלמ%22ח",
  'בה"ד 1 (1001)': "https://he.wikipedia.org/wiki/בית_הספר_לקצינים_של_צה%22ל",
  'בהל"צ (14)': "https://he.wikipedia.org/wiki/בית_הספר_להנדסה_צבאית",
  "חטיבת האש שבטה (3800)": "https://he.wikipedia.org/wiki/מחנה_שבטה",
  'בהל"ג (3801)': "https://he.wikipedia.org/wiki/בית_הספר_להגנת_הגבולות",
  // מרחביות - פיקוד צפון
  "חטיבת ברעם (300)": "https://he.wikipedia.org/wiki/חטיבת_ברעם",
  "חטיבת חירם (769)": "https://he.wikipedia.org/wiki/חטיבת_חירם",
  "חטיבת הגולן (474)": "https://he.wikipedia.org/wiki/חטיבת_הגולן",
  // מרחביות - פיקוד דרום
  "חטיבת פארן (512)": "https://he.wikipedia.org/wiki/חטיבת_פארן",
  "חטיבת יואב (406)": "https://he.wikipedia.org/wiki/חטיבת_יואב",
  "חטיבת ההרים (810)": "https://he.wikipedia.org/wiki/חטיבת_ההרים",
  // מרחביות - פיקוד מרכז
  "חטיבת הבקעה (417)": "https://he.wikipedia.org/wiki/חטיבת_הבקעה",
  "חטיבת אורי (182)": "https://he.wikipedia.org/wiki/חטיבת_אורי",
  "חטיבת עציון (274)": "https://he.wikipedia.org/wiki/חטמ%22ר_עציון",
  "חטיבת אפרים (578)": "https://he.wikipedia.org/wiki/חטמ%22ר_אפרים",
  "חטיבת בנימין (906)": "https://he.wikipedia.org/wiki/חטמ%22ר_בנימין",
  "חטיבת יהודה (433)": "https://he.wikipedia.org/wiki/חטמ%22ר_יהודה",
  "חטיבת מנשה (431)": "https://he.wikipedia.org/wiki/חטמ%22ר_מנשה",
  "חטיבת שומרון (442)": "https://he.wikipedia.org/wiki/חטמ%22ר_שומרון",
  // הגנה אווירית
  "חטיבת האש 990 (990)": "https://he.wikipedia.org/wiki/חטיבת_האש_990",
  "חטיבת האש 215 (215)": "https://he.wikipedia.org/wiki/חטיבת_האש_215",
  // אוגדות מילואים
  "חטיבת תל-חי (5097)": "https://he.wikipedia.org/wiki/חטיבת_תל-חי",
  "חטיבת יזרעאלי (5098)": "https://he.wikipedia.org/wiki/חטיבת_יזרעאלי",
  "חטיבת יהונתן (5099)": "https://he.wikipedia.org/wiki/חטיבת_יהונתן",
  "חטיבת נגבה (5100)": "https://he.wikipedia.org/wiki/חטיבת_נגבה",
  "חטיבת קטיף (6643)": "https://he.wikipedia.org/wiki/חטיבת_קטיף",
  "חטיבת גפן (7643)": "https://he.wikipedia.org/wiki/חטיבת_גפן",
  "חטיבה 55 (55)": "https://he.wikipedia.org/wiki/חטיבה_55",
  "חטיבה 551 (551)": "https://he.wikipedia.org/wiki/חטיבה_551",
  "חטיבה 646 (646)": "https://he.wikipedia.org/wiki/חטיבה_646",
  "חטיבת יפתח (11)": "https://he.wikipedia.org/wiki/חטיבת_יפתח_(מילואים)",
  "חטיבה 179 (179)": "https://he.wikipedia.org/wiki/חטיבה_179",
  "חטיבת הזקן (8)": "https://he.wikipedia.org/wiki/חטיבה_8",
  "חטיבה 205 (205)": "https://he.wikipedia.org/wiki/חטיבה_205",
  "חטיבת אלון (228)": "https://he.wikipedia.org/wiki/חטיבת_אלון",
  "חטיבה 5 (5)": "https://he.wikipedia.org/wiki/חטיבה_5",
  "חטיבה 16 (16)": "https://he.wikipedia.org/wiki/חטיבה_16",
  "חטיבה 6 (6)": "https://he.wikipedia.org/wiki/חטיבה_6",
  "חטיבה 679 (679)": "https://he.wikipedia.org/wiki/חטיבה_679",
  "חטיבת כרמלי (2)": "https://he.wikipedia.org/wiki/חטיבת_כרמלי",
  "חטיבת קרייתי (4)": "https://he.wikipedia.org/wiki/חטיבת_קרייתי",
  "חטיבת אגרוף הברזל (200)": "https://he.wikipedia.org/wiki/חטיבה_200",
  "חטיבת עציוני (6)": "https://he.wikipedia.org/wiki/חטיבת_עציוני",
  "עוצבת יפתח (434)": "https://he.wikipedia.org/wiki/חטיבה_434",
  "חטיבת עודד (5210)": "https://he.wikipedia.org/wiki/חטיבת_עודד",
  "חטיבת אלכסנדרוני (5300)": "https://he.wikipedia.org/wiki/חטיבת_אלכסנדרוני",
  "עוצבת כידון (209)": "https://he.wikipedia.org/wiki/חטיבת_קידון",
  "חטיבת קלע דוד (214)": "https://he.wikipedia.org/wiki/קלע_דוד",
  "עוצבת אדירים (5091)": "https://he.wikipedia.org/wiki/עוצבת_אדירים",
  "עוצבת הנשר (226)": "https://he.wikipedia.org/wiki/עוצבת_הנשר",
  "עוצבת התקומה (5200)": "https://he.wikipedia.org/wiki/עוצבת_התקומה",
};

const divisionWikiMap: Record<string, string> = {
  'אוגדה 36 "געש" (36)': "https://he.wikipedia.org/wiki/אוגדה_36",
  'אוגדה 98 "האש" (98)': "https://he.wikipedia.org/wiki/אוגדה_98",
  'אוגדה 162 "הפלדה" (162)': "https://he.wikipedia.org/wiki/אוגדה_162",
  'אוגדה 99 "הבזק" (99)': "https://he.wikipedia.org/wiki/אוגדה_99",
  'אוגדה 38 "ההכשרות" (38)': "https://he.wikipedia.org/wiki/אוגדת_ההכשרות",
  'אוגדה 91 "הגליל" (91)': "https://he.wikipedia.org/wiki/אוגדה_91",
  'אוגדה 210 "בשן" (210)': "https://he.wikipedia.org/wiki/אוגדה_210",
  'אוגדה 80 "אדום" (80)': "https://he.wikipedia.org/wiki/אוגדה_80",
  'אוגדה 877 "יהודה ושומרון" (877)': "https://he.wikipedia.org/wiki/אוגדה_877",
  'אוגדה 143 "פיירפוקס" (143)': "https://he.wikipedia.org/wiki/אוגדה_143",
  'אוגדה 146 "המפץ" (146)': "https://he.wikipedia.org/wiki/אוגדה_146",
  'אוגדה 96 "גלעד" (96)': "https://he.wikipedia.org/wiki/אוגדה_96",
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
      const divNode: TreeNode = { label: div, children: [], wikiUrl: divisionWikiMap[div] };
      for (const [brig, bns] of brigMap) {
        const brigNode: TreeNode = {
          label: brig,
          children: bns.map((name) => ({ label: name, children: [] })),
          wikiUrl: brigadeWikiMap[brig],
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
      <div className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold text-foreground ${bgClass} border-r-2 ${colorClass}`}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 hover:bg-muted/60 transition-colors rounded p-0.5"
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronLeft className="w-4 h-4 shrink-0 text-muted-foreground" />
          )}
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className="hover:bg-muted/60 transition-colors rounded px-1"
        >
          {node.label}
        </button>
        <span className="text-xs text-muted-foreground">
          ({node.children.length})
        </span>
        {node.wikiUrl && (
          <a
            href={node.wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mr-auto text-muted-foreground hover:text-primary transition-colors"
            title="ויקיפדיה"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        {!node.wikiUrl && <span className="mr-auto" />}
      </div>
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
