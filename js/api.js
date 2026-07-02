/**
 * FreelanceIn API Client
 * Abstraksi fetch ke backend Express — siap diganti ke production URL
 */
const FreelanceInAPI = (function () {
  const BASE = window.FREELANCEIN_API_URL || 
    (window.location.protocol === 'file:' || window.location.port !== '3000'
      ? 'http://localhost:3000' 
      : '');

  function getToken() {
    return localStorage.getItem('freelancein_token');
  }

  function getSessionUser() {
    const raw = localStorage.getItem('freelancein_user');
    return raw ? JSON.parse(raw) : null;
  }

  function setSession(token, user) {
    localStorage.setItem('freelancein_token', token);
    localStorage.setItem('freelancein_user', JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem('freelancein_token');
    localStorage.removeItem('freelancein_user');
  }

  async function request(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  return {
    getToken,
    getSessionUser,
    setSession,
    clearSession,

    async health() {
      try {
        await fetch(`${BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${getToken() || 'x'}` } });
        return true;
      } catch {
        return false;
      }
    },

    register(payload) {
      return request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
    },

    login(email, password, role) {
      return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password, role }) });
    },

    me() {
      return request('/api/auth/me');
    },

    getStudents(params = {}) {
      const q = new URLSearchParams(params).toString();
      return request(`/api/users?${q}`);
    },

    getUser(id) {
      return request(`/api/users/${id}`);
    },

    updateProfile(data) {
      return request('/api/profile', { method: 'PUT', body: JSON.stringify(data) });
    },

    submitKTM(file) {
      const fd = new FormData();
      fd.append('ktm', file);
      return request('/api/ktm/submit', { method: 'POST', body: fd, headers: {} });
    },

    getPendingKTM() {
      return request('/api/ktm/pending');
    },

    approveKTM(userId) {
      return request(`/api/ktm/${userId}/approve`, { method: 'PATCH' });
    },

    rejectKTM(userId, reason) {
      return request(`/api/ktm/${userId}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) });
    },

    getJobs(params = {}) {
      const q = new URLSearchParams(params).toString();
      return request(`/api/jobs?${q}`);
    },

    getMyJobs() {
      return request('/api/jobs/mine');
    },

    getJob(id) {
      return request(`/api/jobs/${id}`);
    },

    createJob(data) {
      return request('/api/jobs', { method: 'POST', body: JSON.stringify(data) });
    },

    submitProposal(data) {
      return request('/api/proposals', { method: 'POST', body: JSON.stringify(data) });
    },

    getMyProposals() {
      return request('/api/proposals/mine');
    },

    getJobProposals(jobId) {
      return request(`/api/proposals/job/${jobId}`);
    },

    acceptProposal(id) {
      return request(`/api/proposals/${id}/accept`, { method: 'PATCH' });
    },

    rejectProposal(id) {
      return request(`/api/proposals/${id}/reject`, { method: 'PATCH' });
    },

    getMyContracts() {
      return request('/api/contracts/mine');
    },

    getContract(id) {
      return request(`/api/contracts/${id}`);
    },

    updateContractStep(id, step) {
      return request(`/api/contracts/${id}/step`, { method: 'PATCH', body: JSON.stringify({ step }) });
    },

    depositEscrow(id) {
      return request(`/api/contracts/${id}/deposit`, { method: 'POST' });
    },

    releaseEscrow(id) {
      return request(`/api/contracts/${id}/release`, { method: 'POST' });
    },

    createSnapToken(contractId) {
      return request('/api/escrow/snap-token', { method: 'POST', body: JSON.stringify({ contract_id: contractId }) });
    },

    submitReview(contractId, rating, comment) {
      return request(`/api/contracts/${contractId}/review`, { method: 'POST', body: JSON.stringify({ rating, comment }) });
    },

    getThreads() {
      return request('/api/messages/threads');
    },

    getThread(id, since) {
      const q = since ? `?since=${encodeURIComponent(since)}` : '';
      return request(`/api/messages/threads/${id}${q}`);
    },

    sendMessage(threadId, text, file) {
      const fd = new FormData();
      if (text) fd.append('text', text);
      if (file) fd.append('file', file);
      return request(`/api/messages/threads/${threadId}`, { method: 'POST', body: fd, headers: {} });
    },

    getNotifications() {
      return request('/api/notifications');
    },

    markNotificationRead(id) {
      return request(`/api/notifications/${id}/read`, { method: 'PATCH' });
    }
  };
})();

window.FreelanceInAPI = FreelanceInAPI;
