const Skills = require('./Skills');
const Balancing = require('./Balancing');

class GameState {
    constructor(players) {
        this.players = players.map(p => ({
            ...p,
            hp: p.class.baseStats.hp,
            mp: p.class.baseStats.mp,
            maxHp: p.class.baseStats.hp,
            maxMp: p.class.baseStats.mp,
            isDead: false,
            cooldowns: {} // { skillName: turnsRemaining }
        }));
        this.turnIndex = 0;
        this.logs = [];
        this.winner = null;
    }

    getCurrentPlayer() {
        return this.players[this.turnIndex];
    }

    nextTurn() {
        let attempts = 0;
        do {
            this.turnIndex = (this.turnIndex + 1) % this.players.length;
            attempts++;
        } while (this.players[this.turnIndex].isDead && attempts < this.players.length);

        // Reduce cooldowns for the new active player
        const currentPlayer = this.getCurrentPlayer();
        for (const skill in currentPlayer.cooldowns) {
            if (currentPlayer.cooldowns[skill] > 0) {
                currentPlayer.cooldowns[skill]--;
            }
        }

        return currentPlayer;
    }

    processAction(action) {
        const attacker = this.players.find(p => p.socketId === action.attackerId);
        const target = this.players.find(p => p.socketId === action.targetId);
        const skill = action.skill;

        if (!attacker || !target) return { valid: false, message: "Invalid targets" };
        if (attacker.isDead) return { valid: false, message: "You are dead" };
        if (target.isDead) return { valid: false, message: "Target is already dead" };
        if (attacker.socketId !== this.getCurrentPlayer().socketId) return { valid: false, message: "Not your turn" };
        if (attacker.mp < skill.cost) return { valid: false, message: "Not enough MP" };
        if (attacker.cooldowns[skill.name] > 0) return { valid: false, message: "Skill on cooldown" };

        // Calculate Damage
        let damage = skill.damage;

        // Apply Balancing Multiplier
        const multiplier = Balancing.getMultiplier(attacker.class.name, target.class.name);
        damage = Math.floor(damage * multiplier);

        // Apply to Target
        target.hp -= damage;
        if (target.hp <= 0) {
            target.hp = 0;
            target.isDead = true;
            this.logs.push(`${attacker.username} killed ${target.username} with ${skill.name}!`);
        } else {
            this.logs.push(`${attacker.username} used ${skill.name} on ${target.username} for ${damage} damage.`);
        }

        // Consume MP
        attacker.mp -= skill.cost;

        // Set Cooldown (Simple 3 turn cooldown for all active skills for now)
        attacker.cooldowns[skill.name] = 3;

        // Check Win Condition
        const alivePlayers = this.players.filter(p => !p.isDead);
        if (alivePlayers.length === 1) {
            this.winner = alivePlayers[0];
        }

        return { valid: true, state: this.getState() };
    }

    getState() {
        return {
            players: this.players,
            turnIndex: this.turnIndex,
            logs: this.logs,
            winner: this.winner
        };
    }
}

module.exports = GameState;
