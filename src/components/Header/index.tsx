import React, { StatelessComponent } from 'react'
import classnames from 'classnames'
import ReactSVG from 'react-svg'

import styles from './style.scss'

export interface HeaderProps {
  back: boolean
  goBack: () => void
}

const Header: StatelessComponent<HeaderProps> = ({ back, goBack }) => (
  <>
    {back && <ReactSVG src='/vectors/bars-solid.svg'
      svgClassName={styles.backButton} onClick={goBack} />}
    <div className={styles.titleWrapper} onClick={goBack}>
      <span className={classnames(styles.title, { [styles.clickable]: back })}>%</span>
    </div>
  </>
)

export default Header
