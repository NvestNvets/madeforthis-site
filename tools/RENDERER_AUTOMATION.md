# Renderer Automation

This printable pipeline can be scheduled automatically.

## Current entrypoint

Use:

```bash
./tools/run_kids_bundle_pipeline.sh
```

That script:

- loads `OPENAI_API_KEY` from GCP Secret Manager
- runs the prompt-driven printable pipeline
- writes:
  - the generated JSON spec
  - updated preview PNGs
  - updated PDF packs
  - the bundle ZIP

## Best production scheduling path

Use `Cloud Scheduler -> Cloud Build trigger -> script`.

Recommended flow:

1. Cloud Scheduler runs once daily.
2. It triggers a Cloud Build job or admin endpoint.
3. Cloud Build checks out the repo and runs:

```bash
cd digiblog/digiblog-tier4-madeforthisblog
./tools/run_kids_bundle_pipeline.sh
firebase deploy --only hosting --project madeforthis
```

## Why this is the cleanest option

- keeps secrets in GCP
- avoids storing OpenAI keys on a local cron machine
- makes runs auditable in Cloud Build history
- can later be expanded to:
  - generate 4 variations
  - update the product catalog
  - send owner review emails
  - create blog drafts automatically

## Future dashboard tool

The dashboard version should collect:

- prompt
- pack type
- free or paid
- price
- reference image upload
- number of variations
- publish now / review first

Then the backend should:

1. save the request
2. run the printable pipeline
3. store generated files in GCS
4. write product metadata
5. queue review email
6. optionally publish to site
