# Signup Tests

---

## Frontend

### `pages/Login.test.jsx` — UI unit tests

| | |
|---|---|
| **Type** | Unit |
| **What it tests** | The `Login` component renders the correct HTML and wires up user interactions |
| **What this layer proves** | The UI renders the right fields and buttons in Sign Up state, and that every input calls the correct setter from the hook |
| **Tool** | Vitest + React Testing Library |

| Mocked | Real |
|---|---|
| `useAuthForm` hook (entirely replaced with `vi.fn()` return values) | React component rendering |
| — | DOM interactions via `fireEvent` |

> The entire hook is mocked so this file tests only the component — what it renders and what it calls — without any logic, API, or state running.

---

### `hooks/useAuthForm.test.jsx` — hook unit tests

| | |
|---|---|
| **Type** | Unit |
| **What it tests** | The `useAuthForm` hook: FE validation logic, API call shape, token persistence, error handling, and redirect behaviour |
| **What this layer proves** | All FE business logic is correct in isolation — validation fires before the API is called, the token is stored on success, errors surface as toasts, and the redirect triggers when a token exists |
| **Tool** | Vitest + React Testing Library (`renderHook`) |

| Mocked | Real |
|---|---|
| `axios` | Hook state and logic |
| `toast` from react-toastify | `validatePassword` logic inside the hook |
| `localStorage` (spied on) | `useEffect` redirect behaviour |
| `ShopContext` (fake values for `token`, `setToken`, `navigate`, `backendUrl`) | — |

---

### `pages/Login.integration.test.jsx` — FE integration tests

| | |
|---|---|
| **Type** | Integration |
| **What it tests** | The full frontend signup flow: the `Login` component + `useAuthForm` hook working together, from user interaction through to API call and response handling |
| **What this layer proves** | The component and hook integrate correctly — typing into fields, submitting the form, receiving an API response, storing the token, and showing error toasts all work end-to-end on the frontend |
| **Tool** | Vitest + React Testing Library + `MemoryRouter` |

| Mocked | Real |
|---|---|
| `axios` (controls API response) | `Login` component rendering |
| `toast` from react-toastify | `useAuthForm` hook (runs for real, not mocked) |
| `ShopContext` (fake `navigate`, `setToken`, `backendUrl`) | `validatePassword` logic |
| `localStorage` (spied on) | Form interactions via `fireEvent` |
| — | `useEffect` redirect behaviour |

---

## Backend

### `controllers/validateRegistrationInput.test.js` — pure function unit tests

| | |
|---|---|
| **Type** | Unit |
| **What it tests** | The `validateRegistrationInput` function extracted from `userController.js` |
| **What this layer proves** | Email and password validation logic is correct for all input combinations, independent of any controller, database, or HTTP layer |
| **Tool** | Jest only |

| Mocked | Real |
|---|---|
| Nothing | `validator.isEmail` (pure function, no I/O) |

---

### `controllers/registerUser.test.js` — controller unit tests

| | |
|---|---|
| **Type** | Unit |
| **What it tests** | The `registerUser` function — every branch: invalid email, short password, duplicate user, DB save failure, and success |
| **What this layer proves** | The controller handles each case correctly, calls its dependencies with the right arguments, and never hits the database unnecessarily |
| **Tool** | Jest (`jest.fn()`, `jest.unstable_mockModule`) |

| Mocked | Real |
|---|---|
| `userModel.findOne` | `validator.isEmail` |
| `userModel` constructor + `.save()` | Controller branching logic |
| `bcrypt.hash` | — |
| `jwt.sign` | — |
| `req` and `res` (plain JS objects, `res.json` is a `jest.fn()`) | — |

> **Why dynamic imports:** ES module `import` statements are hoisted and execute before any code in the file. `jest.unstable_mockModule` must be registered first. `await import(...)` runs after mocks are in place, so the module loads with mocked dependencies.

---

### `models/userModel.test.js` — model unit tests

| | |
|---|---|
| **Type** | Unit |
| **What it tests** | The Mongoose schema: required fields, default values, and the unique email index |
| **What this layer proves** | MongoDB enforces schema constraints independently of the controller — a safety net that holds even if controller-level checks are removed |
| **Tool** | Jest + `mongodb-memory-server` |

| Mocked | Real |
|---|---|
| Nothing | MongoDB (in-memory via `mongodb-memory-server`) |
| — | Mongoose schema validation and unique index enforcement |

> **Why not redundant with controller tests:** The controller unit test mocks the DB and proves the controller *code* handles duplicates. This file proves the *database index* independently rejects duplicates — two separate guarantees at two different layers.

---

### `routes/userRegistration.integration.test.js` — BE integration tests

| | |
|---|---|
| **Type** | Integration |
| **What it tests** | The full backend signup flow from HTTP request to database and back |
| **What this layer proves** | All backend layers connect correctly: the route is wired up, Express parses the request, the controller runs, bcrypt hashes the password, the user is persisted, and the JWT returned is valid |
| **Tool** | Jest + supertest + `mongodb-memory-server` |

| Mocked | Real |
|---|---|
| `server.js` not imported (avoids `connectDB` / `connectCloudinary` side effects) | HTTP layer via supertest |
| — | Express routing |
| — | `registerUser` controller |
| — | `bcrypt` (real hashing) |
| — | `jwt` (real token signed and decoded) |
| — | MongoDB (in-memory) |

> A minimal Express app is constructed for tests: `app.use(express.json())` + `app.use('/api/user', userRouter)` — enough to exercise the real stack without production side effects.
