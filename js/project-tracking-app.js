/**
 * Project tracking — contract & escrow from API
 */
(function () {
  const STEP_LABELS = ['Proposal', 'Escrow', 'Pengerjaan', 'Review', 'Selesai'];
  let contract = null;
  let userRole = null;

  async function init() {
    if (!FreelanceInAPI.getToken()) {
      window.location.href = 'login.html';
      return;
    }
    const { user } = await FreelanceInAPI.me();
    userRole = user.role;
    const contractId = new URLSearchParams(window.location.search).get('contract') || '1';
    try {
      ({ contract } = await FreelanceInAPI.getContract(contractId));
      renderContract();
    } catch (err) {
      showToast('Error', err.message, 'danger');
    }
  }

  function renderContract() {
    document.getElementById('project-title').textContent = contract.title;
    document.getElementById('escrow-budget').textContent = contract.amount;
    const step = contract.step || 1;
    const progress = [0, 25, 50, 75, 100][step - 1] || 0;
    document.getElementById('stepper-bar').style.width = progress + '%';
    for (let i = 1; i <= 5; i++) {
      const node = document.getElementById(`step-node-${i}`);
      if (!node) continue;
      node.classList.remove('completed', 'active');
      if (i < step) node.classList.add('completed');
      else if (i === step) node.classList.add('active');
    }

    const escrowMap = {
      none: { text: 'Belum Didepositkan', badge: 'badge-danger' },
      pending: { text: 'Menunggu Pembayaran', badge: 'badge-warning' },
      deposited: { text: contract.amount + ' Teraman Escrow', badge: 'badge-success' },
      released: { text: contract.amount + ' Telah Dilepas', badge: 'badge-primary' }
    };
    const esc = escrowMap[contract.escrow_status] || escrowMap.none;
    document.getElementById('escrow-status').textContent = esc.text;
    document.getElementById('escrow-status').className = `badge ${esc.badge}`;

    document.getElementById('status-card-title').textContent = `Tahap ${step}: ${STEP_LABELS[step - 1]}`;
    document.getElementById('status-card-desc').textContent = getStepDesc(step);
    document.getElementById('action-btns-container').innerHTML = getStepActions(step);

    if (window.lucide) lucide.createIcons();
  }

  function getStepDesc(step) {
    const descs = {
      1: 'Proposal diterima. UMKM perlu deposit dana ke Rekening Bersama sebelum pekerjaan dimulai.',
      2: 'Dana escrow aktif. Mahasiswa siap memulai pengerjaan.',
      3: `${contract.student_name} sedang mengerjakan proyek. Monitor via chat.`,
      4: 'Deliverable siap direview. UMKM dapat setujui atau minta revisi.',
      5: 'Proyek selesai. Dana telah dilepaskan ke mahasiswa.'
    };
    return descs[step] || '';
  }

  function getStepActions(step) {
    if (userRole === 'umkm') {
      if (step === 1) return `<button class="btn btn-primary btn-sm" onclick="ProjectTracking.deposit()">Setujui Kontrak & Deposit Dana</button>`;
      if (step === 2) return `<button class="btn btn-primary btn-sm" onclick="ProjectTracking.advance(3)">Konfirmasi Pengerjaan Dimulai</button>`;
      if (step === 4) return `<button class="btn btn-primary btn-sm" onclick="ProjectTracking.release()">Setujui & Lepaskan Dana</button>`;
    }
    if (userRole === 'mahasiswa') {
      if (step === 3) return `<button class="btn btn-primary btn-sm" onclick="ProjectTracking.advance(4)">Kirim Deliverable untuk Review</button>`;
    }
    return `<a href="messages.html?thread=" class="btn btn-outline btn-sm">Diskusi di Pesan</a>`;
  }

  async function deposit() {
    try {
      const snap = await FreelanceInAPI.createSnapToken(contract.id);
      if (snap.simulated) {
        showToast('Escrow Aktif', snap.message, 'success');
      } else if (snap.token && window.snap) {
        window.snap.pay(snap.token, {
          onSuccess: () => { FreelanceInAPI.depositEscrow(contract.id).then(reload); },
          onPending: () => showToast('Pending', 'Menunggu pembayaran...', 'info'),
          onError: () => showToast('Gagal', 'Pembayaran gagal', 'danger')
        });
        return;
      } else {
        await FreelanceInAPI.depositEscrow(contract.id);
        showToast('Escrow Aktif', 'Dana didepositkan ke Rekening Bersama.', 'success');
      }
      await reload();
    } catch (err) {
      showToast('Gagal', err.message, 'danger');
    }
  }

  async function advance(step) {
    try {
      await FreelanceInAPI.updateContractStep(contract.id, step);
      showToast('Berhasil', 'Tahap proyek diperbarui.', 'success');
      await reload();
    } catch (err) {
      showToast('Gagal', err.message, 'danger');
    }
  }

  async function release() {
    try {
      await FreelanceInAPI.releaseEscrow(contract.id);
      showToast('Selesai', 'Dana dilepaskan ke mahasiswa.', 'success');
      await reload();
    } catch (err) {
      showToast('Gagal', err.message, 'danger');
    }
  }

  async function reload() {
    ({ contract } = await FreelanceInAPI.getContract(contract.id));
    renderContract();
  }

  window.ProjectTracking = { init, deposit, advance, release };
  window.addEventListener('load', init);
})();
