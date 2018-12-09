import { select } from 'd3-selection'

import { Selection, BaseType } from 'd3'

export function createIfNotExists (parent: Selection<BaseType, {}, null, undefined>, nodeType: string, className: string) {
  let selection = parent
    .selectAll(`${nodeType}.${className}`)
    .data([0])

  let newSelection = selection
    .enter()
    .append(nodeType)

  return select(selection.merge(newSelection).node())
}
