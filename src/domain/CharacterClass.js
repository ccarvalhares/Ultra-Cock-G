class CharacterClass {
    constructor(name, allowedWeaponTypes, baseStats) {
        this.name = name;
        this.allowedWeaponTypes = allowedWeaponTypes;
        this.baseStats = baseStats;
    }

    canEquip(weaponType) {
        return this.allowedWeaponTypes.includes(weaponType);
    }
}

module.exports = CharacterClass;
