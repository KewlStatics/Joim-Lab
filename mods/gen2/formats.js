exports.BattleFormats = {
	pokemon: {
		effectType: 'Banlist',
		validateSet: function(set, format) {
			var template = this.getTemplate(set.species);
			var problems = [];
			if (set.species === set.name) delete set.name;

			if (template.gen > this.gen) {
				problems.push(set.species+' does not exist in gen '+this.gen+'.');
			} else if (template.isNonstandard) {
				problems.push(set.species+' is not a real Pokemon.');
			}
			var hasHP = false;
			if (set.moves) for (var i=0; i<set.moves.length; i++) {
				var move = this.getMove(set.moves[i]);
				if (move.gen > this.gen) {
					problems.push(move.name+' does not exist in gen '+this.gen+'.');
				} else if (move.isNonstandard) {
					problems.push(move.name+' is not a real move.');
				}
				if (move.id === 'hiddenpower') hasHP = true;
			}
			if (set.moves && set.moves.length > 4) {
				problems.push((set.name||set.species) + ' has more than four moves.');
			}
			
			// Automatically set ability to None
			set.ability = 'None';
			
			// In gen 2, there's no advantage on having subpar EVs and you could max all of them
			set.evs = {hp: 255, atk: 255, def: 255, spa: 255, spd: 255, spe: 255};
			
			// Check if there's Hidden Power
			if (hasHP) {
				// All IVs to 31 forces correct Hidden Power from Typecharts
				set.ivs = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};
				// There's no good shiny Pokémon with good HPs
				set.shiny = false;
			} else {
				// IVs still maxed at 30 on Gen 2
				if (!set.ivs) {
					set.ivs = {hp: 30, atk: 30, def: 30, spa: 30, spd: 30, spe: 30};
				} else {
					for (var iv in set.ivs) {
						// Since Gen 2 has 0-15 DVs that increase 2 points, we only want pair numbers
						if (set.ivs[iv] % 2 !== 0) set.ivs[iv]--;
						// This shouldn't even be possible
						if (set.ivs[iv] > 30) set.ivs[iv] = 30;
					}
					// Special is one IV, we use spa for spa and spd.
					set.ivs.spd = set.ivs.spa;
				}
				// Calculate all the IV oddness on gen 2.
				// Don't run shinies, they fuck your IVs
				if (set.shiny) {
					set.ivs.def = 20;
					set.ivs.spe = 20;
					set.ivs.spa = 20;
					set.ivs.spd = 20;
					// Attack can vary, so let's check it
					if (!(set.ivs.atk in {4:1, 6:1, 12:1, 14:1, 20:1, 22:1, 28:1, 30:1})) {
						set.ivs.atk = 30;
					}
				}
				// Deal with female IVs.
				if (!template.gender) {
					set.gender = 'M';
					// 0001 (1 DV = 2 IV) Gender value 1:7
					if (template.genderRatio && template.genderRatio.F === 0.125 && set.ivs.atk < 3) {
						 set.gender = 'F';
					}
					// 0010 (2 DV = 4 IV) Gender value 1:3
					if (template.genderRatio && template.genderRatio.F === 0.25 && set.ivs.atk < 5) {
						 set.gender = 'F';
					}
					// 0011 (3 DV = 6 IV) Gender value 1:1
					if (!template.genderRatio && set.ivs.atk < 7) {
						 set.gender = 'F';
					}
					// 0100 (4 DV = 8 IV) Gender value 3:1
					if (template.genderRatio && template.genderRatio.F === 0.75 && set.ivs.atk < 9) {
						 set.gender = 'F';
					}
				}
				
				// The HP IV is calculated with the last bit of every value. Do this last.
				set.ivs.hp = (((set.ivs.atk / 2) % 2 * 8) + ((set.ivs.def / 2) % 2 * 4) + ((set.ivs.spe / 2) % 2 * 2) + ((set.ivs.spa / 2) % 2 * 1)) * 2;
			}
				
			// They all also get a useless nature, since that didn't exist
			set.nature = 'Serious';
			
			return problems;
		}
	},
	standard: {
		effectType: 'Banlist',
		ruleset: ['Sleep Clause', 'Species Clause', 'OHKO Clause', 'Evasion Moves Clause'],
		banlist: ['Unreleased', 'Illegal', 'Ignore Illegal Abilities'],
		validateSet: function(set) {
			// limit one of each move in Standard
			var moves = [];
			if (set.moves) {
				var hasMove = {};
				for (var i=0; i<set.moves.length; i++) {
					var move = this.getMove(set.moves[i]);
					var moveid = move.id;
					if (hasMove[moveid]) continue;
					hasMove[moveid] = true;
					moves.push(set.moves[i]);
				}
			}
			set.moves = moves;
		}
	}
};