module.exports = function ({percent = 100, amount}) {
  const percentOff = (percent / 100) * amount
  return percentOff
}
