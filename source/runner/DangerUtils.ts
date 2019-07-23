// The documentation for these are provided inline
// inside DangerUtilsDSL.ts
export function sentence(array: string[]): string {
  if ((array || []).length === 0) {
    return ""
  }
  if (array.length === 1) {
    return array[0]
  }
  return array.slice(0, array.length - 1).join(", ") + " and " + array.pop()
}

export function href(href?: string, text?: string): string | null {
  if (!href && !text) {
    return null
  }
  if (!href && text) {
    return text
  }
  return `<a href="${href}">${text || href}</a>`
}

export const compliment = () => {
  const compliments = ["Well done.", "Congrats.", "Woo!", "Yay.", "Jolly good show.", "Good on 'ya.", "Nice work."]
  return compliments[Math.floor(Math.random() * compliments.length)]
}
