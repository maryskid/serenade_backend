const checkBody = (obj, arr) => {
  return arr.every(value => obj[value])
}

module.exports = checkBody