# Environment variables used by docker-compose.yml

This page lists the variables that `docker-compose.yml` reads from your shell or from a `.env` file in the repository root, which service uses each one, and the default Compose falls back to when it is not set. Start from `.env.example` and fill in your own values.

## Required

Compose refuses to start if any of these are missing, because they build the MongoDB Atlas connection string shared by the backend services.

| Variable | Used by | Notes |
| --- | --- | --- |
| `MONGODB_ATLAS_HOST` | all backend services | Cluster host, e.g. `your-cluster.mongodb.net` |
| `MONGODB_ATLAS_USER` | all backend services | Atlas database user |
| `MONGODB_ATLAS_PASSWORD` | all backend services | Atlas database user password |

## Strongly recommended

| Variable | Used by | Default |
| --- | --- | --- |
| `JWT_SECRET_KEY` | auth, inventory, sales, notification, chat, finance, hrm, ai-chatbot, payment | `your-super-secret-key-change-this-in-production` |

All services must share the same value so tokens issued by the auth service are accepted everywhere. The default is only a placeholder; generate a real one with `python3 -c "import secrets; print(secrets.token_urlsafe(64))"`.

## Payments (Stripe)

| Variable | Used by | Default |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | payment, sales | none |
| `STRIPE_WEBHOOK_SECRET` | payment, sales | none |
| `STRIPE_PUBLISHABLE_KEY` | payment, sales, frontend | none |

See [PAYMENTS.md](PAYMENTS.md) for how to get these keys and test webhooks locally.

## AI chatbot service

| Variable | Default |
| --- | --- |
| `OPENAI_API_KEY` | none |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `DEFAULT_LLM_PROVIDER` | `openai` |
| `DEFAULT_LLM_MODEL` | `gpt-4o-mini` |
| `HUGGINGFACE_API_KEY` | none |
| `HUGGINGFACE_BASE_URL` | `https://api-inference.huggingface.co` |
| `HUGGINGFACE_MODEL` | `microsoft/DialoGPT-medium` |
| `ENABLE_RAG` | `true` |
| `RAG_EMBEDDING_PROVIDER` | `openai` |
| `RAG_EMBEDDING_MODEL` | `text-embedding-3-small` |
| `RAG_CHUNK_SIZE` | `1000` |
| `RAG_CHUNK_OVERLAP` | `200` |
| `RAG_TOP_K` | `5` |

Note that `.env.example` sets `OPENAI_MODEL=gpt-3.5-turbo`. If you copy it as is, that value wins over the Compose default of `gpt-4o-mini`.

## Everything else

Other settings in `docker-compose.yml`, such as service ports, database names and token lifetimes, are hard-coded per service and do not come from `.env`. Change them in the compose file directly if you need to.

To see the final values Compose will use, run:

```bash
docker compose config
```
