import { BaseState } from '../components/Task'

export function simpleInterestData (params: BaseState): number[] {
  const capital = +params.capital
  const interest = +params.interest
  const periodCount = +params.periodCount

  const data: number[] = Array.apply(null, { length: periodCount + 1 })
    .map((a, i) => simpleInterest(capital, interest, i))

  return data
}

export function capitalizedInterestData (params: BaseState): number[] {
  const capital = +params.capital
  const interest = +params.interest
  const profit = +params.profit

  const periodCount = capitalizedInterestPeriods(capital, interest, profit)
  const data: number[] = Array.apply(null, { length: periodCount + 1 })
    .map((a, i) => capitalizedInterest(capital, interest, i))

  return data
}

const T = 1 / 12
export function loanData (params: BaseState): number[] {

  const loanAmount = +params.loanAmount
  const interest = +params.interest
  const loanDuration = +params.loanDuration / T

  const payment = loanPayment(loanAmount, interest, loanDuration)
  const total = payment * loanDuration

  const data: number[] = Array.apply(null, { length: loanDuration + 1 })
    .map((a, i) => total - i * payment)

  return data
}

function simpleInterest (capital: number, interest: number, periodCount: number): number {
  return capital + capital * interest / 100 * periodCount
}

function capitalizedInterestPeriods (capital: number, interest: number, profit: number): number {
  // S = K*(1+p)^n
  // n = logK*(1+p)(S)
  // logK1(S) = ln(K1) / ln(S)
  return Math.ceil(Math.log(1 + profit / capital) / Math.log(1 + interest / 100))
}

function loanPayment (amount: number, interest: number, duration: number): number {
  let percentage = interest / 100 * T

  return amount * percentage / (1 - 1 / Math.pow(1 + percentage, duration))
}

function capitalizedInterest (capital: number, interest: number, periodCount: number): number {
  return capital * Math.pow(1 + interest / 100, periodCount)
}
