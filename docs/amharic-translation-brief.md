# SVH SpeakUp Amharic Translation Brief

This file is for the human translator who will review or rewrite the Amharic copy for the reporter-facing SVH SpeakUp portal.

## Files to use

- Translate: `docs/amharic-translation-template.tsv`
- Fill only the `amharic_translation` column.
- Leave the `key`, `section`, `context`, and `english_source` columns unchanged.

## Translation guidance

- Use clear, professional Amharic suitable for a confidential ethics/reporting portal.
- Keep the tone calm, respectful, and easy to understand for non-technical users.
- Preserve all placeholders exactly, including braces. Examples: `{count}`, `{caseId}`.
- Do not translate product or system names unless the context clearly requires it. Examples: `SVH`, `SVH SpeakUp`, `Dataverse`, `CEO`, `IT`, `MB`.
- Keep email examples unchanged. Example: `name@example.com`.
- If an English phrase is too direct or unnatural in Amharic, translate the meaning rather than the word-for-word structure.
- If a phrase is unclear, add a short note in the `translator_notes` column.

## Important context

- Reporters may be anonymous and may fear retaliation.
- The portal creates a case ID and secret; these are used to track the report later.
- "Presidential escalation" means the report may need direct attention from the President because normal channels may not be safe, effective, or appropriate.
- Category labels come from Dataverse. The translated labels are display-only; the app still submits the original category IDs.

When the translation is complete, send back the completed `docs/amharic-translation-template.tsv` file here or place it in the project folder and tell Codex where it is.
