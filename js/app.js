/**
 * CampusGuard - Main Application Controller
 * Orchestrates all 9 screens, navigation, algorithms, local storage, and celebratory feedback.
 */

// Imports removed; using globals from concatenated scripts

// Using globals: StorageService, ConfettiEngine (loaded via separate script tags)

class CampusGuardApp {
  constructor() {
    this.confetti = null;
    this.currentScreenId = 'screen-1-welcome';
    this.selectedCategory = 'Safety';
    this.selectedSeverity = 2;
    this.selectedUrgency = 2;
    this.selectedPeople = 2;
    this.currentPhotoUrl = null;
    this.currentPhotoTag = null;
    this.mapCategoryFilter = 'All';
    this.staffFilter = 'open'; // 'open' | 'resolved'
    this.activeZoneInspect = 'Cafeteria';

    this.init();
  }

  init() {
    StorageService.init();
    this.confetti = new ConfettiEngine('confetti-canvas');

    this.setupClock();
    this.bindEvents();
    this.syncProfileHUD();
    this.renderEcoScreen();
    this.renderWellbeingScreen();
    this.renderCampusImpact();
    this.renderCampusMap();
    this.renderSchoolDashboard();
    this.renderLeaderboardModal();

    // Check if user has previously completed welcome screen
    const profile = StorageService.getProfile();
    if (profile.hasCompletedWelcome) {
      this.navigateTo('screen-2-dashboard');
    }
  }

  setupClock() {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const clockEl = document.getElementById('device-clock');
      if (clockEl) clockEl.textContent = `${hours}:${mins}`;
    };
    updateTime();
    setInterval(updateTime, 30000);
  }

  bindEvents() {
    // Top Bar Simulator Controls
    document.getElementById('btn-mode-mobile')?.addEventListener('click', () => {
      document.getElementById('device-container')?.classList.remove('full-screen-mode');
      document.getElementById('btn-mode-mobile')?.classList.add('active');
      document.getElementById('btn-mode-desktop')?.classList.remove('active');
    });

    document.getElementById('btn-mode-desktop')?.addEventListener('click', () => {
      document.getElementById('device-container')?.classList.add('full-screen-mode');
      document.getElementById('btn-mode-desktop')?.classList.add('active');
      document.getElementById('btn-mode-mobile')?.classList.remove('active');
    });

    document.getElementById('btn-role-toggle')?.addEventListener('click', () => {
      this.toggleStaffRole();
    });

    document.getElementById('btn-reset-data')?.addEventListener('click', () => {
      if (confirm('Reset all demo data to default state?')) {
        StorageService.resetDefaults();
        location.reload();
      }
    });

    // Welcome Screen
    document.getElementById('btn-get-started')?.addEventListener('click', () => {
      const classSelect = document.getElementById('welcome-class-select');
      const profile = StorageService.getProfile();
      profile.class = classSelect.value;
      profile.hasCompletedWelcome = true;
      StorageService.saveProfile(profile);
      this.syncProfileHUD();
      this.navigateTo('screen-2-dashboard');
    });

    // HUD Leaderboard & Class click
    document.getElementById('hud-class-selector')?.addEventListener('click', () => {
      this.openLeaderboardModal();
    });

    // Screen 2 Dashboard Card Clicks (PRD 6 Cards)
    document.getElementById('card-action-safety')?.addEventListener('click', () => {
      this.openReportForm('Safety');
    });

    document.getElementById('card-action-accessibility')?.addEventListener('click', () => {
      this.openReportForm('Accessibility');
    });

    document.getElementById('card-action-eco')?.addEventListener('click', () => {
      this.navigateTo('screen-5-eco');
    });

    document.getElementById('card-action-wellbeing')?.addEventListener('click', () => {
      this.navigateTo('screen-6-wellbeing');
    });

    document.getElementById('card-action-impact')?.addEventListener('click', () => {
      this.navigateTo('screen-7-impact');
    });

    document.getElementById('card-action-map')?.addEventListener('click', () => {
      this.navigateTo('screen-8-map');
    });

    // Bottom Navigation Bar
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetScreen = btn.getAttribute('data-target');
        if (targetScreen) {
          this.navigateTo(targetScreen);
        }
      });
    });

    // Screen 3 Report Form Category Toggle
    document.getElementById('opt-cat-safety')?.addEventListener('click', () => {
      this.setReportCategory('Safety');
    });

    document.getElementById('opt-cat-accessibility')?.addEventListener('click', () => {
      this.setReportCategory('Accessibility');
    });

    // Back from Report
    document.getElementById('btn-back-from-report')?.addEventListener('click', () => {
      this.navigateTo('screen-2-dashboard');
    });

    // Photo Attachment & Tier A Auto-Classification
    const dropZone = document.getElementById('photo-drop-zone');
    const fileInput = document.getElementById('file-photo-input');
    dropZone?.addEventListener('click', (e) => {
      if (e.target.id === 'btn-remove-photo') return;
      fileInput.click();
    });

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.attachPhoto(ev.target.result, 'custom');
        };
        reader.readAsDataURL(file);
      }
    });

    document.getElementById('btn-remove-photo')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.removePhoto();
    });

    // Quick Sample Photo Buttons (for instant judging demos)
    document.querySelectorAll('.sample-photo-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tag = btn.getAttribute('data-tag');
        const url = btn.getAttribute('data-url');
        this.attachPhoto(url, tag);
      });
    });

    // Option Selector Groups (Severity, Urgency, People Affected)
    this.setupButtonGroup('grp-severity', (val) => {
      this.selectedSeverity = parseInt(val, 10);
    });

    this.setupButtonGroup('grp-urgency', (val) => {
      this.selectedUrgency = parseInt(val, 10);
    });

    this.setupButtonGroup('grp-people', (val) => {
      this.selectedPeople = parseInt(val, 10);
    });

    // Form Submit (Report an Issue)
    document.getElementById('form-report-issue')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleReportSubmit();
    });

    // Screen 4 Priority Result Actions
    document.getElementById('btn-result-view-map')?.addEventListener('click', () => {
      this.navigateTo('screen-8-map');
    });

    document.getElementById('btn-result-to-dashboard')?.addEventListener('click', () => {
      this.navigateTo('screen-2-dashboard');
    });

    // Screen 5 Eco Mission Completion
    document.getElementById('btn-complete-eco')?.addEventListener('click', () => {
      this.handleEcoCompletion();
    });

    document.getElementById('btn-view-full-leaderboard')?.addEventListener('click', () => {
      this.openLeaderboardModal();
    });

    document.getElementById('btn-close-leaderboard')?.addEventListener('click', () => {
      this.closeLeaderboardModal();
    });

    document.getElementById('leaderboard-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'leaderboard-modal') {
        this.closeLeaderboardModal();
      }
    });

    // Screen 6 Wellbeing Check-in Emoji Clicks
    document.querySelectorAll('.mood-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mood = btn.getAttribute('data-mood');
        this.handleMoodSelection(mood);
      });
    });

    // Screen 7 Impact Cards Filter-and-Navigate to Map
    document.querySelectorAll('.stat-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        this.mapCategoryFilter = filter || 'All';
        this.navigateTo('screen-8-map');
        this.updateMapFilterPills();
        this.renderCampusMap();
      });
    });

    // Screen 8 Map Filter Buttons
    document.querySelectorAll('.map-filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        this.mapCategoryFilter = btn.getAttribute('data-filter') || 'All';
        this.updateMapFilterPills();
        this.renderCampusMap();
      });
    });

    // Screen 9 Staff Dashboard Filters & Exit
    document.getElementById('tab-staff-open')?.addEventListener('click', () => {
      this.staffFilter = 'open';
      document.getElementById('tab-staff-open')?.classList.add('selected');
      document.getElementById('tab-staff-resolved')?.classList.remove('selected');
      this.renderSchoolDashboard();
    });

    document.getElementById('tab-staff-resolved')?.addEventListener('click', () => {
      this.staffFilter = 'resolved';
      document.getElementById('tab-staff-resolved')?.classList.add('selected');
      document.getElementById('tab-staff-open')?.classList.remove('selected');
      this.renderSchoolDashboard();
    });

    document.getElementById('btn-exit-staff')?.addEventListener('click', () => {
      this.toggleStaffRole(false);
    });
  }

  setupButtonGroup(groupId, callback) {
    const container = document.getElementById(groupId);
    if (!container) return;
    const buttons = container.querySelectorAll('.cg-option-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        callback(btn.getAttribute('data-val'));
      });
    });
  }

  navigateTo(screenId) {
    const currentScreen = document.getElementById(this.currentScreenId);
    const targetScreen = document.getElementById(screenId);
    if (!targetScreen) return;

    if (currentScreen) {
      currentScreen.classList.remove('active');
    }

    targetScreen.classList.add('active');
    this.currentScreenId = screenId;

    // Scroll viewport to top
    const viewport = document.getElementById('app-viewport');
    if (viewport) viewport.scrollTop = 0;

    // Manage visibility of HUD and Bottom Nav
    const hud = document.getElementById('app-hud');
    const bottomNav = document.getElementById('bottom-nav-bar');

    if (screenId === 'screen-1-welcome') {
      hud.style.display = 'none';
      bottomNav.style.display = 'none';
    } else {
      hud.style.display = 'flex';
      bottomNav.style.display = 'flex';
      this.updateBottomNav(screenId);
    }

    // Trigger screen-specific refreshes
    if (screenId === 'screen-7-impact') {
      this.renderCampusImpact();
    } else if (screenId === 'screen-8-map') {
      this.renderCampusMap();
    } else if (screenId === 'screen-9-school-dashboard') {
      this.renderSchoolDashboard();
    } else if (screenId === 'screen-5-eco') {
      this.renderEcoScreen();
    } else if (screenId === 'screen-6-wellbeing') {
      this.renderWellbeingScreen();
    }
  }

  updateBottomNav(activeScreenId) {
    document.querySelectorAll('.nav-tab-btn').forEach(tab => {
      const target = tab.getAttribute('data-target');
      if (target === activeScreenId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  syncProfileHUD() {
    const profile = StorageService.getProfile();
    const nameEl = document.getElementById('hud-user-name');
    const avatarEl = document.getElementById('hud-user-avatar');
    const classEl = document.getElementById('hud-class-name');
    const pointsEl = document.getElementById('hud-points-val');
    const streakEl = document.getElementById('hud-streak-val');

    if (nameEl) nameEl.textContent = profile.name || 'Heer';
    if (avatarEl) avatarEl.textContent = (profile.name || 'H').charAt(0).toUpperCase();
    if (classEl) classEl.textContent = profile.class || 'Grade 7A';
    if (pointsEl) pointsEl.textContent = profile.points || 0;
    if (streakEl) streakEl.textContent = `${profile.streak || 0}d`;
  }

  bouncePill(pillId) {
    const pill = document.getElementById(pillId);
    if (pill) {
      pill.classList.remove('bounce');
      void pill.offsetWidth; // trigger reflow
      pill.classList.add('bounce');
    }
  }

  toggleStaffRole(forceStaff = null) {
    const profile = StorageService.getProfile();
    const newRole = forceStaff !== null ? (forceStaff ? 'staff' : 'student') : (profile.role === 'staff' ? 'student' : 'staff');
    profile.role = newRole;
    StorageService.saveProfile(profile);

    const toggleBtn = document.getElementById('btn-role-toggle');
    const labelEl = document.getElementById('role-label');

    if (newRole === 'staff') {
      toggleBtn?.classList.add('staff-mode');
      if (labelEl) labelEl.textContent = 'Exit Staff View 👤';
      this.navigateTo('screen-9-school-dashboard');
    } else {
      toggleBtn?.classList.remove('staff-mode');
      if (labelEl) labelEl.textContent = 'Switch to Staff View 🏫';
      this.navigateTo('screen-2-dashboard');
    }
  }

  openReportForm(category) {
    this.setReportCategory(category);
    this.navigateTo('screen-3-report');
  }

  setReportCategory(category) {
    this.selectedCategory = category;
    const safetyBtn = document.getElementById('opt-cat-safety');
    const accessBtn = document.getElementById('opt-cat-accessibility');
    const indicator = document.getElementById('report-mode-indicator');

    if (category === 'Safety') {
      safetyBtn?.classList.add('selected');
      accessBtn?.classList.remove('selected');
      if (indicator) indicator.textContent = 'Safety Hazard';
    } else {
      accessBtn?.classList.add('selected');
      safetyBtn?.classList.remove('selected');
      if (indicator) indicator.textContent = 'Accessibility Barrier';
    }
  }

  attachPhoto(url, tagId) {
    this.currentPhotoUrl = url;
    this.currentPhotoTag = tagId;

    const emptyBox = document.getElementById('photo-empty-state');
    const previewBox = document.getElementById('photo-preview-box');
    const previewImg = document.getElementById('photo-preview-img');

    if (emptyBox) emptyBox.style.display = 'none';
    if (previewBox) previewBox.style.display = 'block';
    if (previewImg) previewImg.src = url;

    // Highlight pill if preset
    document.querySelectorAll('.sample-photo-pill').forEach(btn => {
      if (btn.getAttribute('data-tag') === tagId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Trigger Tier A Photo-Assisted Rule-Based Suggestion (PRD 6.4)
    const tagInfo = PHOTO_AI_TAGS.find(t => t.id === tagId);
    if (tagInfo) {
      this.applyAITagSuggestion(tagInfo);
    }
  }

  removePhoto() {
    this.currentPhotoUrl = null;
    this.currentPhotoTag = null;

    const emptyBox = document.getElementById('photo-empty-state');
    const previewBox = document.getElementById('photo-preview-box');
    const previewImg = document.getElementById('photo-preview-img');
    const fileInput = document.getElementById('file-photo-input');
    const suggestionBox = document.getElementById('ai-suggestion-box');

    if (emptyBox) emptyBox.style.display = 'block';
    if (previewBox) previewBox.style.display = 'none';
    if (previewImg) previewImg.src = '';
    if (fileInput) fileInput.value = '';
    if (suggestionBox) suggestionBox.style.display = 'none';

    document.querySelectorAll('.sample-photo-pill').forEach(b => b.classList.remove('active'));
  }

  applyAITagSuggestion(tagInfo) {
    const suggestionBox = document.getElementById('ai-suggestion-box');
    const suggestionText = document.getElementById('ai-suggestion-text');

    if (suggestionBox && suggestionText) {
      suggestionBox.style.display = 'block';
      suggestionText.innerHTML = `
        <strong>Pattern Detected:</strong> ${tagInfo.label}<br>
        <strong>Suggested Category:</strong> ${tagInfo.category} | 
        <strong>Severity:</strong> ${tagInfo.suggestedSeverity === 3 ? '🔴 High' : tagInfo.suggestedSeverity === 2 ? '🟡 Medium' : '🟢 Low'}<br>
        <span style="font-size:12px; color:#065F46;">${tagInfo.description} (You can edit any field below).</span>
      `;
    }

    // Auto-fill category & severity per PRD 6.4 (editable by student)
    this.setReportCategory(tagInfo.category);
    this.selectSeverity(tagInfo.suggestedSeverity);
    this.selectUrgency(tagInfo.suggestedUrgency);
    this.selectPeople(tagInfo.suggestedPeople);
  }

  selectSeverity(val) {
    this.selectedSeverity = val;
    const group = document.getElementById('grp-severity');
    group?.querySelectorAll('.cg-option-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.getAttribute('data-val') == val);
    });
  }

  selectUrgency(val) {
    this.selectedUrgency = val;
    const group = document.getElementById('grp-urgency');
    group?.querySelectorAll('.cg-option-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.getAttribute('data-val') == val);
    });
  }

  selectPeople(val) {
    this.selectedPeople = val;
    const group = document.getElementById('grp-people');
    group?.querySelectorAll('.cg-option-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.getAttribute('data-val') == val);
    });
  }

  handleReportSubmit() {
    const descInput = document.getElementById('report-desc');
    const zoneInput = document.getElementById('report-zone');
    const profile = StorageService.getProfile();

    const description = descInput.value.trim();
    const zone = zoneInput.value;

    if (!description) {
      alert('Please describe what happened.');
      return;
    }

    // Execute Priority Scoring Formula (PRD 6.1)
    const priorityResult = calculatePriorityScore(
      this.selectedSeverity,
      this.selectedUrgency,
      this.selectedPeople
    );

    const newReport = {
      id: 'rep_' + Date.now(),
      title: description.length > 36 ? description.slice(0, 36) + '...' : description,
      description,
      category: this.selectedCategory,
      zone,
      severity: this.selectedSeverity,
      urgency: this.selectedUrgency,
      peopleAffected: this.selectedPeople,
      priorityScore: priorityResult.score,
      priorityTier: priorityResult.tierKey,
      status: 'open',
      reportedBy: `${profile.name} (${profile.class})`,
      createdAt: new Date().toISOString(),
      photoTag: this.currentPhotoTag,
      photoUrl: this.currentPhotoUrl
    };

    StorageService.addReport(newReport);

    // Award +5 points for submitting a verified report
    profile.points = (profile.points || 0) + 5;
    StorageService.saveProfile(profile);
    this.syncProfileHUD();
    this.bouncePill('hud-points-pill');

    // Confetti burst (PRD 4.5)
    this.confetti.burst({ count: 50 });

    // Render Screen 4 Result
    this.renderPriorityResult(priorityResult);
    this.navigateTo('screen-4-result');

    // Reset report form
    descInput.value = '';
    this.removePhoto();
  }

  renderPriorityResult(priorityResult) {
    const scoreNum = document.getElementById('result-score-number');
    const badge = document.getElementById('result-tier-badge');
    const label = document.getElementById('result-tier-label');
    const breakdownS = document.getElementById('result-breakdown-s');
    const breakdownU = document.getElementById('result-breakdown-u');
    const breakdownP = document.getElementById('result-breakdown-p');
    const breakdownTotal = document.getElementById('result-breakdown-total');
    const recAction = document.getElementById('result-recommended-action');

    const s = priorityResult.breakdown.severity;
    const u = priorityResult.breakdown.urgency;
    const p = priorityResult.breakdown.peopleAffected;

    if (scoreNum) scoreNum.innerHTML = `${priorityResult.score} <span style="font-size:22px; color:var(--text-secondary); font-weight:700;">/ 9</span>`;

    if (badge && label) {
      badge.className = `badge-priority ${priorityResult.tierKey.toLowerCase()}`;
      label.textContent = `${priorityResult.tier.label} PRIORITY`;
    }

    if (breakdownS) breakdownS.textContent = `${s} (${s === 3 ? 'High' : s === 2 ? 'Medium' : 'Low'})`;
    if (breakdownU) breakdownU.textContent = `${u} (${u === 3 ? 'Immediate' : u === 2 ? 'Soon' : 'Can wait'})`;
    if (breakdownP) breakdownP.textContent = `${p} (${p === 3 ? 'Many' : p === 2 ? 'A few' : 'Just me'})`;
    if (breakdownTotal) breakdownTotal.textContent = `${s} + ${u} + ${p} = ${priorityResult.score}`;
    if (recAction) recAction.textContent = priorityResult.tier.recommendedAction;
  }

  renderEcoScreen() {
    const missions = StorageService.getEcoMissions();
    const activeMission = missions.find(m => !m.completed) || missions[0];

    const titleEl = document.getElementById('eco-mission-title');
    const descEl = document.getElementById('eco-mission-desc');
    const catEl = document.getElementById('eco-category-pill');
    const btnComplete = document.getElementById('btn-complete-eco');
    const noticeEl = document.getElementById('eco-completed-notice');
    const wasteText = document.getElementById('eco-class-waste-text');

    if (activeMission) {
      if (titleEl) titleEl.textContent = activeMission.title;
      if (descEl) descEl.textContent = activeMission.description;
      if (catEl) catEl.textContent = activeMission.category;

      if (activeMission.completed) {
        if (btnComplete) btnComplete.style.display = 'none';
        if (noticeEl) noticeEl.style.display = 'block';
      } else {
        if (btnComplete) {
          btnComplete.style.display = 'inline-flex';
          btnComplete.setAttribute('data-id', activeMission.id);
        }
        if (noticeEl) noticeEl.style.display = 'none';
      }
    }

    // Running class estimate (PRD Screen 5)
    const completedCount = missions.filter(m => m.completed).length;
    const estWaste = (completedCount * 1.2).toFixed(1);
    if (wasteText) {
      wasteText.textContent = `🌱 Your class has prevented an estimated ${estWaste} kg of waste this week!`;
    }

    // Mini Leaderboard preview (Top 3)
    const classes = StorageService.getClasses();
    const profile = StorageService.getProfile();
    const leaderboard = calculateClassLeaderboard(classes, profile.points, profile.class);
    const top3 = leaderboard.slice(0, 3);

    const miniList = document.getElementById('mini-leaderboard-list');
    if (miniList) {
      miniList.innerHTML = top3.map((cls, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
        const isCurrent = cls.name === profile.class;
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:${isCurrent ? '#F0FDFA' : '#F8FAFC'}; border:1px solid ${isCurrent ? '#A7F3D0' : '#E2E8F0'}; border-radius:10px; font-size:13px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span>${medal}</span>
              <strong style="${isCurrent ? 'color:var(--primary-dark);' : ''}">${cls.name}</strong>
              ${isCurrent ? '<span style="font-size:10px; background:#A7F3D0; color:#065F46; padding:1px 6px; border-radius:8px;">You</span>' : ''}
            </div>
            <strong style="color:var(--accent);">${cls.totalPoints} pts</strong>
          </div>
        `;
      }).join('');
    }
  }

  handleEcoCompletion() {
    const btn = document.getElementById('btn-complete-eco');
    const missionId = btn?.getAttribute('data-id') || 'eco_3';

    const result = StorageService.completeEcoMission(missionId);
    this.syncProfileHUD();
    this.bouncePill('hud-points-pill');
    this.bouncePill('hud-streak-pill');

    // Confetti celebration (PRD 4.5)
    this.confetti.burst({ count: 60 });

    this.renderEcoScreen();
  }

  renderWellbeingScreen() {
    const logs = StorageService.getWellbeingLogs();
    const recentLogs = logs.slice(-7);

    // Render 7-day trend strip (PRD Screen 6)
    const strip = document.getElementById('mood-history-strip');
    if (strip) {
      strip.innerHTML = recentLogs.map(item => {
        const def = MOOD_DEFINITIONS[item.mood] || MOOD_DEFINITIONS.Good;
        return `
          <div style="display:flex; flex-direction:column; align-items:center; gap:3px;">
            <span style="font-size:22px;">${def.emoji}</span>
            <span style="font-size:11px; font-weight:700; color:var(--text-secondary);">${item.day}</span>
          </div>
        `;
      }).join('');
    }

    // Check 3+ consecutive stress/tired alert (PRD 6.3)
    const stressAlert = checkConsecutiveStressAlert(logs);
    const nudgeBanner = document.getElementById('stress-nudge-banner');
    if (nudgeBanner) {
      nudgeBanner.style.display = stressAlert ? 'flex' : 'none';
    }
  }

  handleMoodSelection(mood) {
    const def = MOOD_DEFINITIONS[mood];
    if (!def) return;

    // Highlight selected button
    document.querySelectorAll('.mood-btn').forEach(b => {
      b.classList.toggle('selected', b.getAttribute('data-mood') === mood);
    });

    // Save check-in
    StorageService.addWellbeingLog(mood);

    // Award +2 mindful points
    const profile = StorageService.getProfile();
    profile.points = (profile.points || 0) + 2;
    StorageService.saveProfile(profile);
    this.syncProfileHUD();
    this.bouncePill('hud-points-pill');

    // Show supportive card
    const card = document.getElementById('mood-suggestion-card');
    const icon = document.getElementById('mood-suggestion-icon');
    const title = document.getElementById('mood-suggestion-title');
    const text = document.getElementById('mood-suggestion-text');

    if (card && icon && title && text) {
      card.style.display = 'block';
      icon.textContent = def.emoji;
      title.textContent = `Mindful Suggestion (${def.label})`;
      text.textContent = def.tip;
    }

    this.renderWellbeingScreen();
  }

  renderCampusImpact() {
    const reports = StorageService.getReports();
    const ecoMissions = StorageService.getEcoMissions();
    const checkIns = StorageService.getWellbeingLogs();

    // PRD 6.2 Campus Score Formula
    const result = calculateCampusScore(reports, ecoMissions, checkIns);

    // Overall Score Circle
    const scoreNum = document.getElementById('campus-score-number');
    const circleBar = document.getElementById('score-circle-bar');
    if (scoreNum) scoreNum.textContent = result.overallScore;

    if (circleBar) {
      const radius = 68;
      const circumference = 2 * Math.PI * radius; // ~427.25
      const offset = circumference - (result.overallScore / 100) * circumference;
      circleBar.style.strokeDasharray = `${circumference}`;
      circleBar.style.strokeDashoffset = `${offset}`;
    }

    // Safety stat
    const safetyM = result.metrics.safety;
    const safetyText = document.getElementById('stat-safety-text');
    const safetyRate = document.getElementById('stat-safety-rate');
    if (safetyText) safetyText.textContent = `${safetyM.total} reports submitted, ${safetyM.resolved} resolved`;
    if (safetyRate) safetyRate.textContent = `${safetyM.rate}%`;

    // Accessibility stat
    const accessM = result.metrics.accessibility;
    const accessText = document.getElementById('stat-access-text');
    const accessRate = document.getElementById('stat-access-rate');
    if (accessText) accessText.textContent = `${accessM.total} identified, ${accessM.resolved} resolved`;
    if (accessRate) accessRate.textContent = `${accessM.rate}%`;

    // Eco stat
    const ecoM = result.metrics.eco;
    const ecoText = document.getElementById('stat-eco-text');
    const ecoRate = document.getElementById('stat-eco-rate');
    if (ecoText) ecoText.textContent = `${ecoM.completed} missions done, ≈${ecoM.wasteAvoidedKg} kg waste avoided`;
    if (ecoRate) ecoRate.textContent = `${ecoM.rate}%`;

    // Wellbeing stat & Sparkline (PRD 6.3)
    const wbM = result.metrics.wellbeing;
    const wbText = document.getElementById('stat-wb-text');
    const wbRate = document.getElementById('stat-wb-rate');
    if (wbText) wbText.textContent = `${wbM.rate}% positive check-ins this week`;
    if (wbRate) wbRate.textContent = `${wbM.rate}%`;

    this.renderSparkline(checkIns.slice(-7));
  }

  renderSparkline(recentLogs) {
    const svg = document.getElementById('wellbeing-sparkline');
    if (!svg || recentLogs.length === 0) return;

    const width = 320;
    const height = 50;
    const padding = 12;
    const step = (width - padding * 2) / (recentLogs.length - 1 || 1);

    const points = recentLogs.map((log, index) => {
      const def = MOOD_DEFINITIONS[log.mood] || { value: 3 };
      const x = padding + index * step;
      // Value 1 to 5 mapped to height - padding to padding
      const y = height - padding - ((def.value - 1) / 4) * (height - padding * 2);
      return { x, y, val: def.value, day: log.day };
    });

    const dPath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

    svg.innerHTML = `
      <defs>
        <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#2DD4BF" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#2DD4BF" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      <path d="${dPath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z" fill="url(#sparkGrad)" />
      <path d="${dPath}" class="sparkline-line" />
      ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" class="sparkline-dot" />`).join('')}
    `;
  }

  updateMapFilterPills() {
    document.querySelectorAll('.map-filter-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-filter') === this.mapCategoryFilter);
    });
  }

  renderCampusMap() {
    const reports = StorageService.getReports();
    const zones = [
      { id: 'Block C Ground Floor', name: 'Block C (Stairs & Lockers)', gridClass: 'zone-block-c', type: 'Classrooms' },
      { id: 'Block A Ground Floor', name: 'Block A (Main Entry)', gridClass: 'zone-block-a', type: 'Administrative' },
      { id: 'Cafeteria', name: 'Cafeteria & Dining Plaza', gridClass: 'zone-cafeteria', type: 'Food Services' },
      { id: 'Library', name: 'Senior Learning Resource Library', gridClass: 'zone-library', type: 'Study Hub' },
      { id: 'Sports Hall', name: 'Indoor Sports & Gym Complex', gridClass: 'zone-sports', type: 'Athletics' },
      { id: 'Playground', name: 'Main Playground & Turf Field', gridClass: 'zone-playground', type: 'Outdoor Area' },
      { id: 'Science Lab', name: 'Science & Robotics Lab', gridClass: '', type: 'STEM' }
    ];

    const canvas = document.getElementById('campus-map-canvas');
    if (!canvas) return;

    // Filter reports if category chosen
    const activeReports = this.mapCategoryFilter === 'All'
      ? reports
      : reports.filter(r => r.category === this.mapCategoryFilter || (this.mapCategoryFilter === 'Sustainability' && r.category === 'Eco'));

    canvas.innerHTML = zones.map(zone => {
      const zoneReports = activeReports.filter(r => r.zone === zone.id && r.status === 'open');
      const hasHigh = zoneReports.some(r => r.priorityTier === 'HIGH');
      const hasMed = zoneReports.some(r => r.priorityTier === 'MEDIUM');
      const hasLow = zoneReports.some(r => r.priorityTier === 'LOW');

      let beaconStatus = 'clear';
      let beaconIcon = '✓';
      let blockClass = 'is-clear';

      if (hasHigh) {
        beaconStatus = 'high';
        beaconIcon = '!';
        blockClass = 'has-high';
      } else if (hasMed) {
        beaconStatus = 'medium';
        beaconIcon = '⚠️';
        blockClass = 'has-medium';
      } else if (hasLow) {
        beaconStatus = 'low';
        beaconIcon = '•';
      }

      return `
        <div class="campus-zone-block ${zone.gridClass} ${blockClass}" data-zone="${zone.id}">
          <div class="zone-header">
            <div>
              <div class="zone-type-tag">${zone.type}</div>
              <div class="zone-title">${zone.name}</div>
            </div>
            <div class="zone-beacon ${beaconStatus}">
              <span>${beaconIcon}</span>
            </div>
          </div>
          
          <div class="zone-summary-tags">
            ${zoneReports.length > 0 
              ? `<span class="zone-status-chip ${hasHigh ? 'chip-danger' : 'chip-warn'}">${zoneReports.length} Open ${zoneReports.length === 1 ? 'Report' : 'Reports'}</span>`
              : `<span class="zone-status-chip chip-good">All Clear 🟢</span>`
            }
          </div>
        </div>
      `;
    }).join('');

    // Attach click events on zones to open Inspector Card
    canvas.querySelectorAll('.campus-zone-block').forEach(block => {
      block.addEventListener('click', () => {
        const zoneId = block.getAttribute('data-zone');
        this.inspectZone(zoneId);
      });
    });

    // Auto-inspect the active zone
    this.inspectZone(this.activeZoneInspect);
  }

  inspectZone(zoneId) {
    this.activeZoneInspect = zoneId;
    const card = document.getElementById('zone-inspector-card');
    const nameEl = document.getElementById('zone-inspect-name');
    const statusEl = document.getElementById('zone-inspect-status');
    const prioBadge = document.getElementById('zone-inspect-priority');

    const wasteEl = document.getElementById('zone-inspect-waste');
    const waterEl = document.getElementById('zone-inspect-water');
    const accessEl = document.getElementById('zone-inspect-access');
    const safetyEl = document.getElementById('zone-inspect-safety');
    const issuesContainer = document.getElementById('zone-inspect-issues');

    if (!card) return;
    card.style.display = 'block';

    const allReports = StorageService.getReports();
    const zoneReports = allReports.filter(r => r.zone === zoneId && r.status === 'open');

    if (nameEl) nameEl.textContent = zoneId;
    if (statusEl) statusEl.textContent = `${zoneReports.length} open issue${zoneReports.length === 1 ? '' : 's'}`;

    const hasHigh = zoneReports.some(r => r.priorityTier === 'HIGH');
    const hasMed = zoneReports.some(r => r.priorityTier === 'MEDIUM');

    if (prioBadge) {
      if (hasHigh) {
        prioBadge.className = 'badge-priority high';
        prioBadge.textContent = 'HIGH PRIORITY ZONE';
      } else if (hasMed) {
        prioBadge.className = 'badge-priority medium';
        prioBadge.textContent = 'MEDIUM PRIORITY';
      } else {
        prioBadge.className = 'badge-priority low';
        prioBadge.textContent = 'NORMAL STATUS';
      }
    }

    // Zone ratings (PRD Screen 8 sample: Waste: HIGH, Water: GOOD, Accessibility: GOOD, Safety: MED)
    if (zoneId === 'Cafeteria') {
      if (wasteEl) wasteEl.textContent = 'HIGH (Sorting needed)';
      if (waterEl) waterEl.textContent = 'GOOD';
      if (accessEl) accessEl.textContent = hasHigh ? 'ATTENTION' : 'GOOD';
      if (safetyEl) safetyEl.textContent = hasMed ? 'MEDIUM' : 'GOOD';
    } else if (zoneId === 'Block C Ground Floor') {
      if (wasteEl) wasteEl.textContent = 'GOOD';
      if (waterEl) waterEl.textContent = hasHigh ? 'SPILL ALERT ⚠️' : 'GOOD';
      if (accessEl) accessEl.textContent = 'GOOD';
      if (safetyEl) safetyEl.textContent = hasHigh ? 'HIGH' : 'GOOD';
    } else {
      if (wasteEl) wasteEl.textContent = 'GOOD';
      if (waterEl) waterEl.textContent = 'GOOD';
      if (accessEl) accessEl.textContent = 'GOOD';
      if (safetyEl) safetyEl.textContent = hasMed ? 'MEDIUM' : 'GOOD';
    }

    // List of active reports in zone
    if (issuesContainer) {
      if (zoneReports.length === 0) {
        issuesContainer.innerHTML = `
          <div style="text-align:center; padding:12px; color:var(--text-secondary); font-size:13px;">
            🎉 No open hazards reported in this zone!
          </div>
        `;
      } else {
        issuesContainer.innerHTML = zoneReports.map(r => `
          <div class="zone-issue-item">
            <div>
              <div style="font-weight:800; color:var(--text-primary);">${r.category === 'Safety' ? '🛡️' : '♿'} ${r.title}</div>
              <div style="font-size:11px; color:var(--text-secondary);">${r.description}</div>
            </div>
            <span class="badge-priority ${r.priorityTier.toLowerCase()}">${r.priorityTier} (${r.priorityScore})</span>
          </div>
        `).join('');
      }
    }
  }

  renderSchoolDashboard() {
    const allReports = StorageService.getReports();
    const openReports = allReports.filter(r => r.status === 'open');
    const resolvedReports = allReports.filter(r => r.status === 'resolved');

    // Sort by priorityScore descending (highest first per PRD Screen 9)
    openReports.sort((a, b) => b.priorityScore - a.priorityScore);
    resolvedReports.sort((a, b) => new Date(b.resolvedAt || 0) - new Date(a.resolvedAt || 0));

    const openCountEl = document.getElementById('staff-open-count');
    const resolvedCountEl = document.getElementById('staff-resolved-count');
    if (openCountEl) openCountEl.textContent = openReports.length;
    if (resolvedCountEl) resolvedCountEl.textContent = resolvedReports.length;

    const listContainer = document.getElementById('staff-reports-list');
    if (!listContainer) return;

    const targetList = this.staffFilter === 'open' ? openReports : resolvedReports;

    if (targetList.length === 0) {
      listContainer.innerHTML = `
        <div class="cg-card" style="text-align:center; padding:32px 16px;">
          <span style="font-size:40px;">🙌</span>
          <h3 style="margin:10px 0 4px;">No ${this.staffFilter} reports</h3>
          <p style="font-size:13px; color:var(--text-secondary);">
            ${this.staffFilter === 'open' ? 'All student reports are resolved!' : 'Resolved items will appear here.'}
          </p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = targetList.map(report => {
      const isResolved = report.status === 'resolved';
      return `
        <div class="cg-card" style="margin-bottom:0; border-left: 5px solid ${report.priorityTier === 'HIGH' ? '#EF4444' : report.priorityTier === 'MEDIUM' ? '#F59E0B' : '#22C55E'};">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-size:18px;">${report.category === 'Safety' ? '🛡️' : '♿'}</span>
              <strong style="font-size:15px; color:var(--text-primary);">${report.category}</strong>
              <span style="font-size:12px; color:var(--text-secondary);">• ${report.zone}</span>
            </div>
            <span class="badge-priority ${report.priorityTier.toLowerCase()}">
              ${report.priorityTier} (${report.priorityScore}/9)
            </span>
          </div>

          <p style="font-size:14px; color:var(--text-primary); margin-bottom:10px; font-weight:600;">
            ${report.description}
          </p>

          ${report.photoUrl ? `
            <div style="width:100%; height:140px; border-radius:10px; overflow:hidden; margin-bottom:10px; border:1px solid #E2E8F0;">
              <img src="${report.photoUrl}" alt="Photo report" style="width:100%; height:100%; object-fit:cover;">
            </div>
          ` : ''}

          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #F1F5F9; padding-top:10px; margin-top:6px;">
            <div style="font-size:12px; color:var(--text-secondary);">
              Reported by: <strong>${report.reportedBy}</strong>
            </div>

            ${!isResolved ? `
              <button type="button" class="cg-btn cg-btn-success btn-resolve-action" data-id="${report.id}" style="width:auto; min-height:40px; padding:6px 16px; font-size:13px; border-radius:var(--radius-pill);">
                ✓ Mark Resolved
              </button>
            ` : `
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:12px; color:#10B981; font-weight:800;">✓ Resolved</span>
                <button type="button" class="cg-btn-secondary btn-reopen-action" data-id="${report.id}" style="width:auto; min-height:32px; padding:2px 10px; font-size:11px; border-radius:var(--radius-pill);">
                  Reopen
                </button>
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');

    // Attach resolve handlers (Demonstrating the Closed Loop)
    listContainer.querySelectorAll('.btn-resolve-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.handleResolveReport(id);
      });
    });

    listContainer.querySelectorAll('.btn-reopen-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        StorageService.reopenReport(id);
        this.renderSchoolDashboard();
        this.renderCampusImpact();
        this.renderCampusMap();
      });
    });
  }

  handleResolveReport(reportId) {
    StorageService.resolveReport(reportId);

    // Confetti celebration
    this.confetti.burst({ count: 45 });

    // Live update across all screens (Closed loop: Screen 7 and Screen 8 update automatically)
    this.renderSchoolDashboard();
    this.renderCampusImpact();
    this.renderCampusMap();
  }

  openLeaderboardModal() {
    this.renderLeaderboardModal();
    const modal = document.getElementById('leaderboard-modal');
    if (modal) modal.classList.add('open');
  }

  closeLeaderboardModal() {
    const modal = document.getElementById('leaderboard-modal');
    if (modal) modal.classList.remove('open');
  }

  renderLeaderboardModal() {
    const classes = StorageService.getClasses();
    const profile = StorageService.getProfile();
    const leaderboard = calculateClassLeaderboard(classes, profile.points, profile.class);

    const container = document.getElementById('full-leaderboard-list');
    if (!container) return;

    container.innerHTML = leaderboard.map((cls, idx) => {
      const isCurrent = cls.name === profile.class;
      const rankBadge = idx === 0 ? '🥇 1st' : idx === 1 ? '🥈 2nd' : idx === 2 ? '🥉 3rd' : `#${idx + 1}`;
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:${isCurrent ? '#F0FDFA' : '#FFFFFF'}; border:2px solid ${isCurrent ? '#2DD4BF' : '#E2E8F0'}; border-radius:14px; box-shadow:0 2px 6px rgba(0,0,0,0.04);">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-weight:900; font-size:15px; color:${idx < 3 ? 'var(--primary-dark)' : 'var(--text-secondary)'}; min-width:48px;">
              ${rankBadge}
            </span>
            <div>
              <div style="font-weight:800; font-size:15px; color:var(--text-primary);">${cls.name}</div>
              <div style="font-size:12px; color:var(--text-secondary);">${cls.students} Scouts active</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:16px; font-weight:900; color:var(--accent);">${cls.totalPoints}</div>
            <div style="font-size:10px; font-weight:800; color:var(--text-secondary); text-transform:uppercase;">Impact Pts</div>
          </div>
        </div>
      `;
    }).join('');
  }
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.campusGuardApp = new CampusGuardApp();
});
