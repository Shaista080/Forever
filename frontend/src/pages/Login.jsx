import useAuthForm from '../hooks/useAuthForm'

const Login = () => {
  const {
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
  } = useAuthForm()

  const isLogin = currentState === 'Login'
  const isSignUp = currentState === 'Sign Up'
  const nextState = isLogin ? 'Sign Up' : 'Login'
  const stateToggleText = isLogin ? 'Create account' : 'Login Here'
  const submitButtonText = isLogin ? 'Sign In' : 'Sign Up'

  return (
    <form
      onSubmit={onSubmitHandler}
      className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800'
    >
      <div className='inline-flex items-center gap-2 mb-2 mt-10'>
        <h1 className='prata-regular text-3xl'>{currentState}</h1>
        <hr className='border-none h-[1.5px] w-8 bg-gray-800' />
      </div>

      {isSignUp && (
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

      {isSignUp && (
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
        {isLogin ? (
          <p className='cursor-pointer'>Forgot your password?</p>
        ) : (
          <span />
        )}

        <p
          onClick={() => setCurrentState(nextState)}
          className='cursor-pointer'
        >
          {stateToggleText}
        </p>
      </div>

      <button className='bg-black text-white font-light px-8 py-2 mt-4'>
        {submitButtonText}
      </button>
    </form>
  )
}

export default Login
