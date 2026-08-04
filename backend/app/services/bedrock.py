import json
import os
import time
from collections.abc import Callable
from typing import Any

os.environ["USE_TORCH"] = "1"
os.environ["USE_TF"] = "0"

import requests
from sentence_transformers import SentenceTransformer

from app.config import settings


RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}


class BedrockService:
    def __init__(self) -> None:
        self._embedding_model: SentenceTransformer | None = None

    def is_configured(self) -> bool:
        return bool(settings.groq_api_key and settings.groq_model_id)

    def _retry(self, fn: Callable[[], Any], max_attempts: int = 5) -> Any:
        for attempt in range(1, max_attempts + 1):
            try:
                return fn()
            except requests.HTTPError as exc:
                status_code = exc.response.status_code if exc.response is not None else 0
                if status_code in RETRYABLE_STATUS_CODES and attempt < max_attempts:
                    time.sleep(2 ** (attempt - 1))
                    continue
                raise

    def _get_embedding_model(self) -> SentenceTransformer:
        if self._embedding_model is None:
            self._embedding_model = SentenceTransformer(settings.local_embedding_model)
        return self._embedding_model

    def embed_text(self, text: str, input_type: str = "search_document") -> list[float]:
        _ = input_type
        embedding_model = self._get_embedding_model()
        vector = embedding_model.encode(text, normalize_embeddings=True)
        return [float(value) for value in vector]

    def converse_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        schema: dict[str, Any],
        temperature: float = 0.4,
        max_tokens: int = 700,
    ) -> dict[str, Any]:
        if not self.is_configured():
            raise RuntimeError("Groq is not configured")

        schema_str = json.dumps(schema, separators=(",", ":"))
        composed_user_prompt = (
            f"{user_prompt}\n\n"
            "Return strictly valid JSON using this schema. Do not include markdown fences.\n"
            f"Schema: {schema_str}"
        )

        def _invoke():
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.groq_model_id,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": composed_user_prompt},
                    ],
                },
                timeout=60,
            )
            response.raise_for_status()
            body = response.json()
            content = body["choices"][0]["message"]["content"]
            return json.loads(content)

        structured = self._retry(_invoke)
        for required_key in ("step", "text", "options", "avatar_state"):
            if required_key not in structured:
                raise RuntimeError(f"Groq structured output missing key: {required_key}")
        return structured
