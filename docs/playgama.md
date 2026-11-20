# Relict Swarm — Playgama release

## Release contents

The **Playgama** build is separate from the GitHub Pages, Yandex and CrazyGames editions.

- Source branch: `playgama-integration`
- Automated release: **Actions → Playgama build and QA → latest successful run → Artifacts → RelictSwarm-Playgama**
- GitHub Actions artifact contains **RelictSwarm-Playgama.zip**, which is the uploadable game archive.
- ZIP root: `index.html`, `playgama-bridge-config.json`, `privacy.html`.
- Build locally: `npm test`; archive just the contents of `dist/playgama/` (not the parent directory).

## Integration behavior

- Loads Playgama Bridge JS Core synchronously as the first script in `<head>`, waits for `bridge.initialize()` and restores progress from Bridge Storage before the game bundle starts.
- Saves permanent progress, currency, skins, settings, graphics quality and orientation in Bridge Storage. Errors during startup do **not** silently reset existing cloud saves.
- Supports Russian and English localization according to `bridge.platform.language`; unsupported locales fall back to English.
- Sends `game_ready` after the main menu becomes interactive.
- Reacts to platform pause and audio state changes; gameplay and sound stop during ads and when backgrounded.
- Requests interstitial ads after the result screen of each completed/abandoned run. Bridge controls frequency. A free card reroll stays available; an optional rewarded card reroll is granted **only** on SDK `rewarded` confirmation. Reward controls are hidden if not supported by the platform.
- Uses **P** to pause, not Escape, because Escape is reserved by the browser/fullscreen on Playgama.
- Does **not** include our Cloudflare telemetry scripts and does not persist internal balance diagnostics through localStorage. Runtime balance mechanics remain unchanged.
- Commercial audio bank content is unchanged; existing sounds are retained.

## Playgama catalog metadata

**Title:** Relict Swarm

**Engine:** Plain JS

**Genre:** Action, Arcade, Roguelite, Survival

**English short description:**
> Survive a relentless mechanical swarm in a fast-paced, top-down roguelite. Build an arsenal of automated weapons, fuse them into devastating combinations, battle powerful bosses and unlock permanent upgrades and unique robot skins.

**English how to play:**
> Survive for 15 minutes and defeat the enemies that surround your robot. Move with WASD or the arrow keys, press Space to dash, F to open the Fusion Lab, and P to pause. Weapons fire automatically. Collect data to level up and choose upgrades. Defeat fusion bosses to obtain fusion cores, then combine compatible weapons. On mobile, move with the floating touch joystick and tap the dash button.

**Russian short description:**
> Выживи против механического роя в динамичном рогалике с видом сверху. Собирай автоматическое оружие, объединяй его в мощные комбинации, побеждай боссов и открывай постоянные улучшения и облики робота.

**Russian how to play:**
> Продержись 15 минут и побеждай врагов вокруг робота. Управление на ПК: WASD или стрелки для движения, пробел для рывка, F для лаборатории синтеза, P для паузы. Оружие атакует автоматически. Собирай опыт и выбирай улучшения. Побеждай боссов синтеза, получай ядра и объединяй совместимое оружие. На телефоне используй плавающий джойстик и кнопку рывка.

**Supported devices:** Desktop, Android, iPhone/iPad (HTML5 mobile web). Both portrait and landscape are supported by responsive layout; fullscreen on iOS is managed by the browser/host.

**Languages:** English, Russian (Playgama locale mapping).

## QA before public submission

1. Upload the inner `RelictSwarm-Playgama.zip` to the Playgama game draft.
2. Run the **Test Game / QA** checker. Confirm game loads without any console error or stalled screen.
3. Test fresh launch, menu, a full 15-minute run and several short deaths/abandonments, pause/resume, background/foreground and rotate.
4. Confirm storage survives browser reload, orientation change, ad completion and returning to the game. Check English and Russian language from the host.
5. Confirm interstitial requests are restricted to the end of a run, gameplay/music freeze during ads, and rewarded reroll is only granted for `rewarded` (not `closed` or `failed`).
6. Test at least Chrome desktop, Firefox desktop, Chrome Android, and Safari iOS, including square/portrait/landscape game viewports. Device-specific fullscreen behavior requires real device testing.
7. Attach appropriate media and confirm all third-party audio/asset package use satisfies its original license terms.

## Known validation boundaries

Automated GitHub Actions tests verify the build, mock SDK interactions, storage paths and game logic. They **cannot** certify real advertising supply, platform account settings, native mobile fullscreen behavior, complete localization coverage or Playgama's QA/moderation verdict. Real in-platform QA must happen prior to public submission.

## Developer notes

Official SDK: https://wiki.playgama.com/playgama/bridge-sdk/getting-started
Required steps: https://wiki.playgama.com/playgama/bridge-sdk/api
Submission: https://wiki.playgama.com/playgama/submitting-a-game
