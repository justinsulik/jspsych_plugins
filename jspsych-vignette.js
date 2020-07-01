// Display a vignette to participants (for them to read)
// Track key presses to see if e.g. they're copying the text

jsPsych.plugins["vignette"] = (function() {

  var plugin = {};

  plugin.info = {
    name: "vignette",
    parameters: {
      text: {
        type: jsPsych.plugins.parameterType.STRING, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: undefined
      }
    }
  };

  plugin.trial = function(display_element, trial) {

    // data saving
    var trial_data = {
      keys: [],
      drags: []
    };

    var html =
    '<div id="vignette-containter" style="text-align:left">' +
      '<div id="vignette-prompt">'+
        '<b>Read the following carefully, then click "next".</b>'+
      '</div>'+
      '<div id="vignette">'+
        '<p>'+
         trial.text +
        '</p>'+
      '</div>'+
      '<div id="button-container">'+
        '<br><button type="button" id="submit">Next</button>'+
      '</div>'+
    '</div>';

    display_element.innerHTML = html;

    // end trial
    jsPsych.finishTrial(trial_data);
  };

  return plugin;
})();
