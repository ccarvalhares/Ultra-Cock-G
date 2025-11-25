const CharacterClass = require('./CharacterClass');

const WeaponTypes = {
    SWORD_SHIELD: 'Sword/Shield',
    SPEAR: 'Spear',
    KATANA: 'Katana',
    SHORT_BOW: 'Short Bow',
    PISTOL: 'Pistol',
    HEAVY_CROSSBOW: 'Heavy Crossbow',
    GRIMOIRE: 'Grimoire',
    STAFF: 'Staff',
    HANDS: 'Hands with Symbols'
};

const Classes = {
    WARRIOR: new CharacterClass('Warrior', [WeaponTypes.SWORD_SHIELD, WeaponTypes.SPEAR, WeaponTypes.KATANA], { hp: 100, mp: 20, str: 10, dex: 5, int: 2 }),
    RANGER: new CharacterClass('Ranger', [WeaponTypes.SHORT_BOW, WeaponTypes.PISTOL, WeaponTypes.HEAVY_CROSSBOW], { hp: 80, mp: 40, str: 5, dex: 10, int: 4 }),
    MAGE: new CharacterClass('Mage', [WeaponTypes.GRIMOIRE, WeaponTypes.STAFF, WeaponTypes.HANDS], { hp: 60, mp: 100, str: 2, dex: 4, int: 10 })
};

// 9 Characters (3 per class)
const Characters = [
    // Warriors
    { name: 'Knight', class: Classes.WARRIOR, description: 'A noble defender.' },
    { name: 'Lancer', class: Classes.WARRIOR, description: 'A master of the spear.' },
    { name: 'Samurai', class: Classes.WARRIOR, description: 'A swift katana wielder.' },

    // Rangers
    { name: 'Archer', class: Classes.RANGER, description: 'Precise with a bow.' },
    { name: 'Gunslinger', class: Classes.RANGER, description: 'Quick on the draw.' },
    { name: 'Arbalest', class: Classes.RANGER, description: 'Heavy hitter with crossbow.' },

    // Mages
    { name: 'Scholar', class: Classes.MAGE, description: 'Wields a grimoire of ancient spells.' },
    { name: 'Sorcerer', class: Classes.MAGE, description: 'Channels power through a staff.' },
    { name: 'Mystic', class: Classes.MAGE, description: 'Casts spells with bare hands.' }
];

module.exports = { WeaponTypes, Classes, Characters };
