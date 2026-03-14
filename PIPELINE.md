# Aurora Log Development Pipeline

## Roles

### Bob (Manager)
- Makes executive decisions on task routing
- Small fixes (< 30 sec): does it directly
- Big features: delegates to Clair
- Deploys all changes
- Pushes Billy's ideas to dashboard

### Clair (Builder)
- Handles big features and complex code changes
- Reads files directly from workspace (inherits access)
- Uses persistent sessions for follow-up fixes
- Gets clear task descriptions, finds her own context in the codebase

### Billy (Creative Consultant + System Architect)
- Brainstorms feature ideas for the Ideas dashboard
- Reviews WORKFLOW/SYSTEM changes (not UI tweaks, not line-by-line code)
- Theorizes about what to add or improve
- NOT a code reviewer for routine changes

## Decision Tree

```
Change requested
  |
  ├─ Small fix (< 30 sec, clear solution) → Bob does it directly
  |
  ├─ Big feature / complex change → Clair builds it
  |     |
  |     ├─ Changes workflow or system logic? → Billy reviews + theorizes
  |     |     |
  |     |     ├─ Billy finds bugs → Clair fixes (persistent session)
  |     |     └─ Billy has ideas → Bob pushes to dashboard Ideas
  |     |
  |     └─ UI-only change → Bob deploys directly
  |
  └─ Creative brainstorm needed → Billy generates ideas → dashboard
```

## Models
- Bob: Opus (main session, full reasoning)
- Clair: Sonnet (anthropic/claude-sonnet-4-20250514) — cheaper, handles code tasks fine with good specs
- Billy: Sonnet — brainstorming and architecture don't need Opus

## Context Handoff
- Clair and Billy READ FILES DIRECTLY from workspace
- No manual copy-pasting code into prompts
- Task prompts describe WHAT to do, agents find their own context
- Persistent sessions for Clair so follow-ups don't cold-start

## Status Tracking
- Active work in status.json (aurora-log-data repo)
- Billy's ideas in recommendations.json (aurora-log-data repo)
- Both visible on dashboard
