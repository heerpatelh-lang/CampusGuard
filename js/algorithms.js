/**
 * CampusGuard - Core Algorithms & Business Logic
 * Built for Code Battle 2026–27 (Grades 6–8, GEMS New Millennium School)
 * Compliant with PRD Section 6
 */
var PRIORITY_TIERS = {
  HIGH: {
    label: 'HIGH',
    color: '#EF4444',
    bgTint: '#FEE2E2',
    icon: '🔴',
    recommendedAction: 'Alert a teacher or staff member right away'
  },
  MEDIUM: {
    label: 'MEDIUM',
    color: '#F59E0B',
    bgTint: '#FEF3C7',
    icon: '🟡',
    recommendedAction: 'Let a staff member know when convenient'
  },
  LOW: {
    label: 'LOW',
    color: '#22C55E',
    bgTint: '#DCFCE7',
    icon: '🟢',
    recommendedAction: 'Thanks for reporting — no immediate action needed'
  }
};

/**
 * PRD 6.1: Priority Score Calculation
 * severity: 1 (Low) | 2 (Medium) | 3 (High)
 * urgency: 1 (Can wait) | 2 (Should fix soon) | 3 (Needs immediate attention)
 * peopleAffected: 1 (Just me) | 2 (A few people) | 3 (Many people)
 * priorityScore = severity + urgency + peopleAffected // range: 3–9
 */
function calculatePriorityScore(severity, urgency, peopleAffected) {
  const s = parseInt(severity, 10) || 1;
  const u = parseInt(urgency, 10) || 1;
  const p = parseInt(peopleAffected, 10) || 1;

  const score = s + u + p; // 3 to 9

  let tierKey = 'LOW';
  if (score >= 7) {
    tierKey = 'HIGH';
  } else if (score >= 5) {
    tierKey = 'MEDIUM';
  } else {
    tierKey = 'LOW';
  }

  // Optional stretch variant multiplier: s * u * p (range: 1 - 27)
  const stretchScore = s * u * p;

  return {
    score,
    maxScore: 9,
    stretchScore,
    maxStretchScore: 27,
    tier: PRIORITY_TIERS[tierKey],
    tierKey,
    breakdown: { severity: s, urgency: u, peopleAffected: p }
  };
}

/**
 * PRD 6.2: Campus Score Calculation (Screen 7)
 * campusScore = average of:
 * - safetyResolvedRate = (safety reports resolved ÷ total safety reports) × 100
 * - accessibilityResolvedRate = (accessibility reports resolved ÷ total accessibility reports) × 100
 * - ecoParticipationRate = (eco missions completed ÷ eco missions available) × 100, capped at 100
 * - wellbeingPositiveRate = (check-ins marked Great/Good/Okay ÷ total check-ins) × 100
 * If a category has zero submissions yet, exclude it from the average (avoid divide by zero)
 */
function calculateCampusScore(reports, ecoMissions, checkIns) {
  const safetyReports = reports.filter(r => r.category === 'Safety');
  const accessibilityReports = reports.filter(r => r.category === 'Accessibility');

  const rates = [];
  const metrics = {};

  // Safety rate
  if (safetyReports.length > 0) {
    const resolved = safetyReports.filter(r => r.status === 'resolved').length;
    const rate = Math.round((resolved / safetyReports.length) * 100);
    rates.push(rate);
    metrics.safety = {
      total: safetyReports.length,
      resolved,
      rate
    };
  } else {
    metrics.safety = { total: 0, resolved: 0, rate: 100, zeroData: true };
  }

  // Accessibility rate
  if (accessibilityReports.length > 0) {
    const resolved = accessibilityReports.filter(r => r.status === 'resolved').length;
    const rate = Math.round((resolved / accessibilityReports.length) * 100);
    rates.push(rate);
    metrics.accessibility = {
      total: accessibilityReports.length,
      resolved,
      rate
    };
  } else {
    metrics.accessibility = { total: 0, resolved: 0, rate: 100, zeroData: true };
  }

  // Eco participation rate
  const availableEco = ecoMissions.length || 1;
  const completedEco = ecoMissions.filter(m => m.completed).length;
  const ecoRate = Math.min(100, Math.round((completedEco / availableEco) * 100));
  rates.push(ecoRate);
  metrics.eco = {
    total: availableEco,
    completed: completedEco,
    rate: ecoRate,
    wasteAvoidedKg: (completedEco * 0.6).toFixed(1) // ~0.6kg per eco action
  };

  // Wellbeing positive rate (Great, Good, Okay are positive; Stressed, Tired are negative)
  if (checkIns.length > 0) {
    const positiveCount = checkIns.filter(c => ['Great', 'Good', 'Okay'].includes(c.mood)).length;
    const rate = Math.round((positiveCount / checkIns.length) * 100);
    rates.push(rate);
    metrics.wellbeing = {
      total: checkIns.length,
      positiveCount,
      rate
    };
  } else {
    metrics.wellbeing = { total: 0, positiveCount: 0, rate: 100, zeroData: true };
  }

  // Average of active non-empty categories
  const overallScore = rates.length > 0
    ? Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length)
    : 85;

  return {
    overallScore,
    metrics
  };
}

/**
 * PRD 6.4: Photo-Assisted Categorization (Tier A: Rule-Based Preset Tags)
 * Fast, 100% explainable conditional logic for students and judges.
 */
var PHOTO_AI_TAGS = [
  {
    id: 'spill',
    label: '💧 Spill / Wet Floor',
    category: 'Safety',
    suggestedSeverity: 2, // Medium
    suggestedUrgency: 2,
    suggestedPeople: 2,
    description: 'Slippery surface detected. Poses slip and fall hazard for moving students.'
  },
  {
    id: 'blocked_path',
    label: '🚧 Blocked Path / Ramp',
    category: 'Accessibility',
    suggestedSeverity: 3, // High
    suggestedUrgency: 2,
    suggestedPeople: 3,
    description: 'Obstacle or barrier detected on walkway or wheelchair access point.'
  },
  {
    id: 'broken_item',
    label: '🪑 Broken Furniture / Item',
    category: 'Safety',
    suggestedSeverity: 2, // Medium
    suggestedUrgency: 1,
    suggestedPeople: 1,
    description: 'Damaged desk, chair, or fixture with potential pinch or sharp edges.'
  },
  {
    id: 'crowding',
    label: '👥 Hallway Crowding',
    category: 'Safety',
    suggestedSeverity: 1, // Low
    suggestedUrgency: 2,
    suggestedPeople: 3,
    description: 'Congestion point in school corridor during class exchange.'
  },
  {
    id: 'litter',
    label: '♻️ Litter / Full Bin',
    category: 'Safety',
    suggestedSeverity: 1, // Low
    suggestedUrgency: 1,
    suggestedPeople: 2,
    description: 'Overflowing recyclable or organic waste requiring custodial attention.'
  }
];

/**
 * PRD 6.3: Wellbeing Trend & Consecutive Check-in Logic
 * Maps emoji moods to numeric scale 1-5
 */
var MOOD_DEFINITIONS = {
  Great: { value: 5, emoji: '😊', label: 'Great', tip: 'Awesome energy! Pass on your good vibes to someone nearby.' },
  Good: { value: 4, emoji: '🙂', label: 'Good', tip: 'Nice! Keep up the positive momentum today.' },
  Okay: { value: 3, emoji: '😐', label: 'Okay', tip: 'Totally fine to have neutral days. Take things one step at a time.' },
  Stressed: { value: 2, emoji: '😟', label: 'Stressed', tip: 'Try taking 3 slow, deep belly breaths or take a quick sip of water.' },
  Tired: { value: 1, emoji: '😴', label: 'Tired', tip: 'Stretch your arms and make sure to stay hydrated today.' }
};

/**
 * Check if 3+ consecutive check-ins are Stressed or Tired (PRD 6.3 / Screen 6)
 */
function checkConsecutiveStressAlert(recentCheckIns) {
  if (!recentCheckIns || recentCheckIns.length < 3) return false;
  const last3 = recentCheckIns.slice(-3);
  return last3.every(c => c.mood === 'Stressed' || c.mood === 'Tired');
}

/**
 * PRD 6.5: Gamification & Leaderboard
 * classImpactPoints = sum of Impact Points earned by all students in that class
 */
function calculateClassLeaderboard(classes, studentPoints, currentClass) {
  const leaderboard = classes.map(cls => {
    let totalPoints = cls.basePoints || 0;
    if (cls.name === currentClass) {
      totalPoints += studentPoints;
    }
    return {
      ...cls,
      totalPoints
    };
  });

  return leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
}
