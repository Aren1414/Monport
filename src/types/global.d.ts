export {}

declare global {
  interface Window {
    AddMiniApp?: {
      show: () => void
    }
  }
}
