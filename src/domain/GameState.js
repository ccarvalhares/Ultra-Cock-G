const Skills = require('./Skills');
const Balancing = require('./Balancing');

class GameState {
    constructor(players) {
        this.players = players.map((p, index) => ({
            ...p,
            isDead: false,
            cooldowns: {},
            lastActionTime: 0,
            position: { x: index * 2, y: 0, z: 0 },
            rotation: 0
        }));
        this.logs = [];
        this.winner = null;
        this.isStarted = false;
    }

    startBattle() {
        this.players.forEach(p => {
            if (p.class) {
                p.hp = p.class.baseStats.hp;
                p.mp = p.class.baseStats.mp;
                p.maxHp = p.class.baseStats.hp;
                p.maxMp = p.class.baseStats.mp;
            }
        });
        this.isStarted = true;
    }

    updatePlayerPosition(socketId, position, rotation) {
        const player = this.players.find(p => p.socketId === socketId);
        if (player && !player.isDead) {
            player.position = position;
            player.rotation = rotation;
        }
    }

    processAction(action) {
        const attacker = this.players.find(p => p.socketId === action.attackerId);
        const target = this.players.find(p => p.socketId === action.targetId);
        const skill = action.skill;

        if (!attacker || !target) return { valid: false, message: "Invalid targets" };
        if (attacker.isDead) return { valid: false, message: "You are dead" };
        if (target.isDead) return { valid: false, message: "Target is already dead" };

        // Global Cooldown (100ms discrete interval)
        const now = Date.now();
        if (attacker.lastActionTime && now - attacker.lastActionTime < 100) {
            return { valid: false, message: "Too fast!" };
        }
        attacker.lastActionTime = now;

        // Check Skill Cooldown
        if (attacker.cooldowns[skill.name] && now < attacker.cooldowns[skill.name]) {
            return { valid: false, message: "Skill on cooldown" };
        }

        if (attacker.mp < skill.cost) return { valid: false, message: "Not enough MP" };

        // Calculate Damage
        let damage = skill.damage;
        const multiplier = Balancing.getMultiplier(attacker.class.name, target.class.name);
        damage = Math.floor(damage * multiplier);

        // Apply to Target
        target.hp -= damage;
        if (target.hp <= 0) {
            target.hp = 0;
            target.isDead = true;
            this.logs.push(`${attacker.username} killed ${target.username} with ${skill.name}!`);
        } else {
            this.logs.push(`${attacker.username} hit ${target.username} for ${damage} damage.`);
        }

        // Consume MP
        attacker.mp -= skill.cost;

        // Set Cooldown (e.g., 3 seconds)
        attacker.cooldowns[skill.name] = now + 3000;

        // Check Win Condition
        const alivePlayers = this.players.filter(p => !p.isDead);
        if (alivePlayers.length === 1 && this.players.length > 1) {
            this.winner = alivePlayers[0];
        }

        return { valid: true, state: this.getState() };
    }

    getState() {
        return {
            players: this.players,
            logs: this.logs,
            winner: this.winner
        };
    }
}

module.exports = GameState;
