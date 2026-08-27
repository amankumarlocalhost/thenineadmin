const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export class ApiClientError extends Error {
  constructor(message, statusCode, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

function buildQuery(params) {
  if (!params) return "";
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    usp.set(key, value);
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

// Every admin API call goes through here: same-origin-safe credentialed
// fetch (the backend sets an httpOnly session cookie the admin app never
// touches directly), consistent error shape, and a single place to react to
// a 401 by bouncing to /login.
function rawFetch(path, { method, body, params, isForm }) {
  return fetch(`${API_URL}${path}${buildQuery(params)}`, {
    method,
    credentials: "include",
    headers: isForm ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });
}

// The access cookie lives 15 minutes, the refresh cookie 30 days — without
// this, an admin who left the dashboard open would get bounced to /login
// mid-task. One shared in-flight refresh, because rotation invalidates the
// old refresh token and racing refreshes would sign the admin out.
let refreshInFlight = null;

function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = rawFetch("/auth/refresh", { method: "POST" })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

// A 401 from these is the answer, not a stale-token symptom: a wrong password
// must surface as a wrong password, and refreshing off /auth/refresh itself
// would recurse.
const NO_REFRESH_PATHS = new Set(["/auth/admin/login", "/auth/login", "/auth/refresh", "/auth/logout"]);

async function request(path, { method = "GET", body, params, isForm = false } = {}) {
  let res = await rawFetch(path, { method, body, params, isForm });

  if (res.status === 401 && !NO_REFRESH_PATHS.has(path) && (await refreshSession())) {
    res = await rawFetch(path, { method, body, params, isForm });
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    // no body (e.g. 204) — leave payload null
  }

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      // A 401 that survived the refresh attempt above means the session is
      // genuinely gone. A hard navigation (rather than router.push) is
      // deliberate: it tears down every cached page's in-memory state along
      // with it, so no stale admin data survives the sign-out.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    }
    throw new ApiClientError(payload?.message || `Request failed (${res.status})`, res.status, payload?.details);
  }

  return payload;
}

export const api = {
  get: (path, params) => request(path, { method: "GET", params }),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path, body, params) => request(path, { method: "DELETE", body, params }),
  postForm: (path, formData, params) => request(path, { method: "POST", body: formData, isForm: true, params }),
};

export { API_URL };
