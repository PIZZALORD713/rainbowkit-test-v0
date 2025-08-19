import fs from "fs";
import path from "path";

function read(file) {
  try { return fs.readFileSync(file, "utf8"); } catch { return null; }
}
function write(file, s) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, s, "utf8");
}
function has(s, needle) { return s.includes(needle); }
function insertAfterFirstMatch(s, re, insertion) {
  const m = s.match(re);
  if (!m) return insertion + "\n" + s;
  const i = s.indexOf(m[0]) + m[0].length;
  return s.slice(0, i) + "\n" + insertion + s.slice(i);
}
function insertAboveFirstMatch(s, re, insertion) {
  const m = s.match(re);
  if (!m) return s + "\n" + insertion + "\n";
  const i = s.indexOf(m[0]);
  return s.slice(0, i) + insertion + "\n" + s.slice(i);
}
function update(file, transformer) {
  const before = read(file);
  if (before == null) { console.log("skip (missing):", file); return; }
  const after = transformer(before);
  if (after !== before) { write(file, after); console.log("updated:", file); }
  else { console.log("no change:", file); }
}

/* ---------- Comment blocks ---------- */
const hdrProvidersApp = `/**
 * App-wide providers
 *
 * Why this exists:
 * - Centralizes Wagmi + RainbowKit setup so every page gets the same config.
 * - Prevents duplicate providers in nested routes which can break wallet state.
 *
 * Notes for future devs:
 * - If you change supported chains or projectId, update the wagmi config
 *   and RainbowKitProvider here to keep the modal + hooks in sync.
 * - RainbowKit's modal uses a portal — make sure no ancestor has CSS transforms
 *   that would create a new stacking context (see /diagnostics).
 */`;
const cmtModalTuning = `{/* modalSize keeps the connect UI compact; "coolMode" enables subtle motion.
    Tune these for OraKit's vibe to match the design system. */}`;

const hdrProvidersCmp = `/**
 * Standalone providers (outside App Router).
 * Use this only if you need Wagmi/RainbowKit in an isolated tree
 * (storybook, embedded widgets). Avoid wrapping the app twice.
 */`;

const hdrConnectBtn = `// Custom wrapper around RainbowKit's render-prop API.
// Renders three states:
// 1) not connected → "Connect Wallet"
// 2) unsupported chain → "Wrong network"
// 3) connected → account/chain buttons
// Keep this minimal; heavy re-renders can interfere with RainbowKit internals.`;
const cmtSSRGuard = `// When SSR/streaming, RainbowKit mounts client-side.
// \`ready\` prevents flashing of wrong state on first paint.`;
const cmtCTA = `// Keep the primary CTA short; this is the hero action for new users.`;
const cmtWrongNet = `// Fast path to let users switch to a supported network.`;
const cmtAccountBtns = `{/* Address/ENS controls. Keep hit targets generous for mobile. */}`;

const cmtStorageKey = `// Namespaced localStorage key for AIM files.
// NOTE: LocalStorage is per-origin and has ~5–10MB quotas depending on browser.
// For many Oras, consider IndexedDB or a remote KV (Supabase/Vercel KV).`;
const cmtGetAll = `/** Load all AIM files from localStorage. Returns [] if nothing stored. */`;
const cmtSave = `// If schemas evolve, consider a lightweight migration step here.`;
const cmtImport = `// Shared import path. Overwrites only if IDs match; warn users before replacing.`;

const hdrAIM = `/** Minimal AIM/CMP shape persisted locally.
 * Align this with the emerging CMP schema when available.
 * Required fields: id, characterName, createdAt.
 * Others can evolve without breaking older files.
 */`;

const hdrEditor = `// High-level editor for one AIMFile.
// Sections: Identity, Personality, Backstory, Abilities, Behavior, Goals, etc.
// Keep each section independently controlled to avoid clobbering partial edits.`;
const cmtHandleSave = `// Persist to localStorage and notify parent.
// If you add remote persistence, keep this the single side-effect boundary.`;

const hdrBulk = `// Exports a subset of AIM files as JSON.
// Keep schema stable and documented so files remain portable across tools.`;
const cmtCopy = `// Copy to clipboard for quick share. Fallback to download when not permitted.`;
const cmtDownload = `// Name the file with a date for easier versioning in user folders.`;

const hdrImport = `// Drag-and-drop JSON importer for AIM files.
// Validates shape and prevents silent overwrites unless confirmed.`;
const cmtDrop = `// Restrict to .json/.aim; reject huge files (>2MB) to avoid UI freezes.`;

const hdrHome = `// Collector dashboard: resolve ENS → fetch Oras (/api/chatgpt/oras) → grid → inline AIM actions.`;
const cmtSearch = `// Accept ENS or address. Consider debouncing + caching in sessionStorage.`;

const hdrManage = `// Local profile manager for saved AIM files.
// Filter/sort/metrics are memoized to keep the list responsive.`;
const cmtCompletion = `// Approximate "profile completeness" as % of filled fields.
// If schema expands, update scoring to stay meaningful.`;

const hdrDiag = `// Dev-only page to detect CSS transform/perspective/filter on ancestors
// that can break RainbowKit's portal positioning. Keep this out of production.`;

const hdrEnv = `// Quick runtime check for required NEXT_PUBLIC_* variables on first deploy.`;

const hdrWalletEntry = `// Minimal gate for flows that require an active wallet connection.
// Prefer this route over duplicating connection logic elsewhere.`;

const hdrAPI = `// Fetch Oras for a wallet via OpenSea v2 and shape response for the grid.
// OpenSea can rate limit; add caching if you see 429s.`;
const cmtAPIErr = `// Surface useful info without leaking secrets (keys, full headers, etc.).`;

const cmtCN = `// Tiny helper to join Tailwind class lists.`;

/* ---------- Transformers per file ---------- */
update("app/providers.tsx", s => {
  let out = s;
  if (!has(out, "App-wide providers")) {
    out = insertAfterFirstMatch(out, /['"]use client['"];?/, hdrProvidersApp);
  }
  if (!has(out, "modalSize keeps the connect UI compact")) {
    out = insertAboveFirstMatch(out, /<RainbowKitProvider\b/, cmtModalTuning);
  }
  return out;
});

update("components/providers.tsx", s => {
  let out = s;
  if (!has(out, "Standalone providers (outside App Router)")) {
    out = hdrProvidersCmp + "\n" + out;
  }
  if (!has(out, "Keep feature parity with /app/providers.tsx")) {
    out = insertAboveFirstMatch(out, /<RainbowKitProvider\b/, `{/* Keep feature parity with /app/providers.tsx unless intentionally diverging. */}`);
  }
  return out;
});

update("components/custom-connect-button.tsx", s => {
  let out = s;
  if (!has(out, "Custom wrapper around RainbowKit's render-prop API")) {
    out = out.replace(/(import .+\n)+/m, (m) => m + hdrConnectBtn + "\n");
  }
  if (!has(out, "RainbowKit mounts client-side")) {
    out = insertAboveFirstMatch(out, /const\s+ready\s*=/, cmtSSRGuard + "\n");
  }
  if (!has(out, "hero action for new users")) {
    out = out.replace(/return\s*\(\s*<button onClick={openConnectModal}[^]*?<\/button>\s*\)/m,
      (m) => m.replace(/<button/, `// Keep the primary CTA short; this is the hero action for new users.\n            <button`));
  }
  if (!has(out, "switch to a supported network")) {
    out = out.replace(/return\s*\(\s*<button onClick={openChainModal}[^]*?<\/button>\s*\)/m,
      (m) => m.replace(/<button/, `// Fast path to let users switch to a supported network.\n            <button`));
  }
  if (!has(out, "Keep hit targets generous for mobile")) {
    out = out.replace(/return\s*\(\s*<div className="flex items-center gap-2">/,
      `return (\n          <div className="flex items-center gap-2">\n            {/* Address/ENS controls. Keep hit targets generous for mobile. */}`);
  }
  return out;
});

update("lib/aim-storage.ts", s => {
  let out = s;
  if (!has(out, "Namespaced localStorage key for AIM files")) {
    out = out.replace(/(const\s+STORAGE_KEY\s*=\s*['"].+?['"];?)/, cmtStorageKey + "\n$1");
  }
  if (!has(out, "Load all AIM files from localStorage")) {
    out = out.replace(/static\s+get(All|Files)\s*\(/, `${cmtGetAll}\n  static get$1(`);
  }
  if (!has(out, "lightweight migration step")) {
    out = out.replace(/static\s+save(File|)\s*\(/, `${cmtSave}\n  static save$1(`);
  }
  if (!has(out, "Shared import path")) {
    out = out.replace(/static\s+import(File|)\s*\(/, `${cmtImport}\n  static import$1(`);
  }
  return out;
});

update("types/aim.ts", s => {
  let out = s;
  if (!has(out, "Minimal AIM/CMP shape persisted locally")) {
    out = out.replace(/export\s+interface\s+AIMFile/, hdrAIM + "\nexport interface AIMFile");
  }
  return out;
});

update("components/aim-editor.tsx", s => {
  let out = s;
  if (!has(out, "High-level editor for one AIMFile")) {
    out = hdrEditor + "\n" + out;
  }
  if (!has(out, "Persist to localStorage and notify parent")) {
    out = out.replace(/const\s+handleSave\s*=\s*\(\)\s*=>\s*\{/, `const handleSave = () => {\n    // Persist to localStorage and notify parent.\n    // If you add remote persistence, keep this the single side-effect boundary.`);
  }
  return out;
});

update("components/bulk-edit-modal.tsx", s => {
  let out = s;
  if (!has(out, "Exports a subset of AIM files as JSON")) {
    out = hdrBulk + "\n" + out;
  }
  if (!has(out, "Copy to clipboard for quick share")) {
    out = out.replace(/async\s+function\s+handleCopy\s*\(/, `async function handleCopy(`)
             .replace(/await\s+navigator\.clipboard\.writeText/, `// Copy to clipboard for quick share. Fallback to download when not permitted.\n      await navigator.clipboard.writeText`);
  }
  if (!has(out, "Name the file with a date")) {
    out = out.replace(/function\s+handleDownload\s*\(\)\s*\{/, `function handleDownload() {\n    // Name the file with a date for easier versioning in user folders.`);
  }
  return out;
});

update("components/import-aim-modal.tsx", s => {
  let out = s;
  if (!has(out, "Drag-and-drop JSON importer for AIM files")) {
    out = hdrImport + "\n" + out;
  }
  if (!has(out, "reject huge files")) {
    out = out.replace(/const\s+handleDrop\s*=\s*\([^)]+\)\s*=>\s*\{/, `const handleDrop = (e) => {\n    // Restrict to .json/.aim; reject huge files (>2MB) to avoid UI freezes.`);
  }
  return out;
});

update("app/page.tsx", s => {
  let out = s;
  if (!has(out, "Collector dashboard: resolve ENS")) {
    out = hdrHome + "\n" + out;
  }
  if (!has(out, "debouncing + caching")) {
    out = out.replace(/const\s+handleSearch\s*=\s*async\s*\(/, `// Accept ENS or address. Consider debouncing + caching in sessionStorage.\n  const handleSearch = async (`);
  }
  return out;
});

update("app/manage/page.tsx", s => {
  let out = s;
  if (!has(out, "Local profile manager for saved AIM files")) {
    out = hdrManage + "\n" + out;
  }
  if (!has(out, "profile completeness")) {
    out = out.replace(/function\s+getCompletionPercentage\s*\(/, `// Approximate "profile completeness" as % of filled fields.\n  // If schema expands, update scoring to stay meaningful.\n  function getCompletionPercentage(`);
  }
  return out;
});

update("app/diagnostics/page.tsx", s => {
  let out = s;
  if (!has(out, "Dev-only page to detect CSS")) {
    out = hdrDiag + "\n" + out;
  }
  return out;
});

update("app/env-check/page.tsx", s => {
  let out = s;
  if (!has(out, "Quick runtime check for required")) {
    out = hdrEnv + "\n" + out;
  }
  return out;
});

update("app/wallet-entry/page.tsx", s => {
  let out = s;
  if (!has(out, "Minimal gate for flows that require an active wallet connection")) {
    out = hdrWalletEntry + "\n" + out;
  }
  return out;
});

update("app/api/chatgpt/oras/route.ts", s => {
  let out = s;
  if (!has(out, "Fetch Oras for a wallet via OpenSea v2")) {
    out = out.replace(/export\s+async\s+function\s+GET/, `${hdrAPI}\nexport async function GET`);
  }
  if (!has(out, "Surface useful info without leaking secrets")) {
    out = out.replace(/if\s*\(!response\.ok\)\s*\{/, `if (!response.ok) {\n      // Surface useful info without leaking secrets (keys, full headers, etc.).`);
  }
  return out;
});

update("lib/utils.ts", s => {
  let out = s;
  if (!has(out, "Tiny helper to join Tailwind class lists")) {
    out = out.replace(/export\s+function\s+cn/, `${cmtCN}\nexport function cn`);
  }
  return out;
});

console.log("Done.");
