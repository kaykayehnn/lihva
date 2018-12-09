import React from 'react'
import ReactDOM from 'react-dom'

import App from './components/App'
import './style.scss'

mountApp(<App />)

if (module.hot) {
  module.hot.accept('./components/App', () => {
    let NewApp: typeof App = require('./components/App').default

    mountApp(<NewApp />)
  })
}

function mountApp (element: JSX.Element): void {
  ReactDOM.render(element, document.getElementById('root'))
}
