/**
 * CampusGuard - Data Storage & Seed Management
 * Handles local on-device persistence for reports, eco tasks, wellbeing logs, and user profile.
 */

const STORAGE_KEYS = {
  PROFILE: 'campusguard_profile',
  REPORTS: 'campusguard_reports',
  ECO_MISSIONS: 'campusguard_eco_missions',
  WELLBEING: 'campusguard_wellbeing',
  CLASSES: 'campusguard_classes'
};

const DEFAULT_PROFILE = {
  name: 'Heer',
  school: 'GEMS New Millennium School',
  class: 'Grade 7A',
  points: 135,
  streak: 4,
  role: 'student' // 'student' | 'staff'
};

const DEFAULT_CLASSES = [
  { id: 'c1', name: 'Grade 7A', grade: 7, basePoints: 420, students: 26 },
  { id: 'c2', name: 'Grade 8B', grade: 8, basePoints: 395, students: 28 },
  { id: 'c3', name: 'Grade 6A', grade: 6, basePoints: 340, students: 24 },
  { id: 'c4', name: 'Grade 7B', grade: 7, basePoints: 290, students: 25 },
  { id: 'c5', name: 'Grade 8A', grade: 8, basePoints: 265, students: 27 },
  { id: 'c6', name: 'Grade 6B', grade: 6, basePoints: 210, students: 23 }
];

const DEFAULT_ECO_MISSIONS = [
  {
    id: 'eco_1',
    title: 'Hydration Hero: Bring a Reusable Bottle',
    description: 'Use a refillable water bottle throughout the school day instead of single-use plastic bottles.',
    category: 'Waste Reduction',
    points: 10,
    wasteSavedKg: 0.25,
    completed: true,
    completedAt: '2026-09-15T09:30:00Z'
  },
  {
    id: 'eco_2',
    title: 'Classroom Power Patrol: Lights-Off Check',
    description: 'Turn off the lights and smartboard projector whenever leaving the homeroom or lab.',
    category: 'Energy Conservation',
    points: 10,
    wasteSavedKg: 0.4,
    completed: true,
    completedAt: '2026-09-16T14:15:00Z'
  },
  {
    id: 'eco_3',
    title: 'Cafeteria Zero-Waste Plate',
    description: 'Take only the portion of food you will eat at lunch and properly sort clean compostable napkins.',
    category: 'Food Waste',
    points: 10,
    wasteSavedKg: 0.6,
    completed: false,
    completedAt: null
  },
  {
    id: 'eco_4',
    title: 'Paper Recycling Champion',
    description: 'Collect scratch paper and place unusable sheets into the blue recycling bins in Block C.',
    category: 'Recycling',
    points: 10,
    wasteSavedKg: 0.35,
    completed: false,
    completedAt: null
  }
];

const DEFAULT_REPORTS = [
  {
    id: 'rep_101',
    title: 'Puddle on Stairs after Cleaning',
    description: 'Wet floor near staircase connecting Ground Floor to 1st Floor. High slip hazard for students rushing to lockers.',
    category: 'Safety',
    zone: 'Block C Ground Floor',
    severity: 3, // High
    urgency: 3,  // Immediate
    peopleAffected: 3, // Many
    priorityScore: 9,
    priorityTier: 'HIGH',
    status: 'open',
    reportedBy: 'Heer P. (Grade 7A)',
    createdAt: '2026-09-17T08:15:00Z',
    photoTag: 'spill',
    photoUrl: 'assets/sample_spill.svg'
  },
  {
    id: 'rep_102',
    title: 'Blocked Wheelchair Access Ramp',
    description: 'Stack of uncollected delivery boxes blocking the main exterior ramp entrance to the cafeteria.',
    category: 'Accessibility',
    zone: 'Cafeteria',
    severity: 3, // High
    urgency: 2,  // Should fix soon
    peopleAffected: 2, // A few
    priorityScore: 7,
    priorityTier: 'HIGH',
    status: 'open',
    reportedBy: 'Aarav M. (Grade 8B)',
    createdAt: '2026-09-17T09:40:00Z',
    photoTag: 'blocked_path',
    photoUrl: 'assets/sample_ramp.svg'
  },
  {
    id: 'rep_103',
    title: 'Wobbly Leg on Study Bench',
    description: 'One screw loose on the reading bench next to the fiction bookshelves.',
    category: 'Safety',
    zone: 'Library',
    severity: 2,
    urgency: 1,
    peopleAffected: 1,
    priorityScore: 4,
    priorityTier: 'LOW',
    status: 'resolved',
    resolvedAt: '2026-09-16T15:00:00Z',
    reportedBy: 'Rhea S. (Grade 6A)',
    createdAt: '2026-09-16T11:20:00Z',
    photoTag: 'broken_item',
    photoUrl: 'assets/sample_bench.svg'
  },
  {
    id: 'rep_104',
    title: 'Heavy Corridor Congestion at Gate B',
    description: 'Students gathering in narrow hallway during gym locker transition.',
    category: 'Safety',
    zone: 'Block A Ground Floor',
    severity: 2,
    urgency: 2,
    peopleAffected: 3,
    priorityScore: 7,
    priorityTier: 'HIGH',
    status: 'resolved',
    resolvedAt: '2026-09-16T16:30:00Z',
    reportedBy: 'Omar K. (Grade 7A)',
    createdAt: '2026-09-15T13:45:00Z',
    photoTag: 'crowding',
    photoUrl: null
  },
  {
    id: 'rep_105',
    title: 'Heavy Fire Door Difficult to Push Open',
    description: 'Hydraulic door closer resistance too tight for younger students and students with crutches.',
    category: 'Accessibility',
    zone: 'Sports Hall',
    severity: 2,
    urgency: 2,
    peopleAffected: 2,
    priorityScore: 6,
    priorityTier: 'MEDIUM',
    status: 'open',
    reportedBy: 'Sara T. (Grade 8A)',
    createdAt: '2026-09-17T11:10:00Z',
    photoTag: null,
    photoUrl: null
  },
  {
    id: 'rep_106',
    title: 'Cracked Paver Stone on Grass Path',
    description: 'Uneven paving stone on the footpath near the outdoor soccer field bench.',
    category: 'Safety',
    zone: 'Playground',
    severity: 2,
    urgency: 1,
    peopleAffected: 2,
    priorityScore: 5,
    priorityTier: 'MEDIUM',
    status: 'open',
    reportedBy: 'Zack L. (Grade 6B)',
    createdAt: '2026-09-17T12:05:00Z',
    photoTag: null,
    photoUrl: null
  }
];

const DEFAULT_WELLBEING = [
  { id: 'wb_1', mood: 'Great', timestamp: '2026-09-11T08:00:00Z', day: 'Fri' },
  { id: 'wb_2', mood: 'Good', timestamp: '2026-09-12T08:05:00Z', day: 'Sat' },
  { id: 'wb_3', mood: 'Okay', timestamp: '2026-09-13T08:10:00Z', day: 'Sun' },
  { id: 'wb_4', mood: 'Great', timestamp: '2026-09-14T08:00:00Z', day: 'Mon' },
  { id: 'wb_5', mood: 'Good', timestamp: '2026-09-15T08:15:00Z', day: 'Tue' },
  { id: 'wb_6', mood: 'Great', timestamp: '2026-09-16T08:20:00Z', day: 'Wed' },
  { id: 'wb_7', mood: 'Great', timestamp: '2026-09-17T08:05:00Z', day: 'Thu' }
];

const StorageService = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(DEFAULT_REPORTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ECO_MISSIONS)) {
      localStorage.setItem(STORAGE_KEYS.ECO_MISSIONS, JSON.stringify(DEFAULT_ECO_MISSIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.WELLBEING)) {
      localStorage.setItem(STORAGE_KEYS.WELLBEING, JSON.stringify(DEFAULT_WELLBEING));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(DEFAULT_CLASSES));
    }
  },

  getProfile() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE)) || DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  saveProfile(profile) {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  getReports() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS)) || DEFAULT_REPORTS;
    } catch {
      return DEFAULT_REPORTS;
    }
  },

  saveReports(reports) {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  },

  addReport(newReport) {
    const reports = this.getReports();
    reports.unshift(newReport);
    this.saveReports(reports);
    return reports;
  },

  resolveReport(reportId) {
    const reports = this.getReports();
    const target = reports.find(r => r.id === reportId);
    if (target) {
      target.status = 'resolved';
      target.resolvedAt = new Date().toISOString();
      this.saveReports(reports);
    }
    return reports;
  },

  reopenReport(reportId) {
    const reports = this.getReports();
    const target = reports.find(r => r.id === reportId);
    if (target) {
      target.status = 'open';
      delete target.resolvedAt;
      this.saveReports(reports);
    }
    return reports;
  },

  getEcoMissions() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ECO_MISSIONS)) || DEFAULT_ECO_MISSIONS;
    } catch {
      return DEFAULT_ECO_MISSIONS;
    }
  },

  saveEcoMissions(missions) {
    localStorage.setItem(STORAGE_KEYS.ECO_MISSIONS, JSON.stringify(missions));
  },

  completeEcoMission(missionId) {
    const missions = this.getEcoMissions();
    const mission = missions.find(m => m.id === missionId);
    if (mission && !mission.completed) {
      mission.completed = true;
      mission.completedAt = new Date().toISOString();
      this.saveEcoMissions(missions);

      // Increment student points and streak
      const profile = this.getProfile();
      profile.points = (profile.points || 0) + (mission.points || 10);
      profile.streak = (profile.streak || 0) + 1;
      this.saveProfile(profile);
    }
    return { missions, profile: this.getProfile() };
  },

  getWellbeingLogs() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.WELLBEING)) || DEFAULT_WELLBEING;
    } catch {
      return DEFAULT_WELLBEING;
    }
  },

  addWellbeingLog(mood) {
    const logs = this.getWellbeingLogs();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const newEntry = {
      id: 'wb_' + Date.now(),
      mood,
      timestamp: now.toISOString(),
      day: dayNames[now.getDay()]
    };
    logs.push(newEntry);
    localStorage.setItem(STORAGE_KEYS.WELLBEING, JSON.stringify(logs));
    return logs;
  },

  getClasses() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASSES)) || DEFAULT_CLASSES;
    } catch {
      return DEFAULT_CLASSES;
    }
  },

  resetDefaults() {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(DEFAULT_REPORTS));
    localStorage.setItem(STORAGE_KEYS.ECO_MISSIONS, JSON.stringify(DEFAULT_ECO_MISSIONS));
    localStorage.setItem(STORAGE_KEYS.WELLBEING, JSON.stringify(DEFAULT_WELLBEING));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(DEFAULT_CLASSES));
  }
};

window.StorageService = StorageService;

