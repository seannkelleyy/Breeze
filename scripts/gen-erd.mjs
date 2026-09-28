#!/usr/bin/env node
// Generates docs/db/02-erd.md — a Mermaid ER diagram of the database —
// from breeze.api/db/schema.hcl, the single source of truth.
// Run from the repo root: node scripts/gen-erd.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const SCHEMA_PATH = 'breeze.api/db/schema.hcl';
const OUT_PATH = 'docs/db/02-erd.md';

const schema = readFileSync(SCHEMA_PATH, 'utf8');

// ── extract blocks with brace matching ──────────────────────
function blockAfter(str, startIdx) {
  const open = str.indexOf('{', startIdx);
  let depth = 0;
  for (let i = open; i < str.length; i++) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') {
      depth--;
      if (depth === 0) return { body: str.slice(open + 1, i), end: i };
    }
  }
  return { body: '', end: str.length };
}

const enums = {};
for (const m of schema.matchAll(/^enum "(\w+)" \{/gm)) {
  const { body } = blockAfter(schema, m.index);
  const values = [...body.matchAll(/"([A-Z_0-9]+)"/g)].map((v) => v[1]);
  enums[m[1]] = values;
}

const tables = {};
const tableRe = /^table "(\w+)" \{/gm;
while (tableRe.lastIndex < schema.length) {
  const m = tableRe.exec(schema);
  if (!m) break;
  const { body, end } = blockAfter(schema, m.index);
  tableRe.lastIndex = end;

  const cols = {};
  for (const c of body.matchAll(/^  column "(\w+)" \{/gm)) {
    const col = blockAfter(body, c.index).body;
    const type = col.match(/type\s*=\s*([^\n]+)/)?.[1].trim() ?? 'unknown';
    const nullable = /null\s*=\s*true/.test(col);
    cols[c[1]] = { type: type.replace(/^enum\./, ''), nullable };
  }

  const pkBlock = body.match(/primary_key \{([\s\S]*?)\n  \}/)?.[1] ?? '';
  const pk = [...pkBlock.matchAll(/column\.(\w+)/g)].map((x) => x[1]);

  const fks = [];
  for (const f of body.matchAll(/foreign_key "\w+" \{/g)) {
    const fkBody = blockAfter(body, f.index).body;
    const from = [...fkBody.matchAll(/columns\s*=\s*\[([^\]]*)\]/g)][0]?.[1] ?? '';
    const ref = [...fkBody.matchAll(/ref_columns\s*=\s*\[([^\]]*)\]/g)][0]?.[1] ?? '';
    const fromCol = from.match(/column\.(\w+)/)?.[1];
    const refTable = ref.match(/table\.(\w+)\.column/)?.[1];
    if (fromCol && refTable) fks.push({ fromCol, refTable });
  }

  tables[m[1]] = { cols, pk, fks };
}

// ── emit mermaid ────────────────────────────────────────────
const q = (t) => (/[(),\s]/.test(t) ? `"${t}"` : t);

let mermaid = 'erDiagram\n';
for (const [name, t] of Object.entries(tables)) {
  mermaid += `    ${name} {\n`;
  for (const [col, meta] of Object.entries(t.cols)) {
    const keys = t.pk.includes(col) ? ' PK' : t.fks.some((f) => f.fromCol === col) ? ' FK' : '';
    mermaid += `        ${q(meta.type)} ${col}${keys}\n`;
  }
  mermaid += '    }\n';
}
const seen = new Set();
for (const [name, t] of Object.entries(tables)) {
  for (const f of t.fks) {
    const key = `${f.refTable}||${name}||${f.fromCol}`;
    if (seen.has(key)) continue;
    seen.add(key);
    mermaid += `    ${f.refTable} ||--o{ ${name} : "${f.fromCol}"\n`;
  }
}

// ── emit markdown ───────────────────────────────────────────
const enumList = Object.entries(enums)
  .map(([name, values]) => `| \`${name}\` | ${values.map((v) => `\`${v}\``).join(' · ')} |`)
  .join('\n');

const md = `# 02 — Entity-Relationship Diagram

Generated ERD of all ${Object.keys(tables).length} tables. **Do not edit by hand** — regenerate after any \`schema.hcl\` change:

\`\`\`bash
node scripts/gen-erd.mjs
\`\`\`

GitHub renders the diagram below natively; most editors do too (VS Code, nvim with a Mermaid preview).

\`\`\`mermaid
${mermaid}\`\`\`

## Enums

${enumList}
`;

writeFileSync(OUT_PATH, md);
console.log(`Wrote ${OUT_PATH}: ${Object.keys(tables).length} tables, ${seen.size} relationships, ${Object.keys(enums).length} enums`);
