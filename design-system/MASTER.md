# HEY Design System

HEY is a mobile-first AI office app where the user talks with `代理おぴよ`, a proxy AI companion that coordinates specialist AIs. The main visual metaphor is a small cozy workspace where AI characters are visibly working. The secondary metaphor is a LINE-like conversation where those characters leave messages and reports.

## Principles

- Mobile-first: every primary screen must work comfortably around 390px wide.
- Warm but clean: use soft neutral surfaces, readable text, and one clear accent.
- Friendly but not childish: character presence is welcome, but avoid toy-like clutter.
- The user should always know where to look and what to press next.
- User-facing copy is short, natural Japanese.
- Do not make the app feel like a corporate analytics dashboard.
- The center experience is the Agent Room / Proxy workspace, not a dashboard home.

## Color Tokens

- `--hey-bg`: `#f7f3ed` page background.
- `--hey-room-bg`: `#62c65d` agent workspace background.
- `--hey-chat-bg`: `#e9eef1` LINE-like chat background.
- `--hey-surface`: `#fffdf8` primary surface.
- `--hey-surface-strong`: `#ffffff` high-contrast cards and chat bubbles.
- `--hey-line`: `#e8ded0` borders and dividers.
- `--hey-text`: `#25211b` primary text.
- `--hey-muted`: `#746b61` secondary text.
- `--hey-soft`: `#f0e8dc` quiet neutral fills.
- `--hey-accent`: `#06c755` the only UI accent color.
- `--hey-accent-strong`: `#058f3f` pressed or high-emphasis accent.
- Character body colors may use small fixed illustration colors, but UI controls, states, and highlights should use the accent token only.

## Typography

- Base font: system sans-serif with Japanese fallback.
- Page title: 24px, bold, line-height 1.25.
- Section title: 16px, bold.
- Body: 14px, line-height 1.7.
- Supporting text: 12px to 13px, line-height 1.6.
- Avoid negative letter spacing and viewport-based font scaling.

## Spacing

- Page horizontal padding: 16px.
- Screen gap: 16px to 20px.
- Card padding: 16px.
- Compact control gap: 8px.
- Keep repeated lists dense enough to scan, but never cramped.

## Border Radius

- Standard cards: 8px.
- Chat bubbles: 18px with one tighter corner to suggest direction.
- Pills and primary action buttons: full radius.
- Character illustration shapes can be fully rounded.

## Cards

- Use cards for repeated items, reports, and framed tools only.
- Card background: `--hey-surface-strong`.
- Border: `1px solid var(--hey-line)`.
- Shadow: subtle and low contrast.
- Avoid nesting cards inside cards. Use rows or neutral bands inside a card instead.

## Buttons

- Primary: accent background, white text.
- Secondary: white or neutral background, text color primary.
- Ghost: transparent with clear focus/hover state.
- Minimum tap target: 44px.
- Every interactive element needs a visible focus ring.
- Labels should say the next action: `代理モードを開く`, `次の作業を見る`, `OKする`.

## Chat Bubbles

- User bubbles: right side, accent background or white action outline depending on context.
- 代理おぴよ bubbles: left side, white background, primary text, with small character icon.
- Specialist AI reports: left side, card-like bubble with a small title and role label.
- The talk log is a persistent work record, not a temporary modal.
- Chat screens should have calm empty space, a date pill, quick action buttons near the lower right, and a bottom message composer.

## Character Workspace

- Show a full-screen cozy workspace area for the main Agent Room.
- Always show HP above the character’s head.
- HP means available AI usage internally, but copy should feel like stamina.
- Low HP copy should say the character is tired, e.g. `ちょっと疲れてきたから、今日は軽めの作業にするね`.
- Work spots should be short and recognizable: `タスク棚`, `カレンダー`, `メモ机`, `調査室`, `デザイン机`, `記事机`, `確認待ち`.
- Specialist stations must include a small desk/work area, character placeholder, speech bubble, name label, HP indicator, and status label.
- Required specialist labels: `デザイナーAI ミドリ`, `リサーチAI モコ`, `ライターAI パチ`, `ナレッジAI スッキリ`.
- Keep a visible `今日のタスク` board in the workspace.
- Use small CSS transitions only. Avoid heavy animation libraries.

## Temporary Art Assets

- Current temporary art assets live in `/image`.
- Use `lib/workspace-assets.ts` as the single source of truth for workspace art mapping.
- Asset slots:
  - `proxyCharacter`: main `代理おぴよ` character.
  - `workspaceBackground`: grass / room background for the Agent Room.
  - `workstationDesk`: shared specialist desk / computer station.
  - `specialistCharacters.designer`: `デザイナーAI ミドリ`.
  - `specialistCharacters.research`: `リサーチAI モコ`.
  - `specialistCharacters.writer`: `ライターAI パチ`.
  - `specialistCharacters.knowledge`: `ナレッジAI スッキリ`.
- Preserve transparent PNG backgrounds with `object-contain`; do not stretch character art.
- If a specialist lacks unique artwork, reuse the closest existing asset temporarily and document that in the asset config.
- Future replacement should only require changing imports in `lib/workspace-assets.ts`.
- Character placement should keep labels, HP badges, and speech bubbles readable on a 390px-wide mobile screen.
- Background art may cover the workspace, but important characters must not depend on exact background details for readability.

## Mobile App Shell

- Main app pages should feel like an iPhone-sized app.
- Use a top safe area/status area where appropriate.
- Use a stable main content area, a bottom message composer, and a five-tab bottom navigation.
- Bottom tabs are: Chat, Tasks, Proxy, Calendar, Reports.
- The center Proxy tab is visually emphasized as the main Agent Room button.
- Avoid desktop-style page chrome on the core Chat and Proxy screens.

## Bottom Navigation

- Fixed bottom navigation on mobile.
- Use five short tab labels: Chat, Tasks, Proxy, Calendar, Reports.
- Active item uses the accent color.
- Inactive items use muted neutral text.
- Keep the height stable and respect safe-area padding.
- Center Proxy tab uses a larger circular affordance.

## Empty States

- Never leave blank areas.
- Explain what is empty in one sentence.
- Give one concrete next action.
- Tone should be calm: `まだありません。チャットで依頼すると、ここに追加されます。`

## Accessibility

- Text contrast must be readable on mobile.
- All controls need keyboard focus styling.
- Do not rely on color alone for status.
- Keep tap targets at least 44px high where possible.
- Use semantic headings and buttons.

## Do Not Do

- Do not use purple/blue SaaS gradients.
- Do not use multiple accent colors for UI state.
- Do not make dense admin dashboards.
- Do not use large dashboard cards as the first impression of the product.
- Do not show technical implementation language to end users.
- Do not auto-execute external sending, publishing, payment, deletion, or irreversible actions.
- Do not block progress for minor unknowns; make safe assumptions and continue.
