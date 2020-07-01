/*

 // Author: Justin Sulik
 // Contact:
 //  justin.sulik@gmail.com
 //  twitter.com/justinsulik
 //  github.com/justinsulik
 //  justinsulik.com

 */

/*
updating an existing plugin by Josh de Leeuw, so that a keyboard response ends the trial, but only after the image has been displayed
*/


jsPsych.plugins["image-keyboard-response"] = (function() {

  var plugin = {};

  jsPsych.pluginAPI.registerPreload('image-keyboard-response', 'stimulus', 'image');

  plugin.info = {
    name: 'image-keyboard-response',
    description: '',
    parameters: {
      stimulus: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'Stimulus',
        default: undefined,
        description: 'The image to be displayed'
      },
      choices: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        array: true,
        pretty_name: 'Choices',
        default: jsPsych.ALL_KEYS,
        description: 'The keys the subject is allowed to press to respond to the stimulus.'
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt',
        default: null,
        description: 'Any content here will be displayed below the stimulus.'
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
        description: 'How long to show trial before it ends.'
      },
      response_ends_trial: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Response ends trial',
        default: true,
        description: 'If true, trial will end when subject makes a response.'
      },
      height: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'image height',
        default: 480,
        description: 'Specifies the height of the image stimulus div'
      }
    }
  };

  plugin.trial = function(display_element, trial) {

    var new_html = '<div id="img-container"></div>';
    new_html += '<div id="prompt-container"></div>';

    // draw
    display_element.innerHTML = new_html;

    // add prompt
    if (trial.prompt !== null){
      $('#prompt-container').html('<p>'+trial.prompt+'</p>');
    }

    // style divs
    $('#img-container').css('height', trial.height+'px');

    // add image
    $('#img-container').html('<img src="'+trial.stimulus+'" id="jspsych-image-keyboard-response-stimulus">');

    // store response
    var response = {
      rt: null,
      key: null
    };

    var start = Date.now();
    var end;

    // function to end trial when it is time
    var end_trial = function() {

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // gather the data to store for the trial
      var trial_data = {
        rt: response.rt,
        stimulus: trial.stimulus,
        key_press: response.key
      };

      // clear the display
      display_element.innerHTML = '';
      console.log(trial_data)

      // move on to the next trial
      jsPsych.finishTrial(trial_data);
    };

    // function to handle responses by the subject
    var after_response = function(key) {
      // after a valid response, the stimulus will have the CSS class 'responded'
      // which can be used to provide visual feedback that a response was recorded
      display_element.querySelector('#img-container').className += ' responded';

      // only record the first response
      if (response.key == null && key != null) {
        response.key = key;
        response.rt = Date.now()-start;
      }

      //  kill keyboard listeners
      $( "body" ).off( "keypress");

      if (trial.response_ends_trial) {
        // response only ends trial if the stim has finished displaying
        if( display_element.querySelector('#jspsych-image-keyboard-response-stimulus').style.visibility == 'hidden') {
          end_trial();
        }
      }
    };

    // hide stimulus if stimulus_duration is set
    if (trial.stimulus_duration !== null) {
      jsPsych.pluginAPI.setTimeout(function() {
        display_element.querySelector('#jspsych-image-keyboard-response-stimulus').style.visibility = 'hidden';
        var responded = display_element.querySelector('#img-container').className;
        if (responded){
          end_trial();
        }
      }, trial.stimulus_duration);
    }

    // end trial if trial_duration is set
    if (trial.trial_duration !== null) {
      jsPsych.pluginAPI.setTimeout(function() {
            end_trial();
      }, trial.trial_duration);

    }


    // inputs
    $('body').keypress(function(event){
      var key;
      if( event.which == 102 ){  // 102=f
        key = 'f';
      }
      if( event.which == 109 ){ // 109=m
        key = 'm';
      }
      if( key ){
        after_response(key);
      }
    });

  };

  return plugin;
})();
