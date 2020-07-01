/*
 * Example plugin template
 */

jsPsych.plugins["mouse-trap"] = (function() {

  var plugin = {};

  plugin.info = {
    name: "mouse-trap",
    parameters: {
      cutoffTime: {
        type: jsPsych.plugins.parameterType.INT, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: 4000
      },
      totalTime: {
        type: jsPsych.plugins.parameterType.INT, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: 5000
      },
      trials: {
        type: jsPsych.plugins.parameterType.INT,
        default: 10
      },
      gridsize: {
        type: jsPsych.plugins.parameterType.INT,
        default: 4
      }
    }
  };

  plugin.trial = function(display_element, trial) {

    // trial data

    var trial_data = {
      trial_number: trial.trial_number,
      draws: trial.draws
    };

    var start_time;

    var css = '<style>';
    css += '</style>';

    var html = '<div id="sketch-container">';
    html += '</div>';

    display_element.innerHTML = css + html;

    var timerSketch = new p5(function( sketch ) {

      var mouse = [];
      var trap;
      var win;
      var lose = [];

      sketch.preload = function(){
        mouse[0] = sketch.loadImage('../../assets/mousetrap/mousetrap_mouse_left.png');
        mouse[1] = sketch.loadImage('../../assets/mousetrap/mousetrap_mouse_left.png');
      }

      sketch.setup = function(){
        sketch.createCanvas(800,800);
      }

      sketch.draw = function(){
        sketch.background(240)

      }

    }, 'sketch-container');


    //jsPsych.finishTrial(trial_data);

    // start/end trial

    $( document ).ready(function() {
      start_time = Date.now();
      $('#answer').focus();

    });




  };

  return plugin;
})();
