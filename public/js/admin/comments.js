// Load recent comments
async function loadRecentComments() {
  try {
    const response = await fetch('/api/comments/admin/recent');
    const data = await response.json();
    
    if (data.success) {
      displayCommentsTable(data.comments);
    } else {
      document.getElementById('commentsTable').innerHTML = '<p class="error">Không thể tải bình luận</p>';
    }
  } catch (error) {
    console.error('Error loading comments:', error);
    document.getElementById('commentsTable').innerHTML = '<p class="error">Không thể tải bình luận</p>';
  }
}

// Display comments in table format
function displayCommentsTable(comments) {
  const container = document.getElementById('commentsTable');
  
  if (comments.length === 0) {
    container.innerHTML = '<p class="no-results">Chưa có bình luận nào</p>';
    return;
  }
  
  const tableHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Người Dùng</th>
          <th>Truyện</th>
          <th>Nội Dung</th>
          <th>Thời Gian</th>
          <th>Hành Động</th>
        </tr>
      </thead>
      <tbody>
        ${comments.map(comment => `
          <tr data-comment-id="${comment._id}">
            <td>
              <i class="fas fa-user"></i> 
              ${comment.user ? comment.user.username : 'N/A'}
            </td>
            <td>
              ${comment.manga ? `
                <a href="/manga/${comment.manga._id}" target="_blank">
                  ${comment.manga.title}
                </a>
              ` : 'N/A'}
            </td>
            <td class="comment-content-cell">${escapeHtml(comment.content)}</td>
            <td>${formatRelativeTime(comment.createdAt)}</td>
            <td>
              <button 
                class="btn btn-danger btn-sm" 
                onclick="deleteComment('${comment._id}')"
                title="Xóa bình luận">
                <i class="fas fa-trash"></i> Xóa
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  container.innerHTML = tableHTML;
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
      // Remove row from table
      const row = document.querySelector(`tr[data-comment-id="${commentId}"]`);
      if (row) {
        row.remove();
      }
      
      // Check if table is empty
      const tbody = document.querySelector('.admin-table tbody');
      if (tbody && tbody.children.length === 0) {
        document.getElementById('commentsTable').innerHTML = '<p class="no-results">Chưa có bình luận nào</p>';
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
document.addEventListener('DOMContentLoaded', loadRecentComments);
