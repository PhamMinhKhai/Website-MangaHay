// Translate status to Vietnamese
function translateStatus(status) {
  const statusTranslations = {
    'Ongoing': 'Đang Tiến Hành',
    'Completed': 'Hoàn Thành'
  };
  return statusTranslations[status] || status;
}

// Format views count
function formatViews(views) {
  if (views >= 1000000) {
    return (views / 1000000).toFixed(1) + 'M';
  } else if (views >= 1000) {
    return (views / 1000).toFixed(1) + 'K';
  }
  return views.toString();
}

// Tab management
function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Remove active from all buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected tab
  document.getElementById(tabName + 'Tab').classList.add('active');
  
  // Activate button
  event.target.classList.add('active');
  
  // Load data for the tab
  switch(tabName) {
    case 'info':
      loadUserInfo();
      break;
    case 'favorites':
      loadFavorites();
      break;
    case 'history':
      loadHistory();
      break;
    case 'password':
      // Password form doesn't need data loading
      break;
  }
}

// Load user info
async function loadUserInfo() {
  try {
    const response = await fetch('/api/user/profile');
    const user = await response.json();
    
    document.getElementById('userInfo').innerHTML = `
      <h2>Thông Tin Tài Khoản</h2>
      <div class="info-item">
        <label>Tên đăng nhập:</label>
        <span>${user.username}</span>
      </div>
      <div class="info-item">
        <label>Email:</label>
        <span>${user.email}</span>
      </div>
      <div class="info-item">
        <label>Thành viên từ:</label>
        <span>${formatDate(user.createdAt)}</span>
      </div>
      <div class="info-item">
        <label>Vai trò:</label>
        <span class="badge">${user.isAdmin ? 'Quản trị viên' : 'Người dùng'}</span>
      </div>
    `;
  } catch (error) {
    console.error('Error loading user info:', error);
    document.getElementById('userInfo').innerHTML = '<p class="error">Không thể tải thông tin người dùng.</p>';
  }
}

// Load favorites
async function loadFavorites() {
  try {
    const response = await fetch('/api/user/favorites');
    const favorites = await response.json();
    
    const container = document.getElementById('favoritesList');
    
    if (favorites.length === 0) {
      container.innerHTML = '<p class="no-results">Bạn chưa thêm truyện nào vào yêu thích.</p>';
      return;
    }
    
    container.innerHTML = favorites.map(fav => `
      <div class="manga-card favorite-card">
        <a href="/manga/${fav.mangaId._id}">
          <img src="${fav.mangaId.coverImage}" alt="${fav.mangaId.title}" loading="lazy">
          <div class="manga-card-info">
            <h3>${fav.mangaId.title}</h3>
            <p class="manga-author">${fav.mangaId.author}</p>
            <div class="manga-meta">
              <span><i class="fas fa-eye"></i> ${formatViews(fav.mangaId.views)}</span>
              <span class="status-badge ${fav.mangaId.status.toLowerCase()}">${translateStatus(fav.mangaId.status)}</span>
            </div>
          </div>
        </a>
        <button class="remove-btn" onclick="removeFavorite('${fav.mangaId._id}')" title="Xóa khỏi yêu thích">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading favorites:', error);
    document.getElementById('favoritesList').innerHTML = '<p class="error">Không thể tải danh sách yêu thích.</p>';
  }
}

// Remove favorite
async function removeFavorite(mangaId) {
  if (!confirm('Xóa truyện khỏi yêu thích?')) return;
  
  try {
    const response = await fetch(`/api/user/favorites/${mangaId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      loadFavorites();
    } else {
      alert('Không thể xóa khỏi yêu thích');
    }
  } catch (error) {
    console.error('Error removing favorite:', error);
    alert('Đã xảy ra lỗi');
  }
}

// Load reading history
async function loadHistory() {
  try {
    const response = await fetch('/api/user/history');
    const history = await response.json();
    
    const container = document.getElementById('historyList');
    
    if (history.length === 0) {
      container.innerHTML = '<p class="no-results">Chưa có lịch sử đọc.</p>';
      return;
    }
    
    container.innerHTML = history.map(item => `
      <div class="update-item">
        <img src="${item.mangaId.coverImage}" alt="${item.mangaId.title}" class="update-cover">
        <div class="update-info">
          <h3><a href="/manga/${item.mangaId._id}">${item.mangaId.title}</a></h3>
          <p class="update-chapter">
            <a href="/read/${item.chapterId._id}">Chapter ${item.chapterNumber}</a>
          </p>
          <p class="update-time">Đọc lần cuối: ${formatRelativeTime(item.lastRead)}</p>
        </div>
        <a href="/read/${item.chapterId._id}" class="btn btn-primary btn-sm">Tiếp tục</a>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading history:', error);
    document.getElementById('historyList').innerHTML = '<p class="error">Không thể tải lịch sử đọc.</p>';
  }
}

// Change password
async function changePassword(event) {
  event.preventDefault();
  
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  // Clear previous messages
  document.getElementById('passwordError').style.display = 'none';
  document.getElementById('passwordSuccess').style.display = 'none';
  
  // Validate passwords match
  if (newPassword !== confirmPassword) {
    showError('passwordError', 'Mật khẩu mới không khớp');
    return;
  }
  
  if (newPassword.length < 6) {
    showError('passwordError', 'Mật khẩu mới phải có ít nhất 6 ký tự');
    return;
  }
  
  try {
    const response = await fetch('/api/user/change-password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showSuccess('passwordSuccess', 'Đổi mật khẩu thành công!');
      document.getElementById('changePasswordForm').reset();
    } else {
      showError('passwordError', data.error || 'Không thể đổi mật khẩu');
    }
  } catch (error) {
    console.error('Error changing password:', error);
    showError('passwordError', 'Đã xảy ra lỗi');
  }
}

// Delete account
async function deleteAccount() {
  const confirmed = confirm('Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.');
  
  if (!confirmed) return;
  
  const doubleConfirm = confirm('Điều này sẽ xóa vĩnh viễn tất cả dữ liệu của bạn. Bạn có chắc chắn không?');
  
  if (!doubleConfirm) return;
  
  try {
    const response = await fetch('/api/user/account', {
      method: 'DELETE'
    });
    
    if (response.ok) {
      alert('Xóa tài khoản thành công');
      window.location.href = '/';
    } else {
      alert('Không thể xóa tài khoản');
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    alert('Đã xảy ra lỗi');
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadUserInfo();
});

