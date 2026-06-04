# EFF-024 - Guest privacy trust messaging

**Status:** Resolved
**Owner:** Wilson / Codex / Claude
**Created:** 2026-05-27
**Updated:** 2026-06-04

## One-line summary

Add concise guest-facing privacy/trust messaging that explains anonymous Pantry, Kitchen, and Cooking Profile setup is stored locally on the browser/device unless the user chooses to link Google.

## Context

During INIT-003 production-gates validation, Wilson noticed that anonymous guests need to revisit Pantry, Kitchen, and Cooking Profile Settings after first setup/cooking so their second Chef It Up attempt can reflect what they actually have. PR #107 adjusted the guest boundary so those Settings edits remain available as browser-local guest profile state while durable cloud persistence stays linked-account only.

Wilson then identified this as a trust feature for new users who are hesitant to try Laica: guest mode lets them experience the product while keeping setup data local to their browser/device until they choose a linked account.

This Effort tracks a later copy/UX pass to surface that privacy benefit somewhere in the app without expanding the current production-gates branch.

## Scope

### In scope

- Audit lightweight locations where the message could help without adding friction, such as the public landing page, guest setup completion, guest Settings hub, account menu, or linked-account prompt copy.
- Add one or two small guest-facing trust cues that explain the local guest-storage model.
- Keep copy precise: guest Pantry, Kitchen, and Cooking Profile settings are stored locally on this browser/device, not in durable linked-account storage.
- Make the distinction between guest mode and linked mode easy to understand: guest is private/temporary/local; linked is durable/portable.
- Validate the final copy in Replit/mobile visual review because this is user-facing trust messaging.

### Out of scope

- Changing the guest persistence architecture.
- Changing durable linked-account persistence, History, Slop Bowl, cleanup memory, taste memory, or next-meal retention boundaries.
- Claiming that Laica never processes user data. Setup scans, recipe generation, cooking steps, and speech/AI features may still send the needed request data through the app/backend/provider flow.
- Writing legal privacy-policy language or making compliance claims without a separate explicit review.
- Adding analytics for guest-to-link conversion; measurement belongs in a separate analytics effort if it becomes urgent.
- Implementing Phase 4 Google promotion/import or Phase 5 anonymous Slop Bowl dry-run.

## Decisions made so far

- Guest Settings local persistence is a product trust benefit, not only a technical compromise.
- The useful user-facing contrast is: guest mode is local and temporary; linked mode is durable and portable.
- Messaging should say `browser/device` or similar precise language rather than implying universal device-wide security or cross-browser persistence.
- Messaging must not overpromise privacy. It can describe storage of guest setup data, but it should not imply that AI/scanning/cooking requests never leave the device.

## Open questions

- Which surface should carry the first version of this message: landing page, guest setup completion, guest Settings hub, account menu, or link prompt?
- Should this appear before setup, after setup, or only when the user opens guest Settings?
- What exact wording feels reassuring without sounding legalistic?
- Should linked-account prompts mention portability explicitly, or only the save/durable-memory benefit?

## Agent checklist

Read EFF-024 before starting any of the following:

- [ ] Changing guest-mode privacy, trust, local-storage, or linked-account copy.
- [ ] Changing public landing page copy that discusses anonymous trial or privacy.
- [ ] Changing guest setup completion, guest Settings hub, or account menu copy.
- [ ] Changing linked-account prompts that contrast guest mode with linked mode.
- [ ] Adding marketing language about whether pantry/kitchen/profile data is local, private, durable, or cloud-saved.

## Resolution criteria

This Effort is `Resolved` when all of the following are true:

1. The chosen guest-facing surface is documented with rationale.
2. Copy clearly explains local guest storage without overclaiming privacy.
3. The implementation preserves guest/local vs linked/durable boundaries from PD-012 and INIT-003.
4. Focused local tests cover any changed rendering or prompt behavior where practical.
5. Replit/mobile visual validation confirms the copy is visible, legible, and not adding friction to guest entry.

## Linked artifacts

- [`PD-012: Public anonymous trial and account upgrade`](../product-decisions/pd-012-public-anonymous-trial-and-account-upgrade.md)
- [`INIT-003: Anonymous Trial and Account Upgrade`](../initiatives/INIT-003-anonymous-trial-and-account-upgrade.md)
- PR #107, INIT-003 production gates

## 2026-05-27 - Created from guest Settings privacy insight

Wilson recognized that browser-local guest Pantry/Kitchen/Profile settings can be framed as a privacy benefit for new users hesitant to try the app. Created this Effort so a later UX/copy pass can surface that benefit deliberately while preserving the exact guest/local and linked/durable boundaries.

## 2026-06-03 - First restrained browser-local copy pass in account promotion

`codex/anonymous-google-promotion` added a narrow copy pass that supported the Effort before merge: the menu header carries the single "Saved on this browser" cue, while Settings menu/screen/toast copy stays concise (`Pantry, kitchen, and cooking profile`) after Wilson's Replit review found repeated "this browser" language too forward. The branch also added sign-up/save-progress CTAs around preserving setup work and a separate Start over action for guests who want to abandon the trial setup. It does not claim provider requests stay local and does not add public privacy-policy language.

Wilson's Replit follow-up accepted the restrained wording at runtime head `e2231be`: the menu-level `Saved on this browser` cue plus concise Settings copy felt better than repeating browser-local language throughout the app. Keep this signal for merge closeout; do not resolve the Effort before the branch merges and final validation is refreshed on the branch head.

## 2026-06-04 - Resolved by PR #126 merge

PR #126 merged as `8282d5193f6eeef50eeecdff9f91bd029bbcd561` and resolves this Effort. The chosen surface is the guest menu header, where `Your kitchen · Saved on this browser` provides one restrained browser-local cue without repeating privacy language throughout Settings. Settings menu/screen/toast copy stays concise, and sign-up prompts focus on preserving pantry/profile work rather than implying the guest has a durable account.

Wilson Replit-validated the copy direction through runtime code head `2a4ae75`: the menu-level browser-local cue plus concise Settings copy felt better and did not add friction. Local tests cover the guest menu/settings rendering and copy expectations in the PR's focused suites. Future privacy/legal language, analytics, or broader public-landing messaging should use PD-012 or a new scoped follow-up rather than reopening this Effort.
