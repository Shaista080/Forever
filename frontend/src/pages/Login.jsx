import { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const Login = () => {
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext)
  const [currentState, setCurrentState] = useState('Login')

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    try {
      if (currentState === 'Sign Up') {
        if (password !== confirmPassword) {
          toast.error("Passwords don't match")
          return
        }
        if (password.length < 8) {
          toast.error('Password must be at least 8 characters long')
          return
        }
        const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/
        if (!specialCharRegex.test(password)) {
          toast.error('Password must contain at least one special character')
          return
        }
        const res = await axios.post(backendUrl + '/api/user/register', {
          name,
          email,
          password,
        })

        if (res.data.success) {
          setToken(res.data.token)
          localStorage.setItem('token', res.data.token)
        } else {
          toast.error(res.data.message)
        }
      } else {
        const res = await axios.post(backendUrl + '/api/user/login', {
          email,
          password,
        })

        if (res.data.success) {
          setToken(res.data.token)
          localStorage.setItem('token', res.data.token)
        } else {
          toast.error(res.data.message)
        }
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (token) {
      navigate('/')
    }
  }, [token, navigate])

  return (
    <form
      onSubmit={onSubmitHandler}
      className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800'
    >
      <div className='inline-flex items-center gap-2 mb-2 mt-10'>
        <p className='prata-regular text-3xl'>{currentState}</p>
        <hr className='border-none h-[1.5px] w-8 bg-gray-800' />
      </div>

      {currentState === 'Login' ? (
        ''
      ) : (
        <input
          type='text'
          className='w-full px-3 py-2 border border-gray-800'
          placeholder='Name'
          required
          onChange={(e) => setName(e.target.value)}
          value={name}
        />
      )}
      <input
        type='email'
        className='w-full px-3 py-2 border border-gray-800'
        placeholder='Email'
        required
        onChange={(e) => setEmail(e.target.value)}
        value={email}
      />
      <input
        type='password'
        className='w-full px-3 py-2 border border-gray-800'
        placeholder='Password'
        required
        onChange={(e) => setPassword(e.target.value)}
        value={password}
      />
      {currentState === 'Sign Up' && (
        <input
          type='password'
          className='w-full px-3 py-2 border border-gray-800'
          placeholder='Confirm Password'
          required
          onChange={(e) => setConfirmPassword(e.target.value)}
          value={confirmPassword}
        />
      )}

      <div className='w-full flex justify-between text-sm mt-[-8px]'>
        {currentState === 'Login' ? (
          <p className='cursor-pointer'>Forgot your password?</p>
        ) : (
          <span></span>
        )}
        {currentState === 'Login' ? (
          <p
            onClick={() => setCurrentState('Sign Up')}
            className='cursor-pointer'
          >
            Create account
          </p>
        ) : (
          <p
            onClick={() => setCurrentState('Login')}
            className='cursor-pointer'
          >
            Login Here{' '}
          </p>
        )}
      </div>

      <button className='bg-black text-white font-light px-8 py-2 mt-4'>
        {currentState === 'Login' ? 'Sign In' : 'Sign Up'}
      </button>
    </form>
  )
}

export default Login
