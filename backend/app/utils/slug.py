import re
import unicodedata


def slugify(text: str) -> str:
    """
    Generate an ASCII-only URL-safe slug from input text.
    """
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text.lower()).strip()
    return re.sub(r"[-\s]+", "-", text)
