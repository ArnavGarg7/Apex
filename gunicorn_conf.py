import multiprocessing
import os

bind = "0.0.0.0:8001"
# SINGLE worker on purpose: the live-timing cache is per-process in-memory state.
# With multiple workers, POST /api/live/ingest would land on one worker while an
# SSE/REST reader hits another → divergent/stale boards. One worker guarantees the
# relay push, the cache, and the SSE stream all share the same process state.
# (Concurrency is handled by the async UvicornWorker event loop, not extra procs.)
cores = multiprocessing.cpu_count()
workers = 1

worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120    # FastF1 cold caches can take over a minute to download massive parquet files
keepalive = 5
errorlog = "-"
loglevel = "info"
accesslog = "-"
