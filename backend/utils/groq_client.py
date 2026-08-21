import time
import os
from groq import Groq, RateLimitError, APIError
from dotenv import load_dotenv

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

PRIMARY_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
FALLBACK_MODELS = ["openai/gpt-oss-20b", "groq/compound-mini"]


def ask_groq(prompt: str) -> str:
    """
    Sends prompt to Groq with automatic model fallback and rate limit recovery.
    """
    models_to_try = [PRIMARY_MODEL] + [m for m in FALLBACK_MODELS if m != PRIMARY_MODEL]

    last_error = None
    for model_name in models_to_try:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                temperature=0.3,
            )
            return response.choices[0].message.content

        except RateLimitError as rle:
            last_error = rle
            # Rate limit on this model, fall through immediately to next model
            continue

        except APIError as apie:
            last_error = apie
            time.sleep(0.5)
            continue

        except Exception as e:
            last_error = e
            continue

    if last_error:
        raise last_error
    raise RuntimeError("Failed to obtain response from Groq.")