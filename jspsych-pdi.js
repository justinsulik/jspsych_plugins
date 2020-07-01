/*
Description: jsPsych plugin for the Peters Delusion Inventory (PDI).
Preferably load p5.min.js in the main experiment page (otherwise it will be downloaded from cdnjs.cloudflare.com)

Author: Justin Sulik
Contact:
 justin.sulik@gmail.com
 justinsulik.com,
 twitter.com/justinsulik
 github.com/justinsulik
*/

jsPsych.plugins["pdi"] = (function() {

  var plugin = {};

  plugin.info = {
    name: "pdi",
    parameters: {
      followUp: {
        type: jsPsych.plugins.parameterType.BOOL, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: true,
        pretty_name: 'Follow up questions',
        description: 'If true, for every "yes" response, the participant is asked follow up questions about distress, preoccupation and conviction'
      },
      short: {
        type: jsPsych.plugins.parameterType.BOOL,
        default: true,
        pretty_name: 'Short inventory',
        description: 'If true, the short PDI-21 is used; if false the whole 40-item inventory'
      },
      randomizeOrder: {
        type: jsPsych.plugins.parameterType.BOOL,
        default: true,
        pretty_name: 'Randomize order',
        description: 'If true, the order of items is randomized'
      },
      attentionCheck: {
        type: jsPsych.plugins.parameterType.BOOL,
        default: true,
        pretty_name: 'Attention check',
        description: 'If true, include an attention check question'
      },
      includeCAPE: {
        type: jsPsych.plugins.parameterType.BOOL,
        default: false,
        pretty_name: 'Include CAPE',
        description: 'If true, include questions from the CAPE instrument'
      }
    }
  };

  plugin.trial = function(display_element, trial) {

    // check if p5 script is loaded
    if (window.p5){
        console.log('p5 already loaded...');
    } else {
      $.ajax({
          url: "https://cdnjs.cloudflare.com/ajax/libs/p5.js/0.5.16/p5.min.js",
          dataType: "script",
          success: function() {
            console.log("p5 loaded...");
          }
      });
    }

/*
trial variables and functions
*/
    var questionCounter = 0;
    var displayed = false;
    var sliderChecker = [0, 0, 0];
    var sliders = {};
    var trial_data = {};

    var instructions;
    var currentSketch;
    var response;

    function shuffle(unshuffled){
      // shuffle an array
      var shuffled = [];
      var N = unshuffled.length;
      for( var i = 0; i < N; i++ ){
        var index = Math.floor(Math.random() * (unshuffled.length));
        var newValue = unshuffled[index];
        shuffled.push(newValue);
        unshuffled.splice(index, 1);
      }
      return shuffled;
    }

    var questions;
    if( trial.short ){
      questions = [
        'Do you ever feel as if people seem to drop hints about you or say things with a double meaning?',
        'Do you ever feel as if things in magazines or on TV were written especially for you?',
        'Do you ever feel as if some people are not what they seem to be?',
        'Do you ever feel as if you are being persecuted in some way?',
        'Do you ever feel as if there is a conspiracy against you?',
        'Do you ever feel as if you are, or destined to be someone very important?',
        'Do you ever feel that you are a very special or unusual person?',
        'Do you ever feel that you are especially close to God?',
        'Do you ever think people can communicate telepathically?',
        'Do you ever feel as if electrical devices such as computers can influence the way you think?',
        'Do you ever feel as if you have been chosen by God in some way?',
        'Do you believe in the power of witchcraft, voodoo or the occult?',
        'Are you often worried that your partner may be unfaithful?',
        'Do you ever feel that you have sinned more than the average person?',
        'Do you ever feel that people look at you oddly because of your appearance?',
        'Do you ever feel as if you had no thoughts in your head at all?',
        'Do you ever feel as if the world is about to end?',
        'Do your thoughts ever feel alien to you in some way?',
        'Have your thoughts ever been so vivid that you were worried other people would hear them?',
        'Do you ever feel as if your own thoughts were being echoed back to you?',
        'Do you ever feel as if you are a robot or zombie without a will of your own?'
      ];
    } else {
      questions = [
        'Do you ever feel as if you are under the control of some force or power other than yourself?',
        'Do you ever feel as if you are a robot or zombie without a will of your own?',
        'Do you ever feel as if you are possessed by someone or something else?',
        'Do you ever feel as if your feelings or actions are not under your control?',
        'Do you ever feel as if someone or something is playing games with your mind?',
        'Do you ever feel as if people seem to drop hints about you or say things with a double meaning?',
        'Do you ever feel as if things in magazines or on TV were written especially for you?',
        'Do you ever think that everyone is gossiping about you? ',
        'Do you ever feel as if some people are not what they seem to be?',
        'Do things around you ever feel unreal, as though it was all part of an experiment?',
        'Do you ever feel as if someone is deliberately trying to harm you?',
        'Do you ever feel as if you are being persecuted in some way?',
        'Do you ever feel as if there is a conspiracy against you?',
        'Do you ever feel as if some organization or institution has it in for you?',
        'Do you ever feel, as if someone or something is watching you?',
        'Do you ever feel as if you have special abilities or powers?',
        'Do you ever feel as if there is a special purpose or mission to your life?',
        'Do you ever feel as if there is a mysterious power working for the good of the world?',
        'Do you ever feel as if you are or destined to be someone very important?',
        'Do you ever feel that you are a very special or unusual person?',
        'Do you ever feel that you are especially close to God?',
        'Do you ever think that people can communicate telepathically?',
        'Do you ever feel as if electrical devices such as computers can influence the way you think?',
        'Do you ever feel as if there are forces around you which affect you in strange ways?',
        'Do you ever feel as if you have been chosen by God in some way?',
        'Do you believe in the power of witchcraft, voodoo, or the occult?',
        'Are you often worried that your partner may be unfaithful?',
        'Do you ever think that you smell very unusual to other people?',
        'Do you ever feel as if your body is changing in a peculiar way?',
        'Do you ever think that strangers want to have sex with you?',
        'Do you ever feel that you have sinned more than the average person?',
        'Do you ever feel that people look at you oddly because of your appearance?',
        'Do you ever feel as if you had no thoughts in your head at all?',
        'Do you ever feel as if your insides might be rotting?',
        'Do you ever feel as if the world is about to end?',
        'Do your thoughts ever feel alien to you in some way?',
        'Have your thoughts ever been so vivid that you were worried other people would hear them?',
        'Do you ever feel as if your own thoughts were being echoed back to you?',
        'Do you ever feel as if your thoughts were blocked by someone or something else?',
        'Do you ever feel as if other people can read your mind?'
      ];
    }
    if( trial.attentionCheck ){
      questions = questions.concat(['Have you ever seen a purple unicorn? Respond yes and set all the sliders to maximum value.']);
    }
    if (trial.includeCAPE ){
      questions = questions.concat(['Do you ever feel as if the thoughts in your head are being taken away from you?',
      'Do you ever feel as if the thoughts in your head are not your own?',
      'Do you ever feel as if you are under the control of some force or power other than yourself?',
      'Do you ever hear voices when you are alone?',
      'Do you ever hear voices talking to each other when you are alone?',
      'Do you ever feel as if a double has taken the place of a family member, friend or acquaintance?',
      'Do you ever see objects, people or animals that other people cannot see?']);
    }

    var saveResponses = function(){
      var currentQuestion = questionOrder[questionCounter];
      trial_data[currentQuestion] = {
        'response': response,
        'order': questionCounter-1
      };
      if( trial.followUp & response == 'yes' ){
        var followUp = {};
        for( var i = 0; i < followUpPrompts.length; i++ ){
          var slider = sliders[i].sketch.slider;
          var dataRating = ((slider.thumbX-slider.offset)/slider.sliderWidth).toFixed(2);
          followUp[i] = dataRating;
        }
        trial_data[currentQuestion].followUp = followUp;
      }
    };

    var addSliders = function(){

      followUpPrompts.forEach(function(e,i){
        let sliderObject = {
          id: e,
          order: i,
          sketch: new p5(function( sketch ) {
            // var slider;
            var canvas;
            var backgroundColor;

            sketch.setup = function(){
              backgroundColor = 'white';
              sketch.offset = 27; //allow space on either end of slider track
              sketch.trackwidth = 600;
              sketch.over = false;
              canvas = sketch.createCanvas(sketch.trackwidth+sketch.offset*2, 50);
              sketch.background(backgroundColor);
              sketch.id = i;
              sketch.slider = new Scrollbar(sketch, 0.5,0.7, sketch.trackwidth, 8, i);
            };

            sketch.draw = function(){

              sketch.focus();

              backgroundColor = function(){
                if(sketch.over & displayed == true){
                  return sketch.color('#EFF5FB');
                } else {
                  return sketch.color('white');
                }
              };

              sketch.background(backgroundColor());

              if( displayed == true ){
                sketch.slider.display();
              }
            };

            sketch.focus = function() {
              var over = $('#rating_'+sketch.id).attr('over');
              if( over == 'true' ){
                sketch.over = true;
              } else {
                sketch.over = false;
              }
            };

            sketch.mouseDragged = function() {
                  sketch.slider.drag();
            };

            sketch.mouseClicked = function() {
                sketch.slider.move();
            };

            sketch.mousePressed = function() {
                if(sketch.over){
                  currentSketch = sketch.id;
                }
                sketch.slider.move();
            };

          }, 'slider_'+i)
        };
        sliders[i] = sliderObject;
      });

    };



/*
trial setup
*/

    // shuffle order of explanations
    var questionOrder = [];
    questions.forEach(function(e,i){
      questionOrder.push(i);
    });
    if( trial.randomizeOrder ){
      var order_original = questionOrder;
      questionOrder = shuffle(order_original);
    }




    // set up basic html

    var html = '<style id="jspsych-PDI-css"></style>';
    html += '<div id="questionContainer" class="container"><div id="questionContent" class="top text content"></div></div>';
    html += '<div id="responseContainer" class="container"><div id="responseContent" class="top text"></div></div>';
    html += '<div id="buttonContainer" class="container"><div id="buttonContent" class="top text"></div></div>';
    html += '<div id="ratingsContainer" class="container"><div id="ratingsContent" class="bottom content"></div></div>';

    display_element.innerHTML = html;

    if( trial.followUp ){
      $('#ratingsContainer').prepend('<div id="furtherInstructions" class="bottom text"></div>');
    }

    // style that doesn't depend on content

    $('.container').css({
      'width': '800px',
    });
    $('.content').css({
      'display': 'flex',
      'flex-direction': 'column',
      'height': '100%',
      'width': '100%',
      // 'font-size': '14px',
      'font-weight': '200'
    });
    $('#questionContainer').css({'height': '50px'});
    $('#ratingsContainer').css({'height': '350px'});
    $('#buttonContainer').css({'height': '50px'});
    $('#buttonContent').css({'width': '50px',
                             'margin': 'auto'});

    // style that depends on content

    var cssString = '.content.bottom > div {flex: 1 1 auto;}';
    cssString += '.invisible {display: none;}';
    cssString += '.rating.flexbox > p {line-height: 50%;}';
    $('#jspsych-PDI-css').html(cssString);

    // content

      // question

      $('#questionContent').html(questions[questionOrder[questionCounter]]);

      // response

      var noResponse = '<input type="radio" name="response" value="no"> No </input>';
      var yesResponse = '<input type="radio" name="response" value="yes"> Yes</input>';
      $('#responseContent').html(noResponse+yesResponse);

      // button

      var nextButton = '<button>Next</button>';

      // ratings

      var followUpPrompts = ["How distressing are these experiences?",
                            "How often do you think about them?",
                            "How true do you believe them to be?"];

      var followUpScales = [
          ["Not at all\ndistressing", "Hardly\ndistressing", "A little\ndistressing", "Somewhat\ndistressing", "Quite\ndistressing", "Very\ndistressing"],
          ["\nNever", "\nHardly ever", "\nNot often", "\nSometimes", "\nOften", "All the\ntime"],
          ["Completely\nuntrue", "Mostly\nuntrue", "Somewhat\nuntrue", "Somewhat\ntrue", "Mostly\ntrue", "Absolutely\ntrue"]];


      if( trial.followUp ){
        followUpPrompts.forEach(function(e,i){
          var p = '<p class="rating text" id="criterion_'+i+'"></p>';
          var slider = '<div class="rating slider" id="slider_'+i+'"></div>';
          $('#ratingsContent').append(
            '<div class="rating flexbox" id="rating_'+i+'">'+p+slider+'</div>'
          );

        });

        addSliders();

      }



/*
 p5 pseudo-classes
*/

    // A slider for giving a graded confidence estimate
    // Can be forced to constant sum [to do...]
    function Scrollbar(sketch, xPosition, yPosition, sliderWidth, sliderHeight, scaleNo, explOrder){

      this.sketch = sketch;
      this.scaleNo = scaleNo;
      this.explOrder = explOrder;
      this.overThumb = false;
      this.overTrack = false;
      this.thumbCreated = false;
      this.thumbColor = 70;
      this.thumbX = 0;
      this.background = 200;
      this.sliderWidth = sliderWidth;
      this.offset = sketch.offset;

      sketch.tickInterval = sliderWidth/(followUpScales[scaleNo].length-1);

      this.display = function() {

        sketch.rectMode(sketch.RADIUS);

        // labels
        if( sketch.over ){
          this.label();
        }

        // track
        sketch.fill(this.background);
        sketch.stroke(200);
        sketch.rect(sketch.width*xPosition, sketch.height*yPosition, sliderWidth/2, sliderHeight/2);

        // thumb
        if( this.thumbCreated ){
          sketch.fill(this.thumbColor);
          sketch.stroke(40);
          sketch.rect(this.thumbX,sketch.height*yPosition, 5, 8, 3, 3, 3, 3);
        }

      };

      this.label = function() {
        // console.log(scaleNo)
        // console.log(followUpScales[scaleNo])
        followUpScales[scaleNo].forEach(function(e,i){
          var tickX = sketch.offset+i*sketch.tickInterval;
          var tickY = sketch.height*yPosition-sliderHeight/2;
          sketch.stroke(110);
          sketch.line(tickX,tickY,tickX,tickY-5);
          sketch.textSize(10);
          sketch.fill(40);
          sketch.strokeWeight(0);
          sketch.textAlign(sketch.CENTER);
          sketch.text(e, tickX, tickY-22);
          sketch.strokeWeight(1);
        });
      };

      this.updateThumb = function() {
          this.thumbX = sketch.mouseX;
      };

      this.overTrack = function(){
        if( sketch.mouseX > sketch.offset & sketch.mouseX < sketch.offset+sliderWidth ){
          return true;
        } else {
          return false;
        }
      };

      this.move = function() {
        if( sketch.over & this.overTrack() ){
          this.updateThumb();

          if( !this.thumbCreated  & sketch.mouseY > 20 & sketch.mouseY < 60){
            this.thumbCreated = true;
            sliderChecker[this.scaleNo] = 1;
            var ratingsGiven = 0;
            for( var i = 0; i < sliderChecker.length; i++){
              ratingsGiven += sliderChecker[i];
            }
            if( ratingsGiven == sliderChecker.length ){
              $('#buttonContent').html(nextButton);
              $('#furtherInstructions').html('Click "Next" to proceed');
            }


          }
        }
      };

      this.drag = function() {
        if( sketch.over & this.overTrack() & currentSketch == this.scaleNo ){
          this.updateThumb();
        }
      };
    }

/*
Inputs
*/



    // record start time once trial is set up

    var start_time = Date.now();
    var timeSinceClicked = Date.now();

    // Inputs

    $( '.rating.flexbox' ).mouseenter( function(){

      if( displayed == true ) {
        $( this ).css('background', '#EFF5FB');
        $( this ).attr('over', true);
      }
    }).mouseleave( function(){
      $( this ).css('background', 'white');
      $( this ).attr('over', false);
    });

    $("#responseContainer").on("click", "input", function(e){

          response = e.target.value;

          if( response == 'yes' & trial.followUp ){

            $('#buttonContent').html('');
            $('#furtherInstructions').html('Use the scales below to answer each question');

            followUpPrompts.forEach(function(e,i){
              $('#criterion_'+i).html(e);
            });

            displayed = true;

          } else {

            if( displayed == true ){
              // rehide the ratings if 'no' selected
              displayed = false;
              followUpPrompts.forEach(function(e,i){
                $('#criterion_'+i).html('');
              });
            }

            $('#buttonContent').html(nextButton);
            $('#furtherInstructions').html('');

          }

    });

    $("#buttonContainer").on("click", "button", function(e){

      $('#buttonContent').html('');
      $('#furtherInstructions').html('');
      sliderChecker = [0, 0, 0];
      displayed = false;
      questionCounter+=1;
      $('#responseContent').html(noResponse+yesResponse);
      $('#questionContent').html(questions[questionOrder[questionCounter]]);
      followUpPrompts.forEach(function(e,i){
        $('#criterion_'+i).html('');
        sliders[i].sketch.slider.thumbCreated = false;
      });
      saveResponses();
      if( questionCounter == questions.length-1 ){
        console.log(trial_data);
        display_element.innerHTML = '';
        // end trial
        jsPsych.finishTrial(trial_data);
      }

    });



  };

  return plugin;
})();
