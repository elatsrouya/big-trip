# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: plain static HTML/CSS/JS (ES modules, no build step), hosted on GitHub Pages from the `big-trip` repo, installable to the iPhone home screen (web app manifest + service worker). Chosen because it deploys by pushing files, needs no toolchain to maintain, and runs fully client-side.

## Users

Elad (20), finishing army service, planning the classic Israeli post-army backpacking trip in Asia. He uses the app on his iPhone (18 Pro), both months ahead while planning and saving, and during the trip itself, often on weak or no connectivity. Hebrew speaker; the whole interface is Hebrew, right-to-left.

## Product Purpose

A personal trip-planning hub for one traveller: decide where to go and in what order, see when each place is in season, track savings against the budget, discover destinations and attractions, and work through the preparation checklist on time. Success: Elad plans the trip himself in the app, and keeps opening it on the road.

## Positioning

Built for one specific trip and one person, in Hebrew, around the Israeli post-army trip reality (Israeli-passport visa rules, countries closed to Israelis, savings targets in shekels, prep timeline before flying), rather than a generic travel app.

## Operating Context

- Mostly one-handed phone use, opened from the home screen like a native app.
- Planning phase: about a year before release, flight roughly 6 to 12 months after release; trip budget about 50 to 70 thousand NIS.
- On the trip: hostels, buses, patchy mobile data.
- Focus region: Southeast Asia first, plus India, Nepal, Sri Lanka, Japan, Mongolia, China, South Korea, Taiwan, Kyrgyzstan, Uzbekistan.

## Capabilities and Constraints

- Pages: Home (countdown to flight, trip summary, savings, next destination), Route (detailed map, filter all recommendations vs. my route, route details, manual reordering, no "clear route" action), Calendar, Discover (filter by destination and category, map view, TikTok-style vertical feed with save and add-to-route), Budget (flights, hostels, food, attractions, insurance, gear, each drill-down), Countries (overview, attractions, people, seasons, short history), Prep (tasks by recommended timing).
- Images and place details are loaded live from other sites (Google Maps Platform where budget allows, Wikipedia / Wikimedia Commons otherwise); nothing has to be pre-downloaded.
- Google Maps Platform usage must stay inside Google's free monthly caps: hard client-side daily limits, restricted API key, quotas, budget alert. When a limit is reached the app falls back to free sources (OpenStreetMap-based map, Wikimedia images).
- Personal data (route, savings, ticks, saved items) lives on the device; the repo is public, so no personal data in code.
- Lots of recommendations per destination across categories (food, attractions, hostels, views, treks, experiences), not three per place.
- Previous version exists as a Claude artifact; its route/savings data must be importable.

## Evidence on Hand

- Existing destination data from the previous app: 105 places across 15 countries, seasons, visa notes, prices, events, recommendations, and Mizrahnik tips with links (paraphrased, credited).
- Wikimedia Commons photo selections with photographer credits.
- No testimonials, no other users; nothing to fabricate.

## Product Principles

1. The trip is Elad's: every screen answers "what should I do next for my trip", not "browse travel content".
2. Free forever for personal use: never let a third-party API turn into a bill.
3. Works on the road: degrade gracefully offline and on slow data.
4. Facts that change (visas, prices, closures) carry a date and a nudge to re-check.
5. Credit sources: photographers, Mizrahnik, Google, Wikipedia.

## Accessibility & Inclusion

Hebrew RTL throughout; large touch targets for one-handed use outdoors; readable in bright sunlight and in dark mode.
