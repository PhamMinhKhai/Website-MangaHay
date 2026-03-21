// Load dashboard statistics
async function loadStats() {
  try {
    const response = await fetch('/api/admin/stats');
    const stats = await response.json();
    
    const container = document.getElementById('statsCards');
    
    container.innerHTML = `
      <div class="stat-card">
        <i class="fas fa-book"></i>
        <h3>${stats.totalManga}</h3>
        <p>Tổng Truyện</p>
      </div>
      <div class="stat-card">
        <i class="fas fa-list"></i>
        <h3>${stats.totalChapters}</h3>
        <p>Tổng Chapter</p>
      </div>
      <div class="stat-card">
        <i class="fas fa-users"></i>
        <h3>${stats.totalUsers}</h3>
        <p>Tổng Người Dùng</p>
      </div>
      <div class="stat-card">
        <i class="fas fa-play-circle"></i>
        <h3>${stats.ongoingManga}</h3>
        <p>Truyện Đang Tiến Hành</p>
      </div>
      <div class="stat-card">
        <i class="fas fa-check-circle"></i>
        <h3>${stats.completedManga}</h3>
        <p>Truyện Hoàn Thành</p>
      </div>
    `;
  } catch (error) {
    console.error('Error loading stats:', error);
    document.getElementById('statsCards').innerHTML = '<p class="error">Không thể tải thống kê.</p>';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', loadStats);

