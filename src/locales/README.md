These static dictionaries add Turkish, Polish, Romanian, Albanian, Spanish, Greek, Ukrainian, Bulgarian and Italian to the existing German, English and French content.

Public English source strings were machine-translated using Google's public dictionary translation service. Company names and addresses are rendered separately, unchanged. Management/construction role labels were manually refined. These are not certified or professional legal translations; native-language editorial review remains advisable.

Visitors never call a translation provider. `scripts/prepare-locales.mjs` fills missing dictionary entries during development; `scripts/refine-locale-labels.mjs` applies reviewed role labels. Existing entries are retained. Run `npm test` to check coverage and language handling; `scripts/languages-browser-check.mjs` checks all public routes against `TEST_BASE_URL` (default `http://localhost:4173`).

Admin product fields support all 12 languages. Existing sample product strings are included in the dictionaries. For new custom catalog content, enter translations in the product editor; missing custom translations fall back to the supplied English/German text.
