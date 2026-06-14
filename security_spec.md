# Security Specification - MailMind AI

## Data Invariants
1. A Template must belong to a user and cannot be accessed by others.
2. A Broadcast history record must be owned by the user who sent it.
3. AutoReply settings are private to the user.
4. AI Logs are private to the user.

## The Eight Pillars Evaluation
1. **Master Gate**: All collections are top-level but keyed by userId or in sub-paths that can be verified.
2. **Validation Blueprints**: `isValidTemplate`, `isValidBroadcast`, `isValidSettings`, `isValidLog`.
3. **Path Variable Hardening**: `isValidId` for all document IDs.
4. **Tiered Identity**: Only the owner can read/write their own data.
5. **Total Array Guarding**: Tags in templates and keywords in settings will be size-limited.
6. **PII Isolation**: Recipient emails in logs/broadcasts are protected by owner-only read rules.
7. **Atomicity**: N/A for this simple schema.
8. **Secure List Queries**: `allow list: if resource.data.userId == request.auth.uid`.

## Roles
- **Owner**: `request.auth.uid == userId`

## Operations
- **Templates**: Create, Read, Update, Delete by owner.
- **Broadcasts**: Create, Read by owner.
- **Settings**: Read, Write by owner.
- **Logs**: Read, Create by owner (AI engine acting as user).
