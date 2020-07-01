/*

 // Author: Justin Sulik
 // Contact:
 //  justin.sulik@gmail.com
 //  twitter.com/justinsulik
 //  github.com/justinsulik
 //  justinsulik.com

 */

/**
 * Show a fixation "+" that can randomly change color at a random time
 * based on jspsych-html-keyboard-response by Josh de Leeuw
 *
 * plugin for displaying a fixation stimulus and getting a keyboard response
 *
 **/



jsPsych.plugins["fixation-response"] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'fixation-response',
    description: '',
    parameters: {
      stimulus: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        pretty_name: 'Stimulus',
        default: undefined,
        description: 'The HTML string to be displayed'
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
      change_range: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Change point',
        default: [0.33, 0.67],
        description: 'An array length 2 indicating the times (expressed as a proportion of trial_duration) during which the stim can change color.'
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
        default: false,
        description: 'If true, trial will end when subject makes a response.'
      },
      change_prob: {
        type: jsPsych.plugins.parameterType.FLOAT,
        pretty_name: 'Change probability',
        default: 1,
        description: 'The probability that a given trial will change color'
      }

    }
  };

  plugin.trial = function(display_element, trial) {

    var new_html = '<div id="jspsych-fixation-response-stimulus"><p>'+trial.stimulus+'</p></div>';

    // add prompt
    if(trial.prompt !== null){
      new_html += trial.prompt;
    }

    // draw
    display_element.innerHTML = new_html;

    // add style

    var stim = document.querySelector('#jspsych-fixation-response-stimulus');
    stim.style['font-size'] = '60px';

    // store response
    var response = {
      rt: null,
      key: null
    };

    var change_point;
    var change;
    if (Math.random() <= trial.change_prob){
      change = 1;
      change_point = trial.trial_duration*(trial.change_range[0] + (trial.change_range[1]-trial.change_range[0])*Math.random());
    } else {
      change = 0;
    }

    // function to end trial when it is time
    var end_trial = function() {

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // kill keyboard listeners
      if (typeof keyboardListener !== 'undefined') {
        jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
      }

      // gather the data to store for the trial
      var trial_data = {
        "change": change,
        "change_point": trial.change_point,
        "rt": response.rt,
        "stimulus": trial.stimulus,
        "key_press": response.key
      };

      // clear the display
      display_element.innerHTML = '';

      // move on to the next trial
      jsPsych.finishTrial(trial_data);
    };

    // function to handle responses by the subject
    var after_response = function(info) {

      // after a valid response, the stimulus will have the CSS class 'responded'
      // which can be used to provide visual feedback that a response was recorded
      display_element.querySelector('#jspsych-fixation-response-stimulus').className += ' responded';

      // only record the first response
      if (response.key == null) {
        response = info;
      }

      if (trial.response_ends_trial) {
        end_trial();
      }
    };

    // start the response listener
    if (trial.choices != jsPsych.NO_KEYS) {
      var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: after_response,
        valid_responses: trial.choices,
        rt_method: 'date',
        persist: false,
        allow_held_key: false
      });
    }

    // hide stimulus if stimulus_duration is set
    if (trial.stimulus_duration !== null & change==1) {
      jsPsych.pluginAPI.setTimeout(function() {
        display_element.querySelector('#jspsych-fixation-response-stimulus').style.color = 'red';
      }, change_point);
    }

    // end trial if trial_duration is set
    if (trial.trial_duration !== null) {
      jsPsych.pluginAPI.setTimeout(function() {
        end_trial();
      }, trial.trial_duration);
    }

  };

  return plugin;
})();
