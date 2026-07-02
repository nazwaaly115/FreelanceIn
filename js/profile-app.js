/**
 * FreelanceIn — Profil mahasiswa dari API + fallback demo
 */
(function () {
  let _portfolio = [];

  const STATIC = {
    siti: {
      name: 'Siti Rahma', role: 'UI/UX Designer & Prototyper',
      univ: 'S1 Sistem Informasi - ITB', semester: '6',
      hourly_rate: 120000,
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=160&auto=format&fit=crop',
      bio: 'Desainer UI/UX mahasiswa ITB spesialis e-commerce dan mobile app.',
      skills: ['Figma', 'Adobe XD', 'UI/UX', 'Prototyping'],
      portfolio: [{ title: 'E-Commerce Hijab UI Kit', tech: 'Figma, Prototyping', image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=600' }],
      ktm_status: 'verified', email: 'siti@mahasiswa.itb.ac.id'
    },
    rian: {
      name: 'Rian Pratama', role: 'Mobile App Developer',
      univ: 'S1 Teknik Informatika - UGM', semester: '7',
      hourly_rate: 95000,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=160',
      bio: 'Pengembang Flutter & React Native untuk UMKM.',
      skills: ['Flutter', 'Dart', 'Firebase', 'React Native'],
      portfolio: [{ title: 'App Delivery UMKM', tech: 'Flutter, Firebase', image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=600' }],
      ktm_status: 'verified', email: 'rian@mahasiswa.ugm.ac.id'
    },
    dewi: {
      name: 'Dewi Lestari', role: 'Data Analyst & ML Enthusiast',
      univ: 'S1 Statistika - IPB', semester: '5',
      hourly_rate: 90000,
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=160',
      bio: 'Analisis data penjualan dan visualisasi untuk UMKM.',
      skills: ['Python', 'Pandas', 'Tableau', 'SQL'],
      portfolio: [{ title: 'Sales Dashboard UMKM', tech: 'Python, Tableau', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600' }],
      ktm_status: 'verified', email: 'dewi@mahasiswa.ipb.ac.id'
    }
  };

  const LEGACY_API_ID = { budi: 2 };

  function formatRate(rate) {
    const n = Number(rate) || 75000;
    return 'Rp ' + n.toLocaleString('id-ID') + ' / jam';
  }

  function toDisplay(user, reviews = []) {
    const skills = user.skills || [];
    const portfolio = (user.portfolio || []).map(p => ({
      title: p.title,
      desc: p.tech || p.desc || '',
      fullDesc: p.fullDesc || `${p.title}. Dibangun dengan ${p.tech || 'teknologi modern'}.`,
      tech: p.tech || '',
      img: p.image || p.img || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600'
    }));
    return {
      id: user.id,
      name: user.name,
      role: (user.role && !['mahasiswa', 'umkm', 'admin'].includes(user.role))
        ? user.role
        : (skills[0] ? `${skills[0]} Developer` : 'Mahasiswa IT Freelancer'),
      univ: user.univ ? (user.univ.startsWith('S1') ? user.univ : `S1 - ${user.univ}`) : 'Mahasiswa IT',
      sem: `Semester ${user.semester || '5'}`,
      location: 'Indonesia',
      timezone: 'Waktu lokal: WIB',
      rate: formatRate(user.hourly_rate),
      projects: `${portfolio.length} Proyek`,
      hours: '—',
      success: user.ktm_status === 'verified' ? '100% Terverifikasi' : 'Menunggu KTM',
      email: user.email,
      avatar: user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=160',
      bio1: user.bio || `Halo! Saya ${user.name}, mahasiswa IT di ${user.univ || 'kampus terdaftar'}.`,
      bio2: 'Siap membantu UMKM Indonesia bertransformasi digital dengan kualitas kampus dan harga terjangkau.',
      skills,
      portfolio,
      reviews,
      ktmVerified: user.ktm_status === 'verified'
    };
  }

  async function resolveUser(key) {
    if (key === 'me') {
      const { user } = await FreelanceInAPI.me();
      return { user, isOwner: true };
    }
    if (/^\d+$/.test(key)) {
      const { user } = await FreelanceInAPI.getUser(key);
      const session = FreelanceInAPI.getSessionUser();
      return { user, isOwner: session && session.id === user.id };
    }
    if (LEGACY_API_ID[key]) {
      const { user } = await FreelanceInAPI.getUser(LEGACY_API_ID[key]);
      const session = FreelanceInAPI.getSessionUser();
      return { user, isOwner: session && session.id === user.id };
    }
    if (STATIC[key]) {
      const session = FreelanceInAPI.getSessionUser();
      return { user: STATIC[key], isOwner: false };
    }
    const { user } = await FreelanceInAPI.getUser(2);
    return { user, isOwner: false };
  }

  function render(data, isOwner) {
    window.activeProfileName = data.name;
    document.title = `${data.name} - FreelanceIn`;
    document.querySelector('.profile-large-avatar').src = data.avatar;
    document.getElementById('prof-name').textContent = data.name;
    document.getElementById('prof-location').textContent = data.location;
    document.getElementById('prof-timezone').textContent = data.timezone;
    document.getElementById('prof-sidebar-rate').textContent = data.rate;
    document.getElementById('prof-sidebar-projects').textContent = data.projects;
    document.getElementById('prof-sidebar-hours').textContent = data.hours;
    document.getElementById('prof-sidebar-success').textContent = data.success;
    document.getElementById('prof-sidebar-email').textContent = data.email;
    document.getElementById('prof-sidebar-univ').textContent = (data.univ || '').replace(/^S1\s*-?\s*/, '').replace(/^S1\s+/, '');
    document.getElementById('prof-sidebar-date').textContent = `2023 - Sekarang (${data.sem})`;
    document.getElementById('prof-main-title').textContent = data.role;
    document.getElementById('prof-main-rate').innerHTML = `${data.rate.replace(' / jam', '')} <span>/ jam</span>`;
    document.getElementById('prof-bio-1').textContent = data.bio1;
    document.getElementById('prof-bio-2').textContent = data.bio2;

    const badge = document.querySelector('.profile-header-info .badge');
    if (badge) {
      badge.style.display = data.ktmVerified ? 'inline-flex' : 'none';
    }

    const skillsEl = document.getElementById('prof-skills-list');
    skillsEl.innerHTML = data.skills.map(s => `<span class="tag-skill">${s}</span>`).join('') || '<span class="tag-skill">IT</span>';

    const portEl = document.getElementById('prof-portfolio-list');
    _portfolio = data.portfolio;
    if (!data.portfolio.length) {
      portEl.innerHTML = '<div style="grid-column:1/-1;padding:24px;text-align:center;color:var(--color-slate-400);font-size:var(--font-xs);">Belum ada portofolio.</div>';
    } else {
      portEl.innerHTML = data.portfolio.map((item, i) => `
        <div class="portfolio-detailed-card" onclick="ProfileApp.openPortfolioByIndex(${i})">
          <img src="${item.img}" alt="${item.title}" class="portfolio-detailed-img">
          <div class="portfolio-detailed-content">
            <h4 class="portfolio-detailed-title">${item.title}</h4>
            <p class="portfolio-detailed-desc">${item.desc}</p>
            <div class="freelancer-skills" style="gap:4px;">
              ${(item.tech || '').split(',').map(t => `<span class="tag-skill" style="padding:2px 6px;font-size:10px;">${t.trim()}</span>`).join('')}
            </div>
          </div>
        </div>
      `).join('');
    }

    const revEl = document.getElementById('prof-reviews-list');
    revEl.innerHTML = data.reviews.length
      ? data.reviews.map(r => `<div class="review-item"><h4>${r.job}</h4><p>${r.feedback}</p></div>`).join('')
      : '<div style="padding:24px;text-align:center;color:var(--color-slate-400);font-size:var(--font-xs);">Belum ada ulasan.</div>';

    const editBtn = document.getElementById('prof-edit-btn');
    if (editBtn) editBtn.style.display = isOwner ? 'inline-flex' : 'none';

    const msgBtn = document.getElementById('prof-message-btn');
    if (msgBtn && data.id) msgBtn.href = 'messages.html';

    if (window.lucide) lucide.createIcons();
  }

  function openPortfolioByIndex(i) {
    const item = _portfolio[i];
    if (!item) return;
    openPortfolioModal(item.title, item.fullDesc, item.tech, item.img);
  }

  function openPortfolioModal(title, details, tech, imgSrc) {
    document.getElementById('port-modal-title').textContent = title;
    document.getElementById('port-modal-desc').textContent = details;
    document.getElementById('port-modal-tech').textContent = tech;
    document.getElementById('port-modal-img').src = imgSrc;
    document.getElementById('portfolio-modal').classList.add('show');
  }

  async function saveProfile(event) {
    event.preventDefault();
    const bio = document.getElementById('edit-bio').value.trim();
    const skillsRaw = document.getElementById('edit-skills').value.trim();
    const skills = skillsRaw.split(',').map(s => s.trim()).filter(Boolean);
    try {
      await FreelanceInAPI.updateProfile({ bio, skills });
      showToast('Profil Diperbarui', 'Perubahan profil jasa tersimpan.', 'success');
      document.getElementById('edit-profile-modal').classList.remove('show');
      init();
    } catch (err) {
      showToast('Gagal', err.message, 'danger');
    }
  }

  function openEditModal() {
    const bio1 = document.getElementById('prof-bio-1').textContent;
    const skills = [...document.querySelectorAll('#prof-skills-list .tag-skill')].map(el => el.textContent).join(', ');
    document.getElementById('edit-bio').value = bio1;
    document.getElementById('edit-skills').value = skills;
    document.getElementById('edit-profile-modal').classList.add('show');
  }

  function submitHireOffer(event) {
    event.preventDefault();
    document.getElementById('hire-modal').classList.remove('show');
    showToast('Penawaran Terkirim', `Undangan dikirim ke ${window.activeProfileName}.`, 'success');
  }

  async function init() {
    const params = new URLSearchParams(window.location.search);
    let key = params.get('user');
    if (!key && FreelanceInAPI.getSessionUser()?.role === 'mahasiswa') key = 'me';
    if (!key) key = 'budi';

    try {
      const { user, isOwner } = await resolveUser(key);
      render(toDisplay(user), isOwner);
      if (window.location.hash === '#hire') document.getElementById('hire-modal')?.classList.add('show');
    } catch (err) {
      if (STATIC[key]) render(toDisplay(STATIC[key]), false);
      else showToast('Error', err.message, 'danger');
    }
  }

  window.ProfileApp = { openPortfolioModal, openPortfolioByIndex, openEditModal, saveProfile, submitHireOffer, init };
  window.addEventListener('load', init);
})();
