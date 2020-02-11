function rangesOfDifferBetweenTwoStrings(source: string, target: string) {
  const ranges = [] as { start: number; length: number }[]

  const addToIndex = (index: number) => {
    const closestIndex = ranges[ranges.length - 1]
    if (closestIndex) {
      const doesAddToIndex = closestIndex.start + closestIndex.length === index - 1
      if (doesAddToIndex) {
        closestIndex.length = closestIndex.length + 1
      } else {
        ranges.push({ start: index - 1, length: 1 })
      }
    } else {
      ranges.push({ start: index - 1, length: 1 })
    }
  }

  for (let index = 0; index < source.length; index++) {
    const srcChar = source[index]
    const targetChar = target[index]
    if (srcChar !== targetChar) {
      addToIndex(index)
    }
  }

  return ranges
}

function highlightDifferenceBetweenInStrings(source: string, target: string) {
  const ranges = rangesOfDifferBetweenTwoStrings(source, target)
  let emTarget = target
  ranges.forEach((range, index) => {
    const lhs = `\e[3m`
    const rhs = `\e[0m`
    const additionalOffset = index * lhs.length + index * rhs.length
    const before = emTarget.slice(0, range.start + 1 + additionalOffset)
    const between = emTarget.slice(
      range.start + 1 + additionalOffset,
      range.start + range.length + 1 + additionalOffset
    )
    const after = emTarget.slice(range.start + range.length + 1 + additionalOffset, emTarget.length)
    emTarget = before + lhs + between + rhs + after
  })
  return emTarget
}

it("sees a difference", () => {
  const src = "Hello world"
  const target = "Hello w0rld"
  expect(highlightDifferenceBetweenInStrings(src, target)).toMatchInlineSnapshot(`"Hello we[3m0e[0mrld"`)

  const src2 = "Hello world"
  const target2 = "H3llo w0rld"
  expect(highlightDifferenceBetweenInStrings(src2, target2)).toMatchInlineSnapshot(`"He[3m3e[0mllo we[3m0e[0mrld"`)

  const src3 = "Hello world ok then"
  const target3 = "H3llo w0rld no then"
  expect(highlightDifferenceBetweenInStrings(src3, target3)).toMatchInlineSnapshot(
    `"He[3m3e[0mllo we[3m0e[0mrld e[3mnoe[0m then"`
  )

  //   expect(rangesOfDifferBetweenTwoStrings(src, target)).toMatchInlineSnapshot(`
  // Array [
  //   Object {
  //     "length": 1,
  //     "start": 6,
  //   },
  // ]
  // `)

  //   const multilineInput = `
  // ↓
  // (↓
  // ····<div>↓
  // ······text↓
  // ····</div>↓
  // )
  // `
  //   const multilineOutput = `
  // ↓
  // (↓
  // ····<div>↓
  // ········text↓
  // ······</div>↓
  // )`
  //   expect(rangesOfDifferBetweenTwoStrings(multilineInput, multilineOutput)).toMatchInlineSnapshot(`
  // Array [
  //   Object {
  //     "length": 8,
  //     "start": 22,
  //   },
  //   Object {
  //     "length": 10,
  //     "start": 32,
  //   },
  // ]
  // `)
})
