import os
import sys
from pathlib import Path

# Settings requires MONGODB_URL and reads SECRET_KEY at import time, so both must
# exist before `app.config` is first imported. No database connection is opened by
# these tests — the URL only has to be present and well-formed.
os.environ.setdefault("MONGODB_URL", "mongodb://localhost:27017")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-used-outside-tests")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
