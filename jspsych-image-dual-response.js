/*
 * An update of jspsych-image-slider-response (by Josh de Leeuw) to include a dichotomous response (in addition to the slider)
 * a jspsych plugin for free response survey questions
 *
 */


jsPsych.plugins['image-dual-response'] = (function() {

  var plugin = {};

  jsPsych.pluginAPI.registerPreload('image-dual-response', 'stimulus', 'image');

  plugin.info = {
    name: 'image-dual-response',
    description: '',
    parameters: {
      stimulus: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'Stimulus',
        default: undefined,
        description: 'The image to be displayed'
      },
      min: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Min slider',
        default: 0,
        description: 'Sets the minimum value of the slider.'
      },
      max: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Max slider',
        default: 100,
        description: 'Sets the maximum value of the slider',
      },
      start: {
				type: jsPsych.plugins.parameterType.INT,
				pretty_name: 'Slider starting value',
				default: 50,
				description: 'Sets the starting value of the slider',
			},
      step: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Step',
        default: 1,
        description: 'Sets the step of the slider'
      },
      labels: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        pretty_name:'Labels',
        default: ['Extremely\nunsure', 'Quite\nunsure', 'Slightly\nunsure', 'Slightly\nsure', 'Quite\nsure', 'Extremely\nsure'],
        array: true,
        description: 'Labels of the slider.',
      },
      button_label: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Button label',
        default:  'Continue',
        array: false,
        description: 'Label of the button to advance.'
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt',
        default: null,
        description: 'Any content here will be displayed below the slider.'
      },
      stimulus_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Stimulus duration',
        default: null,
        description: 'How long to hide the stimulus.'
      },
      trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Trial duration',
        default: null,
        description: 'How long to show the trial.'
      },
      response_ends_trial: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Response ends trial',
        default: true,
        description: 'If true, trial will end when user makes a response.'
      },
      dichotomous_prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Dichotomous prompt',
        default: 'Did you see this person in stage 1?',
        description: 'Prompt asking for a dichotomous response.'
      },
      dichotomous_options: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'dichotomous options',
        default: ['yes', 'no'],
        description: 'If true, trial will end when user makes a response.'
      },
      slider_prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Slider prompt',
        default: 'How sure are you about that answer?',
        description: 'Prompt asking for a slider response.'
      },
    }
  };

  plugin.trial = function(display_element, trial) {

    var html = '<div id="jspsych-image-slider-response-wrapper" style="margin: 70px 0px 50px 0px;">';
    html += '<div id="jspsych-image-slider-response-stimulus"><img src="' + trial.stimulus + '"></div>';
    html += '<div id="dichotomous-response-container" style="height: 90px">';
    html += '<div id="dichotomous-response-prompt"></div>';
    html += '<input id="dichotomous-response-radio-0" name="dichotomous-response" type="radio"><label for="dichotomous-response-0"> Yes    </label></input>';
    html += '<input id="dichotomous-response-radio-1" name="dichotomous-response" type="radio"><label for="dichotomous-response-1"> No</label></input>';
    html += '</div>';
    html += '<div class="jspsych-image-slider-response-container" style="position:relative;">';
    html += '<div id="slider-response-prompt"></div>';
    html += '<div id="slider-response-sketch" style="height:70px"></div>';
    html += '</div>';
    html += '</div>';

    // add submit button
    html += '<button id="jspsych-image-slider-response-next" class="jspsych-btn">'+trial.button_label+'</button>';

    display_element.innerHTML = html;

    if (trial.dichotomous_prompt !== null){
      display_element.querySelector('#dichotomous-response-prompt').innerHTML = trial.dichotomous_prompt
    }

    if (trial.slider_prompt !== null){
      display_element.querySelector('#slider-response-prompt').innerHTML = trial.slider_prompt
    }

    var response = {
      rt: null,
      response: null
    };

    $('#slider-response-prompt').css({'visibility': 'hidden'});
    var showSlider = false;
    $('#jspsych-image-slider-response-next').css({'visibility': 'hidden'});

    // hide stimulus if stimulus_duration is set
    if (trial.stimulus_duration !== null) {
      jsPsych.pluginAPI.setTimeout(function() {
        display_element.querySelector('#jspsych-image-slider-response-stimulus').style.visibility = 'hidden';
      }, trial.stimulus_duration);
    }

    // p5 slider pseudoclass

    function Scrollbar(sketch, xPosition, yPosition, sliderWidth, sliderHeight){

      this.sketch = sketch;
      this.overThumb = false;
      this.overTrack = false;
      this.thumbCreated = false;
      this.thumbColor = 70;
      this.thumbX = 0;
      this.background = 200;
      this.sliderWidth = sliderWidth;
      this.offset = sketch.offset;

      sketch.tickInterval = sliderWidth/(trial.labels.length-1);

      this.display = function() {

        sketch.rectMode(sketch.RADIUS);

        // labels
        this.label();

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
        trial.labels.forEach(function(e,i){
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

          if( !this.thumbCreated  & sketch.mouseY > 30 & sketch.mouseY < 92){
            this.thumbCreated = true;
            $('#jspsych-image-slider-response-next').css({'visibility': 'visible'});
          }

        }
      };

      this.drag = function() {
        if( sketch.over & this.overTrack() & currentSketch == this.explNo ){
          this.updateThumb();
        }
      };
    }

    // define slider hover colors

    $( '#slider-response-sketch' ).mouseenter( function(){
        $( this ).css('background', '#EFF5FB');
        $( this ).attr('over', true);
    }).mouseleave( function(){
      $( this ).css('background', 'white');
      $( this ).attr('over', false);
    });

    // p5 sketch

    var confidenceSketch = new p5(function( sketch ){

      var sketchWidth = 500;
      var sketchHeight = $('#slider-response-sketch').css('height').match(/\d+/)[0];
      sketch.setup = function(){
        backgroundColor = 'white';
        sketch.offset = 27; //allow space on either end of slider track
        sketch.trackwidth = sketchWidth-2*sketch.offset;
        sketch.over = false;
        canvas = sketch.createCanvas(sketchWidth, sketchHeight);
        sketch.background(backgroundColor);
        sketch.slider = new Scrollbar(sketch, 0.5, 0.7, sketch.trackwidth, 8);
        // sketch, xPosition, yPosition, sliderWidth, sliderHeight
      };

      sketch.draw = function(){

        if( showSlider ){

          sketch.focus();

          backgroundColor = function(){
            if(sketch.over){
              return sketch.color('#EFF5FB');
            }else{
              return sketch.color('white');
            }
          };

          sketch.background(backgroundColor());

          sketch.slider.display();

        }
      };

      sketch.focus = function() {
        var over = $('#slider-response-sketch').attr('over');
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

    }, 'slider-response-sketch');



    // inputs

    $('input:radio').click(function(){
      showSlider = true;
      $('#slider-response-prompt').css({'visibility': 'visible'});
    });

    display_element.querySelector('#jspsych-image-slider-response-next').addEventListener('click', function() {
      // measure response time
      var endTime = (new Date()).getTime();
      response.rt = endTime - startTime;
      // response.response = display_element.querySelector('#jspsych-image-slider-response-response').value;
      // get slider value

      end_trial();

    });


    function end_trial(){

      jsPsych.pluginAPI.clearAllTimeouts();

      // save data
      var trialdata = {
        "rt": response.rt,
        "response": response.response
      };

      display_element.innerHTML = '';

      // next trial
      jsPsych.finishTrial(trialdata);
    }

    var startTime = (new Date()).getTime();
  };

  return plugin;
})();
