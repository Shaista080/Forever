import { assets } from '../assets/assets'

const Navbar = ({ setToken }) => {
  return (
    <div className='flex items-center py-2 px-[4%] justify-between'>
      <img src={assets.logo} style={{ width: 'max(10%, 80px)' }} alt='' />
      <button
        onClick={() => setToken('')}
        className='bg-gray-600 text-white px-5 py-5 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm'
      >
        Logout
      </button>
    </div>
  )
}

export default Navbar
