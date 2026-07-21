import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import Add from './Add'

vi.mock('../App', () => ({
  backendUrl: 'http://localhost:1001',
}))

vi.mock('axios')
vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

const fillRequired = () => {
  fireEvent.change(screen.getByPlaceholderText('Type here'), {
    target: { value: 'Cool Shirt' },
  })
  fireEvent.change(screen.getByPlaceholderText('Write content here'), {
    target: { value: 'A very cool shirt' },
  })
  fireEvent.change(screen.getByPlaceholderText('25'), {
    target: { value: '49' },
  })
}

const submit = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Add' }))

describe('Admin Add Page Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // jsdom has no URL.createObjectURL (used for image preview)
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    axios.post.mockResolvedValue({
      data: { success: true, message: 'Product Added' },
    })
  })

  afterEach(() => {
    delete URL.createObjectURL
  })

  it('posts the product as FormData with the auth header', async () => {
    render(<Add token='tkn' />)
    fillRequired()
    fireEvent.click(screen.getByText('S'))
    fireEvent.click(screen.getByText('M'))
    submit()

    await waitFor(() => expect(axios.post).toHaveBeenCalled())

    const [url, formData, config] = axios.post.mock.calls[0]
    expect(url).toBe('http://localhost:1001/api/product/add')
    expect(config).toEqual({ headers: { Authorization: 'Bearer tkn' } })
    expect(formData.get('name')).toBe('Cool Shirt')
    expect(formData.get('description')).toBe('A very cool shirt')
    expect(formData.get('price')).toBe('49')
    expect(formData.get('category')).toBe('Men')
    expect(formData.get('sizes')).toBe(JSON.stringify(['S', 'M']))
  })

  it('appends selected category/subCategory and uploaded image', async () => {
    render(<Add token='tkn' />)
    fillRequired()

    fireEvent.change(screen.getAllByRole('combobox')[0], {
      target: { value: 'Women' },
    })
    fireEvent.change(screen.getAllByRole('combobox')[1], {
      target: { value: 'Winterwear' },
    })
    const file = new File(['img'], 'photo.png', { type: 'image/png' })
    fireEvent.change(document.getElementById('image1'), {
      target: { files: [file] },
    })

    submit()

    await waitFor(() => expect(axios.post).toHaveBeenCalled())
    const formData = axios.post.mock.calls[0][1]
    expect(formData.get('category')).toBe('Women')
    expect(formData.get('subCategory')).toBe('Winterwear')
    expect(formData.get('image1')).toBeInstanceOf(File)
  })

  it('shows a success toast and clears fields on success', async () => {
    const { toast } = await import('react-toastify')
    render(<Add token='tkn' />)
    fillRequired()
    submit()

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Product Added')
    )
    expect(screen.getByPlaceholderText('Type here')).toHaveValue('')
    expect(screen.getByPlaceholderText('25')).toHaveValue(null)
  })

  it('shows an error toast when the API returns success: false', async () => {
    axios.post.mockResolvedValue({
      data: { success: false, message: 'Missing fields' },
    })
    const { toast } = await import('react-toastify')
    render(<Add token='tkn' />)
    fillRequired()
    submit()

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Missing fields')
    )
  })

  it('shows an error toast when the request rejects', async () => {
    axios.post.mockRejectedValue(new Error('Network Error'))
    const { toast } = await import('react-toastify')
    render(<Add token='tkn' />)
    fillRequired()
    submit()

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Network Error')
    )
  })
})
