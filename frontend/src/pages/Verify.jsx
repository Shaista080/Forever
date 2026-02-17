import { useContext, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import axios from 'axios'

const Verify = () => {
  const { navigate, token, setCartItems, backendUrl } = useContext(ShopContext)

  const [searchParams] = useSearchParams()

  const success = searchParams.get('success')
  const orderId = searchParams.get('orderId')

  const verifyPayment = async () => {
    try {
      if (!token) {
        return null
      }

      const res = await axios.post(
        backendUrl + '/api/order/verifystripe',
        { success, orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (res.data.success) {
        setCartItems({})
        navigate('/orders')
      } else {
        navigate('/cart')
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  useEffect(() => {
    verifyPayment()
  }, [token])

  return <div></div>
}

export default Verify
