const API_BASE = 'http://localhost:3000';

function saveSession(accessToken) {
  localStorage.setItem('accessToken', accessToken);
}

function clearSession() {
  localStorage.removeItem('accessToken');
}

function getToken() {
  return localStorage.getItem('accessToken');
}

// Decodes the JWT payload without verifying it (display purposes only —
// the API is always the source of truth for authorization).
function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  const payload = decodeToken(token);
  if (!payload || payload.exp * 1000 < Date.now()) {
    clearSession();
    return null;
  }
  return payload;
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

function renderNav(activePage) {
  const user = getCurrentUser();
  const links = [
    { href: 'index.html', label: 'Home', page: 'home' },
    { href: 'guest.html', label: 'Guest View', page: 'guest' },
    { href: 'user.html', label: 'User Dashboard', page: 'user' },
    { href: 'admin.html', label: 'Admin Dashboard', page: 'admin' },
    { href: 'system.html', label: 'System Info', page: 'system' },
  ];

  if (!user) {
    links.push(
      { href: 'login.html', label: 'Login', page: 'login' },
      { href: 'signup.html', label: 'Signup', page: 'signup' },
    );
  }

  const nav = document.createElement('nav');
  nav.style.cssText =
    'display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #ddd;';

  links.forEach((link) => {
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.label;
    if (link.page === activePage) {
      a.style.fontWeight = 'bold';
    }
    nav.appendChild(a);
  });

  const status = document.createElement('span');
  status.style.marginLeft = 'auto';
  status.textContent = user
    ? `Logged in as ${user.email} (${user.role})`
    : 'Not logged in';
  nav.appendChild(status);

  if (user) {
    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = 'Logout';
    logoutBtn.onclick = async () => {
      await apiFetch('/auth/logout', { method: 'POST' });
      clearSession();
      window.location.href = 'login.html';
    };
    nav.appendChild(logoutBtn);
  }

  document.body.prepend(nav);
}

function requireRole(...roles) {
  const user = getCurrentUser();
  if (!user || (roles.length && !roles.includes(user.role))) {
    document.body.innerHTML =
      '<p>You must be logged in' +
      (roles.length ? ` as ${roles.join(' or ')}` : '') +
      ' to view this page. <a href="login.html">Go to Login</a></p>';
    return null;
  }
  return user;
}
