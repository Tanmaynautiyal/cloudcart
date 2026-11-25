import sys
from pathlib import Path

# Add backend directory to sys.path so 'app' package imports always resolve seamlessly
_backend_dir = str(Path(__file__).resolve().parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)
