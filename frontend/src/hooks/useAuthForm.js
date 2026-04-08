import { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { ShopContext } from '../context/ShopContext'

const AUTH_STATES = {
  LOGIN: 'Login',
  SIGN_UP: 'Sign Up',
}

const useAuthForm = () => {
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext)

  const [currentState, setCurrentState] = useState(AUTH_STATES.LOGIN)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const persistToken = (token) => {
    setToken(token)
    localStorage.setItem('token', token)
  }

  const validatePassword = () => {
    if (password !== confirmPassword) {
      toast.error("Passwords don't match")
      return false
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return false
    }

    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/
    if (!specialCharRegex.test(password)) {
      toast.error('Password must contain at least one special character')
      return false
    }

    return true
  }

  const handleSignUp = async () => {
    if (!validatePassword()) return

    const res = await axios.post(`${backendUrl}/api/user/register`, {
      name,
      email,
      password,
    })

    if (res.data.success) {
      persistToken(res.data.token)
    } else {
      toast.error(res.data.message)
    }
  }

  const handleLogin = async () => {
    const res = await axios.post(`${backendUrl}/api/user/login`, {
      email,
      password,
    })

    if (res.data.success) {
      persistToken(res.data.token)
    } else {
      toast.error(res.data.message)
    }
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault()

    try {
      if (currentState === AUTH_STATES.SIGN_UP) {
        await handleSignUp()
      } else {
        await handleLogin()
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (token) {
      navigate('/')
    }
  }, [token, navigate])

  return {
    currentState,
    setCurrentState,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    onSubmitHandler,
  }
}

export default useAuthForm
