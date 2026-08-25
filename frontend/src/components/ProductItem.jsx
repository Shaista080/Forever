import { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { Link } from 'react-router-dom'

const ProductItem = ({ id, image, name, price }) => {
  const { currency } = useContext(ShopContext)
  return (
    <Link
      to={`/product/${id}`}
      className='text-gray-700 cursor-pointer'
      data-testid='product-card'
      data-product-name={name}
    >
      <div className='overflow-hidden'>
        <img
          src={image[0]}
          alt=''
          className='hover:scale-110 transition ease-in-out'
        />
      </div>
      <p className='pt-3 pb-1 text-sm' data-testid='product-card-name'>
        {name}
      </p>
      <p className='text-sm font-medium' data-testid='product-card-price'>
        {currency}
        {price}
      </p>
    </Link>
  )
}

export default ProductItem
