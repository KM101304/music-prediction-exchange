const DEFAULT_API_ORIGIN = 'https://music-prediction-exchange-production.up.railway.app';

function getApiOrigin() {
  const value = process.env.NEXT_PUBLIC_API_URL || process.env.API_PROXY_TARGET || DEFAULT_API_ORIGIN;
  return value.replace(/\/+$/, '');
}

async function proxy(request, context) {
  const params = await context.params;
  const path = Array.isArray(params?.path) ? params.path.join('/') : '';
  const url = new URL(request.url);
  const query = url.search || '';
  const target = `${getApiOrigin()}/${path}${query}`;

  const requestHeaders = new Headers();
  const contentType = request.headers.get('content-type');
  const authorization = request.headers.get('authorization');
  const accept = request.headers.get('accept');
  if (contentType) {
    requestHeaders.set('content-type', contentType);
  }
  if (authorization) {
    requestHeaders.set('authorization', authorization);
  }
  if (accept) {
    requestHeaders.set('accept', accept);
  }

  const init = {
    method: request.method,
    headers: requestHeaders,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  let upstream;
  try {
    upstream = await fetch(target, init);
  } catch (_error) {
    return Response.json({ error: 'Backend unavailable' }, { status: 502 });
  }
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('transfer-encoding');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export async function GET(request, context) {
  return proxy(request, context);
}

export async function POST(request, context) {
  return proxy(request, context);
}

export async function PUT(request, context) {
  return proxy(request, context);
}

export async function PATCH(request, context) {
  return proxy(request, context);
}

export async function DELETE(request, context) {
  return proxy(request, context);
}

export async function OPTIONS(request, context) {
  return proxy(request, context);
}
