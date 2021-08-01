/**
 * @Class This class binds key listeners to the window and updates the controller in attached player body.
 * @author Ethan Toney / Base code given to us in class 
 * @typedef InputHandler
 */
class InputHandler {
	key_code_mappings = {
		button: {
			32: {key: 'space', state: 'action_1'}
		},
		axis: {
			68: {key: 'right', state: 'move_x', mod: 1},
			65: {key: 'left', state: 'move_x', mod: -1},
			87: {key: 'up', state: 'move_y', mod: -1},
			83: {key: 'down', state: 'move_y', mod: 1}
		}
	};
	player = null;

	constructor(player) {
		this.player = player;

		// bind event listeners
		window.addEventListener("keydown", (event) => this.keydown(event), false);
		window.addEventListener("keyup", (event) => this.keyup(event), false);
		window.addEventListener('keydown', function(e) {
			if(e.keyCode == 32) {
			  e.preventDefault();
			}
		  });
	}

	/**
	 * This is called every time a keydown event is thrown on the window.
	 * 
	 * @param {Object} event The keydown event
	 */
	keydown(event) {
		// ignore event handling if they are holding down the button
		if (event.repeat)
			return;
	
		// check if axis mapping exists
		if (this.key_code_mappings.axis.hasOwnProperty(event.keyCode)) {
			const mapping = this.key_code_mappings.axis[event.keyCode];
			this.player.controller[mapping.state] += mapping.mod;
			//console.log(`input_handler[axis:${mapping.state} state:${this.player.controller[mapping.state]}]`);
		}
	
		// check if button mapping exists
		if (this.key_code_mappings.button.hasOwnProperty(event.keyCode)) {
			const mapping = this.key_code_mappings.button[event.keyCode];
			this.player.controller[mapping.state] = true;
			//console.log(`input_handler[button:${mapping.state} state:${this.player.controller[mapping.state]}]`);
		}
	}

	/**
	 * This is called every time a keyup event is thrown on the window.
	 * 
	 * @param {Object} event The keyup event
	 */
	keyup(event) {
		// check if axis mapping exists
		if (this.key_code_mappings.axis.hasOwnProperty(event.keyCode)) {
			const mapping = this.key_code_mappings.axis[event.keyCode];
			this.player.controller[mapping.state] -= mapping.mod;
		//	console.log(`input_handler[axis:${mapping.state} state:${this.player.controller[mapping.state]}]`);
		}
	
		// check if button mapping exists
		if (this.key_code_mappings.button.hasOwnProperty(event.keyCode)) {
			const mapping = this.key_code_mappings.button[event.keyCode];
			this.player.controller[mapping.state] = false;
			//console.log(`input_handler[button:${mapping.state} state:${this.player.controller[mapping.state]}]`);
		}
	}
}

/**
 * @class Creates a new body, can either be a person or a enemy
 * @author Matt Militello / Ethan Toney 
 * @typedef Body
 */
class Body {
	position = {x: 0, y: 0};
	velocity = {x: 0, y: 1};
	size = {width: 10, height: 10};
	health = 100;

	/**
	 * Creates a new body with all of the default attributes
	 */
	constructor() {
		// generate and assign the next body id
		this.id = running_id++;
		// add to the entity map
		entities[this.id] = this;
	}

	/**
	 * @type {Object} An object with two properties, width and height. The passed width and height
	 * are equal to half ot the width and height of this body.
	 */
	get half_size() {
		return {
			width: this.size.width / 2,
			height: this.size.height / 2
		};
	}
	/**
	 * @type {Object} Adjusts the players health 
	 * @param {String} string Determines how to adjust the players health
	 */
	setHealth(string) {
		if(string == "ship") {
			this.health = this.health - 20;
		}
		else if(string =="shot") {
			this.health = this.health - 10;
		}
		else if (string == "HP") {
			console.log(this.health);
			this.health = this.health + 15;
			console.log(this.health);
		}
		
	}
	/**
	 * @returns {Boolean} true if health is less than or equal to zero, false otherwise.
	 */
	isDead() {
		return this.health <= 0;
	}

	/**
	 * Updates the position of this body using the set velocity.
	 * 
	 * @param {Number} delta_time Seconds since last update
	 */
	update(delta_time) {
		// move body
		this.position.x += delta_time * this.velocity.x;
		this.position.y += delta_time * this.velocity.y;
	}

	/**
	 * This function draws a green line in the direction of the body's velocity. The length of this
	 * line is equal to a tenth of the length of the real velocity
	 * 
	 * @param {CanvasRenderingContext2D} graphics The current graphics context.
	 */
	draw(graphics) {
		graphics.strokeStyle = '#00FF00';
		graphics.beginPath();
		graphics.moveTo(this.position.x, this.position.y);
		graphics.lineTo(this.position.x + this.velocity.x / 10, this.position.y + this.velocity.y / 10);
		graphics.stroke();
	}

	/**
	 * Marks this body to be removed at the end of the update loop
	 */
	remove() {
		queued_entities_for_removal.push(this.id);
	}
}
/**
 * @class Creates a new weapon, currently only implemented for a HEALTH PACK
 * @author Matt Militello
 * @typedef Powerup
 */
class weapons {
	position = {x: 0, y: this.getRndInteger(config.canvas_size.height/2, config.canvas_size.height)};
	velocity = {x: 50, y: 0};
	size = {width: 10, height: 10};
	/**
	 * Creates a new weapon with all of the default attributes
	 */
	constructor() {
		this.id = powerup_id++;
		powerups[this.id] = this;
	}
	/**
	 * @type {Object} Returns a random position based on min and max
	 * @param {Number} min Minimum position to spawn a weapon
	 * @param {Number} max Maximum position to spawn a weapon
	 * @returns {Number} Returns a random int
	 */
	getRndInteger(min, max) {
		return Math.floor(Math.random() * (max - min + 1) ) + min;
	  }
	  /**
	 * @type {Object} An object with two properties, width and height. The passed width and height
	 * are equal to half ot the width and height of this body.
	 */
	get half_size() {
		return {
			width: this.size.width / 2,
			height: this.size.height / 2
		};
	}
	/**
	 * This function draws a green line in the direction of the body's velocity. The length of this
	 * line is equal to a tenth of the length of the real velocity
	 * 
	 * @param {CanvasRenderingContext2D} graphics The current graphics context.
	 */
	draw(graphics) {
		graphics.strokeStyle = '#0000FF';
		graphics.beginPath();
		graphics.moveTo(
			this.position.x,
			this.position.y
		);
		graphics.lineTo(
			this.position.x + this.size.width,
			this.position.y
		);
		graphics.lineTo(
			this.position.x + this.size.width,
			this.position.y + this.size.height
		);
		graphics.lineTo(
			this.position.x,
			this.position.y + this.size.height
		);
		graphics.lineTo(
			this.position.x,
			this.position.y
		);
		graphics.stroke();
			
		graphics.font = "6px Arial";
		graphics.textAlign = "center";
		graphics.fillStyle = '#000000';
		graphics.position = 'absolute';
		graphics.fillText('HP', this.position.x+5, this.position.y+7);
	}
	/**
	 * Updates the position of this body using the set velocity.
	 * 
	 * @param {Number} delta_time Seconds since last update
	 */
	update(delta_time) {
		if(this.position.x >= 500) {
			this.remove();
		}
		else {
			this.position.x += delta_time * this.velocity.x;
			this.position.y += delta_time * this.velocity.y;
		}
		
	}
	/**
	 * Marks this body to be removed at the end of the update loop
	 */
	remove() {
		queued_powerups_for_removal.push(this.id);
	}
}
/**
 * @class Creates a new shot, can be either from player or enemy
 * @author Matt Militello
 * @typedef Shot
 */
class Shooter{
	position = {x: 0, y: 0};
	velocity = {x: 0, y: 0};
	size = {width: 5, height: 10};
	setColor = "green";

	/**
	 * Creates a new body with all of the default attributes
	 */
	constructor() {
		this.id = shooting_id++;
		shots[this.id] = this;
	}
	/**
	 * @type {Object} Sets the x coordinate of the shot
	 * @param {Number} num The x coordinate
	 */
	positionX(num) {
		this.position.x = num;
	}
	/**
	 * @type {Object} Sets the y coordinate of the shot
	 * @param {Number} num The y coordinate
	 */
	positionY(num) {
		this.position.y = num;
	}
	/**
	 * @type {Object} Sets the velocity in the Y direction of the shot
	 * @param {Number} num The y velocity
	 */
	velocityY(num) {
		this.velocity.y = num;
	}
	/**
	 * @type {Object} Sets the color of the shot
	 * @param {String} String The string color
	 */
	color(string) {
		if(string == "red") {
			this.setColor = "red";
		}
		else {
			this.setColor = "green";
		}

	}
	/**
	 * Updates the position of this body using the set velocity.
	 * 
	 * @param {Number} delta_time Seconds since last update
	 */
	update(delta_time) {
		if(this.position.y <= 0 ||  this.position.y >= 500) {
			this.remove();
		}
		else {
			this.position.x += delta_time * this.velocity.x;
			this.position.y += delta_time * this.velocity.y;
		}
		
	}
	/**
	 * This function draws a green line in the direction of the body's velocity. The length of this
	 * line is equal to a tenth of the length of the real velocity
	 * 
	 * @param {CanvasRenderingContext2D} graphics The current graphics context.
	 */
	draw(graphics) {
		if (this.setColor == "red"){
			graphics.strokeStyle = '#FF0000';
		}
		else {
		graphics.strokeStyle = '#00FF00';
		}
		
		graphics.beginPath();
		graphics.moveTo(this.position.x, this.position.y);
		graphics.lineTo(this.position.x , this.position.y - 15);
		graphics.stroke();
	}
	/**
	 * Marks this body to be removed at the end of the update loop
	 */
	remove() {
		queued_shots_for_removal.push(this.id);
	}
}
/**
 * @class Represents an player body. Extends a Body by handling input binding and controller management.
 * @author Matt Militello  / Ethan Toney
 * @typedef Player
 */
class Player extends Body {
	// this controller object is updated by the bound input_handler
	controller = {
		move_x: 0,
		move_y: 0,
		action_1: false
	};
	maxspeed = 100;
	input_handler = null;
	isPlayer = true;

	/**
	 * Creates a new player with the default attributes.
	 */
	constructor() {
		super();

		// bind the input handler to this object
		this.input_handler = new InputHandler(this);

		// we always want our new players to be at this location
		this.position = {
			x: config.canvas_size.width / 2,
			y: config.canvas_size.height - 100
		};
	}

	/**
	 * Draws the player as a triangle centered on the player's location.
	 * 
	 * @param {CanvasRenderingContext2D} graphics The current graphics context.
	 */
	draw(graphics) {

		
		graphics.strokeStyle = '#000000';
		graphics.beginPath();
		graphics.moveTo(
			this.position.x,
			this.position.y - this.half_size.height
		);
		graphics.lineTo(
			this.position.x + this.half_size.width,
			this.position.y + this.half_size.height
		);
		graphics.lineTo(
			this.position.x - this.half_size.width,
			this.position.y + this.half_size.height
		);
		graphics.lineTo(
			this.position.x,
			this.position.y - this.half_size.height
		);
		graphics.stroke();
			
		// draw velocity lines
		super.draw(graphics);
	}
	/**
	 * @type {Object} Calls shooter when player presses space
	 */
	shoot() {
		if(loop_count % 10 == 0) {
			let shot = new Shooter();
				shot.positionX(this.position.x);
				shot.positionY(this.position.y - 3);
				shot.velocityY(-150);
				shot.color("green");
		}
			
		
	}
	/**
	 * Updates the player given the state of the player's controller.
	 * 
	 * @param {Number} delta_time Time in seconds since last update call.
	 */
	
	update(delta_time) {
		if (this.controller.action_1 == true) {
			this.shoot(delta_time);
		}
		this.velocity.x = this.maxspeed * this.controller.move_x;
		this.velocity.y = this.maxspeed * this.controller.move_y;
		if(this.move_x != 0 && this.move_y != 0) {
			this.velocity.x *= Math.SQRT1_2;
			this.velocity.y *= Math.SQRT1_2;
		}
		super.update(delta_time);

		// clip to screen
		this.position.x = Math.min(Math.max(0, this.position.x), config.canvas_size.width);
		this.position.y = Math.min(Math.max(0, this.position.y), config.canvas_size.height);
		
	
	}
}
/**
 * @class Creates a new enemy, with an instance of body
 * @author Matt Militello
 * @typedef Enemy
 */
class enemy_spawner extends Body {
	// this controller object is updated by the bound input_handler
	controller = {
		move_x: 0,
		move_y: -1,
		action_1: false
	};
	maxspeed = 100;
	input_handler = null;
	isPlayer = false;
	shoot  = 1;

	/**
	 * Creates a new player with the default attributes.
	 */
	constructor() {
		super();

		this.velocity = {
			x: 0,
			y: this.getSpeed()
		};
		this.position = {
			x: this.getRndInteger(0, config.canvas_size.width),
			y: config.canvas_size.height - 510
		};
	}
	/**
	 * @type {Object} Returns a random position based on min and max
	 * @param {Number} min Minimum position to spawn an enemy
	 * @param {Number} max Maximum position to spawn an enemy
	 * @returns {Number} Returns a random int
	 */
	getRndInteger(min, max) {
		return Math.floor(Math.random() * (max - min + 1) ) + min;
	  }
	  /**
	 * @type {Object} Sets speed based on how long the game has been going on
	 * @returns {Number} Returns a velocity based on time in game
	 */
	getSpeed() {
		if(loop_count < 1000) {
			return 100;
		}
		else if(loop_count >= 1000 && loop_count < 2000) {
			return 150;
		}
		else if(loop_count >= 2000) {
			return 200;
		}
	}
	/**
	 * Draws the player as a triangle centered on the player's location.
	 * 
	 * @param {CanvasRenderingContext2D} graphics The current graphics context.
	 */
	draw(graphics) {
		graphics.strokeStyle = '#000000';
		graphics.beginPath();
		graphics.moveTo(
			this.position.x,
			this.position.y + this.half_size.height
		);
		graphics.lineTo(
			this.position.x - this.half_size.width,
			this.position.y - this.half_size.height
		);
		graphics.lineTo(
			this.position.x + this.half_size.width,
			this.position.y - this.half_size.height
		);
		graphics.lineTo(
			this.position.x,
			this.position.y + this.half_size.height
		);
		graphics.stroke();
	}
	/**
	 * Updates the player given the state of the player's controller.
	 * 
	 * @param {Number} delta_time Time in seconds since last update call.
	 */
	update(delta_time) {
		if(this.position.y >= 500) {
			this.remove();
		}
		let randomShot = Math.floor(Math.random() * 251);
		if(randomShot == this.shoot) {
			let shot = new Shooter();
			shot.positionX(this.position.x);
			shot.positionY(this.position.y + 15);
			if(loop_count >= 1000) {
				shot.velocityY(250);
			}
			else {
				shot.velocityY(150);
			}
			shot.color("red");
		}
		super.update(delta_time);
	}
}
/** @type {Object<Collision>} This is an object to detect collisions  */
var collision_handler = null;
/**
 * @class Creates a collision detector
 * @author Matt Militello
 * @typedef Collision
 */
class collision extends Body{
	constructor() {
		super();
	}
	update(delta_time) {
		entities.forEach((value) => {
			if(player.position.x < value.position.x + value.size.width && 
					player.position.x + player.size.width > value.position.x &&
					player.position.y < value.position.y + value.size.height && 
					player.position.y + player.size.height > value.position.y) { 
						if(player.isPlayer && value.isPlayer) {
						}
						else {
							value.remove();
							player.setHealth("ship");				
						}
					}
			else {
				shots.forEach((second) => {
					if(value.position.x < second.position.x + second.size.width && 
					value.position.x + value.size.width > second.position.x &&
					value.position.y < second.position.y + second.size.height && 
					value.position.y + value.size.height > second.position.y) {
						if(second.setColor == "green") {
							numHit++;
							value.remove();
							second.remove();
						}
						
					}
				});
			}
		});
		shots.forEach((value) => {
			if(player.position.x < value.position.x + value.size.width && 
					player.position.x + player.size.width > value.position.x &&
					player.position.y < value.position.y + value.size.height && 
					player.position.y + player.size.height > value.position.y) { 
						if(value.setColor == "red") {
							value.remove();
							player.setHealth("shot");	
						}
						
					}
					shots.forEach((second) => {
						if(value.position.x < second.position.x + second.size.width && 
						value.position.x + value.size.width > second.position.x &&
						value.position.y < second.position.y + second.size.height && 
						value.position.y + value.size.height > second.position.y) {
							if(second.setColor == "green" && value.setColor == "red") {
								value.remove();
								second.remove();
							}
							
						}
					});
					powerups.forEach((second) => {
						if(value.position.x < second.position.x + second.size.width && 
						value.position.x + value.size.width > second.position.x &&
						value.position.y < second.position.y + second.size.height && 
						value.position.y + value.size.height > second.position.y) {
							if(value.setColor == "green") {
								player.setHealth("HP");
								second.remove();
								value.remove();
							}						
						}
					});
			});
			powerups.forEach((value) => {
				if(player.position.x < value.position.x + value.size.width && 
						player.position.x + player.size.width > value.position.x &&
						player.position.y < value.position.y + value.size.height && 
						player.position.y + player.size.height > value.position.y) { 
								value.remove();
								player.setHealth("HP");				
							
						}
					
					});

				
	}
}

const config = {
	graphics: {
		// set to false if you are not using a high resolution monitor
		is_hi_dpi: true
	},
	canvas_size: {
		width: 600,
		height: 400
	},
	update_rate: {
		fps: 60,
		seconds: null
	}
};

config.update_rate.seconds = 1 / config.update_rate.fps;

/** grab the html span*/
const game_state = document.getElementById('game_state');
/** grab the html span for score*/
const game_score= document.getElementById('score');
/** grab the html span for topscores*/
const top_score = document.getElementById('topscore');
/**  grab the html canvas*/
const game_canvas = document.getElementById('game_canvas');
game_canvas.style.width = `${config.canvas_size.width}px`;
game_canvas.style.height = `${config.canvas_size.height}px`;
/**Graphics using the game canvas */
const graphics = game_canvas.getContext('2d');

// for monitors with a higher dpi
if (config.graphics.is_hi_dpi) {
	game_canvas.width = 2 * config.canvas_size.width;
	game_canvas.height = 2 * config.canvas_size.height;
	graphics.scale(2, 2);
} else {
	game_canvas.width = config.canvas_size.width;
	game_canvas.height = config.canvas_size.height;
	graphics.scale(1, 1);
}

/** @type {Number} last frame time in seconds */
var last_time = null;
/** @type {Number} Keeps track of how many times the isDead function is called */
let count = 0;
/** @type {Number} A counter representing the number of update calls */
var loop_count = 0;
/** @type {Number} Keeps track of the score  */
let score = 0;
/** @type {Number} A counter that is used to assign bodies a unique identifier */
var running_id = 0;
/** @type {Number} number of seconds the game has been going on */
let seconds = 0;
/** @type {Number} A counter that is used to assign shots a unique identifier */
let shooting_id = 0;
/** @type {Number} Number of enemies hit */
let numHit = 0;
/** @type {Object<Number, Body>} This is a map of body ids to body instances */
var entities = null;
/** @type {Object<Number, Shot>} This is a map of shot ids to shot instances */
let shots = null;
/** @type {Object<Number, Powerup>} This is a map of powerup ids to powerup instances */
let powerups = null;
/** @type {Number} A counter that is used to assign powerups a unique identifier */
let powerup_id = 0;
/** @type {Array<Number>} This is an array of body ids to remove at the end of the update */
var queued_entities_for_removal = null;
/** @type {Array<Number>} This is an array of shot ids to remove at the end of the update */
var queued_shots_for_removal = null;
/** @type {Array<Number>} This is an array of powerup ids to remove at the end of the update */
var queued_powerups_for_removal = null;
/** @type {Number} Final score when player dies*/
let finalScore = 0;
/** @type {Player} The active player */
var player = null;
/** @type {Enemy} The enemy spawner */
var enemy_spawner1 = null;
/** @type {Powerup} The powerup class */
let powerup = null;
/** @type {Number} The number of enemies spawned */
let spawned = 0;
/** @type {Array<Number>} Array to show the top 5 scores */
let topScores = [0, 0, 0, 0, 0];

/**
 * This function updates the state of the world given a delta time.
 * 
 * @param {Number} delta_time Time since last update in seconds.
 */
function update(delta_time) {
	// move entities

	// allow the player to restart when dead
	if (player.isDead()) {
		finalScore = score;
		
		if(player.controller.action_1) {
			loop_count = 0;
			score = 0;
			count = 0;
			numHit = 0;
			spawned = 0;
			running_id = 0;
			shooting_id = 0;
			powerup_id = 0;
			start();
		}
		
	}
	else {
		Object.values(entities).forEach(entity => {
			entity.update(delta_time);
		});
		Object.values(shots).forEach(shot => {
			shot.update(delta_time);
		});
		Object.values(powerups).forEach(power => {
			power.update(delta_time);
		});
		
		// detect and handle collision events
		if (collision_handler != null) {
			collision_handler.update(delta_time);
		}

		// remove enemies
		
		queued_entities_for_removal.forEach(id => {
		delete entities[id];
		});
		queued_shots_for_removal.forEach(id => {
		delete shots[id];
		});
		queued_powerups_for_removal.forEach(id => {
			delete powerups[id];
		});
		if(loop_count >= 100) {
			let randomSpawn = Math.floor(Math.random() * 1001);
			if(randomSpawn == 1) {
				console.log("Powerup Spawned");
				powerup = new weapons();
				powerup.velocity.x = 50;
			}
			
		}
		// spawn enemies
		if (enemy_spawner1 != null) {
		
			if(loop_count % 15 == 0 && loop_count <=1000) {
				let spawn = new enemy_spawner();
				spawned++;
			}
			else if(loop_count % 10 == 0 && loop_count >= 1000) {
				let spawn = new enemy_spawner();
				spawned++;
			}
		}
		score = Math.floor(30 * numHit + loop_count/60);
	}
}
/**This function defines the scoreboard and adds the scores highest to lowest
 * @param {Number} num The score player recieved at the end of the game
 */
function scoreboard(num) {
	topScores.push(num);
	topScores.sort(function(a, b){return b-a}); 
	top_score.innerHTML = `<br>Top Scores: <br>1) ${topScores[0]} 2) ${topScores[1]} 3) ${topScores[2]} 4) ${topScores[3]} 5) ${topScores[4]}`;
}
/**
 * This function draws the state of the world to the canvas.
 * 
 * @param {CanvasRenderingContext2D} graphics The current graphics context.
 */
function draw(graphics) {
	// default font config
	graphics.font = "10px Arial";
	graphics.textAlign = "left";

	// draw background (this clears the screen for the next frame)
	graphics.fillStyle = '#FFFFFF';
	graphics.fillRect(0, 0, config.canvas_size.width, config.canvas_size.height);

	game_score.innerHTML = `Score: ${score}`;


	// for loop over every eneity and draw them

	// game over screen
	if (player.isDead()) {
	graphics.font = "30px Arial";
	graphics.textAlign = "center";
	graphics.fillStyle = '#FF0000';
	graphics.position = 'absolute';
	graphics.fillText('Game Over', config.canvas_size.width / 2, config.canvas_size.height / 2);
	graphics.fillStyle = '#FF0000';
	graphics.font = "12px Arial";
	graphics.textAlign = "center";
	graphics.position = 'absolute';
	graphics.fillText('press space to restart', config.canvas_size.width / 2, 12 + config.canvas_size.height / 2);
		if(count < 1) {
			scoreboard(score);	
			seconds = loop_count / 60;
			count++;
		}
		graphics.fillText('Final Score: ' + finalScore, config.canvas_size.width / 2, 124 + config.canvas_size.height / 2);
		graphics.fillText('Time Alive: ' + Math.round(seconds), config.canvas_size.width / 2, 136 + config.canvas_size.height / 2);
		graphics.fillText('Num of Enemies Hit: ' + numHit, config.canvas_size.width / 2, 148 + config.canvas_size.height / 2);
		graphics.fillText('Num of Enemies Spawned: ' + spawned, config.canvas_size.width / 2, 160 + config.canvas_size.height / 2);	
	}
	else {
		Object.values(entities).forEach(entity => {
			entity.draw(graphics);
		});
		Object.values(shots).forEach(shot => {
			shot.draw(graphics);
		});
		Object.values(powerups).forEach(power => {
			power.draw(graphics);
		});
	}
}

/**
 * This is the main driver of the game. This is called by the window requestAnimationFrame event.
 * This function calls the update and draw methods at static intervals. That means regardless of
 * how much time passed since the last time this function was called by the window the delta time
 * passed to the draw and update functions will be stable.
 * 
 * @param {Number} curr_time Current time in milliseconds
 */
function loop(curr_time) {
	// convert time to seconds
	curr_time /= 1000;

	// edge case on first loop
	if (last_time == null) {
		last_time = curr_time;
	}

	var delta_time = curr_time - last_time;

	// this allows us to make stable steps in our update functions
	while (delta_time > config.update_rate.seconds) {
		update(config.update_rate.seconds);
		draw(graphics);

		delta_time -= config.update_rate.seconds;
		last_time = curr_time;
		loop_count++;

		//game_state.innerHTML = `loop count ${loop_count}`;
	}

	window.requestAnimationFrame(loop);
}
/**Starts and restarts the game when called */
function start() {
	entities = [];
	shots = [];
	powerups = [];
	queued_entities_for_removal = [];
	queued_shots_for_removal = [];
	queued_powerups_for_removal = [];
	player = new Player();
	enemy_spawner1 = new enemy_spawner();
	collision_handler = new collision();
}

// start the game
scoreboard(0);
start();

// start the loop
window.requestAnimationFrame(loop);