import multiprocessing
import os

bind = "0.0.0.0:8001"
# Formula: (2 x $num_cores) + 1. But clamp to 4 to avoid OOM on smaller VMs with heavy Pandas/FastF1 logic
cores = multiprocessing.cpu_count()
workers = min((cores * 2) + 1, 4) if os.environ.get('NODE_ENV') == 'production' else 2

worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120    # FastF1 cold caches can take over a minute to download massive parquet files
keepalive = 5
errorlog = "-"
loglevel = "info"
accesslog = "-"
