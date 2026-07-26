const BACKEND = "https://mentorship-app-f772.onrender.com";

/**
 * Proxy /api/* on the Pages domain to the Render backend so OAuth
 * never lands on a flagged *.onrender.com URL in the browser.
 */
export async function onRequest(context) {
  const incoming = new URL(context.request.url);
  const target = `${BACKEND}${incoming.pathname}${incoming.search}`;

  const headers = new Headers(context.request.headers);
  headers.delete("host");
  headers.set("x-forwarded-host", incoming.host);
  headers.set("x-forwarded-proto", "https");

  const init = {
    method: context.request.method,
    headers,
    redirect: "manual",
  };

  if (context.request.method !== "GET" && context.request.method !== "HEAD") {
    init.body = context.request.body;
  }

  const upstream = await fetch(target, init);

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  });
}
