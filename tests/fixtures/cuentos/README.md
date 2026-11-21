# Cuentos fixtures

Everything here was written or drawn for Hablaba. Never add a photo or text
from a real picture book: Cuentos is for books the parent owns, read at home,
and the repo must not carry anyone else's pages.

- `osito.en.txt` / `osito.es.txt`: an original rhyming page and the Spanish we
  expect back (tú, child-level, the rhyme kept, not a gloss). The `.es.txt`
  files are covered by the tú check in `npm run validate:content`.
- `*.jpg`: rendered page images for the e2e tests (plain type, white text over
  a dark illustration, a two-page spread), with the expected OCR in the
  matching `.en.txt`.
