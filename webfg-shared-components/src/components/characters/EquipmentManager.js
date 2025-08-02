const equip = (slot, objectId) => {
  updateCharacterEquipment({
    variables: {
      characterId,
      equipmentInput: {
        [slot]: objectId
      }
    }
  });
};

const unequip = (slot) => {
  updateCharacterEquipment({
    variables: {
      characterId,
      equipmentInput: {
        [slot]: null
      }
    }
  });
}; 