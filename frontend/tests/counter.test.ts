import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCounterStore } from '../stores/counter'

describe('Counter Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts at 0', () => {
    const store = useCounterStore()
    expect(store.count).toBe(0)
  })

  it('increments count', () => {
    const store = useCounterStore()
    store.increment()
    expect(store.count).toBe(1)
  })

  it('computes doubled value', () => {
    const store = useCounterStore()
    store.increment()
    store.increment()
    expect(store.doubled).toBe(4)
  })
})
