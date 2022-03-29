export function isCrossOriginURL(url: string): boolean {
  const { location } = window;
  const parts = url.match(/^(\w+:)\/\/([^:/?#]*):?(\d*)/i);

  return (
    parts !== null &&
    (parts[1] !== location.protocol ||
      parts[2] !== location.hostname ||
      parts[3] !== location.port)
  );
}
