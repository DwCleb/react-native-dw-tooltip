const decimal = num => {
    const casas = 2
    const operation = Math.pow(10, casas)

    let newNum = Math.floor(num * operation) / operation
    let str = newNum.toString()

    str = str.replace('.', ',')
    str = str.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

    if (newNum % 1 === 0 || newNum === 0) str = `${str},00`

    let newStr = str.split(',')

    if (newStr.length > 1) if (newStr[1].length < 2) str = `${str}0`

    return str
}

export default {
  decimal: num => decimal(num),
}
