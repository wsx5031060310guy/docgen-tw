// Tiny SSR-safe helper for inlining JSON-LD <script> tags.
// Pass any serialisable object; the rendered tag is keyed so Next can dedupe.

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
