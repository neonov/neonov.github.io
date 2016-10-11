;(function (){

  function Game() {

    // cache DOM nodes
    this.$input = document.getElementById('input');
    this.$button = document.getElementById('button');
    this.$description =  document.getElementById('description');
    this.$restartButton =  document.getElementById('restart-button');

    // let's start
    this.addEvents();
    this.init()
  }

  /**
   * Init game
   */
  Game.prototype.init = function() {

    // display correctly description and button stage
    this.$description.innerHTML = Game.const.INIT_DESCRIPTION;
    this.$button.innerHTML = Game.const.INIT_BUTTON;

    // disable restart button
    this.$restartButton.style.display = 'none';

    // enable input and focus on it
    this.$input.removeAttribute('disabled');
    this.$input.focus();

    // game stage
    this.stage = Game.const.GAME_STAGE_PRE_START;

    // set random intenger
    this._number = Game.randomIntInRange(Game.const.MIN, Game.const.MAX);

    console.log('TIP: ', this._number);
    
    // array for entered numbers
    this.enteredNumbers = [];


  };

  /**
   * Add event listeners
   */
  Game.prototype.addEvents = function() {
    this.$input.addEventListener('input', this.callbackInputChange.bind(this));
    this.$button.addEventListener('click', this.callbackCheckNumber.bind(this));
    this.$restartButton.addEventListener('click', this.callbackRestartClick.bind(this))
  };

  Game.prototype.callbackInputChange = function() {
    if(this.stage === Game.const.GAME_STAGE_PRE_START) {
      this.$button.removeAttribute('disabled'); // enable button
      this.stage = Game.const.GAME_STAGE_START;
    }
    this.validateInput(this.$input.value);
  };

  Game.prototype.callbackCheckNumber = function() {

    // write entered numbers
    this.enteredNumbers.push(this.$input.value);

    if (this.$input.value < this._number) {
      this.$button.innerHTML = Game.const.TIPS_TOO_LOW;
    } else if (this.$input.value > this._number) {
      this.$button.innerHTML = Game.const.TIPS_TOO_HIGH;
    } else {

      this.displayEnteredNumbers();
      this.$button.innerHTML = Game.const.TIPS_FOUND;

      this.$input.setAttribute('disabled', true);  // disable input
      this.$button.setAttribute('disabled', true); // disable button
      this.$restartButton.style.display = 'block'; // display restart button
    }
  };

  Game.prototype.callbackRestartClick = function() {
    this.$restartButton.style.display = 'none';
    this.$input.value = '';
    this.init();
  };

  /**
   * Validate entered value
   * @param  {number} number entered value
   */
  Game.prototype.validateInput = function(number) {
    if (this.$input.value === '') {
      // disable button
      this.$button.setAttribute('disabled', true);
    } else if (number < Game.const.MIN) {
      this.$input.value = Game.const.MIN;
    } else if (number > Game.const.MAX) {
      this.$input.value = Game.const.MAX;
    } else {
      this.$button.removeAttribute('disabled');
    }
  };

  /**
   * display entered number on view
   */
  Game.prototype.displayEnteredNumbers = function() {
    this.$description.innerHTML = 'You have ' + this.enteredNumbers.length + ' attempts: '+ this.enteredNumbers.join(', ')
  };


  /**
   * Generate random integer in range
   * @param  {number} min  min in range
   * @param  {number} max  max in range
   * @return {number} random integer
   */
  Game.randomIntInRange = function(min, max) {
    var rand = min - 0.5 + Math.random() * (max - min + 1);
    return Math.round(rand);
  };


  Game.const = {

    // range numbers
    MIN: 1,
    MAX: 100,

    // some constant that will be displayed
    TIPS_TOO_HIGH: 'Too high',
    TIPS_TOO_LOW: 'Too Low',
    TIPS_FOUND: 'You found the number',
    INIT_DESCRIPTION: 'Guess a number between 1 and 100',
    INIT_BUTTON: 'Guess',

    // stage of game
    GAME_STAGE_PRE_START: 'pre start', // not entered number
    GAME_STAGE_START: 'start' // entered number

  };

  new Game();

}());
