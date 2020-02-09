

const gameState = {}; // Keeps track of the state of the game

class Gameplay extends Phaser.Scene {
    constructor() {
        super({key: 'Gameplay'})
    };

    preload() { //Loads in external files/assets
        
        this.load.spritesheet('char','assets/robosheet4.png', { frameWidth: 30, frameHeight: 55 });  // loads in sprite sheet for player Character
        this.load.spritesheet('virus','assets/Virus2.jpg', { frameWidth: 41, frameHeight: 36}); // loads in sprite sheet for AI
        this.load.image('tiles','assets/tileset.png'); // loads in tileset
        this.load.tilemapTiledJSON('map','assets/maze5.json'); // loads in map

        
    };

    create() { //Defines the GameObjects
        
       
        //Creates Map
        
        const map = this.make.tilemap({ key: 'map'}); // Creates tilemap
        const tset = map.addTilesetImage('tileset','tiles',32,32); // adds tileset
        const worldLayer = map.createStaticLayer("World", tset, 0, 0); // adds tilemap World layer
        worldLayer.setCollisionByProperty({ collides: true }); // Creates collision when property is true
        

         //Creates Character
         gameState.player= this.physics.add.sprite(600,74,'char');  // adds animated sprite affected by physics
         this.physics.add.collider(gameState.player, worldLayer); // Creates collision between the worldLayer and the player
         this.anims.create( {   // Adds in animation for running
           key: 'run', // animation identifier
           frames: this.anims.generateFrameNumbers('char', { start: 0, end: 6}), // generates frames 0 to 6
           frameRate: 7, // 7 frames displayed per second
           repeat: -1 // repeats infinitely
         })

         this.anims.create( {  // Adds in animation for standing
            key: 'stand', // animation identifier
            frames: this.anims.generateFrameNumbers('char', { start: 4, end: 4}), // generates frame 4
            frameRate: 1, // 1 frame displayed per second
            repeat: -1 // repeats infinitely

         })

         gameState.cursors = this.input.keyboard.createCursorKeys(); // Implements Controls

          //Creates Enemies
          const enemies = this.physics.add.group(); // Implements enemy group object
          gameState.ai = enemies.create(50,150,'virus'); // Creates an enemy object

 
         //Creates Collider
         //this.physics.add.collider(gameState.player, enemies, function()  { // When player and enemy collide game ends
             //this.physics.pause(); // pauses all physics
           //  });
             

        // Path finding algorithm for AI - A* algorithm
        gameState.finder = new EasyStar.js(); // Creates EasyStar.js object

        let grid = []; // Will hold grid representing tilemap

        const getTileID = function(x,y){ // Function accepting parameters x and y by value representing the coordinates of a tile
            let tile = map.getTileAt(x, y); // stores tile returned from given x and y coordinates within tilemap
            return tile.index; // returns the tileID at the given x and y coordinates
        };

        // Embedded for loop creating grid representing the tilemap for A* algorithm to be performed upon

        for(let y = 0; y < map.height-1; y++){ // Loops until y = to the height of the tilemap, starts at y=0, y is incremented on each iteration
            let col = []; // Will hold all TileIDs of the tiles with the same y coordinate
            for(let x = 0; x < map.width-1; x++){ // Loops until x = the width of the tilemap, starts at x=0, x is incremented on each iteration
                col.push(getTileID(x,y)); // Adds all TileIDs with the same y-coordinate to the col array
                
            }
            grid.push(col); // Adds rows of TileIDs to grid one by one
        }
        gameState.finder.setGrid(grid); // Defines the grid for the A* algorithm to use


        let tileset = map.tilesets[0];
        let properties = tileset.tileProperties;
        let acceptableTiles = [];

        for(let i = tileset.firstgid-1; i < tileset.total; i++){ // firstgid and total are fields from Tiled that indicate the range of IDs that the tiles can take in that tileset
                if(!properties.hasOwnProperty(i)) {
                    // If there is no property indicated at all, it means it's a walkable tile
                    acceptableTiles.push(i+1);
                    continue;
                }
                if(!properties[i].collide) acceptableTiles.push(i+1); // If no collision tile is walkable
                if(properties[i].cost) gameState.finder.setTileCost(i+1, properties[i].cost); // If there is a cost attached to the tile, let's register it
            }
        gameState.finder.setAcceptableTiles(acceptableTiles); // sets acceptable Tiles within easystar


   
    };

    update() { // Defines animation and interaction 

        
        if(gameState.cursors.up.isDown) { 
            gameState.player.setVelocityY(-300); // When up arrow key is pressed the player's sprite moves upwards
            gameState.player.anims.play('run',true) 

        } else if(gameState.cursors.down.isDown) {
            gameState.player.setVelocityY(300); // When down arrow key is pressed the player's sprite moves downwards
            gameState.player.anims.play('run',true) 

        } else if(gameState.cursors.right.isDown) {
            gameState.player.setVelocityX(300); // When right arrow key is pressed the player's sprite moves to the right
            gameState.player.anims.play('run',true) // plays run animation
            gameState.player.flipX = false; // flips animation direction from left to right

        } else if(gameState.cursors.left.isDown) {
            gameState.player.setVelocityX(-300); // When left arrow key is pressed the player's sprite moves to the left
            gameState.player.anims.play('run',true)  // plays run animation
            gameState.player.flipX = true; // flips animation direction from right to left
        

        } else {
            gameState.player.setVelocityX(0); // When no arrow key is pressed the player's velocity left or right is set to 0
            gameState.player.setVelocityY(0); // When no arrow key is pressed the player's velocity up or down is set to 0
            gameState.player.anims.play('stand',true) // plays standing animation
        }
        
        // Calculating path to player and moving enemy along that path
        let toX = Math.floor(gameState.player.x/32); // Puts players x coordinate in correct format
        let toY = Math.floor(gameState.player.y/30); // Puts players y coordinate in correct format
        let fromX = Math.floor(gameState.ai.x/32); // puts enemys x coordinate in correct format
        let fromY = Math.floor(gameState.ai.y/30); // puts enemys y coordinate in correct format
        console.log('going from ('+fromX+','+fromY+') to ('+toX+','+toY+')'); // Logs to console the path the AI is taking
        

        const moveEnemy = function(path) { // method moves enemy along path to player
            for(let i = 0; i < path.length-1; i++) { // for loop iterates until enemy has reached destination
                setTimeout(function() {
                    gameState.ai.x = (path[i+1].x)*32; // redefines enemys x coordinate to next posistion in path and puts back into correct format
                    gameState.ai.y = (path[i+1].y)*30; // redefines enemys y coordinate to next position in path and puts back into correct format
                    console.log(gameState.ai.x)
                    console.log(gameState.ai.y)
                },2000) // delays for 2 seconds
            }
        }

        gameState.finder.findPath(fromX, fromY, toX, toY, function( path ) { // easystar method accepting enemys position and its destination and also a call back function
            if (path === null) {
                console.warn("Path was not found."); // if path does not exist warn that path was not found
            } else {
                moveEnemy(path); // If path exists move enemy along path
            }
        });
    gameState.finder.calculate(); // Calculates the path to the player
    };
}

class MainMenu extends Phaser.Scene {
    constructor() {
        super({key: 'MainMenu'})
    };

    preload() {   //Loads in external files/assets
        this.load.image('bg','assets/maze.png'); //Loads in background image
        

    };

    create() { //Defines the GameObjects
        this.add.image(656,360,'bg'); //adds background image to the game
        this.add.rectangle(660,80,705,125,0) // adds border to text box
        this.add.rectangle(660,80,700,120,0xFFFFFF) //adds text box for title
        this.add.text(400,40,'Data Capture', { font: "70px Courier New", fill: '0'}) //adds title

        this.add.rectangle(670,280,505,95,0) // adds border to text box
        gameState.startGame=this.add.rectangle(670,280,500,90,0xFFFFFF).setInteractive() //adds interactive text box
        this.add.text(590,250,'Start', { font: "50px Courier New", fill: '0'}) //adds text
        gameState.startGame.on('pointerup', function() { //adds functionality to interactive text box
            this.scene.scene.start('Gameplay') // Starts Gameplay scene when button is clicked
        })

        this.add.rectangle(670,400,505,95,0) // adds border to text box
        this.add.rectangle(670,400,500,90,0xFFFFFF) //adds text box 
        this.add.text(510,375,'Leaderboard', { font: "50px Courier New", fill: '0'}) //adds text
    
        this.add.rectangle(670,520,505,95,0) // adds border to text box
        this.add.rectangle(670,520,500,90,0xFFFFFF) //adds text box 
        this.add.text(585,490,'Review', { font: "50px Courier New", fill: '0'}) //adds text
        
        this.add.rectangle(240,600,205,65,0) // adds border to text box
        gameState.logout=this.add.rectangle(240,600,200,60,0xFFFFFF).setInteractive() //adds interactive text box 
        this.add.text(155,580,'Log Out', { font: "40px Courier New", fill: '0'}) //adds text
        gameState.logout.on('pointerup', function() { //adds functionality to the interactive text box
            this.scene.scene.start('SignIn') // Starts SignIn scene when button is clicked
        })
    
    
        
    };

    update() { // Defines animation and interaction 
   

        

    };
}

class SignIn extends Phaser.Scene {
    constructor() {
        super({key: 'SignIn'})
    };
 
    preload() { //Loads in external files/assets
        this.load.image('bg','assets/maze.png'); //Loads in background image
    };

    create() { //Defines the GameObjects
        this.add.image(656,360,'bg'); //adds background image to the game
        this.add.rectangle(660,120,705,125,0) // adds border to text box
        this.add.rectangle(660,120,700,120,0xFFFFFF) //adds text box for title
        this.add.text(500,90,'Sign in', { font: "70px Courier New", fill: '0'}) //adds title

        this.add.rectangle(670,280,505,65,0) // adds border to text box
        this.add.rectangle(670,280,500,60,0xFFFFFF) //adds text box 
        this.add.text(430,250,'Username', { font: "50px Courier New", fill: '0'}) //adds text

        this.add.rectangle(670,350,505,50,0) // adds border to text box
        this.add.rectangle(670,350,500,45,0xFFFFFF) //adds text box 

        this.add.rectangle(670,430,505,65,0) // adds border to text box
        this.add.rectangle(670,430,500,60,0xFFFFFF) //adds text box 
        this.add.text(430,400,'Password', { font: "50px Courier New", fill: '0'}) //adds text

        this.add.rectangle(670,500,505,50,0) // adds border to text box
        this.add.rectangle(670,500,500,45,0xFFFFFF) //adds text box 
    
        
        this.add.rectangle(280,570,205,65,0) // adds border to text box
        this.add.rectangle(280,570,200,60,0xFFFFFF) //adds text box 
        this.add.text(195,550,'Sign up', { font: "40px Courier New", fill: '0'}) //adds text


        this.add.rectangle(1000,570,205,65,0) // adds border to text box
        gameState.login=this.add.rectangle(1000,570,200,60,0xFFFFFF).setInteractive() //adds interactive text box 
        this.add.text(920,550,'Log in', { font: "40px Courier New", fill: '0'}) //adds text
        gameState.login.on('pointerup', function() { //adds functionality to the interactive text box
            this.scene.scene.start('MainMenu') // Starts MainMenu scene when button is clicked
        })
        
            
    };  

    update() { // Defines animation and interaction

    };


}

const config = { // Structures Phaser Game
    type: Phaser.AUTO, // changes phaser type automatically to fit browser it is run on
    width: 1312,  // defines width of phaser game screen
    height: 720, // defines the height of phaser game screen
    physics: {    //adds physics to the game  
        default: 'arcade'  //Specifys physics as arcade physics
    },
    scene: [SignIn,MainMenu,Gameplay] // Stores scenes of my game

};
const game = new Phaser.Game(config); // Creates Phaser game 
