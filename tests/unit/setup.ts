// Every unit test starts from an empty device: no localStorage rows, no
// IndexedDB databases. fake-indexeddb/auto installs an in-memory IndexedDB
// on globalThis, which jsdom doesn't provide.
import "fake-indexeddb/auto"
import { IDBFactory } from "fake-indexeddb"
import { beforeEach } from "vitest"
import { resetBlobConnectionForTests } from "@/lib/cuentos/blobs"

beforeEach(() => {
  localStorage.clear()
  globalThis.indexedDB = new IDBFactory()
  resetBlobConnectionForTests()
})
