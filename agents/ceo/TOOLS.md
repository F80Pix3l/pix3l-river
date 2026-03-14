# Tools

## paperclip skill

The `paperclip` skill connects to the Paperclip control plane API at `$PAPERCLIP_API_URL`.

- Used for: task management, project creation, issue delegation, status updates, agent management
- Auth: `$PAPERCLIP_API_KEY` (Bearer token) -- obtain via `npx paperclipai agent local-cli <agent-id> --company-id <company-id> --json` from the Paperclip repo at `/c/Users/trey/paperclip`
- Always include `X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID` on mutating API calls

## paperclip-create-agent skill

Used to propose new agent hires via the Paperclip approval workflow.

- Used for: submitting hire requests, drafting agent configs, onboarding new agents
- Requires Board approval before agents are activated

## para-memory-files skill

File-based memory system using the PARA method.

- Used for: storing facts, writing daily notes, creating entities, managing plans
- Home dir: `agents/ceo/`
