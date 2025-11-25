const Skills = {
    WARRIOR: [
        { name: 'Slash', damage: 10, cost: 0, type: 'Active' },
        { name: 'Block', damage: 0, cost: 5, type: 'Active' },
        { name: 'Charge', damage: 15, cost: 10, type: 'Active' },
        { name: 'Whirlwind', damage: 20, cost: 20, type: 'Active' },
        { name: 'Bash', damage: 12, cost: 8, type: 'Active' },
        { name: 'Pierce', damage: 18, cost: 12, type: 'Active' },
        { name: 'Parry', damage: 0, cost: 5, type: 'Active' },
        { name: 'Berserk', damage: 0, cost: 30, type: 'Active' }
    ],
    RANGER: [
        { name: 'Shot', damage: 8, cost: 0, type: 'Active' },
        { name: 'Rapid Fire', damage: 12, cost: 10, type: 'Active' },
        { name: 'Snipe', damage: 25, cost: 20, type: 'Active' },
        { name: 'Trap', damage: 10, cost: 15, type: 'Active' },
        { name: 'Dodge', damage: 0, cost: 5, type: 'Active' },
        { name: 'Poison Arrow', damage: 5, cost: 10, type: 'Active' }, // DoT
        { name: 'Rain of Arrows', damage: 15, cost: 25, type: 'Active' },
        { name: 'Eagle Eye', damage: 0, cost: 10, type: 'Active' } // Buff
    ],
    MAGE: [
        { name: 'Fireball', damage: 15, cost: 10, type: 'Active' },
        { name: 'Ice Bolt', damage: 12, cost: 10, type: 'Active' },
        { name: 'Mana Shield', damage: 0, cost: 15, type: 'Active' },
        { name: 'Heal', damage: -20, cost: 20, type: 'Active' },
        { name: 'Teleport', damage: 0, cost: 15, type: 'Active' },
        { name: 'Lightning', damage: 18, cost: 18, type: 'Active' },
        { name: 'Meteor', damage: 30, cost: 40, type: 'Active' },
        { name: 'Arcane Blast', damage: 25, cost: 25, type: 'Active' }
    ]
};

module.exports = Skills;
