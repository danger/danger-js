// @flow
//
// This file represents the module that is exposed as the danger API

module.exports = function (percent: number = 100, amount: number): number {
  const percentOff = (percent / 100) * amount
  return percentOff
}

