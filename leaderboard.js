// Leaderboard script - displays users ranked by weight loss

let currentPeriod = 'week';

// Clear browser cache on page load
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
      caches.delete(cacheName);
    });
  });
}

// Calculate weight loss for a user over a time period
function calculateWeightLoss(entries, days) {
  if (!entries || entries.length === 0) return 0;

  const sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

  const recentEntries = sortedEntries.filter(e => new Date(e.date) >= cutoffDate);
  if (recentEntries.length < 2) return 0;

  const startWeight = recentEntries[0].weight;
  const endWeight = recentEntries[recentEntries.length - 1].weight;

  return startWeight - endWeight; // Positive = weight loss
}

// Load and display leaderboard
function loadLeaderboard(period) {
  currentPeriod = period;

  const days = {
    'week': 7,
    'month': 30,
    '3months': 90,
    'year': 365
  }[period];

  // For now, just load btbga's data
  // In the future, this would query all users from the database
  const users = [
    {
      username: 'btbga',
      displayName: localStorage.getItem('btb_profile_btbga')
        ? JSON.parse(localStorage.getItem('btb_profile_btbga')).displayName || 'btbga'
        : 'btbga',
      entries: JSON.parse(localStorage.getItem('btb_entries_btbga') || '[]')
    }
  ];

  // Calculate weight loss for each user
  const rankings = users.map(user => ({
    ...user,
    weightLoss: calculateWeightLoss(user.entries, days)
  })).sort((a, b) => b.weightLoss - a.weightLoss); // Sort by most weight lost

  // Display leaderboard
  const leaderboardList = document.getElementById('leaderboard-list');

  if (rankings.length === 0 || rankings[0].weightLoss === 0) {
    leaderboardList.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #7c8aa9;">
        <p>No data available for this time period</p>
      </div>
    `;
    return;
  }

  leaderboardList.innerHTML = rankings.map((user, index) => {
    const rank = index + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
    const lossText = user.weightLoss > 0
      ? `${user.weightLoss.toFixed(1)} lbs lost`
      : user.weightLoss < 0
        ? `${Math.abs(user.weightLoss).toFixed(1)} lbs gained`
        : 'No change';

    return `
      <div class="leaderboard-item" onclick="window.location.href='profile.html?user=${user.username}'">
        <div class="rank">${medal}</div>
        <div class="user-info">
          <div class="user-name">${user.displayName}</div>
          <div class="user-stats">${lossText}</div>
        </div>
        <div class="view-profile">View Profile →</div>
      </div>
    `;
  }).join('');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Set up time filter buttons
  document.querySelectorAll('.time-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.time-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadLeaderboard(btn.dataset.period);
    });
  });

  // Admin link on logo click
  const adminLink = document.getElementById('secret-admin-link');
  if (adminLink) {
    adminLink.addEventListener('click', () => {
      window.location.href = 'admin.html';
    });
  }

  // Load default leaderboard
  loadLeaderboard('week');
});
