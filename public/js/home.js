// Load featured manga
async function loadFeaturedManga() {
  try {
    const response = await fetch('/api/manga/featured/list');
    const manga = await response.json();
    
    const container = document.getElementById('featuredManga');
    
    if (manga.length === 0) {
      container.innerHTML = '<p class="no-results">Chưa có truyện nào.</p>';
      return;
    }
    
    container.innerHTML = manga.map(m => `
      <div class="manga-card">
        <a href="/manga/${m._id}">
          <img src="${m.coverImage}" alt="${m.title}" loading="lazy">
          <div class="manga-card-info">
            <h3>${m.title}</h3>
            <div class="manga-meta">
              <span><i class="fas fa-eye"></i> ${m.views} lượt xem</span>
            </div>
          </div>
        </a>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading featured manga:', error);
    document.getElementById('featuredManga').innerHTML = '<p class="error">Không thể tải truyện.</p>';
  }
}

// Load latest updates
async function loadLatestUpdates() {
  try {
    const response = await fetch('/api/manga/latest/updates');
    const updates = await response.json();
    
    const container = document.getElementById('latestUpdates');
    
    if (updates.length === 0) {
      container.innerHTML = '<p class="no-results">Chưa có cập nhật mới.</p>';
      return;
    }
    
    container.innerHTML = updates
      .filter(chapter => chapter.mangaId) // Filter out chapters with null manga
      .map(chapter => `
      <div class="update-item">
        <img src="${chapter.mangaId.coverImage}" alt="${chapter.mangaId.title}" class="update-cover">
        <div class="update-info">
          <h3><a href="/manga/${chapter.mangaId._id}">${chapter.mangaId.title}</a></h3>
          <p class="update-chapter">
            <a href="/read/${chapter._id}">Chapter ${chapter.chapterNumber}${chapter.title ? ': ' + chapter.title : ''}</a>
          </p>
          <p class="update-time">${formatRelativeTime(chapter.releaseDate)}</p>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading latest updates:', error);
    document.getElementById('latestUpdates').innerHTML = '<p class="error">Không thể tải cập nhật.</p>';
  }
}

// Load continue reading
async function loadContinueReading() {
  const container = document.getElementById('continueReading');
  if (!container) return;
  
  try {
    const response = await fetch('/api/user/history');
    
    if (!response.ok) {
      container.style.display = 'none';
      return;
    }
    
    const history = await response.json();
    
    if (history.length === 0) {
      container.innerHTML = '<p class="no-results">Chưa có lịch sử đọc.</p>';
      return;
    }
    
    // Show only first 6 items
    const recentHistory = history.slice(0, 6);
    
    container.innerHTML = recentHistory.map(item => `
      <div class="manga-card">
        <a href="/read/${item.chapterId._id}">
          <img src="${item.mangaId.coverImage}" alt="${item.mangaId.title}" loading="lazy">
          <div class="manga-card-info">
            <h3>${item.mangaId.title}</h3>
            <p class="continue-chapter">Chapter ${item.chapterNumber}</p>
            <p class="continue-time">${formatRelativeTime(item.lastRead)}</p>
          </div>
        </a>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading continue reading:', error);
    container.style.display = 'none';
  }
}

// Initialize home page
document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedManga();
  loadLatestUpdates();
  loadContinueReading();
});

