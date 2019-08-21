import React, { PureComponent, ChangeEvent, RefObject } from 'react'

import { select } from 'd3-selection'
import { scaleLinear, scaleBand, scalePow } from 'd3-scale'
import { axisBottom, axisRight } from 'd3-axis'
import 'd3-transition' // modifies d3-selection prototype!

import { debounce, clone } from 'lodash-es'
import classnames from 'classnames'

import styles from './style.scss'
import { nonStrictFloatRegex } from '../../utilities/validation'
import { createIfNotExists } from '../../utilities/d3'

export interface TaskField {
  label: string
  key: string
  icon: string
  validator: RegExp
}

export interface TaskProps {
  chartOnly?: boolean
  color: string
  fields: TaskField[]
  answerLabel: string
  answerFn: (data: number[]) => number
  dataFn: (params: BaseState) => number[]
  yScaleFn: (initialValue: number, finalValue: number) => [number, number]
}

export interface BaseState {
  [key: string]: string
}

export default class Task<T extends BaseState> extends PureComponent<TaskProps, T> {
  private chartElement: RefObject<HTMLDivElement>
  private resultElement: RefObject<HTMLDivElement>

  private defaultState: BaseState
  private drawnChart: number = 0

  private GOLDEN_RATIO = 1.618
  private CHART_BOXWIDTH = 900
  private CHART_BOXHEIGHT = this.CHART_BOXWIDTH / this.GOLDEN_RATIO
  private ANIMATION_DURATION = 750
  private REMOVE_DURATION = this.ANIMATION_DURATION / 2
  private DEBOUNCE_DELAY = 250
  private MARGIN = {
    TOP: 20,
    RIGHT: 40,
    BOTTOM: 20,
    LEFT: 20
  }

  constructor (props) {
    super(props)

    let defaultField = this.props.chartOnly ? '5' : ''
    this.defaultState = this.props.fields.reduce((p, c) => (p[c.key] = defaultField, p), {})

    this.state = clone(this.defaultState) as T
    this.chartElement = React.createRef()
    this.resultElement = React.createRef()

    this.handleChange = this.handleChange.bind(this)
    this.drawChart = debounce(this.drawChart, this.DEBOUNCE_DELAY)
  }

  componentDidMount () {
    const { current } = this.chartElement

    select(current)
      .append('svg')
      .classed(styles.hidden, true)
      .attr('viewBox', `0 0 ${this.CHART_BOXWIDTH} ${this.CHART_BOXHEIGHT}`)
      .append('g')
      .attr('transform', `translate(${this.MARGIN.LEFT}, ${this.MARGIN.TOP})`)

    if (this.props.chartOnly) {
      this.componentDidUpdate() // draws chart if chartOnly
    }
  }

  componentDidUpdate () {
    this.drawChart()

    setTimeout(() => {
      if (!this.props.chartOnly && this.drawnChart === 1) {
        window.scrollTo({
          top: document.body.scrollHeight,
          left: 0,
          behavior: 'smooth'
        })
      }
    }, this.DEBOUNCE_DELAY + 10)
  }

  drawChart () {
    const { fields } = this.props
    
    const args = {}
    const params = fields.map(f => f.key)
    let valid = true
    for (let i = 0; i < params.length && valid; i++) {
      let field = fields[i]
      let value = this.state[field.key]

      const parsed = value.replace(",", ".");
      valid = field.validator.test(parsed) && parsed.length > 0
      args[field.key] = parsed
    }

    if (!valid) return
    this.drawnChart++
    const data: number[] = this.props.dataFn(args)

    const width = this.CHART_BOXWIDTH - (this.MARGIN.LEFT + this.MARGIN.RIGHT)
    const height = this.CHART_BOXHEIGHT - (this.MARGIN.TOP + this.MARGIN.BOTTOM)

    let initialValue = data[0]
    let finalValue = data[data.length - 1]

    let xScale = scaleBand<number>()
      .domain(data)
      .range([0, width])
      .padding(0.1)

    let yScale = scaleLinear()
      .domain(this.props.yScaleFn(initialValue, finalValue))
      .range([0, height])

    let xAxis = axisBottom(xScale).tickFormat((t, i) => i + '')
    let yAxis = axisRight(yScale.copy().range([height, 0]))

    let svg = select(this.chartElement.current)
      .select('svg')
      .classed(styles.hidden, false)
      .classed(styles.chart, true)
      .select('g')

    createIfNotExists(svg, 'g', 'xAxis')
      .classed('xAxis', true)
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis)

    createIfNotExists(svg, 'g', 'yAxis')
      .classed('yAxis', true)
      .attr('transform', `translate(${width})`)
      .call(yAxis)

    let rects = svg.selectAll('rect')
      .data(data)

    // ENHANCEMENT: make bars stacks and add labels
    let newRects = rects
      .enter()
      .append('rect')
      .attr('height', 0)
      .attr('fill', this.props.color)
      .attr('width', xScale.bandwidth())
      .attr('x', xScale)
      .attr('y', height)

    // delay + log1.5(i + 1) * 100
    const delayFunction = delay => (d, i) => {
      return delay + Math.log(i + 1) / Math.log(1.5) * 100
    }

    let transition = (selection, delay) => selection.interrupt()
      .transition()
      .duration(this.ANIMATION_DURATION)
      .delay(delayFunction(delay))
      .attr('width', xScale.bandwidth())
      .attr('x', xScale)
      .attr('y', height)
      .attr('height', yScale)
      .attr('y', (d) => height - yScale(d))

    let oldRects = rects.exit() // delete
      .transition()
      .duration(this.REMOVE_DURATION)
      .attr('height', 0)
      .attr('y', height)
      .remove()

    // if any elements are to be removed delays moving updated ones until transition end
    const updateDelay = oldRects.empty() ? 0 : this.REMOVE_DURATION
    const addDelay = updateDelay + (rects.empty() ? 0 : this.ANIMATION_DURATION)

    transition(rects, updateDelay) // update
    transition(newRects, addDelay) // add

    if (this.props.chartOnly) {
      return
    }

    requestAnimationFrame((startMs) => {
      const { current } = this.resultElement
      const match = current.textContent.match(nonStrictFloatRegex)

      const startValue = +(match[0]) || 0
      const annotationValue = +(match[1]) || 0
      const answer = this.props.answerFn(data)
      const totalDelay = newRects.empty() ? updateDelay : addDelay

      const totalDuration = delayFunction(totalDelay)(null, data.length - 1) + this.ANIMATION_DURATION

      const scale = scalePow()
        .exponent(1)
        .domain([0, totalDelay, totalDuration])
        .range([startValue, startValue, answer])
        .clamp(true)

      const annotationScale = scale
        .copy()
        .range([annotationValue, annotationValue, finalValue - initialValue])

      const format: (n: number) => string = n => n.toFixed(2)

      const update = (ms) => {
        let elapsed = ms - startMs

        let result = scale(elapsed)
        let annotationResult = Math.max(annotationScale(elapsed), 0)
        // filter negatives for loan task

        const classes = classnames(styles.profit, { [styles.hidden]: annotationResult <= 0 })
        current.innerHTML = `${format(result)}<span class="${classes}"> (+${format(annotationResult)}$)</span>`

        if (elapsed >= totalDuration) {
          return
        }

        requestAnimationFrame(update)
      }

      requestAnimationFrame(update)
    })
  }

  handleChange (event: ChangeEvent<HTMLInputElement>) {
    const { value, name } = event.target

    const { fields } = this.props
    for (let i = 0; i < fields.length; i++) {
      let field = fields[i]
      if (field.key === name && !field.validator.test(value)) {
        return
      }
    }

    let change = ({ [name]: value } as unknown) as T
    this.setState(change)
  }

  render () {
    let chart = (
      <div className={styles.chartWrapper}>
        <div className={styles.chartContainer} ref={this.chartElement}></div>
      </div>
    )

    if (this.props.chartOnly) {
      return chart
    }

    return (
      <>
        <div className={styles.container}>
          <form className={styles.form}>
            {this.props.fields.map(f => (
              <div key={f.key}>
                <label className={styles.label} htmlFor={f.key}>{f.label}</label>
                <div className={styles.inputGroup}>
                  <input className={styles.input} name={f.key} id={f.key} value={this.state[f.key]} onChange={this.handleChange} inputMode="decimal" />
                  <span className={styles.icon}>{f.icon}</span>
                </div>
              </div>)
            )}
          </form>
          <div className={styles.resultContainer}>
            <div className={styles.resultLabel}>{this.props.answerLabel}</div>
            <div className={styles.result} ref={this.resultElement}>
              <span className={classnames(styles.profit, styles.hidden)}> (+0$)</span>
            </div>
          </div>
        </div>
        {chart}
      </>
    )
  }
}
