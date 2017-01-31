export function sentence(array: Array<string>): string {
  if ((array || []).length === 0) {
    return ""
  }
  if (array.length === 1) {
    return array[0]
  }
  return array.slice(0, array.length - 1).join(", ") + " and " + array.pop()
}

export function href(href: string, text: string): string {
  return `<a href="${href || "#"}">${text || ""}</a>`
}
