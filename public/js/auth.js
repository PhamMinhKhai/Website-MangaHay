// Handle login
async function handleLogin(event) {
  event.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      window.location.href = '/';
    } else {
      showError('errorMessage', data.error || 'Đăng nhập thất bại');
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('errorMessage', 'Đã xảy ra lỗi khi đăng nhập');
  }
}

// Handle registration
async function handleRegister(event) {
  event.preventDefault();
  
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  // Validate passwords match
  if (password !== confirmPassword) {
    showError('errorMessage', 'Mật khẩu không khớp');
    return;
  }
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      window.location.href = '/';
    } else {
      showError('errorMessage', data.error || 'Đăng ký thất bại');
    }
  } catch (error) {
    console.error('Registration error:', error);
    showError('errorMessage', 'Đã xảy ra lỗi khi đăng ký');
  }
}

