// @flow

module.exports = function (percent = 100, amount: number): number {
  const percentOff = (percent / 100) * amount
  return percentOff
}

