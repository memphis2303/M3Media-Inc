LIGHTCRAFT V8 — STUDIO LAB

Open index.html in a modern browser. The app is static and can be hosted on any standard web server.

WHAT IS NEW
- Dark, responsive desktop/mobile interface
- Six fine-grained lighting controls with live conceptual canvas preview
- Guided lighting coach: 10 photography types, 5 moods, 3 studio sizes, beginner/experienced steps
- 10 creative shot recipes
- Apply recommendations to existing V7 modifier and distance controls
- Sync fine controls from V7 gear
- Local V8 workspace save and JSON import/export

PRESERVED FROM V7
Original V7 style library, subject selector, photo references, 3D viewer, overhead diagram, lighting ratios, flash settings, light meter helper, troubleshooting, gear matching, saved setups, print card and share codes.

LIMITATIONS
- The V8 live preview is an illustrative 2D lighting study, not a physically accurate ray-traced photo.
- New AI photo generation is NOT included: that requires a separately configured image generation API. Existing local photo/render previews remain available.
- The V7 3D view requires the external Three.js CDN to load. Other local controls work offline.
- Flash estimates are starting points only; confirm exposure with a meter/test frame.

TESTS
Run python3 tests/test_static.py from the project directory.
For full browser testing, serve locally: python3 -m http.server 8000 and open http://localhost:8000
