let manga = null;
let chapters = [];
let isFavorited = false;

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

// Load manga details
async function loadMangaDetails() {
  try {
    const response = await fetch(`/api/manga/${mangaId}`);
    const data = await response.json();
    
    manga = data.manga;
    chapters = data.chapters;
    isFavorited = data.isFavorited;
    
    displayMangaDetails(manga, chapters, data.readingHistory);
    loadComments(); // Load comments after manga details
  } catch (error) {
    console.error('Error loading manga details:', error);
    document.getElementById('mangaDetails').innerHTML = '<p class="error">Không thể tải thông tin truyện.</p>';
  }
}

// Display manga details
function displayMangaDetails(manga, chapters, readingHistory) {
  const container = document.getElementById('mangaDetails');
  
  const genreTags = manga.genres.map(g => `<a href="/library?genre=${encodeURIComponent(g)}" class="genre-tag">${translateGenre(g)}</a>`).join('');
  
  const continueReading = readingHistory 
    ? `<a href="/read/${readingHistory.chapterId}" class="btn btn-primary">
        <i class="fas fa-play"></i> Tiếp Tục Đọc - Chapter ${readingHistory.chapterNumber}
      </a>`
    : chapters.length > 0 
      ? `<a href="/read/${chapters[0]._id}" class="btn btn-primary">
          <i class="fas fa-book-open"></i> Bắt Đầu Đọc
        </a>`
      : '';
  
  const favoriteBtn = `<button class="btn ${isFavorited ? 'btn-secondary' : 'btn-outline'}" onclick="toggleFavorite()">
    <i class="fas fa-heart"></i> ${isFavorited ? 'Xóa khỏi Yêu thích' : 'Thêm vào Yêu thích'}
  </button>`;
  
  container.innerHTML = `
    <div class="manga-header">
      <img src="${manga.coverImage}" alt="${manga.title}" class="manga-cover">
      <div class="manga-info">
        <h1>${manga.title}</h1>
        <p class="manga-author"><strong>Tác giả:</strong> <a href="/library?author=${encodeURIComponent(manga.author)}" class="author-link">${manga.author}</a></p>
        <div class="manga-stats">
          <span class="status-badge ${manga.status.toLowerCase()}">${translateStatus(manga.status)}</span>
          <span><i class="fas fa-eye"></i> ${manga.views} lượt xem</span>
        </div>
        <div class="genre-tags">${genreTags}</div>
        <p class="manga-description">${manga.description}</p>
        <div class="manga-actions">
          ${continueReading}
          ${favoriteBtn}
        </div>
      </div>
    </div>
    
    <div class="chapters-section">
      <h2>Chapters (${chapters.length})</h2>
      <div class="chapters-list">
        ${chapters.length > 0 
          ? chapters.map(chapter => `
              <div class="chapter-item">
                <a href="/read/${chapter._id}">
                  <span class="chapter-number">Chapter ${chapter.chapterNumber}</span>
                  <span class="chapter-title">${chapter.title || ''}</span>
                  <span class="chapter-date">${formatDate(chapter.releaseDate)}</span>
                </a>
                <button 
                  class="btn-download-chapter" 
                  onclick="downloadChapter('${chapter._id}', event)"
                  title="Tải xuống chapter"
                >
                  <i class="fas fa-download"></i>
                </button>
              </div>
            `).join('')
          : '<p class="no-results">Chưa có chapter nào.</p>'
        }
      </div>
    </div>

    <div class="comments-section">
      <h2>Bình Luận</h2>
      <div id="commentFormContainer"></div>
      <div id="commentsList" class="comments-list">
        <div class="loading">Đang tải bình luận...</div>
      </div>
    </div>
  `;
  
  // Render comment form if user is logged in
  renderCommentForm();
}

// Toggle favorite
async function toggleFavorite() {
  try {
    const method = isFavorited ? 'DELETE' : 'POST';
    const response = await fetch(`/api/user/favorites/${mangaId}`, { method });
    
    if (response.ok) {
      isFavorited = !isFavorited;
      loadMangaDetails(); // Reload to update UI
    } else {
      const data = await response.json();
      alert(data.error || 'Không thể cập nhật yêu thích');
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    alert('Đã xảy ra lỗi');
  }
}

// Render comment form
function renderCommentForm() {
  const container = document.getElementById('commentFormContainer');
  
  // Check if user is logged in (from global user variable in main.js)
  if (window.currentUser) {
    container.innerHTML = `
      <form id="commentForm" class="comment-form">
        <textarea 
          id="commentContent" 
          placeholder="Viết bình luận của bạn..." 
          required
          maxlength="1000"
        ></textarea>
        <button type="submit" class="btn btn-primary">
          <i class="fas fa-paper-plane"></i> Gửi Bình Luận
        </button>
      </form>
    `;
    
    document.getElementById('commentForm').addEventListener('submit', handleCommentSubmit);
  } else {
    container.innerHTML = `
      <p class="login-prompt">
        <i class="fas fa-info-circle"></i> 
        <a href="/login">Đăng nhập</a> để bình luận
      </p>
    `;
  }
}

// Handle comment submission
async function handleCommentSubmit(e) {
  e.preventDefault();
  
  const content = document.getElementById('commentContent').value.trim();
  if (!content) return;
  
  try {
    const response = await fetch(`/api/comments/${mangaId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Clear form
      document.getElementById('commentContent').value = '';
      
      // Reload comments
      loadComments();
    } else {
      alert(data.error || 'Không thể gửi bình luận');
    }
  } catch (error) {
    console.error('Error posting comment:', error);
    alert('Đã xảy ra lỗi khi gửi bình luận');
  }
}

// Load comments
async function loadComments() {
  try {
    const response = await fetch(`/api/comments/${mangaId}`);
    const data = await response.json();
    
    if (data.success) {
      displayComments(data.comments);
    } else {
      document.getElementById('commentsList').innerHTML = '<p class="error">Không thể tải bình luận</p>';
    }
  } catch (error) {
    console.error('Error loading comments:', error);
    document.getElementById('commentsList').innerHTML = '<p class="error">Không thể tải bình luận</p>';
  }
}

// Display comments
function displayComments(comments) {
  const container = document.getElementById('commentsList');
  
  if (comments.length === 0) {
    container.innerHTML = '<p class="no-results">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>';
    return;
  }
  
  // Filter out any invalid comments
  const validComments = comments.filter(c => c && c._id);
  
  if (validComments.length === 0) {
    container.innerHTML = '<p class="no-results">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>';
    return;
  }
  
  container.innerHTML = validComments.map(comment => {
    // Handle deleted users with extra safety
    const userExists = comment.user && typeof comment.user === 'object' && comment.user._id;
    const username = userExists ? (comment.user.username || 'Unknown') : 'Người dùng đã bay màu';
    const userClass = userExists ? 'comment-author' : 'comment-author deleted-user';
    
    // Show delete button if user is owner OR admin
    const isOwnComment = window.currentUser && userExists && comment.user._id === window.currentUser.id;
    const isAdmin = window.currentUser && window.currentUser.isAdmin === true;
    const canDelete = isOwnComment || isAdmin;
    
    const deleteBtn = canDelete 
      ? `<button class="btn-delete" onclick="deleteComment('${comment._id}')" title="Xóa">
           <i class="fas fa-trash"></i>
         </button>`
      : '';
    
    return `
      <div class="comment-item" data-comment-id="${comment._id}">
        <div class="comment-header">
          <span class="${userClass}">
            <i class="fas ${userExists ? 'fa-user' : 'fa-user-slash'}"></i> ${username}
          </span>
          <span class="comment-time">${formatRelativeTime(comment.createdAt)}</span>
        </div>
        <div class="comment-body">
          <div class="comment-content">${escapeHtml(comment.content)}</div>
          ${deleteBtn ? `<div class="comment-actions">${deleteBtn}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Download chapter as ZIP
async function downloadChapter(chapterId, event) {
  // Prevent navigation when clicking the download button
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  try {
    // Get the button element
    const button = event.target.closest('.btn-download-chapter');
    const icon = button.querySelector('i');
    const originalIcon = icon.className;
    
    // Show loading state
    icon.className = 'fas fa-spinner fa-spin';
    button.disabled = true;
    
    // Trigger download
    const response = await fetch(`/api/chapters/download/${chapterId}`, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Download failed');
    }
    
    // Get the blob from response
    const blob = await response.blob();
    
    // Get filename from Content-Disposition header if available
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'chapter.zip';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    // Create download link and trigger download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    // Restore button state
    icon.className = originalIcon;
    button.disabled = false;
    
  } catch (error) {
    console.error('Error downloading chapter:', error);
    
    // Restore button state
    if (event) {
      const button = event.target.closest('.btn-download-chapter');
      const icon = button.querySelector('i');
      icon.className = 'fas fa-download';
      button.disabled = false;
    }
    
    // Show error message
    if (error.message.includes('Unauthorized')) {
      alert('Bạn cần đăng nhập để tải xuống chapter');
    } else {
      alert('Không thể tải xuống chapter. Vui lòng thử lại sau.');
    }
  }
}

// Delete comment
async function deleteComment(commentId) {
  if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;
  
  try {
    const response = await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Remove from UI
      const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
      if (commentElement) {
        commentElement.remove();
      }
      
      // Check if no comments left
      const commentsList = document.getElementById('commentsList');
      if (!commentsList.querySelector('.comment-item')) {
        commentsList.innerHTML = '<p class="no-results">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>';
      }
    } else {
      alert(data.error || 'Không thể xóa bình luận');
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    alert('Đã xảy ra lỗi khi xóa bình luận');
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', loadMangaDetails);


