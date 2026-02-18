import Title from '../components/Title'

import { assets } from '../assets/assets'
import NewsletterBox from '../components/NewsletterBox'

const About = () => {
  return (
    <div>
      <div className='text-2xl text-center pt-8 border-t'>
        <Title text1={'ABOUT'} text2={'US'} />
      </div>

      <div className='my-10 flex flex-col md:flex-row gap-16'>
        <img
          src={assets.about_img}
          className='w-full md:max-w-[450px]'
          alt=''
        />
        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-gray-600'>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor
            quidem culpa sapiente necessitatibus similique, quaerat nisi fugiat
            at officiis tempora laboriosam ipsam iusto? Veritatis illum ipsum
            nihil delectus deserunt voluptates, officia nemo nulla aspernatur
            laboriosam.
          </p>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Soluta a
            doloremque vitae consectetur, quas earum voluptatum nobis itaque
            veritatis, ut ipsam eius sed ab fugiat.
          </p>

          <b className='text-gray-800'>Our Mission</b>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Suscipit
            eius officia fugit sequi libero possimus temporibus commodi
            doloremque omnis saepe.
          </p>
        </div>
      </div>

      <div className='text-xl py-4'>
        <Title text1={'WHY'} text2={'CHOOSE US'} />
      </div>

      <div className='flex flex-col md:flex-row text-sm mb-20'>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>Quality Assurance:</b>
          <p className='text-gray-600'>
            We meticulously select and vet each product to ensure it meets our
            stringent quality standard.
          </p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>Convenience:</b>
          <p className='text-gray-600'>
            With our user-friendly interface and hassle-free ordering process,
            shopping fas never been easier.
          </p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>Exceptional Customer Service:</b>
          <p className='text-gray-600'>
            Our team of dedicated professionals is here to assist you the way,
            ensuring your satisfaction is our top priority
          </p>
        </div>
      </div>

      <NewsletterBox />
    </div>
  )
}

export default About
