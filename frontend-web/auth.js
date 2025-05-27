export async function login(username, password) {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch('http://localhost:8000/login', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Login failed');
  }

  const data = await response.json();
  return data.access_token;
}
export async function register(username, password, email) {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  formData.append('email', email);

  const response = await fetch('http://localhost:8000/register', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Registration failed');
  }

  const data = await response.json();
  return data;
}

