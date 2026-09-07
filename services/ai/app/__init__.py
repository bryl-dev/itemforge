"""ItemForge AI engine.

A deliberately small service: it turns source text into chunks, drafts
assessment items from those chunks, and produces embeddings. Everything about
*what to do* with a draft — screening, deduplication, review state — lives in
the API service, so this one stays replaceable.
"""

__version__ = "0.1.0"
