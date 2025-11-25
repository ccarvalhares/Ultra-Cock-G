const Balancing = {
    // Damage Multipliers
    ADVANTAGE_MULTIPLIER: 1.25,
    DISADVANTAGE_MULTIPLIER: 0.75,

    // Class Matchups
    getMultiplier: (attackerClass, defenderClass) => {
        if (attackerClass === 'Warrior' && defenderClass === 'Ranger') return 1.25;
        if (attackerClass === 'Ranger' && defenderClass === 'Mage') return 1.25;
        if (attackerClass === 'Mage' && defenderClass === 'Warrior') return 1.25;

        if (attackerClass === 'Ranger' && defenderClass === 'Warrior') return 0.75;
        if (attackerClass === 'Mage' && defenderClass === 'Ranger') return 0.75;
        if (attackerClass === 'Warrior' && defenderClass === 'Mage') return 0.75;

        return 1.0;
    }
};

module.exports = Balancing;
