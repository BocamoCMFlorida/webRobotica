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
