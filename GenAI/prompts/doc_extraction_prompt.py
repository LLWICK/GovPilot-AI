

EXTRACTION_PROMPT = """This is page {page_num} of a BLANK, unfilled Sri Lankan
government form template — do not attempt to extract any values, since it is
empty. List every labeled field visible on this page, in the order they appear.

Field labels are often shown in Sinhala, Tamil, and English together (they may
be stacked or side by side) — capture all three if present, matched to the same
field.

Return ONLY valid JSON matching this schema:
{{
  "fields": [
    {{
      "field_number": "e.g. '(1)' if numbered, or null",
      "label_english": "the English label text",
      "label_sinhala": "the Sinhala label text, or null if not shown",
      "label_tamil": "the Tamil label text, or null if not shown",
      "field_type": "text | date | choice | id_number | checkbox",
      "notes": "any relevant detail, e.g. 'segmented digit boxes' or 'strikethrough choice'"
    }}
  ]
}}"""