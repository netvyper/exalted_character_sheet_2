import React, { useState, useRef } from 'react'
import { connect } from 'react-redux'

import { ListItemIcon, ListItemText, MenuItem } from '@material-ui/core'
import { Publish } from '@material-ui/icons'

import { State } from 'ducks'
import {
  createCharm,
  createMerit,
  createSpell,
  createWeapon,
  update,
  updateCharm,
  updateMerit,
  updateSpell,
  updateWeapon,
} from 'ducks/actions/ByType'
import { getSpecificCharacter } from '../../../selectors/character'
import { Character, Merit, Weapon, Spell, Charm } from 'types'
import { MenuItemProps } from './CharacterMenuItem'
import CharacterDiff from './CharacterDiff' // This component will be created next

interface StateProps {
  character: Character
}

interface DispatchProps {
  updateCharacter(character: Character): void
  createMerit(characterId: number, options?: object): Promise<{ payload: Merit }>
  updateMerit(id: number, characterId: number, merit: Merit): void
  createWeapon(
    characterId: number,
    options?: object,
  ): Promise<{ payload: Weapon }>
  updateWeapon(id: number, characterId: number, weapon: Weapon): void
  createSpell(characterId: number, options?: object): Promise<{ payload: Spell }>
  updateSpell(id: number, characterId: number, spell: Spell): void
  createCharm(characterId: number, options?: object): Promise<{ payload: Charm }>
  updateCharm(id: number, characterId: number, charm: Charm): void
}

interface InnerProps extends StateProps, DispatchProps {
  characterType: string
}

const ImportButton = ({
  character,
  updateCharacter,
  createMerit,
  updateMerit,
  createWeapon,
  updateWeapon,
  createSpell,
  updateSpell,
  createCharm,
  updateCharm,
  characterType,
}: InnerProps) => {
  const [diffing, setDiffing] = useState(false)
  const [importedCharacter, setImportedCharacter] = useState<Character | null>(
    null,
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!character) {
    return null
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result
        if (typeof text === 'string') {
          const imported = JSON.parse(text)
          // Basic validation
          if (imported.name && imported.type) {
            setImportedCharacter(imported)
            setDiffing(true)
          } else {
            alert('Invalid character file.')
          }
        }
      } catch (error) {
        alert('Failed to parse character file.')
        console.error(error)
      }
    }
    reader.readAsText(file)
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleConfirm = async () => {
    if (importedCharacter) {
      const {
        merits,
        weapons,
        spells,
        charms,
        martial_arts_charms,
        evocations,
        spirit_charms,
        ...rest
      } = importedCharacter

      // 1. Update the base character attributes
      const baseCharacter = {
        ...rest,
        id: character.id,
        player_id: character.player_id,
      }
      updateCharacter(baseCharacter)

      // 2. Create and then update all the nested items
      const createAndUpdate = (createFn, updateFn) => async (item) => {
        const { id, ...itemData } = item
        const createOptions = { type: item.type || item.charm_type }
        const { payload: newEntity } = await createFn(
          character.id,
          createOptions,
        )
        updateFn(newEntity.id, character.id, itemData)
      }

      await Promise.all([
        ...merits.map(createAndUpdate(createMerit, updateMerit)),
        ...weapons.map(createAndUpdate(createWeapon, updateWeapon)),
        ...spells.map(createAndUpdate(createSpell, updateSpell)),
        ...charms.map(createAndUpdate(createCharm, updateCharm)),
        ...martial_arts_charms.map(createAndUpdate(createCharm, updateCharm)),
        ...evocations.map(createAndUpdate(createCharm, updateCharm)),
        ...spirit_charms.map(createAndUpdate(createCharm, updateCharm)),
      ])
    }
    setDiffing(false)
    setImportedCharacter(null)
  }

  const handleCancel = () => {
    setDiffing(false)
    setImportedCharacter(null)
  }

  if (characterType !== 'character') {
    return null
  }

  return (
    <>
      <MenuItem button onClick={handleImportClick}>
        <ListItemIcon>
          <Publish />
        </ListItemIcon>
        <ListItemText primary="Import" />
      </MenuItem>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept=".json,.txt"
      />
      {diffing && importedCharacter && (
        <CharacterDiff
          oldCharacter={character}
          newCharacter={importedCharacter}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  )
}

const mapState = (
  state: State,
  { id, characterType }: MenuItemProps,
): StateProps => ({
  character:
    characterType === 'character' ? getSpecificCharacter(state, id) : null,
})

const mapDispatch = (dispatch): DispatchProps => ({
  updateCharacter: (character) => dispatch(update.character(character)),
  createMerit: (characterId, options) =>
    dispatch(createMerit(characterId, options)),
  updateMerit: (id, characterId, merit) =>
    dispatch(updateMerit(id, characterId, merit)),
  createWeapon: (characterId, options) =>
    dispatch(createWeapon(characterId, options)),
  updateWeapon: (id, characterId, weapon) =>
    dispatch(updateWeapon(id, characterId, weapon)),
  createSpell: (characterId, options) =>
    dispatch(createSpell(characterId, options)),
  updateSpell: (id, characterId, spell) =>
    dispatch(updateSpell(id, characterId, spell)),
  createCharm: (characterId, options) =>
    dispatch(createCharm(characterId, options)),
  updateCharm: (id, characterId, charm) =>
    dispatch(updateCharm(id, characterId, charm)),
})

export default connect<StateProps, DispatchProps, MenuItemProps>(
  mapState,
  mapDispatch,
)(ImportButton)
