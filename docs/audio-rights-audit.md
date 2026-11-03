# Relict Swarm audio rights audit — 2026-11-03

## Commercial release status: NOT CLEARED

The developer requested that the original music and effects be restored temporarily because the procedural replacement did not meet sound quality expectations.

### Restored audio and source

- `src/modules/30-audio/embedded-bank.js` restores the historical approximately 3.5 MB encoded recording bank from Git commit `0fbc0e6dc1601513fb1176135e0508be3d0a254c`.
- `src/modules/30-audio/engine/playback.js` restores historical Web Audio decoding and menu/combat track playback from the same commit.
- `src/modules/30-audio/engine/mixer.js` restores the audio controls and sound previews.
- The procedural audio experiment is still available in Git history (PR #25), but is no longer the runtime soundtrack.
- The game continues to offer music and sound-effects volume controls.
- **Passing automated tests does not prove rights to these recordings.**

### Unresolved rights

The audio bank previously contained 55 embedded recordings, including superseded versions, with 44 named sound identifiers. Sources, authors and licenses for the current samples are not documented in the repository. The filename of a sound is not proof of permissions. In particular the earlier mine spawn sound was associated with an unverified Freesound/Pixabay filename, which does not confirm the exact recording's license.

Before any ad-supported or otherwise commercial release, each remaining sound requires proof of source, author, license/version, download date, commercial-game redistribution permission and attribution obligations. Any file without suitable permission must be replaced and removed from the release package. Samples with CC BY-NC licensing cannot be used in a commercial edition without additional authorization.

### Plan

1. Search for suitable free sci-fi music/SFX packages with explicit compatible licensing (including individual Unity Asset Store EULAs).
2. Keep a ledger for each selected track, author, original link, license and credit obligations.
3. Replace the original recordings gradually, keeping the gameplay logic intact and auditioning each result.
4. Remove old/unused recordings from shipped HTML. Run playback, performance and accessibility checks before marking the release cleared.

Freesound licensing guide: https://freesound.org/help/faq/

**Do not describe this build as royalty-free, CC0, fully licensed or commercially cleared.**
