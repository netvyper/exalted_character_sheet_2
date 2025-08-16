import * as React from 'react'

import { Grid } from '@material-ui/core'
import { Charm } from 'types'
import FullCharmDisplay from './CharmDisplay/FullCharm'

interface ExposedProps {
  charms: Charm[]
}

const fullViewMap = (c: Charm) => (
  <Grid item xs={12} md={6} key={c.id}>
    <FullCharmDisplay charm={c} />
  </Grid>
)

const CharmList = (props: ExposedProps) => {
  const mappedCharms = (
    <Grid container spacing={3}>
      {props.charms.map(fullViewMap)}
    </Grid>
  )
  return <>{mappedCharms}</>
}

export default CharmList
