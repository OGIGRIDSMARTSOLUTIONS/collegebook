# CollegeBook — Database & Security Architecture v1.0

Foundation document for the CollegeBook platform: a multi-institution social
network with an institution-isolated digital YearBook. This is the contract
that `schema.prisma`, middleware, and every service must follow. No feature
ships that violates a rule in here.

---

## 1. Scope

This document covers:

1. Prisma schema (source of truth: `backend/prisma/schema.prisma`)
2. ERD (conceptual)
3. Table-by-table data dictionary
4. Institution/tenant isolation model
5. User / Student / Institution relationships
6. Academic Set (cohort) architecture
7. Messaging database architecture
8. Social network database architecture
9. YearBook database architecture
10. RBAC architecture
11. Permission engine
12. Cross-institution access rules
13. Notification architecture
14. Audit-log architecture
15. Indexes & unique constraints
16. Soft-delete strategy
17. Data retention strategy
18. API security model

---

## 2. Core Design Principle

```
COLLEGEBOOK
│
├── TENANT LAYER (Institutions)
│     Institution → Faculty → Department → AcademicSet → Student
│
├── SOCIAL LAYER (cross-tenant, permission-gated)
│     Profiles, Connections, Posts, Comments, Reactions, Feeds,
│     Notifications, Messaging, Groups
│
└── YEARBOOK LAYER (strictly tenant-isolated)
      Institution → YearBook → Sections → Students → Photos
```

`institutionId` is a **security boundary**, not just a foreign key. Every
tenant-owned row carries it, and every query that touches tenant-owned data
must filter by it — enforced in the service layer, never trusted from the
client.

---

## 3. Unique Identity Architecture

Every important entity gets a permanent, prefixed public ID (cuid internally,
exposed with a human-readable prefix for logs/support):

| Entity | Prefix | Example |
|---|---|---|
| Institution | `INST_` | `INST_000001` |
| Faculty | `FAC_` | `FAC_000012` |
| Department | `DEPT_` | `DEPT_000045` |
| AcademicSet | `SET_` | `SET_000125` |
| Student | `STU_` | `STU_001245` |
| User | `USR_` | `USR_009981` |

Internally we use Prisma's `cuid()` as the primary key; the prefixed code is
a separate indexed `code` column used in URLs, logs, and support tooling so
internal IDs are never guessable sequential integers.

---

## 4. User vs Student

Authentication (`User`) is separated from academic identity (`Student`)
because CollegeBook has actors who are not students: institution admins,
moderators, YearBook admins, and eventually alumni/super admins.

```
User (auth)  1 ── 1  Student (academic identity)
User (auth)  1 ── 1  InstitutionStaff (admin identity, future)
```

A `User` row can exist without a `Student` row (e.g. a `SUPER_ADMIN` who
never enrolls anywhere). A `Student` row always requires a `User` row.

---

## 5. Tenant Isolation Model

### 5.1 Tenant-owned data (must always carry `institutionId`)

`Institution`, `Faculty`, `Department`, `AcademicSet`, `Student`,
`Broadcast`, `BroadcastRecipient`, `YearBook`, `YearBookSection`,
`YearBookStudent`, `YearBookPhoto`, `YearBookContent`, `AuditLog`.

### 5.2 Global / cross-tenant data (no single owning institution)

`Post`, `Comment`, `Reaction`, `Connection`, `Conversation`,
`ConversationParticipant`, `Message`, `Notification`, `Group`,
`GroupMembership`.

These are owned by a `User`/`Student` and reference `institutionId`
**denormalized onto the row at creation time** (e.g. `Post.institutionId`)
so institution-scoped feeds and moderation queries don't need a join —
but access control for *cross*-institution interaction is never decided by
that denormalized field alone; it's decided by the Permission Engine (§11).

### 5.3 The rule

> **Never trust institution, set, student, or permission information
> supplied by the frontend.**

The backend always derives tenant context server-side:

```
JWT (userId)
   → Student (institutionId, setId, departmentId, facultyId)
      → Institution (settings, permissions)
         → Permission Engine
            → Requested resource
```

Any endpoint that accepts a body/query field like `institutionId` for
*filtering the current user's own scope* is fine (e.g. an admin picking
which of their own institutions — N/A in V1, single institution per admin).
Any endpoint that would use a client-supplied `institutionId` to determine
**whose data is being written or whose permissions apply** is a security
bug.

### 5.4 YearBook isolation (hard rule)

A student connected to a student from Institution B does **not** gain
YearBook access to Institution B. YearBook access is governed exclusively by:

```
Student.institutionId === YearBook.institutionId
```

checked server-side on every YearBook query — with row-level filtering,
never client-side hiding. Postgres Row-Level Security (RLS) is a Phase 8+
hardening layer, not a substitute for this check.

---

## 6. RBAC Architecture

```
SUPER_ADMIN
 │
 ├── INSTITUTION_ADMIN        (scoped to institutionId)
 ├── INSTITUTION_MODERATOR    (scoped to institutionId)
 ├── YEARBOOK_ADMIN           (scoped to institutionId)
 ├── STUDENT
 └── ALUMNI
```

Rules:

- `SUPER_ADMIN` is a platform-level role (CollegeBook staff only), never
  assigned to institution staff.
- Every non-`SUPER_ADMIN`, non-`STUDENT`/`ALUMNI` role is bound to exactly
  one `institutionId` at the `User`/`Student` level (V1). Multi-institution
  admin accounts are out of scope for V1.
- Role checks are necessary but not sufficient — see §11, permission checks
  also verify tenant scope and relationship state.

---

## 7. Permission Engine

All authorization decisions go through one service
(`services/permission.service.js`), not scattered `if` statements across
controllers.

```js
canViewProfile(viewer, profileOwner)
canMessage(sender, receiver)
canSendCrossInstitutionMessage(sender, receiver)
canViewYearBook(user, yearbook)
canEditYearBook(user, yearbook)
canBroadcast(admin, targetScope)
canCreatePost(user)
canModeratePost(admin, post)
canManageStudents(admin, targetInstitutionId)
```

Final permission = combination of:

```
Institution Policy (crossInstitutionInteraction setting)
   +
Student Privacy Setting (who can message me / view my profile)
   +
Relationship (NONE / PENDING / CONNECTED / BLOCKED)
   +
Blocking (either direction wins)
   +
Platform Policy (global moderation rules)
```

### 7.1 Core permission matrix (V1)

| Action | Same Set | Same Institution | Other Institution |
|---|---|---|---|
| View public profile | Yes | Yes | Permission-gated |
| Send connection | Yes | Yes | Permission-gated |
| Send message | Yes | Permission-gated | Permission-gated |
| View posts | Yes | Yes | Privacy-controlled |
| Comment / Share | Yes | Yes | Privacy-controlled |
| YearBook access | Yes | Institution-controlled | No, by default |
| Institution broadcast | Admin only | Admin only | No |
| Manage students | Admin only | Admin only | No |
| Manage YearBook | YearBook Admin | Institution Admin | No |

### 7.2 Cross-institution interaction levels (institution setting)

`OFF | CONNECTION_ONLY | MESSAGE_AFTER_CONNECTION | MESSAGE_WITHOUT_CONNECTION | FULL_INTERACTION`

### 7.3 Student message-privacy levels (student setting)

`NOBODY_EXCEPT_CONNECTIONS | SET_ONLY | INSTITUTION_ONLY | APPROVED_INSTITUTIONS | EVERYONE`

---

## 8. Prisma Schema (V1 — Phases 1–6)

Source of truth lives in `backend/prisma/schema.prisma`. Summary of models
by domain:

```
AUTH        → User
TENANT      → Institution, Faculty, Department, AcademicSet, InstitutionSetting
STUDENT     → Student, StudentPrivacy
SOCIAL      → Post, Comment, Reaction, Connection, Report
MESSAGING   → Conversation, ConversationParticipant, Message, MessageRead
NOTIFY      → Notification
BROADCAST   → Broadcast, BroadcastRecipient
YEARBOOK    → YearBook, YearBookSection, YearBookStudent, YearBookPhoto, YearBookContent
AUDIT       → AuditLog
```

See §9 for the field-level data dictionary and §14 for the actual ERD.

---

## 9. Data Dictionary (V1 tables)

### `User`
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| email | String | unique, nullable if phone-only |
| phone | String? | unique when present |
| passwordHash | String | bcrypt/argon2 |
| role | Enum(Role) | SUPER_ADMIN / INSTITUTION_ADMIN / INSTITUTION_MODERATOR / YEARBOOK_ADMIN / STUDENT / ALUMNI |
| accountStatus | Enum(AccountStatus) | PENDING / ACTIVE / SUSPENDED / BANNED |
| emailVerifiedAt | DateTime? | |
| lastLoginAt | DateTime? | |
| createdAt / updatedAt | DateTime | |

### `Institution`
`id, code (INST_ prefix, unique), institutionCode (e.g. UNILAG, unique), name, shortName, logoUrl, coverImageUrl, description, colours(json), website, location, crossInstitutionInteraction (Enum), status (ACTIVE/SUSPENDED), createdAt, updatedAt`

### `Faculty` / `Department`
Both carry `institutionId` (FK, indexed) + `name`, `code`. Department also
carries `facultyId`.

### `AcademicSet`
`id, institutionId, departmentId?, name, startYear, endYear, graduationYear?, kind (Enum: ADMISSION_COHORT/GRADUATION_COHORT/CLASS/DEPARTMENTAL/FACULTY/SCHOOL/PROFESSIONAL), status, createdAt`

### `Student`
`id, code (STU_ prefix), userId (FK, unique), institutionId, setId, departmentId?, facultyId?, studentNumber?, firstName, lastName, otherNames?, profilePhotoUrl?, coverPhotoUrl?, bio?, gender?, location?, verificationStatus (Enum: PENDING/VERIFIED/SUSPENDED/GRADUATED/ALUMNI), createdAt, updatedAt`

### `StudentPrivacy`
`id, studentId (FK, unique), whoCanMessage (Enum), whoCanViewProfile (Enum), whoCanViewPosts (Enum)`

### `Post` / `Comment` / `Reaction`
`Post: id, authorId (Student), institutionId (denormalized), body?, images(json[]), linkUrl?, visibility (Enum: PUBLIC/INSTITUTION/SET/CONNECTIONS), createdAt, updatedAt, deletedAt`
`Comment: id, postId, authorId, parentCommentId? (self-referencing, threaded), body, createdAt, deletedAt`
`Reaction: id, postId? , commentId?, studentId, type (Enum: LIKE/LOVE/CELEBRATE/SUPPORT), createdAt` — unique on `(postId, studentId)` and `(commentId, studentId)`.

### `Connection`
`id, requesterId (Student), addresseeId (Student), status (Enum: PENDING/ACCEPTED/REJECTED/BLOCKED), createdAt, updatedAt` — unique on `(requesterId, addresseeId)`.

### `Conversation` / `ConversationParticipant` / `Message`
`Conversation: id, type (Enum: PRIVATE/SET/INSTITUTION/CROSS_INSTITUTION/GROUP), createdAt`
`ConversationParticipant: id, conversationId, studentId, joinedAt, lastReadAt?` — unique on `(conversationId, studentId)`.
`Message: id, conversationId, senderId, body?, attachmentUrl?, createdAt, editedAt?, deletedAt?`

### `Notification`
`id, recipientId (Student), type (Enum: MESSAGE/CONNECTION/COMMENT/LIKE/MENTION/SHARE/INSTITUTION_BROADCAST/YEARBOOK/SYSTEM), payload(json), readAt?, createdAt`

### `Broadcast` / `BroadcastRecipient`
`Broadcast: id, institutionId, authorUserId, title, body, scope (Enum: ALL/SET/DEPARTMENT/FACULTY/CUSTOM), scopeIds(json[]), createdAt`
`BroadcastRecipient: id, broadcastId, studentId, readAt?` — generated at send time via background job.

### `YearBook` / `YearBookSection` / `YearBookStudent` / `YearBookPhoto` / `YearBookContent`
`YearBook: id, institutionId, setId?, year, status (DRAFT/PUBLISHED/ARCHIVED), coverImageUrl?, welcomeMessage?, createdAt`
`YearBookSection: id, yearBookId, kind (Enum: FACULTY/DEPARTMENT/EVENTS/ACHIEVEMENTS/MEMORIES), title, order`
`YearBookStudent: id, yearBookId, institutionId (denormalized, always checked), studentId, photoUrl?, quote?`
`YearBookPhoto: id, yearBookId, sectionId?, url, caption?, uploadedByUserId`
`YearBookContent: id, yearBookId, sectionId, body`

### `AuditLog`
`id, institutionId?, actorUserId, action (String, e.g. DELETE_POST), targetType, targetId, metadata(json), ip?, createdAt`

---

## 10. Notification Architecture

Notifications are written synchronously for low-volume events (comment,
like, connection) and via background job for high-volume fan-out
(broadcasts to thousands of students — see §"Background Jobs" below).

Unread counts are maintained as denormalized counters (`unreadMessages`,
`unreadNotifications`) updated on write, not recomputed by scanning the
table on every page load. Redis is introduced in Phase 8 to offload this
further.

---

## 11. Audit-Log Architecture

Every admin-privileged action is logged: `LOGIN, LOGOUT, CREATE_STUDENT,
UPDATE_STUDENT, DELETE_STUDENT, CREATE_BROADCAST, PUBLISH_YEARBOOK,
DELETE_YEARBOOK_CONTENT, SUSPEND_USER, DELETE_POST, ...`

Audit logs are **append-only** — no update or delete endpoint ever touches
`AuditLog`. Retained indefinitely in V1 (see §13 retention).

---

## 12. Indexes & Unique Constraints (minimum set)

- `User.email` unique, `User.phone` unique (nullable-safe)
- `Institution.institutionCode` unique
- `Student.userId` unique
- `Student(institutionId, studentNumber)` unique composite (when studentNumber present)
- `Connection(requesterId, addresseeId)` unique
- `ConversationParticipant(conversationId, studentId)` unique
- `Reaction(postId, studentId)` unique, `Reaction(commentId, studentId)` unique
- `YearBookStudent(yearBookId, studentId)` unique
- Foreign-key indexes on every `institutionId`, `studentId`, `authorId`,
  `conversationId`, `postId` column (Prisma adds these by default on
  relation fields — verified explicitly in the schema, not assumed).

---

## 13. Soft-Delete & Data Retention Strategy

- **Soft-deleted** (via `deletedAt` timestamp, hidden from normal queries
  but retained for moderation/audit): `Post`, `Comment`, `Message`.
- **Hard-deleted**: `Connection` cancellations, expired sessions.
- **Never deleted**: `AuditLog`.
- Suspended/banned `User` rows are retained with `accountStatus` changed,
  not deleted, to preserve referential integrity of posts/messages/YearBook
  entries they authored.
- YearBook content, once published, is archived rather than deleted when a
  set/year is retired.

---

## 14. Initial ERD (conceptual)

```
User ──1:1── Student ──N:1── Institution
                │              │
                │              ├──1:N── Faculty ──1:N── Department
                │              ├──1:N── AcademicSet
                │              ├──1:N── Broadcast ──1:N── BroadcastRecipient
                │              └──1:N── YearBook ──1:N── YearBookSection
                │                                 ├──1:N── YearBookStudent
                │                                 └──1:N── YearBookPhoto
                │
Student ──1:N── Post ──1:N── Comment (self-referencing parentCommentId)
Student ──1:N── Reaction
Student ──N:N── Connection (requester/addressee, self-referencing via two FKs)
Student ──N:N── ConversationParticipant ──N:1── Conversation ──1:N── Message
Student ──1:N── Notification
```

---

## 15. API Security Model

1. **Authentication**: httpOnly, `Secure`, `SameSite=Lax` (or `None` if
   cross-subdomain) JWT cookie. Access token short-lived (15 min), refresh
   token longer-lived (7–30 days) rotated on use.
2. **Authorization**: every protected route runs
   `authenticate → loadStudentContext → checkPermission` middleware chain.
   `loadStudentContext` attaches `req.context = { userId, studentId,
   institutionId, setId, role }` derived server-side from the DB, never
   from the request body.
3. **Tenant isolation middleware**: any route under `/api/admin/*` or
   institution-scoped routes additionally runs a
   `requireInstitutionScope(paramInstitutionId)` check that compares
   `req.context.institutionId === resource.institutionId` before any
   write.
4. **Input validation**: schema-validated request bodies (zod/Joi) on every
   mutating route.
5. **Rate limiting**: per-IP and per-user, tighter on `/auth/*` and
   `/broadcasts`.
6. **File upload validation**: MIME-type allow-list, size caps, Cloudinary
   signed uploads (never raw client-side unsigned uploads to production
   folders).
7. **CSRF**: mitigated via `SameSite` cookie + custom header check on
   state-changing requests, since we use cookie-based auth.
8. **Audit logging**: as above — every admin mutation is logged
   server-side, not client-reported.

---

## 16. Development Phases (reference)

Phase 1 (this build): Auth, Users, Institutions, Faculties, Departments,
AcademicSets, Students, Roles/Permissions skeleton.
Phase 2+: Profiles, Social, Messaging, Notifications, YearBook, Advanced
Social, Scale — per the original architecture discussion.

---

*This document is the contract. If a future feature needs to break a rule
here (e.g. relax tenant isolation for a "verified alumni network" feature),
that's a deliberate architecture decision requiring an update to this file
first — not a silent exception in code.*
