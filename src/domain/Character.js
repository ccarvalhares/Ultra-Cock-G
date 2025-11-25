class Character {
    constructor(id, name, characterClass, stats) {
        this.id = id;
        this.name = name;
        this.characterClass = characterClass;
        this.stats = stats;
        this.level = 1;
        this.experience = 0;
        this.skills = [];
        this.weapon = null;
    }

    equipWeapon(weapon) {
        // Logic to check if weapon is compatible with class
        if (this.characterClass.canEquip(weapon.type)) {
            this.weapon = weapon;
        } else {
            throw new Error('Weapon not compatible with this class');
        }
    }

    learnSkill(skill) {
        this.skills.push(skill);
    }
}

module.exports = Character;
