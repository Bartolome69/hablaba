# Teacher source PDFs

Drop grammar PDFs from your Spanish teacher here (e.g. `por-para.pdf`), then run
the `/ingest-pdf` skill in Claude Code to turn one into an Exercises content pack
under `lib/exercises/content/`.

These files are **inputs to a dev-time workflow**, not app assets: nothing in the
app imports from this folder, and it isn't part of the shipped bundle. Once a PDF
has been ingested and you've committed the generated JSON, you can keep the PDF
here for reference or delete it — the content pack is the durable artifact.

See `lib/exercises/README.md` for the full data model.
