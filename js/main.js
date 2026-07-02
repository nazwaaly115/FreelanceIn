/**
 * FreelanceIn Main JS
 * Controls interactivity for both Landing Page and Design System Showcase
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- MOCK STATE & SESSION MANAGEMENT ---
  window.logoutUser = function (e) {
    if (e) e.preventDefault();
    if (window.FreelanceInAPI) FreelanceInAPI.clearSession();
    else localStorage.removeItem('freelancein_user');
    window.location.href = 'index.html?logout=success';
  };

  // Re-check for logout/login status parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('logout') === 'success') {
    window.history.replaceState({}, document.title, window.location.pathname);
    setTimeout(() => {
      showToast('Berhasil Keluar', 'Anda telah keluar dari akun FreelanceIn.', 'success');
    }, 100);
  }
  if (urlParams.get('login') === 'success') {
    window.history.replaceState({}, document.title, window.location.pathname);
    setTimeout(() => {
      showToast('Selamat Datang!', 'Proses masuk berhasil. Selamat bekerja!', 'success');
    }, 100);
  }

  function initSessionAndHeaders() {
    const userJson = localStorage.getItem('freelancein_user');
    const navMenu = document.querySelector('.nav-menu');
    const navRight = document.querySelector('.nav-right');
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    if (!userJson) {
      // VISITOR STATE - Setup Default Nav
      if (navMenu) {
        navMenu.innerHTML = `
          <li class="nav-item ${currentPath === 'index.html' || currentPath === '' ? 'text-primary' : ''}"><a href="index.html">Home</a></li>
          <li class="nav-item ${currentPath === 'marketplace.html' ? 'text-primary' : ''}"><a href="marketplace.html">Cari Talenta</a></li>
          <li class="nav-item ${currentPath === 'projects.html' ? 'text-primary' : ''}"><a href="projects.html">Cari Proyek</a></li>
          <li class="nav-item"><a href="index.html#alur-kolaborasi">Cara Kerja</a></li>
        `;
      }
      if (navRight) {
        navRight.innerHTML = `
          <div class="header-search">
            <input type="text" placeholder="Cari talenta IT atau proyek...">
            <span class="header-search-icon">
              <i data-lucide="search" style="width: 16px; height: 16px;"></i>
            </span>
          </div>
          <a href="login.html" class="btn-text" style="font-size: var(--font-sm); font-weight: 600;">Masuk</a>
          <a href="login.html#register" class="btn btn-outline btn-sm">Daftar</a>
          <a href="login.html" class="btn btn-primary btn-sm">Posting Pekerjaan</a>
          <button class="mobile-nav-toggle">
            <i data-lucide="menu"></i>
          </button>
        `;
      }
      return;
    }

    // LOGGED IN USER
    const user = JSON.parse(userJson);
    const userInitials = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'US';

    if (user.role === 'mahasiswa') {
      if (navMenu) {
        navMenu.innerHTML = `
          <li class="nav-item"><a href="index.html">Home</a></li>
          <li class="nav-item ${currentPath === 'projects.html' ? 'text-primary' : ''}"><a href="projects.html">Cari Proyek</a></li>
          <li class="nav-item ${currentPath === 'student-dashboard.html' ? 'text-primary' : ''}"><a href="student-dashboard.html">Dashboard</a></li>
          <li class="nav-item ${currentPath === 'messages.html' ? 'text-primary' : ''}"><a href="messages.html">Pesan</a></li>
        `;
      }
      if (navRight) {
        navRight.innerHTML = `
          <div class="header-search">
            <input type="text" placeholder="Cari lowongan proyek...">
            <span class="header-search-icon">
              <i data-lucide="search" style="width: 16px; height: 16px;"></i>
            </span>
          </div>
          <a href="messages.html" class="btn-text" style="padding: var(--space-xs) var(--space-sm); position: relative; display: flex; align-items: center;" title="Pesan">
            <i data-lucide="message-square" style="width: 20px; height: 20px;"></i>
            <span class="badge badge-danger notif-badge" style="position: absolute; top: -5px; right: -5px; padding: 2px 5px; font-size: 8px; display: none;">0</span>
          </a>
          <div class="user-menu-wrapper" style="position: relative; cursor: pointer; display: flex; align-items: center;">
            <div class="user-menu-trigger d-flex align-center gap-xs">
              <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120&auto=format&fit=crop" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-accent);" alt="Avatar">
              <span style="font-size: var(--font-xs); font-weight: 600; color: var(--color-slate-700); max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${user.name.split(' ')[0]} (Mhs)</span>
              <i data-lucide="chevron-down" style="width: 12px; height: 12px; color: var(--color-slate-500);"></i>
            </div>
            <div class="user-dropdown" style="display: none; position: absolute; top: 120%; right: 0; background: var(--color-white); border: 1px solid var(--color-slate-200); border-radius: var(--radius-sm); box-shadow: var(--shadow-lg); width: 180px; z-index: 110; padding: var(--space-xs) 0;">
              <a href="student-dashboard.html" style="display: block; padding: 8px 16px; font-size: var(--font-xs); color: var(--color-slate-700); font-weight: 500;">Dashboard Saya</a>
              <a href="profile.html" style="display: block; padding: 8px 16px; font-size: var(--font-xs); color: var(--color-slate-700); font-weight: 500;">Profil Publik</a>
              <a href="#" onclick="logoutUser(event)" style="display: block; padding: 8px 16px; font-size: var(--font-xs); color: var(--color-danger); border-top: 1px solid var(--color-slate-100); font-weight: 600;">Keluar</a>
            </div>
          </div>
          <button class="mobile-nav-toggle">
            <i data-lucide="menu"></i>
          </button>
        `;
      }
    } else if (user.role === 'umkm') {
      if (navMenu) {
        navMenu.innerHTML = `
          <li class="nav-item"><a href="index.html">Home</a></li>
          <li class="nav-item ${currentPath === 'marketplace.html' ? 'text-primary' : ''}"><a href="marketplace.html">Cari Talenta</a></li>
          <li class="nav-item ${currentPath === 'umkm-dashboard.html' ? 'text-primary' : ''}"><a href="umkm-dashboard.html">Dashboard UMKM</a></li>
          <li class="nav-item ${currentPath === 'messages.html' ? 'text-primary' : ''}"><a href="messages.html">Pesan</a></li>
        `;
      }
      if (navRight) {
        navRight.innerHTML = `
          <div class="header-search">
            <input type="text" placeholder="Cari talenta IT...">
            <span class="header-search-icon">
              <i data-lucide="search" style="width: 16px; height: 16px;"></i>
            </span>
          </div>
          <a href="messages.html" class="btn-text" style="padding: var(--space-xs) var(--space-sm); position: relative; display: flex; align-items: center;" title="Pesan">
            <i data-lucide="message-square" style="width: 20px; height: 20px;"></i>
            <span class="badge badge-danger notif-badge" style="position: absolute; top: -5px; right: -5px; padding: 2px 5px; font-size: 8px; display: none;">0</span>
          </a>
          <div class="user-menu-wrapper" style="position: relative; cursor: pointer; display: flex; align-items: center;">
            <div class="user-menu-trigger d-flex align-center gap-xs">
              <div style="width: 36px; height: 36px; border-radius: 50%; background-color: var(--color-primary); color: var(--color-slate-900); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: var(--font-sm); border: 2px solid var(--color-accent);">
                ${userInitials}
              </div>
              <span style="font-size: var(--font-xs); font-weight: 600; color: var(--color-slate-700); max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${user.name.split(' ')[0]} (UMKM)</span>
              <i data-lucide="chevron-down" style="width: 12px; height: 12px; color: var(--color-slate-500);"></i>
            </div>
            <div class="user-dropdown" style="display: none; position: absolute; top: 120%; right: 0; background: var(--color-white); border: 1px solid var(--color-slate-200); border-radius: var(--radius-sm); box-shadow: var(--shadow-lg); width: 180px; z-index: 110; padding: var(--space-xs) 0;">
              <a href="umkm-dashboard.html" style="display: block; padding: 8px 16px; font-size: var(--font-xs); color: var(--color-slate-700); font-weight: 500;">Dashboard Saya</a>
              <a href="#" onclick="logoutUser(event)" style="display: block; padding: 8px 16px; font-size: var(--font-xs); color: var(--color-danger); border-top: 1px solid var(--color-slate-100); font-weight: 600;">Keluar</a>
            </div>
          </div>
          <a href="umkm-dashboard.html?post=true" class="btn btn-primary btn-sm">Posting Pekerjaan</a>
          <button class="mobile-nav-toggle">
            <i data-lucide="menu"></i>
          </button>
        `;
      }
    } else if (user.role === 'admin') {
      if (navMenu) {
        navMenu.innerHTML = `
          <li class="nav-item ${currentPath === 'admin.html' ? 'text-primary' : ''}"><a href="admin.html">Verifikasi KTM</a></li>
        `;
      }
      if (navRight) {
        navRight.innerHTML = `
          <span style="font-size:var(--font-xs);font-weight:600;color:var(--color-slate-600);">Admin</span>
          <a href="#" onclick="logoutUser(event)" class="btn btn-outline btn-sm">Keluar</a>
        `;
      }
    }

    // Bind User Dropdown Toggle
    document.querySelectorAll('.user-menu-wrapper').forEach(wrapper => {
      wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = wrapper.querySelector('.user-dropdown');
        if (dropdown) {
          const isVisible = dropdown.style.display === 'block';
          document.querySelectorAll('.user-dropdown').forEach(d => d.style.display = 'none');
          dropdown.style.display = isVisible ? 'none' : 'block';
        }
      });
    });

    document.addEventListener('click', () => {
      document.querySelectorAll('.user-dropdown').forEach(d => d.style.display = 'none');
    });
  }

  // Initialize session headers first
  initSessionAndHeaders();

  // Load notification badge count
  if (window.FreelanceInAPI && FreelanceInAPI.getToken()) {
    FreelanceInAPI.getNotifications().then(({ unread }) => {
      document.querySelectorAll('.notif-badge').forEach(b => {
        if (unread > 0) {
          b.textContent = unread > 9 ? '9+' : unread;
          b.style.display = 'block';
        }
      });
    }).catch(() => {});
  }

  // Re-create icons if Lucide is available
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 1. Mobile Navigation Menu Toggle
  const mobileToggle = document.querySelector('.mobile-nav-toggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      // Create and toggle a basic mobile menu overlay if it doesn't exist
      let mobileOverlay = document.getElementById('mobile-nav-overlay');
      if (!mobileOverlay) {
        mobileOverlay = document.createElement('div');
        mobileOverlay.id = 'mobile-nav-overlay';
        mobileOverlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: var(--color-white);
          z-index: 999;
          padding: 80px 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        `;

        // Copy links from desktop menu
        const desktopMenu = document.querySelector('.nav-menu');
        if (desktopMenu) {
          const menuClone = desktopMenu.cloneNode(true);
          menuClone.style.flexDirection = 'column';
          menuClone.style.alignItems = 'flex-start';
          menuClone.style.display = 'flex';
          menuClone.style.gap = '20px';
          mobileOverlay.appendChild(menuClone);
        }

        // Add a close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
          position: absolute;
          top: 20px;
          right: 24px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
        `;
        closeBtn.addEventListener('click', () => {
          mobileOverlay.style.opacity = '0';
          mobileOverlay.style.pointerEvents = 'none';
        });
        mobileOverlay.appendChild(closeBtn);

        // Add action buttons
        const actionWrapper = document.createElement('div');
        actionWrapper.style.cssText = 'display:flex; flex-direction:column; gap:12px; margin-top:20px;';
        actionWrapper.innerHTML = `
          <a href="login.html" class="btn btn-outline" style="text-align:center;">Masuk</a>
          <a href="login.html#register" class="btn btn-primary" style="text-align:center;">Daftar</a>
        `;
        mobileOverlay.appendChild(actionWrapper);

        document.body.appendChild(mobileOverlay);
      }

      mobileOverlay.style.opacity = '1';
      mobileOverlay.style.pointerEvents = 'auto';
    });
  }

  // 2. Tab Switching for "Cara Kerja" (UMKM vs Mahasiswa)
  const tabButtons = document.querySelectorAll('.work-tab-btn');
  const contentPanels = document.querySelectorAll('.work-content-panel');

  if (tabButtons.length > 0 && contentPanels.length > 0) {
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;

        // Remove active state from all buttons
        tabButtons.forEach(b => b.classList.remove('active'));
        // Hide all content panels
        contentPanels.forEach(p => p.classList.remove('active'));

        // Add active state to clicked button
        btn.classList.add('active');
        // Show target content panel
        const targetPanel = document.getElementById(`work-tab-${target}`);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      });
    });
  }

  // 3. Search Bar Interaction (Hero & Header)
  const headerSearchInput = document.querySelector('.header-search input');
  const headerSearchIcon = document.querySelector('.header-search-icon');

  const heroSearchInput = document.querySelector('.hero-search-box input');
  const heroSearchButton = document.querySelector('.hero-search-box button');

  function handleSearch(query) {
    const userRaw = localStorage.getItem('freelancein_user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    const isMarketplace = window.location.pathname.includes('marketplace.html');
    const isProjects = window.location.pathname.includes('projects.html');

    if (user && user.role === 'mahasiswa') {
      if (isProjects) {
        const inp = document.getElementById('filter-search');
        if (inp) { inp.value = query; if (typeof loadJobs === 'function') loadJobs(); }
      } else {
        window.location.href = `projects.html?search=${encodeURIComponent(query)}`;
      }
      return;
    }

    if (isMarketplace) {
      const globalInput = document.getElementById('global-search-input');
      if (globalInput) {
        globalInput.value = query;
        if (typeof window.filterFreelancers === 'function') {
          window.filterFreelancers();
        }
      }
    } else {
      window.location.href = `marketplace.html?search=${encodeURIComponent(query)}`;
    }
  }

  if (heroSearchInput && heroSearchButton) {
    heroSearchButton.addEventListener('click', () => {
      const query = heroSearchInput.value.trim();
      if (query) {
        handleSearch(query);
      } else {
        showToast('Peringatan', 'Silakan masukkan kata kunci pencarian terlebih dahulu.', 'warning');
      }
    });
    heroSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        heroSearchButton.click();
      }
    });
  }

  if (headerSearchInput) {
    if (headerSearchIcon) {
      headerSearchIcon.addEventListener('click', () => {
        const query = headerSearchInput.value.trim();
        if (query) {
          handleSearch(query);
        }
      });
    }
    headerSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = headerSearchInput.value.trim();
        if (query) {
          handleSearch(query);
        }
      }
    });
  }

  // 4. Custom Dropzone File Upload Interaction (if present in Design System)
  const dropzone = document.querySelector('.dropzone');
  if (dropzone) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    fileInput.multiple = true;
    dropzone.appendChild(fileInput);

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('active');
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, () => {
        dropzone.classList.remove('active');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      handleUploadedFiles(files);
    });

    fileInput.addEventListener('change', () => {
      handleUploadedFiles(fileInput.files);
    });
  }

  function handleUploadedFiles(files) {
    if (files.length > 0) {
      const fileNames = Array.from(files).map(f => f.name).join(', ');
      showToast('Berhasil', `${files.length} file terpilih: ${fileNames}`);
      const infoText = document.querySelector('.dropzone p');
      if (infoText) {
        infoText.innerHTML = `<strong>${files.length} Berkas Diunggah:</strong><br>${fileNames}`;
      }
    }
  }

  // 5. Toast Notification System
  window.showToast = function (title, message, type = 'info') {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';

    // Choose icon based on type
    let iconSvg = `<svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`; // default info

    if (title === 'Berhasil' || type === 'success') {
      toast.style.borderLeftColor = 'var(--color-success)';
      iconSvg = `<svg class="alert-icon" style="color: var(--color-success)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (title === 'Peringatan' || type === 'warning') {
      toast.style.borderLeftColor = 'var(--color-warning)';
      iconSvg = `<svg class="alert-icon" style="color: var(--color-warning)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    } else if (title === 'Gagal' || type === 'danger') {
      toast.style.borderLeftColor = 'var(--color-danger)';
      iconSvg = `<svg class="alert-icon" style="color: var(--color-danger)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
      toast.style.borderLeftColor = 'var(--color-primary-dark)';
    }

    toast.innerHTML = `
      ${iconSvg}
      <div>
        <h4 style="font-size: var(--font-sm); font-weight: 700; color: var(--color-slate-900);">${title}</h4>
        <p style="font-size: var(--font-xs); color: var(--color-slate-600); margin-top: 2px;">${message}</p>
      </div>
      <span class="toast-close">✕</span>
    `;

    toastContainer.appendChild(toast);

    // Animation trigger
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    });

    // Auto remove
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
      }
    }, 4000);
  };

  // 6. Generic Modal Trigger
  const modalTriggers = document.querySelectorAll('[data-toggle="modal"]');
  modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = trigger.getAttribute('data-target');
      const modal = document.getElementById(targetId);
      if (modal) {
        modal.classList.add('show');
      }
    });
  });

  const modalCloses = document.querySelectorAll('.modal-close, .modal-overlay, [data-dismiss="modal"]');
  modalCloses.forEach(close => {
    close.addEventListener('click', (e) => {
      if (e.target === close || close.classList.contains('modal-close') || close.getAttribute('data-dismiss') === 'modal') {
        const modal = close.closest('.modal');
        if (modal) {
          modal.classList.remove('show');
        }
      }
    });
  });

  // 7. Showcase Copy Code Function (if present on Design System page)
  const copyButtons = document.querySelectorAll('.btn-copy-code');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const codeBlock = btn.previousElementSibling;
      if (codeBlock && codeBlock.tagName === 'PRE') {
        navigator.clipboard.writeText(codeBlock.innerText).then(() => {
          const originalText = btn.innerText;
          btn.innerText = 'Disalin!';
          btn.classList.add('btn-primary');
          btn.style.color = '#000';
          showToast('Berhasil', 'Kode komponen disalin ke papan klip.', 'success');
          setTimeout(() => {
            btn.innerText = originalText;
            btn.classList.remove('btn-primary');
            btn.style.color = '';
          }, 2000);
        });
      }
    });
  });

  // 8. Interactivity for Demonstration Fields in Showcase
  const demoForm = document.getElementById('demo-validation-form');
  if (demoForm) {
    demoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const inputNama = document.getElementById('demo-nama');
      const inputEmail = document.getElementById('demo-email');
      let valid = true;

      // Reset
      inputNama.closest('.form-group').classList.remove('has-error', 'has-success');
      inputEmail.closest('.form-group').classList.remove('has-error', 'has-success');
      const errors = demoForm.querySelectorAll('.form-error-text');
      errors.forEach(err => err.remove());

      if (!inputNama.value.trim()) {
        valid = false;
        inputNama.closest('.form-group').classList.add('has-error');
        const errText = document.createElement('span');
        errText.className = 'form-error-text';
        errText.innerText = 'Nama lengkap wajib diisi.';
        inputNama.parentNode.appendChild(errText);
      } else {
        inputNama.closest('.form-group').classList.add('has-success');
      }

      if (!inputEmail.value.trim() || !inputEmail.value.includes('@')) {
        valid = false;
        inputEmail.closest('.form-group').classList.add('has-error');
        const errText = document.createElement('span');
        errText.className = 'form-error-text';
        errText.innerText = 'Email tidak valid.';
        inputEmail.parentNode.appendChild(errText);
      } else {
        inputEmail.closest('.form-group').classList.add('has-success');
      }

      if (valid) {
        showToast('Berhasil', 'Formulir demo berhasil divalidasi.', 'success');
      } else {
        showToast('Gagal', 'Silakan perbaiki kesalahan formulir.', 'danger');
      }
    });
  }
});
