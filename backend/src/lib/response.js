export const resp = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
  },
  body: typeof body === "string" ? body : JSON.stringify(body),
});

export function safeParse(s) {
  try {
    return JSON.parse(s || "{}");
  } catch {
    return null;
  }
}
