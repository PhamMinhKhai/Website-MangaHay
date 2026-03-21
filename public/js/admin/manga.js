// Genre translation map
const genreTranslations = {
  'Action': 'Hành Động',
  'Adventure': 'Phiêu Lưu',
  'Comedy': 'Hài Hước',
  'Drama': 'Chính Kịch',
  'Romance': 'Lãng Mạn',
  'Fantasy': 'Giả Tưởng',
  'Horror': 'Kinh Dị',
  'Mystery': 'Bí Ẩn',
  'Psychological': 'Tâm Lý',
  'Sci-Fi': 'Khoa Học Viễn Tưởng',
  'Slice of Life': 'Đời Thường',
  'Supernatural': 'Siêu Nhiên',
  'Sports': 'Thể Thao',
  'Mecha': 'Mecha'
};

// Translate genre to Vietnamese
function translateGenre(genre) {
  return genreTranslations[genre] || genre;
}

// Translate status to Vietnamese
function translateStatus(status) {
  const statusTranslations = {
    'Ongoing': 'Đang Tiến Hành',
    'Completed': 'Hoàn Thành'
  };
  return statusTranslations[status] || status;
}

// Load all manga
async function loadManga() {
  try {
    const response = await fetch('/api/admin/manga?limit=1000');
    const data = await response.json();
    
    const container = document.getElementById('mangaList');
    
    if (data.manga.length === 0) {
      container.innerHTML = '<p class="no-results">Chưa có truyện nào trong cơ sở dữ liệu.</p>';
      return;
    }
    
    container.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Bìa</th>
            <th>Tiêu Đề</th>
            <th>Tác Giả</th>
            <th>Trạng Thái</th>
            <th>Thể Loại</th>
            <th>Lượt Xem</th>
            <th>Hiển Thị</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          ${data.manga.map(manga => `
            <tr>
              <td><img src="${manga.coverImage}" alt="${manga.title}" class="table-cover"></td>
              <td>${manga.title}</td>
              <td>${manga.author}</td>
              <td><span class="status-badge ${manga.status.toLowerCase()}">${translateStatus(manga.status)}</span></td>
              <td>${manga.genres.map(g => translateGenre(g)).join(', ')}</td>
              <td>${manga.views}</td>
              <td>
                <button 
                  class="btn btn-sm ${manga.isPublished ? 'btn-success' : 'btn-secondary'}" 
                  onclick="toggleMangaStatus('${manga._id}')" 
                  title="${manga.isPublished ? 'Công Khai' : 'Ẩn'}"
                >
                  <i class="fas ${manga.isPublished ? 'fa-eye' : 'fa-eye-slash'}"></i>
                  ${manga.isPublished ? 'Công Khai' : 'Ẩn'}
                </button>
              </td>
              <td class="action-buttons">
                <a href="/admin/manga/edit/${manga._id}" class="btn btn-sm btn-primary" title="Chỉnh Sửa">
                  <i class="fas fa-edit"></i>
                </a>
                <a href="/admin/manga/${manga._id}/chapters" class="btn btn-sm btn-secondary" title="Quản Lý Chapter">
                  <i class="fas fa-list"></i>
                </a>
                <button class="btn btn-sm btn-danger" onclick="deleteManga('${manga._id}')" title="Xóa">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Error loading manga:', error);
    document.getElementById('mangaList').innerHTML = '<p class="error">Không thể tải danh sách truyện.</p>';
  }
}

// Toggle manga status (show/hide)
async function toggleMangaStatus(mangaId) {
  try {
    const response = await fetch(`/api/admin/manga/toggle-status/${mangaId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      alert(data.message);
      loadManga();
    } else {
      const data = await response.json();
      alert(data.error || 'Không thể thay đổi trạng thái');
    }
  } catch (error) {
    console.error('Error toggling manga status:', error);
    alert('Đã xảy ra lỗi');
  }
}

// Delete manga
async function deleteManga(mangaId) {
  if (!confirm('Bạn có chắc chắn muốn xóa truyện này? Điều này cũng sẽ xóa tất cả các chapter và không thể hoàn tác.')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/admin/manga/${mangaId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      alert('Xóa truyện thành công');
      loadManga();
    } else {
      const data = await response.json();
      alert(data.error || 'Không thể xóa truyện');
    }
  } catch (error) {
    console.error('Error deleting manga:', error);
    alert('Đã xảy ra lỗi');
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', loadManga);
