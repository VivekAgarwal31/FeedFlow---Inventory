import React, { createContext, useContext, useEffect, useState } from 'react'
import { authAPI } from '../lib/api'
import { clearGlobalBusinessData } from '../lib/storage'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
      // Verify token is still valid
      authAPI.getMe()
        .then(response => {
          setUser(response.data.user)
          localStorage.setItem('user', JSON.stringify(response.data.user))
        })
        .catch(() => {
          logout()
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      const { token, user } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)

      return { success: true }
    } catch (error) {
      const errorData = error.response?.data
      return {
        success: false,
        message: errorData?.message || 'Login failed',
        requiresVerification: errorData?.requiresVerification,
        email: errorData?.email
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData)

      // Check if verification is required
      if (response.data.requiresVerification) {
        return {
          success: true,
          requiresVerification: true,
          email: response.data.email,
          message: response.data.message
        }
      }

      // Legacy support: if token is returned (old behavior)
      const { token, user } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('lastCompanyId') // Clear company tracking
    clearGlobalBusinessData() // Clear any global business data to prevent cross-contamination
    setUser(null)
  }

  const updateUser = (userDataOrUpdater) => {
    if (typeof userDataOrUpdater === 'function') {
      setUser(prev => {
        const next = userDataOrUpdater(prev)
        localStorage.setItem('user', JSON.stringify(next))
        return next
      })
    } else {
      setUser(userDataOrUpdater)
      localStorage.setItem('user', JSON.stringify(userDataOrUpdater))
    }
  }

  const setAuthData = (token, userData) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    setAuthData,
    loading,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
