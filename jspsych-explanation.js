/*
 * Presents participant with a question, gets them to respond with an explanation,
 * and then rate their own explanation
 */

jsPsych.plugins["explanation"] = (function() {

  var plugin = {};

  plugin.info = {
    name: "explanation",
    parameters: {
      qNo: {
        type: jsPsych.plugins.parameterType.INT, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: undefined
      },
      question: {
        type: jsPsych.plugins.parameterType.STRING,
        default: undefined
      },
      follow_up: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        default: true,
        descript: 'If true, ask participant to rate explanations for accuracy and satisfaction'
      }
    }
  };

  plugin.trial = function(display_element, trial) {

    // data saving
    var trial_data = {
      qNo: trial.qNo
    };
    var start_time;

    // css
    var css = '<style>';
    css += '.likert { list-style:none;'+
      'width:600px;'+
      'margin:0px;'+
      'padding:0 0 12px;'+
      'display:block;'+
      'border-bottom:2px solid #efefef;}';
    css += '.likert:last-of-type {border-bottom:0;}';
    // adds grey line
    css += '.likert:before { content: "";'+
      'position:relative;'+
      'top:11px;'+
      'left:9%;'+
      'display:block;'+
      'background-color:#efefef;'+
      'height:4px;'+
      'width:83%;}';
    // makes horizontal
    css += '.likert li { display:inline-block;'+
      'width:14%;'+
      'text-align:center;'+
      'vertical-align: top;}';
    // labels under radio
    css += '.likert li input[type=radio] { display:block;'+
      'position:relative;'+
      'top:0px;'+
      'left:50%;'+
      'margin-left:-6px;}';
    css += '.likert li label {width:100%;'+
      'font-size:12px;'+
      'line-height:3px;}';
    css += '.question { padding-bottom: 12px;}';
    css += '</style>';

    // html

    var likertSatis = '<ul class="likert satis">'+
      '<li><input type="radio" name="satis" value="0" /><label><p>Extremely</p><p>unsatisfying</p></label></li>'+
      '<li><input type="radio" name="satis" value="1" /><label><p>Unsatisfying</p></label></li>'+
      '<li><input type="radio" name="satis" value="2" /><label><p>Slightly</p><p>unsatisfying</p></label></li>'+
      '<li><input type="radio" name="satis" value="3" /><label><p>Neutral</p></label></li>'+
      '<li><input type="radio" name="satis" value="4" /><label><p>Slightly</p><p>satisfying</p></label></li>'+
      '<li><input type="radio" name="satis" value="5" /><label><p>Satisfying</p></label></li>'+
      '<li><input type="radio" name="satis" value="6" /><label><p>Extremely</p><p>satisfying</p></label></li>'+
      '</ul>';

    var likertAcc = '<ul class="likert acc">'+
      '<li><input type="radio" name="acc" value="0" /><label><p>Extremely</p><p>inaccurate</p></label></li>'+
      '<li><input type="radio" name="acc" value="1" /><label><p>Inaccurate</p></label></li>'+
      '<li><input type="radio" name="acc" value="2" /><label><p>Slightly</p><p>inaccurate</p></label></li>'+
      '<li><input type="radio" name="acc" value="3" /><label><p>Neutral</p></label></li>'+
      '<li><input type="radio" name="acc" value="4" /><label><p>Slightly</p><p>accurate</p></label></li>'+
      '<li><input type="radio" name="acc" value="5" /><label><p>Accurate</p></label></li>'+
      '<li><input type="radio" name="acc" value="6" /><label><p>Extremely</p><p>accurate</p></label></li>'+
      '</ul>';

    var html = '<div class="question">'+trial.question+'</div>';
    html += '<div id="response"><textarea id="answer" rows="10" cols="80"></textarea></div>';
    if(trial.follow_up){
      html += '<p>How satisfying do you think your explanation is?</p>'+likertSatis;
      html += '<p>How accurate do you think your explanation is?</p>'+likertAcc;
    }
    html += '<div><button id="submit" type="button">Submit answer</button></div>';
    display_element.innerHTML = css+html;

    $('#submit').click(function(e){

      // validate answers
      var responses = getResponses();
      var answersOk = validate(responses);
      if(answersOk.all){

        var end_time = Date.now();
        var rt = end_time - start_time;
        trial_data.rt = rt;
        trial_data.responses = responses;

        // end trial
        endTrial();

      } else {
        var alertMessage = "Please make sure you've answered the questions in red.";
        if(!answersOk.explanation){
          $('.question').css('color', 'red');
          if(responses.explanation.length>0){
              alertMessage += ' In particular, we need a longer answer to the "Why?" question.';
          }
        } else {
          $('.question').css('color', 'black');
        }
        if(!answersOk.satis){
          $('.satis').css('color', 'red');
        } else {
          $('.satis').css('color', 'black');
        }
        if(!answersOk.acc){
          $('.acc').css('color', 'red');
        } else {
          $('.acc').css('color', 'black');
        }
        alert(alertMessage);
      }

    });

    function validate(responses) {
      var explOk = responses.explanation.length>5;
      var satOk = responses.satis >= 0;
      var accOk = responses.acc >= 0;
      var all = explOk & satOk & accOk;
      return({explanation: explOk,
        satis: satOk,
        acc: accOk,
        all: all
      });
    }

    function getResponses() {
      var explanationRaw = $('#answer').val();
      var explanation = explanationRaw.replace(/[\\/$@%]/g, '');
      var satis = $("input[name='satis']:checked").val();
      var acc = $("input[name='acc']:checked").val();
      return({explanation: explanation,
        satis: satis,
        acc: acc
      });
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
