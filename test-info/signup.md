# Signup Flow — Frontend to Backend

## End-to-end diagram

```
BROWSER
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Login.jsx  (the UI — only renders HTML)                    │
│  ┌──────────────────────────────┐                           │
│  │  <form onSubmit={handler}>   │                           │
│  │    <input> Name              │                           │
│  │    <input> Email             │                           │
│  │    <input> Password          │                           │
│  │    <input> Confirm Password  │                           │
│  │    <button> Sign Up          │                           │
│  └──────────────────────────────┘                           │
│           │  user clicks Sign Up                            │
│           ▼                                                 │
│  useAuthForm.js  (all the logic lives here)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. onSubmitHandler() called                          │   │
│  │ 2. validatePassword() runs:                          │   │
│  │      - do passwords match?          ──► toast.error  │   │
│  │      - is length >= 8?              ──► toast.error  │   │
│  │      - has special character?       ──► toast.error  │   │
│  │ 3. if valid → handleSignUp()                         │   │
│  │      - axios.POST /api/user/register                 │   │
│  │        sends: { name, email, password }              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                        │  HTTP request over the network
                        ▼
SERVER (Node.js process running on port 4000)
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  server.js  (the entry point — wires everything together)   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ - creates the Express app                            │   │
│  │ - calls connectDB() → connects to MongoDB            │   │
│  │ - registers routes: app.use('/api/user', userRouter) │   │
│  │ - starts listening on port 4000                      │   │
│  └──────────────────────────────────────────────────────┘   │
│           │  request matches /api/user/register             │
│           ▼                                                 │
│  userRoutes.js  (a signpost — maps URLs to functions)       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ POST /register  ──►  registerUser()                  │   │
│  │ POST /login     ──►  loginUser()                     │   │
│  └──────────────────────────────────────────────────────┘   │
│           │                                                 │
│           ▼                                                 │
│  userController.js  (the business logic)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ registerUser():                                      │   │
│  │  1. lowercase the email                              │   │
│  │  2. does email already exist in DB?  ──► READ from DB│   │◄── DB READ
│  │       if yes → { success: false }                    │   │
│  │  3. is email format valid?           ──► { success: false } │
│  │  4. is password >= 8 chars?          ──► { success: false } │
│  │  5. bcrypt.hash(password, salt=10)                   │   │
│  │  6. new userModel({ name, email, hashedPassword })   │   │
│  │  7. save to MongoDB                  ──► WRITE to DB │   │◄── DB WRITE
│  │  8. jwt.sign({ id: user._id })  ──► token            │   │
│  │  9. return { success: true, token }                  │   │
│  └──────────────────────────────────────────────────────┘   │
│           │  reads/writes via Mongoose                      │
│           ▼                                                 │
│  userModel.js  (the blueprint for a user document)          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Schema:                                              │   │
│  │   name:     String, required                         │   │
│  │   email:    String, required, unique                 │   │
│  │   password: String, required  (stores the HASH)      │   │
│  │   cartData: Object, default {}                       │   │
│  └──────────────────────────────────────────────────────┘   │
│           │                                                 │
│           ▼                                                 │
│  MongoDB  (the actual database on disk)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ collection: "user"                                   │   │
│  │ { _id, name, email, hashedPassword, cartData: {} }   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                        │  HTTP response: { success: true, token }
                        ▼
BROWSER — back in useAuthForm.js
┌─────────────────────────────────────────────────────────────┐
│  if success:                                                │
│    setToken(token)  +  localStorage.setItem('token', ...)   │
│    useEffect sees token changed → navigate('/')             │
│  if failure:                                                │
│    toast.error(res.data.message)                            │
└─────────────────────────────────────────────────────────────┘
```
