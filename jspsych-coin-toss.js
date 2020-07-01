/*
 jsPsych plugin for coin toss task

 // Author: Justin Sulik
 // Contact:
 //  justin.sulik@gmail.com
 //  twitter.com/justinsulik
 //  github.com/justinsulik
 //  justinsulik.com

 */

jsPsych.plugins["coin-toss"] = (function() {

  var plugin = {};

  plugin.info = {
    name: "coin-toss",
    parameters: {
      draws: {
        type: jsPsych.plugins.parameterType.COMPLEX, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: undefined
      },
      trial_number: {
        type: jsPsych.plugins.parameterType.INT,
        default: undefined
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
    var first_click_rt = null;
    var pattern_click_rt;
    var confidence_click_rt;
    var toss_string = '';
    trial.draws.forEach(function(d,i){
      if(d==1){
        toss_string += '<span class="heads">H  </span>';
      } else {
        toss_string += '<span class="tails">T  </span">';
      }
    });

    var pattern_options = ['Definitely<br>random', 'Probably<br>random', 'Maybe<br>random', 'Maybe<br>a pattern', 'Probably<br>a pattern', 'Definitely<br>a pattern'];
    var pattern_option_string = '';
    pattern_options.forEach(function(d,i){
      pattern_option_string += '<div class="likert pattern" id="likert-button-'+i+'">'+d+'</div>';
    });

    var confidence_options = ['Definitely<br><b>heads</b>', 'Probably<br><b>heads</b>', 'Maybe<br><b>heads</b>', '50:50<br>chance', 'Maybe<br><b>tails</b>', 'Probably<br><b>tails</b>', 'Definitely<br><b>tails</b>'];
    var confidence_option_string = '';
    confidence_options.forEach(function(d,i){
      confidence_option_string += '<div class="likert confidence" id="confidence-button-'+i+'">'+d+'</div>';
    });

    // set up html

    var css = '<style>';
    css += '#toss {width: 600px; font-size: 60px}';
    css += '.container {margin: 10px auto 10px auto; display: flex; justify-content: space-between;}';
    css += '.heads {color: #660000}';
    css += '.tails {color: #003366}';
    css += '.next {width: 50px; display: inline-block;}';
    css += '.likert {margin: 0px; padding: 0px;border: 1px solid white; flex-grow: 1; font-size: 14px; width: 60px}';
    css += '.likert:hover {border: 1px solid #0099cc}';
    css += '.likert.selected {background: #b3ecff}';
    css += '.coin-instructions {margin-top: 30px}';
    css += '.hidden {color: #e6e6e6; background: white}';
    css += 'button {margin-top: 20px; width: 60px; height: 30px; background: #e6e6e6; border: 1px solid white;}';
    css += 'button:hover {border: 1px solid grey;}';
    css += 'button, likert {border-radius: 2px}'
    css += '</style>';

    var html = '<div id="toss">';
    html += '</div>';
    html += '<div id="choice-container">';
    html += '<p class="coin-instructions">Do you think this is random or shows a pattern?</p>';
    html += '<div id="choices" class="container"></div>';
    html += '</div>';
    html += '<div id="confidence-container" class="hidden">';
    html += '<p class="coin-instructions">Which coin side do you think will come next?</p>';
    html += '<div id="confidence" class="container">';
    html += '</div></div>';
    html += '<div id="button-container">';
    html += '<button id="submit" class="hidden">Submit</button>';

    display_element.innerHTML = css + html;

    $('#toss').html(toss_string);
    $('#choices').html(pattern_option_string);
    $('#confidence').html(confidence_option_string);

    // input

    $('.likert').click(function(e){
      if(!first_click_rt){
        first_click_rt = Date.now() - start_time;
      }
      var group = $(this).attr('class').replace('likert ', '');
      $('.likert.'+group).each(function(i,d){
        $(d).removeClass('selected');
      });
      $(this).addClass('selected');
      if(group=='pattern'){
        pattern_click_rt = Date.now();
        $('#confidence-container').removeClass('hidden');
      } else {
        confidence_click_rt = Date.now();
        $('#submit').removeClass('hidden').addClass('ready');
      }
    });

    $('#submit').click(function(e){
      if($(e.target).hasClass('ready')){
        var pattern_selected = $('.likert.pattern.selected').attr('id').match(/\d/)[0];
        var confidence_selected = $('.likert.confidence.selected').attr('id').match(/\d/)[0];
        var end_time = Date.now();
        rt = end_time - start_time;
        trial_data.end_time = end_time;
        trial_data.start_Time = start_time;
        trial_data.rt = rt;
        trial_data.confidence_click_rt = confidence_click_rt;
        trial_data.pattern_click_rt = pattern_click_rt;
        trial_data.pattern_selected = pattern_selected;
        trial_data.confidence_selected = confidence_selected;
        display_element.innerHTML = '';
        jsPsych.finishTrial(trial_data);
      }
    });

    //

    // start/end trial

    $( document ).ready(function() {
      start_time = Date.now();
      $('#answer').focus();

    });




  };

  return plugin;
})();
