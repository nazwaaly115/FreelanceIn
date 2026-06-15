/**
 * FreelanceIn Main JS
 * Controls interactivity for both Landing Page and Design System Showcase
 */

document.addEventListener('DOMContentLoaded', () => {
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
          mobileOverlay.style.pointer-events = 'none';
        });
        mobileOverlay.appendChild(closeBtn);
        
        // Add action buttons
        const actionWrapper = document.createElement('div');
        actionWrapper.style.cssText = 'display:flex; flex-direction:column; gap:12px; margin-top:20px;';
        actionWrapper.innerHTML = `
          <a href="#" class="btn btn-outline" style="text-align:center;">Masuk</a>
          <a href="#" class="btn btn-primary" style="text-align:center;">Daftar</a>
        `;
        mobileOverlay.appendChild(actionWrapper);
        
        document.body.appendChild(mobileOverlay);
      }
      
      mobileOverlay.style.opacity = '1';
      mobileOverlay.style.pointer-events = 'auto';
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
    const isMarketplace = window.location.pathname.includes('marketplace.html');
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
  window.showToast = function(title, message, type = 'info') {
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
