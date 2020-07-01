/*
 Plugin for Compound Remote Associate problems
to do:

 */

jsPsych.plugins["cra"] = (function() {

  var plugin = {};

  plugin.info = {
    name: "cra",
    parameters: {
      stimuli: {
        type: jsPsych.plugins.parameterType.STRING, // INT, IMAGE, KEYCODE, STRING, FUNCTION, FLOAT
        pretty_name: 'Stimuli words',
        default: ['', '', ''],
        description: 'An array of three stimuli words'
      },
      answer: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Answer word',
        default: '',
        description: 'The answer to the trial'
      },
      qNo: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Question number',
        default: 0,
        description: 'Identifier for each trial'
      },
      max_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Maximum time allowed',
        default: null,
        description: 'Time allowed (in milliseconds) to complete the task before trial is automatically ended'
      },
      feedback: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        default: true,
        description: 'Whether the participant receives feedback at the end of the task'
      },
      countdown: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        default: true,
        description: 'Whether a countdown timer is displayed'
      },
      score: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        default: false,
        description: 'Whether a running score is displayed'
      },
      feedback_duration: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        default: 10000,
        description: 'How long feedback is displayed for'
      }
    }
  };

  plugin.trial = function(display_element, trial) {

    // trial css

    var css = '<style>';
    css += '#feedback-container {'+
    'position: relative;'+
    'justify-content: space-between;'+
    'height: 150px;' +
    'width: 800px;' +
    '}';
    css += '#timer-container {'+
    'position: absolute;'+
    'right: 0px;'+
    'top: 0px;'+
    '}';
    css += '#feedback {'+
    'position: absolute;'+
    'left: 0px;'+
    'margin: 0 auto;'+
    'left: 0;'+
    'right: 0;'+
    'padding: 50px 0 0;'+
    'font-weight: 800;'+
    'font-size: 1.5em;'+
    '}';
    css += '</style>';

    var start_time;
    var correct;
    var feedbackPeriod = false;
    var feedback_start_time;
    var answered = false;

    // set up basic html for trial

    var html = '<div id="feedback-container"></div>';
    html += '<div id="stimuli"></div>';
    html += '<div id="response"><input type="text" id="answer"></input></div>';
    html += '<button id="submit" type="button">Submit answer</button>';
    var feedbackString = '<span style="font-weight:bold;">'+trial.answer+'</span>';
    var stimHtml = trial.stimuli[0].replace('_', '') + '<br>' + trial.stimuli[1].replace('_', '') + '<br>' + trial.stimuli[2].replace('_', '') + '<br><br><br>';
    var feedbackStim = trial.stimuli[0].replace('_', feedbackString) + '<br>' + trial.stimuli[1].replace('_', feedbackString) + '<br>' + trial.stimuli[2].replace('_', feedbackString) + '<br><br><br>';

    display_element.innerHTML = css + html;
    $('#stimuli').html(stimHtml);
    if(trial.feedback){
      $("#feedback-container").append("<div id='feedback'></div>");
    }
    if(trial.countdown){
      $("#feedback-container").append("<div id='timer-container'></div>");
      var time_elapsed;
      var time_remaining;
      var percent_remaining;
      var timerSketch = new p5(function( sketch ) {
        var size = 150;
        var proportion = 0.3;

        sketch.setup = function(){
          sketch.createCanvas(size, size);
          sketch.background(255);
          sketch.strokeCap(sketch.SQUARE);
          sketch.frameRate(60);
        };

        sketch.draw = function(){
          sketch.background(255);
          sketch.translate(size/2,size/2);
          sketch.rotate(-1*sketch.PI/2);

          if(feedbackPeriod){
            time_elapsed = Date.now() - feedback_start_time;
            time_remaining = trial.feedback_duration - time_elapsed;
            percent_remaining = time_remaining/trial.feedback_duration;
            switch(correct){
              case 'incorrect':
                sketch.stroke(230, 0, 0);
              break;
              case 'correct':
                sketch.stroke(0, 230, 0);
              break;
              case 'unanswered':
                sketch.stroke(200);
              break;
            }

            sketch.strokeWeight(2);
            sketch.ellipse(0, 0, proportion*size*percent_remaining, proportion*size*percent_remaining);
          } else {
            time_elapsed = Date.now() - start_time;
            time_remaining = trial.max_duration - time_elapsed;
            percent_remaining = time_remaining/trial.max_duration;
            var red = 255-percent_remaining*255;
            sketch.stroke(100);
            sketch.strokeWeight(1);
            sketch.ellipse(0, 0, proportion*size, proportion*size);

            sketch.stroke(red, 0, 0);
            sketch.strokeWeight(8);
            sketch.arc(0, 0, proportion*size, proportion*size, 0, percent_remaining*2*sketch.PI);
          }
        };
      }, 'timer-container');
    }

    // create object to hold data

    var trial_data = {
      answer: trial.answer,
      qNo: trial.qNo
    };

    // set up timeout

    if(trial.max_duration > null){
      jsPsych.pluginAPI.setTimeout(timeout, trial.max_duration);
    }

    function timeout() {
      if(!answered){
        // only timeout if no answer has been provided
        $("#submit").attr("disabled", true);
        $("#answer").attr("disabled", true);
        correct = 'unanswered';
        trial_data.response = $('#answer').val().replace(/[^\w\s]/gi, '');
        trial_data.timeout = true;
        trial_data.rt = 'NA';
        if(trial.feedback){
          feedback_start_time = Date.now();
          feedbackPeriod = true;
          feedbackHtml = '<p style="color:grey;">No response</p>';
          $("#feedback").html(feedbackHtml);
          $('#stimuli').html(feedbackStim);
          jsPsych.pluginAPI.setTimeout(endTrial, trial.feedback_duration);
        } else {
            endTrial();
        }
      }
    }

    // inputs

    function collectResponse(){
      if(!answered){
        var response = $('#answer').val().replace(/[^\w\s]/gi, '');
        if( response.length > 0 ){
          answered = true;
          $("#submit").attr("disabled", true);
          $("#answer").attr("disabled", true);
          trial_data.response = response;
          trial_data.timeout = false;
          var end_time = Date.now();
          var rt = end_time - start_time;
          trial_data.rt = rt;
          if(trial.feedback){
            feedback_start_time = Date.now();
            feedbackPeriod = true;
            giveFeedback(response);
          } else {
            endTrial();
          }
        } else {
          // jsPsych.pauseExperiment();
          alert('Make sure you enter a response before clicking submit');
          $('#answer').focus();
        }
      }
    }

    $('#submit').click(collectResponse);
    $('#answer').keypress(function(e){
      if (e.which == 13 ) {
          collectResponse();
      }
    });

    // end trial

    var endTrial = function(){

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();


      // clear screen
      timerSketch.remove();
      display_element.innerHTML = '';

      jsPsych.finishTrial(trial_data);
      console.log(trial_data);

    };

    $( document ).ready(function() {
      start_time = Date.now();
      $('#answer').focus();

    });

    // https://rosettacode.org/wiki/Levenshtein_distance#ES5
    function levenshtein(a, b) {
      var t = [], u, i, j, m = a.length, n = b.length;
      if (!m) { return n; }
      if (!n) { return m; }
      for (j = 0; j <= n; j++) { t[j] = j; }
      for (i = 1; i <= m; i++) {
        for (u = [i], j = 1; j <= n; j++) {
          u[j] = a[i - 1] === b[j - 1] ? t[j - 1] : Math.min(t[j - 1], t[j], u[j - 1]) + 1;
        } t = u;
      } return u[n];
    }

    function giveFeedback(response){
      var feedbackHtml;
      if(response==trial.answer){
        correct = 'correct';
        feedbackHtml = '<p style="color:#00E600;">Correct!</p>';
      } else if(levenshtein(trial.answer, response) <= 2) {
        correct = 'correct';
        feedbackHtml = '<p style="color:#00E600;">Correct!</p>';
      } else {
        feedbackHtml = '<p style="color:#E60000;">Incorrect</p>';
        correct = 'incorrect';
      }
      $("#feedback").html(feedbackHtml);
      $('#stimuli').html(feedbackStim);

      jsPsych.pluginAPI.setTimeout(endTrial, trial.feedback_duration);

    }

  };


  return plugin;
})();
