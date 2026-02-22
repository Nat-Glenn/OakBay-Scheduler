export function ok(data: unknown, status = 200) {
  return Response.json({ data }, { status });
}

export function created(data: unknown) {
  return Response.json({ data }, { status: 201 });
}

export function badRequest(error: string, details?: unknown) {
  return Response.json({ error, details }, { status: 400 });
}

export function notFound(error: string, details?: unknown) {
  return Response.json({ error, details }, { status: 404 });
}

export function conflict(error: string, details?: unknown) {
  return Response.json({ error, details }, { status: 409 });
}

export function serverError(error: string) {
  return Response.json({ error }, { status: 500 });
}