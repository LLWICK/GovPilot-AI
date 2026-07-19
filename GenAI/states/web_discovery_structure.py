from pydantic import BaseModel, Field
from typing import Literal, Optional


class DiscoveredPage(BaseModel):
    """A single candidate government page found for a citizen's request."""

    agency_name: str = Field(
        description="The official name of the government agency or department, e.g. 'Registrar of Companies'"
    )
    url: str = Field(
        description="The full URL of the discovered page. Must be a .gov.lk domain."
    )
    relevance_reason: str = Field(
        description="One short sentence on why this page matches the citizen's request"
    )


class DiscoveryResult(BaseModel):
    """Structured output for the Discovery Agent's search over gov.lk sites."""

    status: Literal["found", "not_found", "ambiguous"] = Field(
        description=(
            "'found' if a single confident match exists, 'ambiguous' if multiple "
            "plausible candidates were found and none is clearly best, 'not_found' "
            "if no .gov.lk match could be identified"
        )
    )
    best_match: Optional[DiscoveredPage] = Field(
        default=None,
        description="The single best candidate page, if status is 'found'. Null otherwise."
    )
    alternatives: list[DiscoveredPage] = Field(
        default_factory=list,
        description="Other plausible candidates, populated mainly when status is 'ambiguous'"
    )
    search_query_used: str = Field(
        description="The actual search query that was run, for debugging/traceability"
    )