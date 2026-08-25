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

export interface SeedProduct {
  name: string
  description: string
  price: number
  images: string[]
  category: string
  subCategory: string
  sizes: string[]
  bestSeller: boolean
}

export interface SeedProductCounts {
  category: {
    all: number
    Men: number
    Women: number
    Kids: number
  }
  type: {
    all: number
    Topwear: number
    Bottomwear: number
    Winterwear: number
  }
  combo: {
    MenBottomwear: number
    WomenWinterwear: number
    WomenKidsTopwear: number
  }
}
