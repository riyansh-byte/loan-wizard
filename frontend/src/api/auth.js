let token = null;

export const login = async (email, password) => {
  // Mock response — replace with a real API call once available
  if (email === 'admin@loanwizard.com' && password === 'admin123') {
    token = 'mock-jwt-token-' + Date.now();
    return { success: true, token };
  }

  throw new Error('Invalid credentials');
};

export const isAuthenticated = () => Boolean(token);
export const getToken = () => token;
export const logout = () => {
  token = null;
};
