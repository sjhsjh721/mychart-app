import { describe, it, expect, beforeEach } from 'vitest'
import { useLayoutStore } from '../layout-store'

describe('layout-store', () => {
  beforeEach(() => {
    useLayoutStore.setState({ sidebarCollapsed: true })
  })

  it('should have sidebar collapsed by default (mobile-first)', () => {
    expect(useLayoutStore.getState().sidebarCollapsed).toBe(true)
  })

  it('should toggle sidebar', () => {
    useLayoutStore.getState().toggleSidebar()
    expect(useLayoutStore.getState().sidebarCollapsed).toBe(false)
    
    useLayoutStore.getState().toggleSidebar()
    expect(useLayoutStore.getState().sidebarCollapsed).toBe(true)
  })

  it('should set sidebar collapsed directly', () => {
    useLayoutStore.getState().setSidebarCollapsed(false)
    expect(useLayoutStore.getState().sidebarCollapsed).toBe(false)
    
    useLayoutStore.getState().setSidebarCollapsed(true)
    expect(useLayoutStore.getState().sidebarCollapsed).toBe(true)
  })
})
