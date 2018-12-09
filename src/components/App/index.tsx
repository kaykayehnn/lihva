import React, { Component } from 'react'
import classnames from 'classnames'

import Header from '../Header'
import TaskPreview from '../TaskPreview'
import Task, { TaskProps, TaskField } from '../Task'

import styles from './style.scss'
import { strictIntegerRegex, strictFloatRegex } from '../../utilities/validation'
import { simpleInterestData, capitalizedInterestData, loanData } from '../../utilities/math'

interface AppState {
  active: number
  initialRender: boolean
}

const CAPITAL: TaskField = {
  key: 'capital',
  label: 'Капитал',
  icon: '$',
  validator: strictFloatRegex
}

const INTEREST: TaskField = {
  key: 'interest',
  label: 'Лихвен Процент',
  icon: '%',
  validator: strictFloatRegex
}

const PERIOD_COUNT: TaskField = {
  key: 'periodCount',
  label: 'Брой Периоди',
  icon: 'n',
  validator: strictIntegerRegex
}

const PROFIT: TaskField = {
  key: 'profit',
  label: 'Печалба',
  icon: '$',
  validator: strictFloatRegex
}

const LOAN_AMOUNT: TaskField = {
  key: 'loanAmount',
  label: 'Сума на кредита',
  icon: '$',
  validator: strictFloatRegex
}

const LOAN_DURATION: TaskField = {
  key: 'loanDuration',
  label: 'Период (години)',
  icon: 'y',
  validator: strictIntegerRegex
}

export default class App extends Component<{}, AppState> {
  private taskDefinitions: Pick<TaskProps, 'fields' | 'dataFn' | 'answerLabel' | 'answerFn' | 'yScaleFn' | 'color'>[] = [
    { // task one: simple interest
      fields: [
        CAPITAL,
        INTEREST,
        PERIOD_COUNT
      ],
      color: '#29B6F6',
      dataFn: simpleInterestData,
      answerLabel: 'Печалба',
      answerFn: data => data[data.length - 1],
      yScaleFn: (initial, final) => [initial * (initial / final), final]
    },
    { // task two: capitalized interest
      fields: [
        CAPITAL,
        INTEREST,
        PROFIT
      ],
      color: '#AED581',
      dataFn: capitalizedInterestData,
      answerLabel: 'Периоди',
      answerFn: data => data.length - 1,
      yScaleFn: (initial, final) => [initial * (initial / final), final]
    },
    { // task three: long term loan
      fields: [
        LOAN_AMOUNT,
        INTEREST,
        LOAN_DURATION
      ],
      color: '#EF5350',
      dataFn: loanData,
      answerLabel: 'Погасителна вноска',
      answerFn: data => data[0] - data[1],
      yScaleFn: (initial, final) => [final, initial]
    }
  ]

  constructor (props) {
    super(props)

    this.state = {
      active: -1,
      initialRender: true
    }
  }

  componentDidMount () {
    setTimeout(() => this.setState({ initialRender: false }), 8000)
  }

  render () {
    const hideMenu = this.state.active >= 0

    return (
      <>
        <Header back={hideMenu} goBack={() => this.setState({ active: -1 })} />
        <div className={classnames(styles.menu, { [styles.hidden]: hideMenu })}>
          {this.taskDefinitions.map((td, i) => (
            <TaskPreview key={i} cursor={i === 0 && this.state.initialRender} index={i + 1} setActive={(ix) => this.setState({ active: ix })}>
              <Task chartOnly key={i} {...td} />
            </TaskPreview>
          ))}
        </div>
        {hideMenu && <Task {...this.taskDefinitions[this.state.active]} />}
      </>
    )
  }
}
