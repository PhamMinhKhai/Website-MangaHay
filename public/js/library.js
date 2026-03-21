let currentPage = 1;
const limit = 20;

// Translate status to Vietnamese
function translateStatus(status) {
  const statusTranslations = {
    'Ongoing': 'Đang Tiến Hành',
    'Completed': 'Hoàn Thành'
  };
  return statusTranslations[status] || status;
}

// Load manga with filters
async function loadManga(page = 1) {
  try {
    const genre = document.getElementById('genreFilter').value;
    const status = document.getElementById('statusFilter').value;
    const sort = document.getElementById('sortFilter').value;
    const search = document.getElementById('searchInput').value;
    
    // Get author from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const author = urlParams.get('author');
    
    const params = new URLSearchParams({
      page,
      limit,
      ...(genre && { genre }),
      ...(status && { status }),
      ...(sort && { sort }),
      ...(search && { search }),
      ...(author && { author })
    });
    
    const response = await fetch(`/api/manga?${params}`);
    const data = await response.json();
    
    displayManga(data.manga);
    displayPagination(data.currentPage, data.totalPages);
    
    currentPage = data.currentPage;
  } catch (error) {
    console.error('Error loading manga:', error);
    document.getElementById('mangaList').innerHTML = '<p class="error">Không thể tải truyện.</p>';
  }
}

// Display manga
function displayManga(manga) {
  const container = document.getElementById('mangaList');
  
  if (manga.length === 0) {
    container.innerHTML = '<p class="no-results">Không tìm thấy truyện phù hợp.</p>';
    return;
  }
  
  container.innerHTML = manga.map(m => `
    <div class="manga-card">
      <a href="/manga/${m._id}">
        <img src="${m.coverImage}" alt="${m.title}" loading="lazy">
        <div class="manga-card-info">
          <h3>${m.title}</h3>
          <p class="manga-author">${m.author}</p>
          <div class="manga-meta">
            <span class="status-badge ${m.status.toLowerCase()}">${translateStatus(m.status)}</span>
            <span><i class="fas fa-eye"></i> ${m.views}</span>
          </div>
        </div>
      </a>
    </div>
  `).join('');
}

// Display pagination
function displayPagination(current, total) {
  const container = document.getElementById('pagination');
  
  if (total <= 1) {
    container.innerHTML = '';
    return;
  }
  
  let html = '';
  
  // Previous button
  html += `<button class="page-btn" ${current === 1 ? 'disabled' : ''} onclick="loadManga(${current - 1})">
    <i class="fas fa-chevron-left"></i> Trước
  </button>`;
  
  // Page numbers
  const startPage = Math.max(1, current - 2);
  const endPage = Math.min(total, current + 2);
  
  if (startPage > 1) {
    html += `<button class="page-btn" onclick="loadManga(1)">1</button>`;
    if (startPage > 2) html += '<span class="page-ellipsis">...</span>';
  }
  
  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="loadManga(${i})">${i}</button>`;
  }
  
  if (endPage < total) {
    if (endPage < total - 1) html += '<span class="page-ellipsis">...</span>';
    html += `<button class="page-btn" onclick="loadManga(${total})">${total}</button>`;
  }
  
  // Next button
  html += `<button class="page-btn" ${current === total ? 'disabled' : ''} onclick="loadManga(${current + 1})">
    Sau <i class="fas fa-chevron-right"></i>
  </button>`;
  
  container.innerHTML = html;
}

// Apply filters
function applyFilters() {
  loadManga(1);
}

// Initialize library page
document.addEventListener('DOMContentLoaded', () => {
  // Load URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.has('genre')) {
    document.getElementById('genreFilter').value = urlParams.get('genre');
  }
  if (urlParams.has('status')) {
    document.getElementById('statusFilter').value = urlParams.get('status');
  }
  if (urlParams.has('search')) {
    document.getElementById('searchInput').value = urlParams.get('search');
  }
  if (urlParams.has('author')) {
    document.getElementById('searchInput').value = urlParams.get('author');
  }
  
  loadManga(1);
  
  // Add enter key support for search
  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  });
});

