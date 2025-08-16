import * as React from 'react'
import DocumentTitle from 'react-document-title'
import { connect, useSelector } from 'react-redux'

import { Grid } from '@material-ui/core'

import DivWithFilterDrawer from 'components/shared/DivWithFilterDrawer'
import { State } from 'ducks'
import { getCharmsForCharacterByType, getSpecificCharacter } from 'ducks/entities'
import { Character, Charm } from 'types'
import { RouteWithIdProps as RouteProps } from 'types/util'
import CharacterLoadError from '../CharacterLoadError'
import CharmFilter from './CharmFilter/'
import CharmList from './CharmList'
import { filterCharms, initialFilters, reducer } from './useCharmFilters'

interface Props {
  character: Character
  charms: {
    native: Charm[]
    martialArts: Charm[]
    evocation: Charm[]
    spirit: Charm[]
  }
}

const CharmPageDisplay = (props: Props) => {
  const [filters, setfilters] = React.useReducer(reducer, initialFilters)
  const { character, charms } = props

  if (character == null) {
    return <CharacterLoadError />
  }

  return (
    <DivWithFilterDrawer>
      <DocumentTitle title={`${character.name} Charms | Lot-Casting Atemi`} />

      <div>
        Charms!{' '}
        <CharmFilter id={character.id} filters={filters} setfilters={setfilters} />
      </div>

      <CharmList charms={filterCharms(charms.native, filters)} />
      <CharmList charms={filterCharms(charms.martialArts, filters)} />
      <CharmList charms={filterCharms(charms.evocation, filters)} />
      <CharmList charms={filterCharms(charms.spirit, filters)} />
    </DivWithFilterDrawer>
  )
}

const mapStateToProps = (state: State, { match }: RouteProps) => {
  const id = parseInt(match.params.id, 10)
  return {
    character: getSpecificCharacter(state, id),
  }
}

const CharmPageContainer = (props: { character: Character } & RouteProps) => {
  const { character } = props
  const charmSelectors = getCharmsForCharacterByType
  const charms = {
    native: useSelector((state: State) =>
      charmSelectors.native(state, character?.id),
    ),
    martialArts: useSelector((state: State) =>
      charmSelectors.martialArts(state, character?.id),
    ),
    evocation: useSelector((state: State) =>
      charmSelectors.evocation(state, character?.id),
    ),
    spirit: useSelector((state: State) =>
      charmSelectors.spirit(state, character?.id),
    ),
  }

  return <CharmPageDisplay {...props} charms={charms} />
}

export default connect(mapStateToProps)(CharmPageContainer)
