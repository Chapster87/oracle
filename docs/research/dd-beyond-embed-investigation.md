# Research: D&D Beyond Character Sheet Embedding

## 1. Iframe Embedding

- **Status:** Not officially supported.
- **Constraints:** D&D Beyond's `Content-Security-Policy` and site architecture are not designed for iframes.
- **UX Issues:** High risk of broken layouts, scroll hijacking, and poor responsive behavior. Heavy JS initialization makes iframes brittle in this context.

## 2. Authentication & Privacy

- **Requirement:** Character must be set to **Public** for any external visibility.
- **Private Sheets:** These require a valid session cookie (`cobalt-token`), which is difficult and insecure to proxy through a third-party web app.

## 3. Data Integration (API)

- **Official API:** None exists for public use.
- **Unofficial JSON Endpoint:** `https://character-service.dndbeyond.com/character/v2/character/<ID>` provides the raw data if the character is public.
- **Effort:** High. Building a custom renderer to match the D&D Beyond look and feel is out of scope for the current effort.

## 4. Comparison: Embed vs. External Link

| Feature         | Iframe Embed             | External Link (New Tab)   |
| --------------- | ------------------------ | ------------------------- |
| **Reliability** | Low (Breaks easily)      | 100% (Native experience)  |
| **Mobile UX**   | Poor (Double scrollbars) | Great (Native responsive) |
| **Auth**        | Complex/Failing          | Handled by DDB            |
| **Development** | Moderate (CSS fixes)     | Trivial                   |

## 5. Recommendation

Adopt the **"Link-First"** approach.

1. Provide a clear, prominent button/link that opens the D&D Beyond character sheet in a new tab.
2. For the Oracle interface, focus on displaying high-level "Quick Stats" (HP, AC, Level, Class) fetched via the unofficial JSON endpoint (if public) or manually entered in Supabase, rather than trying to embed the entire heavy sheet.
