# Bau Cua Vui

Bau Cua Vui is an interactive cultural and probability web prototype built around the Vietnamese Tet tabletop game of bau cua tom ca. Every round runs strictly on virtual coins (no real-money deposits, bets, or cash withdrawals). Live hosted demo: https://buiminhtien0707.github.io/

## Running Offline

1. Unzip or clone the project folder.
2. Open `HomePage.html` (or `index.html`) directly in any modern browser.
3. Optional local server check from the `site/` folder:

```bash
python3 -m http.server 8000
```

All dependencies (Bootstrap v5.3.3, 21 WOFF2 font files plus `fonts.css`, and SVG/PNG mascot artwork) are bundled locally under relative paths, so offline browsing behaves identically to GitHub Pages.

## Pages Included

- `HomePage.html`: Entry redirect into `index.html`.
- `index.html`: Introduction, interactive 30-second play preview, six-animal carousel, and FAQ accordion.
- `play.html`: Chip bar (`10`, `50`, `100`, `500`), `3x2` animal board (`max 500 coins/cell`), shakeable crock reveal, `?` rules popup, and sample rankings.
- `learn.html`: Learning mastery tracker, interactive Payout Sandbox calculator, filterable six-animal cultural guide, comparison table against Hoo Hey How, and an 8-question coin quiz.
- `lab.html`: Client-side Monte Carlo simulator (`100` or `1,000` rounds, `1` vs `3` cell strategy) with dual HTML5 Canvas charts demonstrating the long-term `-7.87%` house edge.
- `tet.html`: Six-scene cultural timeline, zero-gambling note, and validated feedback form.

## Key Prototype Behaviors

- **Guest Play & Coin Pouch**: Starts offline in Guest mode via `localStorage` (`bc_state_v1`). Players can claim a 7-day Daily Check-In streak (`2,000` base coins plus `+100` coins per consecutive streak day) or top up anytime using the unlimited `+500 coins (demo)` button.
- **Account Preview (`Coming Soon`)**: Clicking `Sign in` opens a UI preview (`Full Name`, `Email`, `Phone`, `Password`) that clearly indicates backend storage is not connected in this prototype.
- **Trilingual Support**: Live switching between Vietnamese (`VN`), English (`EN`, using unaccented Vietnamese cultural terms for clarity), and Simplified Chinese (`ZH`), persisted locally.
- **Web Audio & Canvas**: Synthesized sound cues (`js/audio.js`) and Monte Carlo charts (`js/lab-charts.js`) run purely through browser APIs without external media files or charting libraries.

Note: All coins and leaderboard scores are virtual and exist solely for classroom evaluation and numeracy exploration.
