/**
 * FreelanceIn Messages — API-backed chat with polling
 */
(function () {
  let activeThreadId = null;
  let lastPollTime = null;
  let pollInterval = null;
  let currentUserId = null;

  function formatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  async function init() {
    if (!FreelanceInAPI.getToken()) {
      window.location.href = 'login.html';
      return;
    }
    const { user } = await FreelanceInAPI.me();
    currentUserId = user.id;
    await loadThreads();
    const threadParam = new URLSearchParams(window.location.search).get('thread');
    if (threadParam) activateThread(parseInt(threadParam, 10));
    pollInterval = setInterval(pollActiveThread, 3000);
  }

  async function loadThreads() {
    const container = document.getElementById('threads-list');
    try {
      const { threads } = await FreelanceInAPI.getThreads();
      if (!threads.length) {
        container.innerHTML = '<p style="padding:20px;font-size:var(--font-xs);color:var(--color-slate-500);">Belum ada percakapan. Hire mahasiswa dari proposal untuk membuka chat.</p>';
        return;
      }
      container.innerHTML = threads.map(t => `
        <div class="chat-thread-item" id="thread-${t.id}" onclick="MessagesApp.activateThread(${t.id})">
          <div class="thread-avatar-wrapper">
            <div style="width:44px;height:44px;border-radius:50%;background:var(--color-primary);display:flex;align-items:center;justify-content:center;font-weight:700;">
              ${t.partner_name.charAt(0)}
            </div>
          </div>
          <div class="thread-details">
            <div class="thread-header-row">
              <span class="thread-name">${escapeHtml(t.partner_name)}</span>
              <span class="thread-time">${formatTime(t.last_at)}</span>
            </div>
            <div class="thread-header-row">
              <span class="thread-last-msg">${escapeHtml((t.last_message || '').substring(0, 60))}</span>
            </div>
          </div>
        </div>
      `).join('');
      if (!activeThreadId && threads[0]) activateThread(threads[0].id);
    } catch (err) {
      container.innerHTML = `<p style="color:var(--color-danger);padding:20px;">${err.message}</p>`;
    }
  }

  async function activateThread(threadId) {
    activeThreadId = threadId;
    lastPollTime = null;
    document.querySelectorAll('.chat-thread-item').forEach(el => el.classList.remove('active'));
    const el = document.getElementById(`thread-${threadId}`);
    if (el) el.classList.add('active');
    await renderMessages(false);
  }

  async function renderMessages(appendOnly) {
    if (!activeThreadId) return;
    try {
      const { thread, messages } = await FreelanceInAPI.getThread(activeThreadId, appendOnly ? lastPollTime : null);
      const box = document.getElementById('chat-messages-box');
      const partner = thread.participant_a === currentUserId ? thread.participant_b : thread.participant_a;

      document.getElementById('active-chat-name').textContent = document.querySelector(`#thread-${activeThreadId} .thread-name`)?.textContent || 'Chat';
      document.getElementById('active-chat-sub').textContent = 'Percakapan proyek';
      const actionBtn = document.getElementById('chat-header-action-btn');
      if (thread.contract_id) actionBtn.href = `project-tracking.html?contract=${thread.contract_id}`;

      if (!appendOnly) box.innerHTML = '';

      messages.forEach(msg => {
        const isOutgoing = msg.sender_id === currentUserId;
        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${isOutgoing ? 'outgoing' : 'incoming'}`;
        bubble.innerHTML = msg.file_name
          ? `<div class="chat-file-card"><i data-lucide="file"></i> ${escapeHtml(msg.file_name)}</div><span class="chat-msg-time">${formatTime(msg.created_at)}</span>`
          : `<p>${escapeHtml(msg.text)}</p><span class="chat-msg-time">${formatTime(msg.created_at)}</span>`;
        box.appendChild(bubble);
        lastPollTime = msg.created_at;
      });

      box.scrollTop = box.scrollHeight;
      if (window.lucide) lucide.createIcons();
    } catch (err) {
      console.error(err);
    }
  }

  async function pollActiveThread() {
    if (!activeThreadId || !lastPollTime) return;
    const prevCount = document.getElementById('chat-messages-box').children.length;
    await renderMessages(true);
    const newCount = document.getElementById('chat-messages-box').children.length;
    if (newCount > prevCount) loadThreads();
  }

  async function sendMessage() {
    const input = document.getElementById('chat-message-input');
    const text = input.value.trim();
    if (!text || !activeThreadId) return;
    input.value = '';
    try {
      await FreelanceInAPI.sendMessage(activeThreadId, text);
      await renderMessages(false);
      await loadThreads();
    } catch (err) {
      showToast('Gagal', err.message, 'danger');
    }
  }

  async function sendFile(input) {
    if (!input.files[0] || !activeThreadId) return;
    try {
      await FreelanceInAPI.sendMessage(activeThreadId, '', input.files[0]);
      await renderMessages(false);
      await loadThreads();
    } catch (err) {
      showToast('Gagal', err.message, 'danger');
    }
    input.value = '';
  }

  function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  window.MessagesApp = { init, activateThread, sendMessage, sendFile, handleKeydown };
  window.addEventListener('load', init);
})();
