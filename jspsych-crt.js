
/*
 jsPsych plugin for Cognitive Reflection test 

 // Author: Justin Sulik
 // Contact:
 //  justin.sulik@gmail.com
 //  twitter.com/justinsulik
 //  github.com/justinsulik
 //  justinsulik.com

 */

jsPsych.plugins["crt"] = (function() {

  var plugin = {};

  plugin.info = {
    name: "crt",
    parameters: {
      question: {
        type: jsPsych.plugins.parameterType.STRING, // INT, IMAGE, KEYCODE, STRING, FUNCTION, FLOAT
        default: '',
        description: 'Question text'
      },
      unit: {
        type: jsPsych.plugins.parameterType.STRING,
        default: '',
        description: 'Units for the answer'
      },
      options: {
        type: jsPsych.plugins.parameterType.STRING,
        default: '',
        description: 'Multiple choices, if any'
      },
      qNo: {
        type: jsPsych.plugins.parameterType.INT,
        default: 0,
        description: 'Question ID'
      },
      naivete: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        default: true,
        description: "If true, ask participant if they've seen this problem before"
      }
    }
  };

  plugin.trial = function(display_element, trial) {

    // set up basic html

    var html = "<p id='question'></p>";
    html += "<div id='responseContainer'><input type='text' name='answer' id='answer' size='6'></input><span id='unit'></span></div><br><br><br>";

    if( trial.naivete ){
      html+= "<div id='naiveteContainer'><input type='checkbox' class = 'checkbox_check' name='naivete' value='familiar'><label>Check here if you've seen this problem before</label></div>";
    }
    html += "<button id='submit' name='submit'>submit</button>";

    display_element.innerHTML = html;

    $('#question').html(trial.question);
    $('#unit').html(' '+trial.unit);
    if( trial.options.length > 0 ){
      var optionsHtml = '';
      var choices = ['a', 'b', 'c'];
      trial.options.forEach(function(e, i){
        optionsHtml += "<input type='radio' name='answer' id='response_"+choices[i]+"'> "+e+"</input><br>";
      })
      $('#responseContainer').html(optionsHtml);
    }

    var start_time = Date.now();

    // data object

    var trial_data = {qNo: trial.qNo};

    // inputs

    $('#submit').click(function(e){
      // end trial
      endTrial();
    });

    $('#responseContainer').keydown(function(e){
      if( e.which==13 ){
        endTrial();
      }
    });


    var endTrial = function() {
      // get data
      var response;
      if( trial.options.length > 0){
        response = $('input[name=answer]:checked').attr('id');
      } else {
        response = $('#answer').val().replace(/[^\w\s.]/gi, '');
      }

      if( trial.naivete ){
        trial_data.seen = $('input.checkbox_check').prop('checked');
      }

      if( response.length > 0 ){
        var end_time = Date.now();
        trial_data.rt = end_time-start_time;
        trial_data.response = response;
        display_element.innerHTML = '';
        jsPsych.finishTrial(trial_data);

      } else {
        alert('Please enter an answer before submitting.');
      }


    };


  };

  return plugin;
})();
