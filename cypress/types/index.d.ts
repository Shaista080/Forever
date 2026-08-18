export interface RegisterUserPayload {
  name: string
  email: string
  password: string
}

export interface RegisterUserResponse {
  success: boolean
  message?: string
  token?: string
}
