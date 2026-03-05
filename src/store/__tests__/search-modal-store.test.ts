import { describe, it, expect, beforeEach } from 'vitest'
import { useSearchModalStore } from '../search-modal-store'

describe('search-modal-store', () => {
  beforeEach(() => {
    useSearchModalStore.setState({ open: false })
  })

  it('should be closed by default', () => {
    expect(useSearchModalStore.getState().open).toBe(false)
  })

  it('should open modal', () => {
    useSearchModalStore.getState().openModal()
    expect(useSearchModalStore.getState().open).toBe(true)
  })

  it('should close modal', () => {
    useSearchModalStore.getState().openModal()
    useSearchModalStore.getState().closeModal()
    expect(useSearchModalStore.getState().open).toBe(false)
  })

  it('should set open directly', () => {
    useSearchModalStore.getState().setOpen(true)
    expect(useSearchModalStore.getState().open).toBe(true)
    
    useSearchModalStore.getState().setOpen(false)
    expect(useSearchModalStore.getState().open).toBe(false)
  })
})
