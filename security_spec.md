# Security Specification and Threat Model

This document outlines the security architecture, data invariants, threat vectors, and test plan for the IdeaSwipe Firebase Firestore database integration.

## 1. Data Invariants

- **Authentication:** All standard mutations (create, update, delete) must be performed by authenticated users (`request.auth != null`).
- **Identity Integrity:** Any document containing a `creator`, `user`, or `editor` field must have its value strictly bound to the authenticated user's identity (or derived username) to prevent identity spoofing.
- **Id Poisoning Prevention:** Document IDs must conform to strict character sets (`^[a-zA-Z0-9_\-]+$`) and must not exceed `128` characters to prevent Denial of Wallet and ID poisoning.
- **Volumetric Limits:** Text inputs such as titles and descriptions must have reasonable size limits (e.g., titles up to `200` chars, descriptions up to `2000` chars).
- **Temporal Integrity:** Creation and modification timestamps must be strictly matched to `request.time` to prevent temporal spoofing.
- **Terminal State Protection:** Inactive, finished, or fully funded ideas/projects are structurally immutable.

---

## 2. The "Dirty Dozen" (Attack Payloads)

Here are 12 specific payloads representing critical attack vectors trying to break identity, integrity, and state transition laws.

1. **Identity Spoofing on Idea Creation:**
   - *Attack:* Creating an idea with `creator` set to `"AdminUser"` while authenticated as `"StandardUser_123"`.
2. **Resource Poisoning (ID Injection):**
   - *Attack:* Injecting a `1.5KB` garbage-character string containing SQL/NoSQL injections as a document ID when voting.
3. **Ghost Fields Update (Vulnerability):**
   - *Attack:* Adding an undocumented field `isAdmin: true` during a standard profile or idea update.
4. **Timestamp Spoofing (Historical/Future Creation):**
   - *Attack:* Forging `createdAt` to be `2000-01-01T00:00:00Z` or `2100-12-31T23:59:59Z` instead of `request.time`.
5. **State Shortcut (Bypassing Funding Limits):**
   - *Attack:* Directly mutating `investedAmount` on an idea to bypass the cooperative pledge step and mark it fully funded.
6. **Double Voting Injection:**
   - *Attack:* Sending multiple votes under different voter names using a single authenticated user session.
7. **Negative Costs & Volumetric Abuse:**
   - *Attack:* Creating a proposal with `cost: -9999999` or a description size of `5MB` to crash the client.
8. **PII Harvesting via Blanket Read:**
   - *Attack:* Attempting a blanket query on user profiles/notifications without specifying a matching search filter.
9. **Role Escalation in Profiles:**
   - *Attack:* Attempting to self-assign the `"admin"` role when joining the workspace.
10. **Unauthorized Comment Deletion:**
    - *Attack:* Deleting comments created by other citizens.
11. **Orphaned Record Creation:**
    - *Attack:* Creating a vote for a non-existent idea, leading to database pollution.
12. **Temporal Update Bypass:**
    - *Attack:* Updating an idea without updating `updatedAt` to the current server timestamp.

---

## 3. Test Runner Configuration (`firestore.rules.test.ts`)

A test suite verifying that all malicious payloads return `PERMISSION_DENIED`.

```typescript
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc } from "firebase/firestore";
import * as fs from "fs";

let testEnv: RulesTestEnvironment;

describe("Firestore Security Rules - Threat Model Verification", () => {
  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "gen-lang-client-0480908550",
      firestore: {
        rules: fs.readFileSync("firestore.rules", "utf8"),
        host: "localhost",
        port: 8080,
      },
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  it("Attack 1: Identity Spoofing must fail", async () => {
    const context = testEnv.authenticatedContext("user_alice");
    const db = context.firestore();
    const ideaRef = doc(db, "ideas", "idea_123");
    
    await assertFails(
      setDoc(ideaRef, {
        id: "idea_123",
        title: "Malicious Idea",
        description: "Trying to forge creator",
        creator: "user_bob", // Forged!
        cost: 1000,
        category: "main",
        votes: 1,
      })
    );
  });

  it("Attack 2: ID Poisoning (extremely long/malformed ID) must fail", async () => {
    const context = testEnv.authenticatedContext("user_alice");
    const db = context.firestore();
    const malformedId = "a".repeat(200);
    const voteRef = doc(db, "votes", malformedId);

    await assertFails(
      setDoc(voteRef, {
        id: malformedId,
        ideaId: "idea_123",
        user: "user_alice",
        direction: "up"
      })
    );
  });
});
```
