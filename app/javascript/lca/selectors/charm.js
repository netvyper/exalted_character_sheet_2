// @flow
import createCachedSelector from 're-reselect'

import { entities } from './entities.js'
import { sortOrderSort } from 'utils'

const characterIdMemoizer = (state, id) => id

const getSpecificCharacter = (state, id) => entities(state).characters[id]

const getCharms = state => entities(state).charms

// $FlowFixMe
export const getNativeCharmsForCharacter = createCachedSelector(
  [getSpecificCharacter, getCharms],
  (character, charms) => {
    if (!character || !character.charms) return []
    return character.charms.map((c) => charms[c]).sort(sortOrderSort)
  },
)(characterIdMemoizer)

// $FlowFixMe
export const getMartialArtsCharmsForCharacter = createCachedSelector(
  [getSpecificCharacter, getCharms],
  (character, charms) => {
    if (!character || !character.martial_arts_charms) return []
    return character.martial_arts_charms
      .map((c) => charms[c])
      .sort(sortOrderSort)
  },
)(characterIdMemoizer)

// $FlowFixMe
export const getEvocationsForCharacter = createCachedSelector(
  [getSpecificCharacter, getCharms],
  (character, charms) => {
    if (!character || !character.evocations) return []
    return character.evocations.map((c) => charms[c]).sort(sortOrderSort)
  },
)(characterIdMemoizer)

// $FlowFixMe
export const getSpiritCharmsForCharacter = createCachedSelector(
  [getSpecificCharacter, getCharms],
  (character, charms) => {
    if (!character || !character.spirit_charms) return []
    return character.spirit_charms.map((c) => charms[c]).sort(sortOrderSort)
  },
)(characterIdMemoizer)

const getSpells = (state) => entities(state).spells

// $FlowFixMe
const getSpellsForCharacter = createCachedSelector(
  [getSpecificCharacter, getSpells],
  (character, spells) => {
    if (!character || !character.spells) return []
    return character.spells.map((s) => spells[s]).sort(sortOrderSort)
  },
)(characterIdMemoizer)

// $FlowFixMe
export const getAllAbilitiesWithCharmsForCharacter = createCachedSelector(
  [getNativeCharmsForCharacter, getMartialArtsCharmsForCharacter],
  (charms, maCharms) => {
    let abilities = [...new Set(charms.map(c => c.ability))]

    if (maCharms.length > 0) abilities = abilities.concat(['martial_arts'])

    return abilities.sort()
  }
)(characterIdMemoizer)

// $FlowFixMe
export const getAllMartialArtsCharmStylesForCharacter = createCachedSelector(
  [getMartialArtsCharmsForCharacter],
  charms => {
    let ch = charms.map(e => e.style).sort()

    return [...new Set(ch)]
  }
)(characterIdMemoizer)

// $FlowFixMe
export const getAllEvocationArtifactsForCharacter = createCachedSelector(
  [getEvocationsForCharacter],
  evocations => {
    let evo = evocations.map(e => e.artifact_name).sort()

    return [...new Set(evo)]
  }
)(characterIdMemoizer)

// $FlowFixMe
export const getAllCharmCategoriesForCharacter = createCachedSelector(
  [
    getNativeCharmsForCharacter,
    getMartialArtsCharmsForCharacter,
    getEvocationsForCharacter,
    getSpiritCharmsForCharacter,
    getSpellsForCharacter,
  ],
  (natives, maCharms, evocations, spiritCharms, spells) => {
    let ch = natives
      .concat(maCharms)
      .concat(evocations)
      .concat(spiritCharms)
      .concat(spells)
      .reduce((a, charm) => [...a, ...charm.categories], [])
      .concat(['Attack', 'Defense', 'Social'])
      .sort()

    return [...new Set(ch)]
  }
)(characterIdMemoizer)
