/*
 jsPsych plugin for cue-target game (Sulik & Lupyan, 2018, JEP:G)

 // Author: Justin Sulik
 // Contact:
 //  justin.sulik@gmail.com
 //  twitter.com/justinsulik
 //  github.com/justinsulik
 //  justinsulik.com

 */

jsPsych.plugins["cue-target"] = (function() {

  var plugin = {};

  plugin.info = {
    name: "cue-target",
    parameters: {
      target: {
        type: jsPsych.plugins.parameterType.STRING, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: undefined
      },
      validate: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        default: true
      },
      preamble: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'Think of a one-word cue that would help someone guess the word:'
      },
      qNo: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        default: undefined
      }
    }
  };

  plugin.trial = function(display_element, trial) {

    // data saving
    var trial_data = {
      target: trial.target,
      qNo: trial.qNo
    };

    // html + css

    var css = '<style>';
    css += '#preamble {font-size:15px;padding-bottom:15px}';
    css += '</style>';

    var html = '<div id="preamble">'+trial.preamble+'</div>';
    html += '<div id="target">'+trial.target+'</div>';
    html += '<div id="cue-container"><input type="text" id="cue"></input></div></div>';
    html += '<div id="button-container"><button id="submit">Submit</button></div>';

    display_element.innerHTML = css+html;

    // responses

    $('#submit').click(function(e){
      // validate answers
      var end_time = Date.now();
      var response = getResponse();
      var responseOk = validate(response);
      console.log(responseOk)
      if(responseOk.allOk){
        trial_data.response = response;
        var rt = end_time - start_time;
        trial_data.rt = rt;
        endTrial();
      } else {
        var alertMsg = '';
        if(!responseOk.charOk){
          alertMsg += "Please answer using a single word. Check you don't have any spaces, numbers, symbols or punctuation (including at the end of your answer). ";
        }
        if(!responseOk.lengthOk){
          alertMsg += 'Please respond with a word that is at least 3 letters long.';
        }
        alert(alertMsg);
      }
    });


    function getResponse() {
      return($('#cue').val());
    }

    function validate(response) {
      var letters = /^[A-Za-z]+$/;
      var charOk = letters.test(response);
      console.log(charOk)
      var lengthOk = response.length>=3;
      var allOk = charOk & lengthOk;
      return({charOk: charOk,
        lengthOk: lengthOk,
        allOk: allOk});
    }

    function endTrial(){

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // clear screen
      display_element.innerHTML = '';

      jsPsych.finishTrial(trial_data);
      console.log(trial_data);

    }

    $( document ).ready(function() {
      start_time = Date.now();
      $('#answer').focus();

    });

  };

  return plugin;
})();
