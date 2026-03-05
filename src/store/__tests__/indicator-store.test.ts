import { describe, it, expect, beforeEach } from 'vitest'
import { useIndicatorStore } from '../indicator-store'

describe('indicator-store', () => {
  beforeEach(() => {
    // Reset store state to defaults
    useIndicatorStore.setState({
      ma: { enabled: true, periods: [5, 20, 60, 120] },
      rsi: { enabled: true, period: 14, overbought: 70, oversold: 30 },
      bollinger: { enabled: true, period: 20, stdDev: 2 },
      ichimoku: { enabled: false, tenkanPeriod: 9, kijunPeriod: 26, senkouBPeriod: 52, displacement: 26 },
      volume: { enabled: true },
    })
  })

  it('should toggle MA indicator', () => {
    const store = useIndicatorStore.getState()
    expect(store.ma.enabled).toBe(true)
    
    store.toggleIndicator('ma')
    expect(useIndicatorStore.getState().ma.enabled).toBe(false)
  })

  it('should toggle RSI indicator', () => {
    const store = useIndicatorStore.getState()
    expect(store.rsi.enabled).toBe(true)
    
    store.toggleIndicator('rsi')
    expect(useIndicatorStore.getState().rsi.enabled).toBe(false)
  })

  it('should update RSI settings', () => {
    const store = useIndicatorStore.getState()
    store.setRSI({ period: 21 })
    expect(useIndicatorStore.getState().rsi.period).toBe(21)
    // Other settings should remain unchanged
    expect(useIndicatorStore.getState().rsi.overbought).toBe(70)
  })

  it('should toggle volume indicator', () => {
    const store = useIndicatorStore.getState()
    expect(store.volume.enabled).toBe(true)
    
    store.toggleIndicator('volume')
    expect(useIndicatorStore.getState().volume.enabled).toBe(false)
  })

  it('should toggle Bollinger Bands', () => {
    const store = useIndicatorStore.getState()
    expect(store.bollinger.enabled).toBe(true)
    
    store.toggleIndicator('bollinger')
    expect(useIndicatorStore.getState().bollinger.enabled).toBe(false)
  })

  it('should update MA periods', () => {
    const store = useIndicatorStore.getState()
    store.setMA({ periods: [5, 10, 20] })
    expect(useIndicatorStore.getState().ma.periods).toEqual([5, 10, 20])
  })

  it('should update Bollinger settings', () => {
    const store = useIndicatorStore.getState()
    store.setBollinger({ period: 25, stdDev: 2.5 })
    expect(useIndicatorStore.getState().bollinger.period).toBe(25)
    expect(useIndicatorStore.getState().bollinger.stdDev).toBe(2.5)
  })

  it('should toggle Ichimoku', () => {
    const store = useIndicatorStore.getState()
    expect(store.ichimoku.enabled).toBe(false)
    
    store.toggleIndicator('ichimoku')
    expect(useIndicatorStore.getState().ichimoku.enabled).toBe(true)
  })
})
