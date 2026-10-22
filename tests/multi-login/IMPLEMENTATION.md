# Multi-login implementation status

## Delivered (isolated feature branch)
- `auth/multi-login.js` opt-in adapter for Google, email/password, Microsoft OAuth and password reset.
- Username login requires an injected server-side resolver; no insecure public Firestore lookup.
- Existing `app.js`, `index.html`, `firestore.rules` and production configuration remain unchanged.

## Blocked pending secure setup
- Create a separate Firebase test project and synthetic test users.
- Enable email/password and Microsoft provider in test Authentication settings.
- Implement a rate-limited server-side username resolver with anti-enumeration safeguards.
- Add UI integration after tests, keeping existing Google entry as fallback.
- Run Firebase emulator tests for Firestore and actual browser authentication.

Do not merge into `main` or enable production providers until integration tests pass.
