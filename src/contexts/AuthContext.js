import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * AuthContext
 * Manages user authentication state and related operations
 */
const AuthContext = createContext();

/**
 * AuthProvider Component
 * Provides authentication context to the application
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Initialize authentication on component mount
   * Check for existing user session
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('authToken');

        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Failed to initialize authentication:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login function
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<void>}
   */
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      const userData = data.user;
      const token = data.token;

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('authToken', token);

      setUser(userData);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.message);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout function
   * Clears user data and authentication token
   */
  const logout = async () => {
    try {
      // TODO: Replace with actual API call
      const token = localStorage.getItem('authToken');
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    }
  };

  /**
   * Register function
   * @param {object} userData - User registration data
   * @returns {Promise<void>}
   */
  const register = async (userData) => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();
      const newUser = data.user;
      const token = data.token;

      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('authToken', token);

      setUser(newUser);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update user profile
   * @param {object} updates - Updated user data
   * @returns {Promise<void>}
   */
  const updateProfile = async (updates) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      // TODO: Replace with actual API call
      const response = await fetch(`/api/auth/profile/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Profile update failed');
      }

      const data = await response.json();
      const updatedUser = { ...user, ...data.user };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register,
    updateProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 * Custom hook to use authentication context
 * @returns {object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;
