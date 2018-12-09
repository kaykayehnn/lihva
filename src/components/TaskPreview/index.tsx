import React, { StatelessComponent } from 'react'
import classnames from 'classnames'
import ReactSVG from 'react-svg'

import styles from './style.scss'

export interface TaskPreviewProps {
  index: number
  cursor: boolean
  setActive: (ix: number) => void
}

const TaskPreview: StatelessComponent<TaskPreviewProps> = ({ index, cursor, setActive, children }) => (
  <div className={classnames(styles.task, { [styles.taskPulse]: cursor })} onClick={() => setActive(index - 1)}>
    <ReactSVG src={`/vectors/${index}.svg`} svgClassName={styles.vector} />
    <div className={styles.mainTask}>
      {children}
    </div>
    {cursor && <ReactSVG className={styles.cursor} src='/vectors/pointinghand.svg' />}
  </div>
)

export default TaskPreview
