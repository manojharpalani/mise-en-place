# Architecture

This system's architecture is tracked as code using the
[Structurizr DSL](https://docs.structurizr.com/dsl), a C4-model
architecture-as-code format.

- **[`workspace.dsl`](./workspace.dsl)** — the source of truth: people,
  containers, external systems, and the relationships between them. Edit
  this file whenever the architecture actually changes (a new container, a
  new external integration, a relationship that no longer exists).
- **`diagrams/context.png`** — System Context view (people + external
  systems around the platform).
- **`diagrams/containers.png`** — Container view (the platform's internal
  containers: web app, API layer, auth, database, cron, and how they talk to
  Stripe, Twilio, SendGrid, S3, Anthropic, OpenAI, and Vercel).

The container diagram is embedded in the top-level [`README.md`](../README.md#architecture).

## Regenerating the diagrams

After editing `workspace.dsl`, regenerate the PNGs:

```bash
./architecture/generate.sh
```

This validates the DSL with the Structurizr CLI, exports it to PlantUML, and
renders PNGs into `architecture/diagrams/`. The CLI and PlantUML jars are
downloaded once into `architecture/.tools/` (gitignored) and reused after
that — no network is needed on later runs.

## Keeping this current

- A GitHub Actions workflow (`.github/workflows/architecture-diagram.yml`)
  re-renders and commits the diagrams automatically whenever
  `architecture/workspace.dsl` changes on `main`, so the images in git never
  drift from the DSL.
- When you add a new container (a new service, a new external dependency
  like a payment or messaging provider) or remove one, update
  `workspace.dsl` in the same PR as the code change. Treat it like any other
  piece of source — reviewers should see architecture changes alongside the
  code that causes them.
