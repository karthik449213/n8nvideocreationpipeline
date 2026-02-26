# Automated 3D‑Style Short Video Pipeline

This repository contains a fully automated, end‑to‑end video creation pipeline built around **n8n** and a set of helper scripts. The goal is to produce short 3D‑style films similar to the ones created by Zack D. Films, without any manual intervention. The workflow covers the entire lifecycle:

1. **Idea generation** – GPT‑powered brainstorming and shortlisting.
2. **Prompt creation** – translate the chosen topic into image/video prompts.
3. **Asset creation** – launch image generation (Stable Diffusion / Midjourney / etc.)
4. **Script and audio** – generate narration using GPT + text‑to‑speech.
5. **Assembly** – stitch images, audio, and motion effects using `ffmpeg`.
6. **Publishing** – upload the finished video to YouTube automatically.

Everything runs on a schedule or via webhook trigger; no human touches the content once configured.

---

## Prerequisites

- Node.js (18+)
- [n8n](https://n8n.io) installed (Docker, CLI, or hosted instance)
- API keys for the following services (set as environment variables):
  - OpenAI / GPT provider (`OPENAI_API_KEY`)
  - Image‑generation service (`IMAGE_API_KEY`)
  - Google Cloud credentials for YouTube upload (`GOOGLE_APPLICATION_CREDENTIALS`)


## Directory structure

```
/                  # root of this project
├─ n8n/            # exported workflows for n8n
├─ scripts/        # Node helper modules called by n8n nodes
└─ PIPELINE.md     # high‑level architecture description
```

## Getting started

1. `npm install` to fetch dependencies used by the helper scripts.
2. Import the JSON workflows in `n8n/` into your n8n instance (via **Settings → Import**).
3. Configure credentials inside n8n for HTTP Request, Google Drive, etc.
4. Start the main flow with a cron trigger. It will generate a video every day/month, depending on the schedule you set.

---

### How the flows interact

Each workflow executes sequentially. n8n passes data from node to node; the heavy lifting is delegated to `scripts/*.js`. After YouTube upload, a final HTTP node can ping a webhook for logging or analytics.

For details on developing or extending the pipeline, see `PIPELINE.md`.
