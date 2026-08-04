import json
import time
from collections.abc import Callable
from typing import Any

import boto3
from botocore.exceptions import ClientError

from app.config import settings


RETRYABLE_CODES = {
    "ThrottlingException",
    "TooManyRequestsException",
    "ServiceUnavailableException",
    "InternalServerException",
    "ModelTimeoutException",
}


class BedrockService:
    def __init__(self) -> None:
        self.client = boto3.client("bedrock-runtime", region_name=settings.aws_region or "us-east-1")

    def is_configured(self) -> bool:
        return bool(
            settings.bedrock_model_id
            and settings.bedrock_embedding_model_id
            and settings.bedrock_model_id != "placeholder"
            and settings.bedrock_embedding_model_id != "placeholder"
        )

    def _retry(self, fn: Callable[[], Any], max_attempts: int = 5) -> Any:
        for attempt in range(1, max_attempts + 1):
            try:
                return fn()
            except ClientError as exc:
                code = exc.response.get("Error", {}).get("Code", "")
                if code in RETRYABLE_CODES and attempt < max_attempts:
                    time.sleep(2 ** (attempt - 1))
                    continue
                raise

    def embed_text(self, text: str, input_type: str = "search_document") -> list[float]:
        if not self.is_configured():
            return [0.0] * 64

        model_id = settings.bedrock_embedding_model_id

        def _invoke():
            if "cohere" in model_id.lower():
                payload = {"texts": [text], "input_type": input_type}
            else:
                payload = {"inputText": text}

            return self.client.invoke_model(
                modelId=model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(payload),
            )

        response = self._retry(_invoke)
        raw_body = response["body"].read()
        body = json.loads(raw_body)

        if "embedding" in body:
            return body["embedding"]
        if "embeddings" in body and body["embeddings"]:
            return body["embeddings"][0]
        raise RuntimeError(f"Unsupported embedding response format: {body}")

    def converse_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        schema: dict[str, Any],
        temperature: float = 0.4,
        max_tokens: int = 700,
    ) -> dict[str, Any]:
        if not self.is_configured():
            raise RuntimeError("Bedrock is not configured")

        def _invoke():
            return self.client.converse(
                modelId=settings.bedrock_model_id,
                system=[{"text": system_prompt}],
                messages=[{"role": "user", "content": [{"text": user_prompt}]}],
                inferenceConfig={"temperature": temperature, "maxTokens": max_tokens},
                toolConfig={
                    "tools": [
                        {
                            "toolSpec": {
                                "name": "emit_response",
                                "description": "Return the final structured lesson response.",
                                "inputSchema": {"json": schema},
                            }
                        }
                    ],
                    "toolChoice": {"tool": {"name": "emit_response"}},
                },
            )

        response = self._retry(_invoke)
        content = response["output"]["message"]["content"]
        for item in content:
            if "toolUse" in item:
                return item["toolUse"]["input"]
        raise RuntimeError(f"Structured output was not returned by model: {content}")
