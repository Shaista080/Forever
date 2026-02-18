import jwt from 'jsonwebtoken'

const authUser = async (req, res, next) => {
  const { authorization } = req.headers

  if (!authorization) {
    return res.status(401).json({
      success: false,
      message: 'NOT AUTHORIZED, LOGIN AGAIN!',
    })
  }

  const token = authorization.split(' ')[1]

  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET)
    req.body.userId = token_decode.id
    next()
  } catch (e) {
    console.log(e)
    res.status(401).json({ success: false, message: 'Error! Not Authorized' })
  }
}

export default authUser
