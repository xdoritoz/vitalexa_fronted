export const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

export const getRoleFromToken = (token) => {
  const decoded = decodeJWT(token);
  if (!decoded) return null;
  
  // 🔥 El rol está en el campo "roles" como array
  if (decoded.roles && Array.isArray(decoded.roles) && decoded.roles.length > 0) {
    return decoded.roles[0]; // Retorna el primer rol
  }
  
  // Fallback para otros formatos
  if (decoded.authorities && Array.isArray(decoded.authorities)) {
    return decoded.authorities[0];
  }
  
  return decoded.role || decoded.auth || null;
};
