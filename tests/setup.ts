import { beforeEach, vi } from "vitest"

export const __mockStore = new Map<string, unknown>()

vi.mock("@plasmohq/storage", () => {
  class Storage {
    constructor(_opts?: unknown) {}

    async get<T = unknown>(key: string): Promise<T | undefined> {
      return __mockStore.get(key) as T | undefined
    }

    async set(key: string, value: unknown): Promise<void> {
      __mockStore.set(key, value)
    }

    async remove(key: string): Promise<void> {
      __mockStore.delete(key)
    }
  }

  return { Storage }
})

beforeEach(() => {
  __mockStore.clear()
})
