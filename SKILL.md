---
name aurora-log-dev
description Use this skill whenever Damien asks for changes to the Aurora Receiving Log app. Covers code editing, file delivery, safety checks, and deployment procedures for the single-file HTMLReactBabel warehouse app hosted on GitHub Pages. Triggers on any mention of Aurora Log, receiving log, the warehouse app, code changes to index.html, or feature requests for the logging system.
---

# Aurora Log Development Skill

Version 1.3.0
Last Updated March 8, 2026
App Aurora Receiving Log - a simplified receiving log for Aurora, a constructionbuilding materials supply warehouse in Portland, Oregon.

## Overview

Aurora Log is a single-file HTML app using React 18 + Babel 7.23 for in-browser JSX transpilation. It runs on GitHub Pages at `httpsneimaD7.github.ioaurora-log` with data stored in localStorage. Damien uses it primarily on his phone on the warehouse floor, with occasional desktop access.

This skill contains every rule, fix, and procedure learned through development. Read this entire skill before writing any code.

---

## CRITICAL RULES (never violate these)

### 1. Never Nest React Components
What Do NOT define React component functions inside other component functions.
Why Nested components are re-created on every parent render. This causes input fields to unmount and remount on each keystroke, killing focus and freezing mobile Safari.
Example of the bug
```jsx
 BAD - NameInput re-created every time AIIntake renders
function AIIntake({ onSave }) {
  const NameInput = ({ value, onChange }) = { ... };   NESTED - BREAKS MOBILE
  return ;
}

 GOOD - NameInput is stable, React preserves its state
function NameInput({ value, onChange, knownItems }) { ... }   TOP LEVEL
function AIIntake({ onSave, knownItems }) {
  return ;   Pass data as props
}
```

### 2. Never Use Literal Triple Backticks in Babel Script
What The regex ````json```g` will break Babel transpilation inside `script type=textbabel`.
Why Babel's parser sees the backticks as template literal syntax and fails silently (Script error, line 0).
Fix Build the pattern with `String.fromCharCode`
```javascript
const FENCE_RE = new RegExp(String.fromCharCode(96,96,96) + json + String.fromCharCode(96,96,96), g);
 Then use text.replace(FENCE_RE, )
```

### 3. GitHub Deploys via Git CLI
Bob (OpenClaw agent) can push directly to GitHub using `git push` from the CLI. The repo is cloned to a temp deploy directory.
Deploy workflow:
1. Copy updated `index.html` to `$env:TEMP\aurora-log-deploy`
2. `git add index.html && git commit -m "description" && git push origin main`
3. Wait ~60s for GitHub Pages to rebuild
Note: The old rule "never push to GitHub" applied to Claude Desktop using the Chrome extension, which was unreliable. Git CLI pushes are fine.
Damien can still deploy manually from mobile if preferred (copy from artifact, paste into GitHub editor).

### 4. Always Use Unique Filenames
What Every file delivered must have a unique name for cache busting.
Why Reusing filenames causes the browser to serve cached versions, making it look like nothing changed.
Pattern `aurora_v13_timestamp.html` using `$(date +%s)` for the timestamp.

### 5. Multi-Token Matching Must Use `every`, Not `some`
What When matching item names against category keywords, ALL tokens in a category must appear in the item name.
Why Using `some` (ANY token matches) causes false positives. Example bag ties with `some` would match Snap Ties and Flat Ties because the single token ties appears. form oil with `some` would match Form Clips because form appears.
Fix Use `catTokens.every(ct = norm.includes(ct))` - requires ALL tokens to match.
Slash = OR Categories with  like form clipsflat ties are split into alternatives, each checked independently with `every`. This lets users add aliases for items that go by different names at different vendors.

---

## FAILSAFE SYSTEM (must be present in every build)

The app has a three-tier data protection system. All three tiers must be present in every version.

### Tier 1 Auto-Backup on Every Write
Every `window.storage.set()` call mirrors data to a `_backup` key
```javascript
async set(k, v) {
  localStorage.setItem(aurora_log_ + k, v);
  try { localStorage.setItem(aurora_log_ + k + _backup, v); } catch(e) {}
  return { key k, value v };
}
```

### Tier 2 Corruption Detection + Auto-Restore
On page load (plain JS, before ReactBabel), validate all localStorage keys. If corrupted
1. Save corrupted data to `_corrupted_backup` key
2. Remove the bad key
3. Attempt auto-restore from `_backup` key
4. If backup is also bad, set `window._dataLost = true`

```javascript
[aurora_log_entries, aurora_log_known_items, aurora_log_upcoming, aurora_log_pull_queue, aurora_log_pull_priority].forEach(function(k) {
  try { var v = localStorage.getItem(k); if (v !== null) JSON.parse(v); }
  catch(e) {
    try { localStorage.setItem(k + _corrupted_backup, localStorage.getItem(k)); } catch(x) {}
    localStorage.removeItem(k);
    var backup = localStorage.getItem(k + _backup);
    if (backup) {
      try { JSON.parse(backup); localStorage.setItem(k, backup); }
      catch(e2) {
        localStorage.removeItem(k + _backup);
        if (k === aurora_log_entries) window._dataLost = true;
      }
    } else {
      if (k === aurora_log_entries) window._dataLost = true;
    }
  }
});
```

### Tier 3 Recovery UI + Mount Timeout
- `window.onerror` catches runtime errors and shows `showRecoveryUI()` - a plain-JS screen (no ReactBabel needed) with data export, retry, clear, and restore-from-backup buttons.
- 8-second timeout if `window._appMounted` is never set to `true`, shows recovery UI.
- `_dataLost` flag if both main and backup are corrupted, React renders a gold warning banner inside the app.

The recovery UI must be entirely plain JavaScript - no React, no Babel, no template literals, no arrow functions. It runs when everything else has failed.

---

## DATA LOSS ROOT CAUSE (historical context)

Data was lost because an earlier version's localStorage validator deleted corrupted keys without checking for backups first. The corruption happened when the app froze from the nested NameInput bug mid-write. On the next load, the validator saw bad JSON and wiped it. This is why the auto-restore-from-backup step was added to the validator.

---

## PRE-DELIVERY CHECKLIST (run every time before presenting a file)

Execute this Python validation script before every file delivery

```python
python3  'PYEOF'
with open('FILE_PATH', 'r') as f
    c = f.read()
lines = c.splitlines()
print(fLines {len(lines)})
print(fSize {len(c)} bytes)
print(fParens {c.count('(')}  {c.count(')')})
print(fBraces {c.count('{')  }  {c.count('}')})
print(fBrackets {c.count('[')  }  {c.count(']')})
print(fScripts {c.count('script')}  {c.count('script')})
print(fEnds OK {c.strip().endswith('html')})

# Check NameInput is top-level and not nested
for i, line in enumerate(lines, 1)
    if 'function NameInput' in line
        print(fNameInput at line {i})
    if 'NameInput ' in line
        print(f  Usage line {i} knownItems={'YES' if 'knownItems=' in line else 'MISSING!'})

# Check for triple backticks
bt = chr(96)3
print(fTriple backticks {'WARNING!' if bt in c else 'clean'})

# Check failsafe components
print(fMount signal {'present' if '_appMounted = true' in c else 'MISSING!'})
print(fRecovery UI {'present' if 'showRecoveryUI' in c else 'MISSING!'})
print(fAuto-backup {'present' if '_backup' in c else 'MISSING!'})
print(fAuto-restore {'present' if 'backup' in c and 'localStorage.setItem(k, backup)' in c else 'MISSING!'})
print(f_dataLost flag {'present' if '_dataLost' in c else 'MISSING!'})
print(fLocal today() {'present' if 'getFullYear' in c else 'MISSING - uses UTC!'})
print(fFENCE_RE {'present' if 'FENCE_RE' in c else 'MISSING - has literal backticks!'})

# Check pull sheet components
print(fPullIntake {'present' if 'function PullIntake(' in c else 'MISSING!'})
print(fPullItemRow {'present' if 'function PullItemRow(' in c else 'MISSING!'})
print(fPullPriorityModal {'present' if 'function PullPriorityModal(' in c else 'MISSING!'})
print(fPullSOCard {'present' if 'function PullSOCard(' in c else 'MISSING!'})
print(fmatchPriority (every) {'present' if 'catTokens.every' in c else 'MISSING - uses some!'})
PYEOF
```

All checks must pass before delivering the file. If any say MISSING, fix the code first.

---

## CODE STYLE

The app uses standard modern JS that Babel 7.23 handles well
- `const`, `let` (no `var` needed)
- Arrow functions `(x) = x + 1`
- Spread `{...obj, key val}` and `[...arr, item]`
- Template literals `` `text ${var}` ``
- Destructuring `const { useState, useEffect, useRef } = React;`
- `asyncawait`
- Optional chaining `data.content.map(...)`

Do NOT use
- `useCallback` (not needed, was removed from imports)
- `data-type=module` on script tags (can cause issues on some mobile browsers, keep it for compatibility but be aware)
- Unicode emoji in JSX handler code (fine in display strings and button labels)

---

## APP ARCHITECTURE

### Storage Keys
 Key  Contents
---------------
 `aurora_log_entries`  Array of logged POs and transfers
 `aurora_log_upcoming`  Array of stagedupcoming POs and transfers
 `aurora_log_known_items`  Item name dictionary (auto-learned)
 `aurora_log_pull_queue`  Array of parsed SOs for current pull session (temporary - cleared on CLEAR)
 `aurora_log_pull_priority`  Ordered list of pull category strings with  as OR separator (persistent)
 `aurora_api_key`  Anthropic API key (not prefixed, not backed up)
 `_backup`  Mirror of each key, written on every save
 `_corrupted_backup`  Saved corrupted data before deletion
 `aurora_sync_token`  GitHub sync PAT (no prefix, not backed up)

### Component Hierarchy (all top-level, never nested)
```
NameInput          - Autocomplete input with dictionary suggestions
AIIntake           - SCAN panel photo upload, API parsing, reviewconfirm (POstransfers)
PullIntake         - + SO panel photo upload, API parsing for sales orders (pull sheet)
PullItemRow        - Merged pull item with big checkbox + expandable per-SO breakdown
PullPriorityModal  - Reorderaddremove pull priority categories
PullSOCard         - Displays a loaded SO in the pull sheet SO list
EntryCard          - Displays a logged entry (PO or transfer)
UpcomingCard       - Displays a staged upcoming entry with RECEIVEDSENT button
DateHeader         - Date separator in the log view
AddModal           - Manual entry form (LOG IT or UPCOMING)
ApiKeyModal        - API key input
ItemDictModal      - Vieweditdelete dictionary items
SyncTokenModal     - GitHub sync token input/clear
SyncStatusBar      - Bottom-bar sync status indicator (idle/syncing/error/last-synced)
App                - Root component, state management, persistence
```

### Tabs
```
POs  XFERS  UPCOMING  PULL
```
TRANSFERS was shortened to XFERS to fit all 4 tabs on mobile.

### Key Behaviors
- Item Dictionary Auto-learns item names from every logged entry. AI system prompt includes known names so it normalizes variants. Client-side fuzzy matching as fallback after API response.
- Multi-Photo Multiple images sent as pages of one document to the API. System prompt instructs combining all line items.
- UPCOMING tab Stage POstransfers before physical receipt. RECEIVEDSENT changes the date to today and moves to main log. Upcoming items are editable.
- today() Uses `getFullYear()``getMonth()``getDate()` for local timezone. NOT `toISOString()` which returns UTC and can be wrong by a day in Pacific time.
- PULL tab Temporary SO workstation. Scanenter multiple SOs - items merge across orders, sorted by user-defined pull priority. Big checkboxes + progress bar. SPLIT button expands per-SO qty breakdown for tote splitting. CLEAR wipes everything. SOs are NOT logged to entries.
- Pull Priority User-configurable category order persisted in `pull_priority`.  in a category means OR (e.g. form clipsfooting clips matches either). Items not matching any category fall to bottom. Default stakes  bag ties  form oil  dobies  bolts  pier papers  form clipsflat ties  snap ties  misc.

### Header Layout
The header right-side buttons change based on which tab is active
```
Non-pull tabs  [AURORA RECEIVING LOG] [DICT] --gap-- [SCAN] [+ LOG]
Pull tab       [AURORA RECEIVING LOG] [DICT] --gap-- [+ SO]
```
DICT is next to the title on the left. Right-side buttons swap contextually.
KEY and LBL buttons were moved into the DICT (ItemDictModal) footer to reduce header clutter on mobile. API key modal still auto-opens on first load if no key is set.

---

## GITHUB SYNC SYSTEM (added v1.3.0)

The app syncs data to a private GitHub repo for cross-device persistence and backup.

### Infrastructure
- **Data repo:** github.com/neimaD7/aurora-log-data (PRIVATE)
- **API:** GitHub Contents API (GET/PUT) for reading/writing JSON files
- **Token:** Fine-grained PAT stored in localStorage as `aurora_sync_token` (no prefix)
- **Token name:** aurora-log-sync (Contents R/W on aurora-log-data only)
- **Token expiry:** June 6, 2026 — remind Dev to renew ~1 week before

### Synced Data
| File | localStorage Key | Notes |
|------|-----------------|-------|
| entries.json | aurora_log_entries | POs and transfers |
| upcoming.json | aurora_log_upcoming | Staged/upcoming items |
| known_items.json | aurora_log_known_items | Item dictionary |

Pull queue and pull priority are NOT synced (session-local / device-local).

### Sync Behavior
1. **Page load:** Read localStorage first (instant render), then background `fullSync()` — pull from GitHub, merge, re-render if changed, then push merged results back
2. **On save/edit/delete:** Write to localStorage immediately, then `debouncedPush()` (2.5s delay) to GitHub
3. **Push flow:** GET current file (for SHA), merge local+remote, PUT updated file
4. **Offline-first:** If GitHub is unreachable, app works normally from localStorage. Errors shown via SyncStatusBar, auto-retry on next save.

### Merge Logic
- **Entries & upcoming:** Union merge by `id` field. If same ID exists in both local and remote, `modifiedAt` timestamp wins (last-modified-wins).
- **Soft-delete:** Deleted entries get `_deleted: true` + updated `modifiedAt` instead of being removed. Filtered from display. On merge, deleted wins if it has latest `modifiedAt`.
- **Known items:** Merge by normalized name. Keep all unique items. Sort alphabetically.

### Entry Modifications for Sync
- `makeEntry()` adds `modifiedAt: Date.now()` on creation
- Editing an entry updates `modifiedAt: Date.now()`
- Deleting sets `_deleted: true, modifiedAt: Date.now()` instead of filtering out
- All display views filter out `_deleted` entries

### GitHubSync Module (top-level object, not a React component)
Key methods:
- `push(dataType, localData)` — merge and push to GitHub
- `pull(dataType)` — fetch from GitHub
- `fullSync(getLocal, setLocal)` — full bidirectional sync on page load
- `debouncedPush(dataType, localData)` — 2.5s debounced push
- `isConfigured()` / `getToken()` / `setToken(t)` — token management
- `onStatusChange(fn)` — subscribe to sync status updates
- `_mergeEntries(local, remote)` / `_mergeKnownItems(local, remote)` — merge logic
- SHA conflict handling: on 409, re-pull and retry once

### UI Components
- **SyncTokenModal** — Enter/clear GitHub sync token. Accessible from DICT modal footer (SYNC button).
- **SyncStatusBar** — Bottom-of-screen indicator showing sync status (idle/syncing/error/last-synced time). Only visible when sync is configured.

### Pre-Delivery Checklist Additions
When modifying sync-related code, also verify:
- `GitHubSync` object exists at top level
- `SyncTokenModal` and `SyncStatusBar` components exist
- `debouncedPush` calls present after localStorage writes for entries, upcoming, and known_items
- `fullSync` called on page load when token is configured
- `_deleted` entries filtered from all display views
- `modifiedAt` set on create, edit, and delete operations

---

## DEVELOPMENT WORKFLOW

1. Receive request from Damien (feature, fix, etc.)
2. Read this skill before writing any code
3. Start from the latest version - ask Damien to upload current code if not in context, or work from the last file created in this session
4. Write the complete file - do NOT patchedit. Full clean writes avoid accumulating errors from string replacements.
5. Run the pre-delivery checklist - fix any issues before presenting
6. Output with unique filename - `aurora_vXX_$(date +%s).html`
7. Present the file - Damien will deploy manually to GitHub

### How Bob Deploys (primary workflow)
1. Edit `index.html` in workspace (`C:\Users\billy\.openclaw\workspace\aurora-log\`)
2. Copy to deploy repo: `Copy-Item ... "$env:TEMP\aurora-log-deploy\index.html"`
3. `git add`, `git commit`, `git push origin main`
4. ~60 seconds later the update is live at `neimaD7.github.io/aurora-log`

### How Damien Deploys (mobile fallback)
1. Copy code from artifact or file
2. Open GitHub repo (`github.com/neimaD7/aurora-log`) in mobile browser
3. Tap `index.html` → Edit (pencil icon)
4. Select all → Paste the copied code
5. Commit the change

### When Making Changes
- Prefer full file rewrites over targeted edits (str_replace can introduce subtle bugs)
- If the file is in context from Damien's upload, use that as the base
- If working from a previous version in the session, use the last validated file
- Always verify the change actually made it into the output (grep for key strings)

---

## COMMON PITFALLS

 Problem  Cause  Prevention
----------------------------
 Input loses focus on every keystroke  Component defined inside another component  All components must be top-level
 Script error, line 0  Triple backticks in Babel script  Use FENCE_RE with String.fromCharCode
 App loads blank, data gone  Validator deleted corrupted data without restoring backup  Auto-restore from _backup key in validator
 Date shows wrong day  `toISOString()` returns UTC  Use getFullYeargetMonthgetDate
 File looks unchanged after update  Cached filename  Always use unique timestamped filenames
 Code corrupted on mobile paste  Pasting raw code from chat (not artifact) garbles characters  Use artifact copy button, not chat copy. File upload also safe
 API key prompt keeps appearing  Key stored without prefix, not in aurora_log_ namespace  This is by design - key is separate
 Pull items sorted wrong  `matchPriority` used `some` instead of `every`  Multi-token categories must use `every` so ALL tokens match. bag ties must not match Snap Ties
 Pull category matches too broadly  Single-word categories like ties or clips  Always use multi-word categories. Use  for aliases (e.g. form clipsfooting clips)

---

## TESTING DATA PROTECTION

When stress-testing the failsafe system, use these console commands

Check data exists
```javascript
console.log(Entries, JSON.parse(localStorage.getItem(aurora_log_entries)).length);
console.log(Backup, JSON.parse(localStorage.getItem(aurora_log_entries_backup)).length);
```

Simulate single corruption (should auto-recover)
```javascript
localStorage.setItem(aurora_log_entries, CORRUPTED{{{);
 Reload - data should survive via backup
```

Simulate double corruption (should show warning)
```javascript
localStorage.setItem(aurora_log_entries, CORRUPTED{{{);
localStorage.setItem(aurora_log_entries_backup, ALSO CORRUPTED{{{);
 Reload - gold warning banner should appear
```

Restore from backup manually
```javascript
localStorage.setItem(aurora_log_entries, localStorage.getItem(aurora_log_entries_backup));
location.reload();
```

---

## SYSTEMATIC DEBUGGING (adapted from Superpowers)

When Damien reports a bug, DO NOT immediately propose a fix. Follow this process

### Phase 1 Understand the Problem
1. Read the symptom carefully - what exactly happens Blank screen Focus loss Data gone Freeze
2. Reproduce mentally - trace through the code to understand what would cause this
3. Check recent changes - what was addedmodified in the latest version The bug is almost certainly there
4. Ask if unclear - one question at a time, don't overwhelm

### Phase 2 Find Root Cause
1. Trace the data flow - for UI bugs, start at the component that broke and trace upward. For data bugs, start at localStorage and trace through loadsave
2. Find working examples - what similar code in the app works correctly What's different
3. Identify the actual cause - not the symptom. Input loses focus is a symptom. NameInput defined inside AIIntake is the root cause.

### Phase 3 Single Fix
1. State the hypothesis - The root cause is X because Y
2. Make ONE change - don't bundle fixes. Don't while I'm here refactor
3. Verify the fix - run the pre-delivery checklist, confirm the specific bug is addressed

### Phase 4 Verify Nothing Else Broke
1. Check all components - did fixing this break something else
2. Test on the mental model of mobile Safari - will this work on Damien's phone

### Red Flags - STOP and Restart Phase 1
- Just try changing X and see if it works
- Proposing multiple fixes at once
- Third fix attempt for the same bug → the approach is wrong, rethink the architecture
- It's probably X without tracing the actual code path

Historical example The NameInput focus bug was fixed multiple times by changing syntax style, removing useCallback, etc. - none worked because nobody traced the root cause (nested component definition). One correct fix (move to top level) solved it permanently.

---

## VERIFICATION BEFORE COMPLETION

Core rule Evidence before claims.

Before presenting ANY file to Damien, Claude MUST

1. Run the pre-delivery checklist script - not skip it, not assume it passes
2. Read the output - every line. Don't glance at it
3. Confirm all checks pass - if ANY say MISSING or WARNING, fix first
4. Verify the specific change landed - grep for the key strings that should be in the new code
5. Only then present the file

### Banned Phrases (without verification)
- This should work
- I've fixed the issue
- All checks pass (without showing the output)
- The NameInput is now top-level (without grepping to confirm)

### Required Verification for Common Changes
 Change  Must Verify
---------------------
 Moved component to top level  `grep -n function ComponentName` shows it outside other functions
 Added failsafe system  grep for `_appMounted`, `showRecoveryUI`, `_backup`, `_dataLost`
 Fixed triple backticks  grep confirms no literal ``` in babel script
 Added new feature  grep for the key functionvariable names
 Changed today()  grep for `getFullYear` not `toISOString`
 Pull priority matching  grep for `catTokens.every` not `catTokens.some`

---

## PLANNING BEFORE CODING

For features that touch multiple parts of the app (not simple one-line fixes), plan before coding

### Step 1 Clarify Intent
- What is Damien trying to accomplish (not what code to write - what workflow problem to solve)
- Ask ONE question at a time if unclear
- Prefer giving options I could do this as A or B - A gives you X, B gives you Y

### Step 2 Break Into Changes
List the specific changes needed
- Which components need new props
- Which new components are needed (remember top-level only)
- What new statestorage keys are needed
- What existing behavior changes

### Step 3 Identify Risks
- Does this touch localStorage keys → backup system must cover new keys
- Does this add a new component → must be top-level
- Does this change the headerlayout → test mental model on small phone screen
- Does this add template literals with special chars → check for Babel issues

### Step 4 Build
Write the complete file incorporating all changes. Don't patch - full clean write.

### When to Skip Planning
- Simple textstyle changes (make the button blue)
- Bug fixes with clear root cause
- Adding a single new field to an existing component
- Damien says just do it - respect his time
