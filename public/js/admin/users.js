// Load all users
async function loadUsers() {
  try {
    const response = await fetch('/api/admin/users');
    const users = await response.json();
    
    const container = document.getElementById('usersList');
    
    if (users.length === 0) {
      container.innerHTML = '<p class="no-results">Chưa có người dùng nào đăng ký.</p>';
      return;
    }
    
    container.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Tên Người Dùng</th>
            <th>Email</th>
            <th>Vai Trò</th>
            <th>Tham Gia</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(user => `
            <tr>
              <td>${user.username}</td>
              <td>${user.email}</td>
              <td>
                <span class="badge ${user.isAdmin ? 'admin' : 'user'}">
                  ${user.isAdmin ? 'Quản Trị' : 'Người Dùng'}
                </span>
              </td>
              <td>${formatDate(user.createdAt)}</td>
              <td class="action-buttons">
                <button class="btn btn-sm btn-secondary" onclick="toggleRole('${user._id}', ${!user.isAdmin})" title="Thay Đổi Vai Trò">
                  <i class="fas fa-user-shield"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser('${user._id}')" title="Xóa">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Error loading users:', error);
    document.getElementById('usersList').innerHTML = '<p class="error">Không thể tải danh sách người dùng.</p>';
  }
}

// Toggle user role
async function toggleRole(userId, makeAdmin) {
  const action = makeAdmin ? 'cấp quyền quản trị cho' : 'thu hồi quyền quản trị từ';
  
  if (!confirm(`Bạn có chắc chắn muốn ${action} người dùng này?`)) {
    return;
  }
  
  try {
    const response = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isAdmin: makeAdmin })
    });
    
    if (response.ok) {
      alert('Cập nhật vai trò người dùng thành công');
      loadUsers();
    } else {
      const data = await response.json();
      alert(data.error || 'Không thể cập nhật vai trò người dùng');
    }
  } catch (error) {
    console.error('Error updating user role:', error);
    alert('Đã xảy ra lỗi');
  }
}

// Delete user
async function deleteUser(userId) {
  if (!confirm('Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      alert('Xóa người dùng thành công');
      loadUsers();
    } else {
      const data = await response.json();
      alert(data.error || 'Không thể xóa người dùng');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('Đã xảy ra lỗi');
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', loadUsers);

