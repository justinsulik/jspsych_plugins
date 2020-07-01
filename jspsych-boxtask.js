/*
 Template for the Box task described in Balzan et al. (2017) Beads task vs. box task: The specificity of the jumping to conclusions bias. Journal of Behavior Therapy and
Experimental Psychiatry
to do:
- randomize majority color for main sketch
- prevent re-opening boxes (+change outline?)
- add feedbackScreen with bonus
- hide/show instructions with fade
- in record=false, flag up previously opened boxes and make unclickable
- add coloring animation
- replace confidence enpoints with simple colors
- first conf. rating: add thumb
- remove requirement to move thumb
-

 */

jsPsych.plugins["boxtask"] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'boxtask',
    parameters: {
      firstColor: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Color for boxes',
        default: [0, 0, 0],
        description: 'Array of RGB values for one of the box colors. The complementary color will be generated automatically.'
      },
      openCount: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Draw count',
        default: 100,
        description: 'The maximum number of boxes that can be opened before guessing the dominant color.'
      },
      colorOrder: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Colors to display',
        default: [],
        description: 'Array of binary values to specify the order of colors discovered.'
      },
      colorRatio: {
        type: jsPsych.plugins.parameterType.FLOAT,
        pretty_name: 'Color ratio',
        default: 0.6,
        description: 'Ratio for coloring boxes'
      },
      rightAnswer: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Right answer',
        default: Math.floor(Math.random() * 2),
        description: 'What the majority color will turn out to be. Is overridden by the majority color in trial.colorOrder, if given'
      },
      boxCount: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Number of boxes',
        default: 100,
        description: 'Number of boxes available for opening'
      },
      record: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        pretty_name: 'Record color',
        default: true,
        description: 'If true, the discovered colors continue to be displayed. Otherwise they are greyed out.'
      },
      graded: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        pretty_name: 'Graded estimation',
        default: false,
        description: 'If true, participants provide an estimation of confident they are about the dominant color, turn by turn. Otherwise, they only decide at the end.'
      },
      sequential: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        pretty_name: 'Serial choices',
        default: true,
        description: "If true, participants decide after each opening whether they want to open another box. Otherwise, they decide up front how many boxes they'd like to open."
      },
      feedback: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        pretty_name: 'Feedback provided',
        default: true,
        description: 'If true, participants are told what the right color was, if they were correct (and if the trial includes an incentive, what their bonus was).'
      },
      incentive: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Incentivizes for guessing and opening',
        default: {base: null,
                  cost: null},
        description: 'If base is not null, participants receive a bonus for guessing the right dominant color. If cost is not null, the base bonus decreases by the cost for every box after the first.'
      },
    }
  }

  plugin.trial = function(display_element, trial) {

    // set up basic html

    var advanceButton = '<div id="buttonFlexContainer"><button type="button" id="advanceButton">Next</button></div>';

    var html = '<style id="jspsych-boxTask-css"></style>';
    html += '<div id="topHalf" style="position:relative;width:800px;height:145px;margin-top:20px;">';
    html += '<div id="instructionsContainer" style="position:absolute;width:100%;bottom:0;">';
    html += '<span id="instructions"></span>';
    html += '<div id="buttonContainer">'+advanceButton+'</div></div></div>';
    html += '<div id="estimateSketchContainer" class="container"></div>';
    html += '<div id="mainSketchContainer" class="container"></div>';

    display_element.innerHTML = html;

    if( !trial.sequential ) {
      //limit choices to whatever is lowest out of: number of beads in urn and however many beads they could draw without getting a negative bonus
      if (trial.incentive.cost > 0){
        var limit = Math.min(trial.boxCount, trial.incentive.base/trial.incentive.cost);
      } else {
        var limit = trial.beadCount;
      }
      var chooseNInput = '<input type="text" id="chooseNInput" name="chooseNInput" size="3" placeholder="1-'+limit+'"></input>';
      var chooseNAlertMessage = "Please enter a number between 1 and " + limit;
      $('#instructions').after(chooseNInput);
      $('#chooseNInput').hide();
    }

    // style the html

    $('.container').css({
      'width': '800px'
    });

    $('#instructionContainer').css({
      'height': '110px',
      'margin-top': '20px'
    });

    $('#mainSketchContainer').css({
      'height': '400px',
      'border': '1px solid black',
    });

    $('#buttonContainer').css({
      'height': '26px',
    });


    if( trial.graded ) {
      $('#estimateSketchContainer').css('height', '105px');
    }

    // create object for storing data
    var trial_data = {};

  /*
  Objects for transitioning between trial stages
  */

    var trialGraph = {

    /*
    This object's properties are names of trial stages. In turn, the stages' properties include:
    successor: which trial stage is coming up next
    button: what html to add to buttonContainer
    onClick: what to do when the button is clicked during this stage
    setup: functions to run at the start of this stage
    */

      'instructions': {

        successor: function(){

          if( instructions.index < instructions.tags.length-1 ){
            return 'instructions';
          } else {
            if( trial.graded ){
              return 'confidence'
            } else {
              if( trial.sequential ){
                return 'open'
              } else {
                return 'chooseN'
              }
            }
          }

        },
        button: "<button type='button' id='advanceButton'>Next</button>",
        instructions: '',
        onClick: function(e){

          switch( instructions.tags[instructions.index] ){

            case 'tint':

              trialInfo.advance();

            break;

            case 'shuffle1':

              moving = true;

            break;

            case 'hide':

              trialInfo.advance();

            break;

            case 'color':

              trialInfo.advance();

            break;

            case 'shuffle2':

              moving = true;

            break;

          }
        },
        setup: function(){

          this.instructions = 'Click to ' + instructions.step();

        }
      },

      'open': {
        successor: function(){

          if( trial.graded ){
            return 'confidence';
          } else if( openBoxes == trial.openCount ){
              return 'decide';
            } else if( trial.sequential ){
                return 'chooseAction'
              } else {
                return 'open';
              }
        },
        button: '',
        instructions: 'Click a box to open it and see its color',
        onClick: function(e){

        },
        setup: function(){

          initialRating = false;

        }
      },

      'chooseN': {
        successor: function(){return 'open'},
        button: "<button type='button' id='advanceButton'>Next</button>",
        instructions: function(){
                  if( trial.incentive.cost > 0 ){
                    return 'How many boxes would you like to open before deciding what the majority color is? That number of boxes will then be opened one by one. The first draw is free, but each subsequent draw decreases your bonus for guessing right by $'+trial.incentive.cost + '. '
                  } else{
                    return 'How many boxes would you like to open before deciding what the majority color is? That number of boxes will then be opened one by one. '
                  }
                },
        onClick: function(e){

          var nInput = $('#chooseNInput').val().replace(/[^\w]/gi, ''); // get rid of spaces, punctuation etc.

          if( nInput.length > 0 ){
            if( nInput.match('[^0-9]') ){

              alert("Please enter numbers only.");

            } else {

              nInput = parseInt(nInput, 10);
              trial_data.chosenN = nInput;
              trial.openCount = nInput;
              $('#chooseNInput').hide();

              // if parameter trial.colorOrder is given, but isn't long enough,
              // fill it up with random draws to equal the number of draws chosen by the participant

              if( trial.colorOrder.length > 0 & trial.colorOrder.length < nInput ){
                var extra = nInput - trial.colorOrder.length;
                var extraDraws = ratioArray(trial.colorRatio, extra);
                trial.colorOrder = trial.colorOrder.concat(extraDraws);
                trial_data.colorOrder = trial.colorOrder
              }

              if( trial.incentive.base > 0 ){
                currentBonus = trial.incentive.base - Math.round(100*(nInput-1)*trial.incentive.cost)/100; //first one is free
              }
              trialInfo.advance();

            }
          } else {

            alert("Please enter a number between 1 and " + trial.boxCount);

          }

        },
        setup: function(){

          $('#chooseNInput').show();

        }
      },

      'confidence': {
        successor: function(){
          if( initialRating ){
            if( trial.sequential ){
              return 'open';
            } else {
              return 'chooseN';
            }
          } else if( openBoxes == trial.openCount ){
                return 'decide';
              } else if( trial.sequential ){
                  return 'chooseAction'
                } else {
                  return 'open';
                }
        },
        button: "<button type='button' id='advanceButton'>Next</button>",
        instructions: function(){
          if( initialRating ){
            return confidenceInstructions;
          } else {
            return confidenceInstructions2;
          }
        },
        onClick: function(e){

          if( thumbMoved == true | initialRating ){
            trialInfo.advance();
            trial_data.confidenceDegree.push(currentConfidenceDegree);
            $('#instructions').css('font-size', '18px');
            thumbMoved = false;
            sliderReady = false;
          } else {
            alert("Please move the slider to reflect how your confidence has changed after the previous box was opened.")
          }

        },
        setup: function(){

          $('#instructions').css('font-size', '15px');

        }
      },

      'chooseAction': {
        successor: function(e){
          if( buttonChoice == 'openButton' ){
            return 'open';
          } else if( buttonChoice == 'decideButton' ){
            return 'decide';
          }
        },
        button: '<button type="button" id="openButton">Open another box</button><button type="button" id="decideButton">Decide what the majority color is</button>',
        instructions: function(){
          if( trial.incentive.cost > 0){
            return 'Choose one of these options. If you decide and get the majority color right, your bonus would be $' + currentBonus + '. If you would like to open another box before deciding, your potential bonus decreases by $' + trial.incentive.cost
          } else {
              return 'Choose one of these options:'
          }
        },
        onClick: function(e){
          buttonChoice = e.target.id;
          if( buttonChoice == 'openButton' & trial.incentive.cost > 0 ){
            currentBonus = Math.round((currentBonus - trial.incentive.cost)*100)/100;
          }
          trialInfo.advance();
        },
        setup: function(){

        }
      },

      'decide': {
        successor: '',
        button: function(){
          return '<button type="button" id="chooseLeft" class="color_1 chooseButton"></button><button type="button" id="chooseRight" class="color_2 chooseButton"></button>';
        },
        instructions: 'What do you think the majority color is?',
        onClick: function(e){

          var choice;
          buttonChoice = e.target.id;
          if( buttonChoice == 'chooseLeft' ){
            choice = 0;
          } else if( buttonChoice == 'chooseRight') {
            choice = 1;
          } else {
            choice = 'NA';
            console.log('Button choice not recorded');
          }
          var end_time = Date.now();
          trial_data.rt = end_time - start_time;
          trial_data.choice = choice;
          trial_data.choicesToDecision = openBoxes;
          if( trial.colorOrder.length > 0 ){
            trial_data.colorOrder = trial.colorOrder;
          }
          trial_data.openCount = trial.openCount;
          trial_data.colorRatio = trial.colorRatio;
          trial_data.boxCount = trial.boxCount;
          trial_data.record = trial.record;
          trial_data.graded = trial.graded;
          trial_data.sequential = trial.sequential;
          trial_data.incentive = trial.incentive;
          trial_data.bonus = currentBonus;
          trial_data.side = trial.side;

          console.log(trial_data);

          // clear display
          display_element.innerHTML = '';
          mainSketch.remove();
          gradedEstimateSketch.remove();
          jsPsych.finishTrial(trial_data);


        },
        setup: function(){

        }
      },
    }

    var trialInfo = {

      /*
      This object contains data about the current state of the trial, and handles transition between stages
      */

        stage: null,
        data: null,
        initialize: function(x){
          this.stage = x;
          this.populate();
          this.data.setup();
          this.updateInstructions();
        },
        populate: function(){
          this.data = trialGraph[this.stage];
        },
        advance: function() {
          var nextStage = this.data.successor();
          instructions.index+=1;
          this.stage = nextStage;
          this.populate();
          this.data.setup();
          this.updateInstructions();
          this.updateButtons();
        },
        updateButtons: function() {
          $('#buttonContainer').html(this.data.button);
        },
        updateInstructions: function(){
          currentInstr = $('#instructions')
          $('#instructions').html(this.data.instructions)
        },
    };

    var instructions = {
      /*
      This object contains data about the instructions displayed during trial setup
      */
      instructionSet: ['divide these boxes into two <b>groups</b> in the ratio ' + Math.round(trial.colorRatio*100) + ':' + Math.round((1-trial.colorRatio)*100),
                        'shuffle the boxes',
                        'cover the boxes to hide the groups',
                        "secretly color the boxes with two different <b>colors</b>: <span class='color_1'>this</span> and <span class='color_2'>this</span>. One will be used for the majority group, and the other for the minority one, but <b>you won't know which!</b>",
                        'shuffle the boxes once more'],
      tags: ['tint', 'shuffle1', 'hide', 'color', 'shuffle2'],
      index: 0,
      step: function(){
        return this.instructionSet[this.index];
      },

    };

    // Select a starting point in trialGraph

    trialInfo.initialize('instructions');

/*
Trial functions
*/

    function rgbString(colorTriple){
      //converts a triple (0,1,2) into a string 'rgb(0,1,2)'
      var colorString = 'rgb('+colorTriple.join()+')'
      return colorString;
    }

    var complementaryColor = function(RGBcolor){
      // Find the complementary color of an RGB color in format [red, green, blue]

      var newColors = [];
      RGBcolor.forEach(function(element) {
        newColors.push(255-element);
      });
      return newColors;
    };

    function ratioArray(colorRatio, N, direction) {
      // Create an array of 0s/1s in the given colorRatio with length N. direction=1 allows for flipping the ratio (e.g. 60:40 vs 40:60).

      var draws = [];

      if( direction === undefined ){
        direction = 0
      }

      var cutoff = Math.round(colorRatio*N);

      var majority = [0, 1];
      var minority = [1, 0];

      for (var i = 0; i < N; i++){
        if (i < cutoff) {
          draws.push(majority[direction]);
        } else {
          draws.push(minority[direction]);
        }
      }
      return draws;
    };

    function shuffle(unshuffled){
      // shuffle an array

      var shuffled = [];
      var N = unshuffled.length
      for( var i = 0; i < N; i++ ){
        var index = Math.floor(Math.random() * (unshuffled.length));
        var newValue = unshuffled[index];
        shuffled.push(newValue);
        unshuffled.splice(index, 1);
      }
      return shuffled;
    };


/*
Trial variables
*/

    var boxset;
    var buttonChoice;

    // constants

    var confidenceInstructions = "Rate your initial <b>confidence</b> about what you think the majority color is. ";
    confidenceInstructions += "In the middle (50:50) means you are really unsure - you think there's a 50:50 chance either color could be the majority. ";
    confidenceInstructions += "Moving right means you're more confident it's the color on the right; ";
    confidenceInstructions += "moving left means you're more confident it's the color on the left. ";
    confidenceInstructions += "Moving completely to either extreme would mean you're 100% certain that is the majority color. ";
    confidenceInstructions += "Once you've given a rating, click to proceed.";
    var confidenceInstructions2 = "<b>Update</b> your <b>confidence</b> about what you think the majority color is. ";
    confidenceInstructions2 += "In the middle (50:50) means you think there's a 50:50 chance it could be either one. ";
    confidenceInstructions2 += "Moving it to either side means you're more confident it's that color that's the majority.";

    var openBoxes = 0;
    var sketchMargin = 15;
    var strokeWeight = 1;
    var sketchWidth = $('#mainSketchContainer').css('width').match(/\d+/);
    var mainSketchHeight = $('#mainSketchContainer').css('height').match(/\d+/);
    var estimateSketchHeight = $('#estimateSketchContainer').css('height').match(/\d+/);
    var boxGap = 15; // gap between 2 boxes
    var boxRowLength = Math.ceil(Math.pow(trial.boxCount, 0.5)); // how many boxes per row
    var boxWidth = (sketchWidth-2*sketchMargin-boxGap*(boxRowLength-1)-2*boxRowLength*strokeWeight)/boxRowLength;
    var boxHeight = (mainSketchHeight-2*sketchMargin-boxGap*(boxRowLength-1)-2*boxRowLength*strokeWeight)/boxRowLength;
    var sketchSizeRatio = estimateSketchHeight/mainSketchHeight;
    var openBoxes = 0;
    var boxSpeed = 0.04;
    var boxAccelleration = 0.01;
    var tints = [50, 200];
    var moving = false;
    var sliderReady = false;
    var currentConfidenceDegree = 50;
    var thumbMoved = false;
    var initialRating = true;

    // variables that depend on trial.info parameters

    var colors = [trial.firstColor, complementaryColor(trial.firstColor)];

    var cssString = '.color_1 {background-color: '+ rgbString(colors[0])+'}';
    cssString += '.color_2 {background-color: '+ rgbString(colors[1])+'}';
    cssString += '.right_answer {background-color: '+ rgbString(colors[trial.rightAnswer])+'}';
    cssString += '.chooseButton {padding: 15px 32px}';
    $('#jspsych-boxTask-css').html(cssString);

    if ( trial.incentive.base > 0 ){
      var currentBonus = trial.incentive.base;
    }

    if( trial.graded ){
      trial_data.confidenceDegree = []
    }

    if( trial.colorOrder.length > 0){
      // Make sure colorOrder.length (if given) and openCount are the same

      if( trial.colorOrder.length > trial.openCount ){
        trial.openCount = trial.colorOrder.length;
      } else if( trial.colorOrder.length < trial.openCount ){
        var extra = trial.openCount - trial.colorOrder.length;
        var extraDraws = ratioArray(trial.colorRatio, extra);
        trial.colorOrder = trial.colorOrder.concat(extraDraws);
      }

      trial_data.colorOrder = trial.colorOrder
    } else {
      trial_data.colorOrder = [];
    }

/*
 P5.js Pseudo-classes for sketches
*/

    // A slider for giving a graded confidence estimate
    function Scrollbar(sketch, xPosition, yPosition, width){

      this.sketch = sketch;
      this.startX = sketch.width*xPosition;
      this.thumbX = sketch.width*xPosition;
      this.textX = sketch.width*xPosition;
      this.thumbY = sketch.height*yPosition;
      this.thumbColor = [128, 128, 128];
      this.valueLabel = '50:50';
      this.overThumb = false;

      // var over = false;
      var confidence = 0;

      this.display = function() {

        sketch.rectMode(sketch.RADIUS)

        // track
        sketch.fill(200);
        sketch.stroke(150);
        sketch.rect(sketch.width*xPosition, this.thumbY, 198, 5);

        // thumb
        sketch.fill(this.thumbColor);
        sketch.stroke(40);
        sketch.rect(this.thumbX,sketch.height*yPosition, 5, 8);

        // label
        sketch.fill(0);
        sketch.strokeWeight(0);
        sketch.stroke(0);
        sketch.textAlign(sketch.CENTER);
        sketch.text(this.valueLabel,this.textX,this.thumbY-20);
        sketch.strokeWeight(1);

      }

      // move thumb if mouse drags thumb
      this.drag = function() {

        if( this.overThumb ) {

          if( sketch.mouseX < 600 & sketch.mouseX > 200 ){

            this.thumbX = sketch.mouseX
            this.updateThumb();

          } else {

            if( sketch.mouseX < 200 ) {
              this.thumbX = 200;
              this.updateThumb();
            } else {
              this.thumbX = 600;
              this.updateThumb();
            }

          }
        }
      }

      // move the slider thumb if mouse clicked on track
      this.move = function() {

        var overTrack = false;

        if( sketch.mouseX > 200 & sketch.mouseX < 600 & sketch.abs(sketch.mouseY-this.thumbY) < 20 ) {

          this.thumbX = sketch.mouseX;
          this.updateThumb();

        }
      };

      this.stop = function() {

        this.overThumb = false;
        this.value = this.thumbX;

      };

      this.clicked = function() {

        if( sketch.abs(sketch.mouseX-this.thumbX) < mouseMargin & sketch.abs(sketch.mouseY-this.thumbY) < mouseMargin ){
          this.overThumb = true;
        }

      }

      // adjust the thumb color to reflect similarity to the majority bead color
      this.updateThumb = function() {

        thumbMoved = true;

        var confidenceDegree = Math.round(50+(this.thumbX-this.startX)/4);
        var confidenceLabel = sketch.abs(100-confidenceDegree) + ':' + confidenceDegree;

        // adjust thumb color to reflect degree of confidence
        var confidenceProportion = sketch.abs(this.thumbX-this.startX)/200;
        if( this.thumbX > this.startX ){
          var confidenceDirection = 1;
        } else {
          var confidenceDirection = 0;
        }
        var targetColor = colors[confidenceDirection]
        var newColor = []
        var colorDifference = targetColor.forEach(function(e,i){
          newColor.push(sketch.abs(128 + Math.floor(confidenceProportion*(e-128))));
        })

        this.thumbColor = newColor;

        // make the label a bit sticky around 50:50
        if( sketch.abs(confidenceDegree-50) < 2 ){
          this.valueLabel = '50:50';
        } else {
          this.valueLabel = confidenceLabel;
        }

        this.textX = this.thumbX;

        // store value
        currentConfidenceDegree = confidenceDegree;

      }
    };


    function Box(sketch, id, anchor, index2, index3, unshuffledColor, shuffledColor){

      this.sketch = sketch;
      this.id = id;
      this.anchor = anchor;
      this.index2 = index2;
      this.index3 = index3;
      this.coordinates = translateIndex(this.id);
      this.coordinates2 = translateIndex(this.index2);
      this.coordinates3 = translateIndex(this.index3);
      this.position = translateCoordinates(this.coordinates);
      this.unshuffledColor = unshuffledColor;
      this.shuffledColor = shuffledColor;
      this.open = false;
      this.previouslyOpened = false;
      this.moved = 0;

      function translateIndex(index){
        // translates an index in range 0..N^2 to a (column, row) coordinate in a set of NxN boxes
        return sketch.createVector(index%boxRowLength, Math.floor(index/boxRowLength));

      }

      function translateCoordinates(coordinates) {
        // translates a (column, row) coordinate into an (x, y) position in the sketch
        var xOffset = sketchMargin + coordinates.x*(boxWidth+boxGap+strokeWeight);
        var yOffset = sketchMargin + coordinates.y*(boxHeight+boxGap+strokeWeight);
        var position = coordinates.add(sketch.createVector(xOffset,yOffset));
        return position;
      }

      this.display = function(){

        sketch.rectMode(sketch.CORNER)

        if( trialInfo.stage=='instructions' ){

          switch(instructions.tags[instructions.index]){

            case 'tint':

              sketch.fill(255);
              sketch.rect(this.position.x, this.position.y, boxWidth, boxHeight);

            break;

            case 'shuffle1':

              sketch.fill(tints[this.unshuffledColor]);
              sketch.rect(this.position.x, this.position.y, boxWidth, boxHeight);

            break;

            case 'hide':

              sketch.fill(tints[this.unshuffledColor]);
              sketch.rect(this.position.x, this.position.y, boxWidth, boxHeight);

            break;

            case 'color':

              sketch.fill(200);
              sketch.stroke(150);
              sketch.rect(this.position.x, this.position.y, boxWidth, boxHeight);

            break;

            case 'shuffle2':

              sketch.fill(200);
              sketch.stroke(150);
              sketch.rect(this.position.x, this.position.y, boxWidth, boxHeight);

            break;
          }

        } else {

          if( sketch.parentId == 'estimateSketchContainer'){
            sketch.strokeWeight(0);
            sketch.fill(colors[this.unshuffledColor])
          } else {

            sketch.strokeWeight(1);
            sketch.stroke(150);

            if( this.open ){

              sketch.fill(colors[this.shuffledColor]);

            } else {
              sketch.fill(200);
            }

          }
          sketch.rect(this.position.x, this.position.y, boxWidth, boxHeight);
        }
      };

      this.plotCourse = function(){

        // identify destination
        if( instructions.tags[instructions.index] == 'shuffle1' ){
          this.destination = translateCoordinates(this.coordinates2.copy());
        } else {
          this.moved = 0;
          this.destination = translateCoordinates(this.coordinates3.copy());
        }

        // pick random control points near the start and end points
        var random1 = sketch.createVector(Math.random()*60-30, Math.random()*60-30);
        var random2 = sketch.createVector(Math.random()*10-5, Math.random()*10-5);
        this.control1 = this.position.copy().add(random1);
        this.control2 = this.destination.copy().add(random2);
      };

      this.move = function(){

        // move along bezier points
        if(this.moved <= 1){
          var x = sketch.bezierPoint(this.position.x, this.control1.x, this.control2.x, this.destination.x, this.moved);
          var y = sketch.bezierPoint(this.position.y, this.control1.y, this.control2.y, this.destination.y, this.moved);
          this.position = sketch.createVector(x, y);
        }
      };

      this.update = function(){
        this.moved = Math.round((this.moved+=boxSpeed)*100)/100; //round to 2 decimal places
      };

      this.tryOpen = function(){
        if(sketch.mouseX > this.position.x & sketch.mouseX < this.position.x + boxWidth & sketch.mouseY > this.position.y & sketch.mouseY < this.position.y + boxHeight ){

          if( trial.colorOrder.length != 0){
              this.shuffledColor = trial.colorOrder[openBoxes]
          }

          this.open = true;
          openBoxes += 1;
          if( trial.colorOrder.length == 0 ){
            trial_data.colorOrder.push(this.shuffledColor);
          }

          // if trial.record  = false, shut previous box
          if( !trial.record ){
            boxset.shut(this.id);
          }
          trialInfo.advance();
        }
      }
    };


    function Boxset(sketch, x, y, direction){

      this.sketch = sketch;
      this.anchor = sketch.createVector(x, y);
      this.direction = direction;
      this.boxes = [];

      var boxColors = ratioArray(trial.colorRatio, trial.boxCount, this.direction);
      var boxColorsShuffled = sketch.shuffle(boxColors);

      // to animate a set of boxes shuffling to new locations (such that each location only ever has one box), derive locations from shuffled arrays of unique IDs in the range 0..trial.boxCount
      var position1 = Array.apply(null, Array(trial.boxCount)).map(function (_, i) {return i;}); //create a range 0 .. trial.boxCount
      var position2 = sketch.shuffle(position1);
      var position3 = sketch.shuffle(position1);

      for (var i = 0; i < trial.boxCount; i++) {
        this.boxes[i] = new Box(sketch, i, this.anchor, position2[i], position3[i], boxColors[i], boxColorsShuffled[i]);
      }

      this.display = function(){

        for (var i = 0; i < this.boxes.length; i++) { //
          this.boxes[i].display();
        }

      };

      this.plotCourse = function(){

        for (var i = 0; i < this.boxes.length; i++) { //
          this.boxes[i].plotCourse();
        }

      }

      this.update = function(){

        for (var i = 0; i < this.boxes.length; i++) { //
          this.boxes[i].update();
        }

      }

      this.move = function(){

        for (var i = 0; i < this.boxes.length; i++) { //
          this.boxes[i].move();
        }

      };

      this.moveFinished = function(){

        var finished = 0;
        for (var i = 0; i < this.boxes.length; i++) { //
          if( this.boxes[i].moved >= 1){
            finished+=1
          }
        }

        if( finished == this.boxes.length ){
          return true;
        } else {
          return false;
        }

      };

      this.open = function(){
        for (var i = 0; i < this.boxes.length; i++) { //
          this.boxes[i].tryOpen()
        }
      };

      this.shut = function(id){
        this.boxes.forEach(function(e){
          if(e.id != id){
            e.open = false;
          }
        })

      }


    };

/*
P5 sketches:
Setup sketches in "instance mode" (vs. default "global mode").
This is needed for (a) integrating p5 with the jsPsych-generated html page and (b) allowing multiple sketches per page (if trial includes graded estimation)
See here for overview of instance mode: https://github.com/processing/sketch.js/wiki/sketch.js-overview#instantiation--namespace
The following actually uses a short-cut version of instance mode, as described here: https://forum.processing.org/two/discussion/17332/using-instance-mode-to-create-multiple-sketches-on-the-same-page
*/

    var mainSketch = new p5(function( sketch ) {

      // sketch variables



      // sketch functions and pseudo-classes

      // sketch setup

      sketch.setup = function(){

        var sketchCanvas = sketch.createCanvas(sketchWidth,mainSketchHeight);
        sketch.background(255);
        sketch.fill(255, 255, 255, 0);
        boxset = new Boxset(sketch, 0, 0);
        sketch.parentId = $(sketch.canvas).parent().attr('id')

      };

      // draw sketch

      sketch.draw = function(){

        sketch.background(255);
        sketch.stroke(0);

        if( trialInfo.stage == 'instructions' ){

          // case 'instructions':

            switch( instructions.tags[instructions.index] ){

              case 'tint':

              break;

              case 'shuffle1':

                if( moving == true){
                  boxset.update();
                  boxset.move();
                }

                if( boxset.moveFinished() ){
                  moving = false
                  trialInfo.advance();
                }

              break;

              case 'hide':

              break;

              case 'color':

                sketch.background(200, 200, 200, 255);

              break;

              case 'shuffle2':

                sketch.background(200);
                if( moving == true){
                  boxset.update();
                  boxset.move();
                }

                if( boxset.moveFinished() ){
                  moving = false
                  trialInfo.advance();
                }

              break;
            };

          } else {

            sketch.background(200);
            sketch.stroke(200);

          }

        boxset.display();

      }

      sketch.mouseClicked = function(){

        switch( trialInfo.stage ){
          case 'instructions':

            boxset.plotCourse();

          break;

          case 'open':

            boxset.open();

          break;
        }

      }


    }, 'mainSketchContainer');


/*
If graded confidence estimates are required, create additional sketch to display beadsets on either side of a slider input
*/

    var gradedEstimateSketch = new p5(function( sketch ){

      var anchorLeftBoxset;
      var anchorRightBoxset;
      var slider;

      sketch.parentId = $(sketch.canvas).parent().attr('id');

      sketch.setup = function(){

        var sketchCanvas = sketch.createCanvas(sketchWidth,estimateSketchHeight);

        sketch.background(255);
        sketch.fill(255);

        sketch.parentId = $(sketch.canvas).parent().attr('id');

        anchorLeftBoxset = new Boxset(sketch, 0, 0, 0);
        anchorRightBoxset = new Boxset(sketch, 0, 0, 1);
        slider = new Scrollbar(sketch, 0.5, 0.5, sketchWidth)

      };

      sketch.draw = function(){

        sketch.background(255);

        if( trialInfo.stage == 'confidence' ){

          slider.display();

          sketch.push();
          sketch.translate(180,20);
          sketch.scale(-1,1);
          sketch.scale(sketchSizeRatio*0.7);
          anchorLeftBoxset.display();
          sketch.pop();

          sketch.push();
          sketch.translate(620,20);
          sketch.scale(sketchSizeRatio*0.7);
          anchorRightBoxset.display();
          sketch.pop();

        }

      };

      sketch.mouseDragged = function() {

        slider.drag();

      };

      sketch.mouseReleased = function() {

        slider.stop();

      };

      sketch.mouseClicked = function() {

        slider.move();

      }

      sketch.mousePressed = function() {

        slider.clicked();

      }

    }, 'estimateSketchContainer');

    // start timer once sketches are loaded

    var start_time = Date.now();

/*
Inputs
*/

    $("#buttonContainer").on("click", "button", function(e){

      trialInfo.data.onClick(e);

    });

    $("#chooseNInput").keydown(function(e){
      if( e.keyCode == 13 & trialInfo.stage == 'chooseN' ){
        trialInfo.data.onClick(e);
      }
    });


  };

  return plugin;
})();
