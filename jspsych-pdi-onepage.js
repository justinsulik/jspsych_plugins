/*
Description: jsPsych plugin for the Peters Delusion Inventory (PDI).

Author: Justin Sulik
Contact:
 justin.sulik@gmail.com
 justinsulik.com,
 twitter.com/justinsulik
 github.com/justinsulik
*/

jsPsych.plugins['pdi-onepage'] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'pdi-onepage',
    parameters: {
      followUp: {
        type: jsPsych.plugins.parameterType.BOOL, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: true,
        pretty_name: 'Follow up questions',
        description: 'If true, for every "yes" response, the participant is asked follow up questions about distress, preoccupation and conviction'
      },
      short: {
        type: jsPsych.plugins.parameterType.BOOL,
        default: true,
        pretty_name: 'Short inventory',
        description: 'If true, the short PDI-21 is used; if false the whole 40-item inventory'
      },
      randomizeOrder: {
        type: jsPsych.plugins.parameterType.BOOL,
        default: true,
        pretty_name: 'Randomize order',
        description: 'If true, the order of items is randomized'
      },
      attentionCheck: {
        type: jsPsych.plugins.parameterType.BOOL,
        default: true,
        pretty_name: 'Attention check',
        description: 'If true, include an attention check question'
      },
      includeCAPE: {
        type: jsPsych.plugins.parameterType.BOOL,
        default: false,
        pretty_name: 'Include CAPE',
        description: 'If true, include questions from the CAPE instrument'
      },
      scaleChoices: {
        type: jsPsych.plugins.parameterType.INT,
        default: 5,
        pretty_name: 'Scale choices',
        description: 'How many choices there should be on the follow-up scales'
      }
    }
  };

  plugin.trial = function(display_element, trial) {


/*
trial variables and functions
*/
    var questionCounter = 0;
    var displayed = false;
    var sliderChecker = [0, 0, 0];
    var sliders = {};
    var trial_data = {};
    var scaleChoices = Array.apply(null, Array(trial.scaleChoices)).map(function (_, i) {return i+1;});

    var instructions;
    var currentSketch;
    var response;

    // ratings

    var followUpScales = [
        ['Not at all distressing', 'Very distressing'],
        ['Hardly ever think about it',  'Think about it all the time'],
        ["Don't believe it's true", 'Believe it is absolutely true']];

    var questions;
    if( trial.short ){
      questions = [
        'Do you ever feel as if people seem to drop hints about you or say things with a double meaning?',
        'Do you ever feel as if things in magazines or on TV were written especially for you?',
        'Do you ever feel as if some people are not what they seem to be?',
        'Do you ever feel as if you are being persecuted in some way?',
        'Do you ever feel as if there is a conspiracy against you?',
        'Do you ever feel as if you are, or destined to be someone very important?',
        'Do you ever feel that you are a very special or unusual person?',
        'Do you ever feel that you are especially close to God?',
        'Do you ever think people can communicate telepathically?',
        'Do you ever feel as if electrical devices such as computers can influence the way you think?',
        'Do you ever feel as if you have been chosen by God in some way?',
        'Do you believe in the power of witchcraft, voodoo or the occult?',
        'Are you often worried that your partner may be unfaithful?',
        'Do you ever feel that you have sinned more than the average person?',
        'Do you ever feel that people look at you oddly because of your appearance?',
        'Do you ever feel as if you had no thoughts in your head at all?',
        'Do you ever feel as if the world is about to end?',
        'Do your thoughts ever feel alien to you in some way?',
        'Have your thoughts ever been so vivid that you were worried other people would hear them?',
        'Do you ever feel as if your own thoughts were being echoed back to you?',
        'Do you ever feel as if you are a robot or zombie without a will of your own?'
      ];
    } else {
      questions = [
        'Do you ever feel as if you are under the control of some force or power other than yourself?',
        'Do you ever feel as if you are a robot or zombie without a will of your own?',
        'Do you ever feel as if you are possessed by someone or something else?',
        'Do you ever feel as if your feelings or actions are not under your control?',
        'Do you ever feel as if someone or something is playing games with your mind?',
        'Do you ever feel as if people seem to drop hints about you or say things with a double meaning?',
        'Do you ever feel as if things in magazines or on TV were written especially for you?',
        'Do you ever think that everyone is gossiping about you? ',
        'Do you ever feel as if some people are not what they seem to be?',
        'Do things around you ever feel unreal, as though it was all part of an experiment?',
        'Do you ever feel as if someone is deliberately trying to harm you?',
        'Do you ever feel as if you are being persecuted in some way?',
        'Do you ever feel as if there is a conspiracy against you?',
        'Do you ever feel as if some organization or institution has it in for you?',
        'Do you ever feel, as if someone or something is watching you?',
        'Do you ever feel as if you have special abilities or powers?',
        'Do you ever feel as if there is a special purpose or mission to your life?',
        'Do you ever feel as if there is a mysterious power working for the good of the world?',
        'Do you ever feel as if you are or destined to be someone very important?',
        'Do you ever feel that you are a very special or unusual person?',
        'Do you ever feel that you are especially close to God?',
        'Do you ever think that people can communicate telepathically?',
        'Do you ever feel as if electrical devices such as computers can influence the way you think?',
        'Do you ever feel as if there are forces around you which affect you in strange ways?',
        'Do you ever feel as if you have been chosen by God in some way?',
        'Do you believe in the power of witchcraft, voodoo, or the occult?',
        'Are you often worried that your partner may be unfaithful?',
        'Do you ever think that you smell very unusual to other people?',
        'Do you ever feel as if your body is changing in a peculiar way?',
        'Do you ever think that strangers want to have sex with you?',
        'Do you ever feel that you have sinned more than the average person?',
        'Do you ever feel that people look at you oddly because of your appearance?',
        'Do you ever feel as if you had no thoughts in your head at all?',
        'Do you ever feel as if your insides might be rotting?',
        'Do you ever feel as if the world is about to end?',
        'Do your thoughts ever feel alien to you in some way?',
        'Have your thoughts ever been so vivid that you were worried other people would hear them?',
        'Do you ever feel as if your own thoughts were being echoed back to you?',
        'Do you ever feel as if your thoughts were blocked by someone or something else?',
        'Do you ever feel as if other people can read your mind?'
      ];
    }
    if( trial.attentionCheck ){
      questions = questions.concat(['Have you ever seen a purple unicorn? Respond yes and click on five for all three scales on the right.']);
    }
    if (trial.includeCAPE ){
      questions = questions.concat(['Do you ever feel as if the thoughts in your head are being taken away from you?',
      'Do you ever feel as if the thoughts in your head are not your own?',
      'Do you ever feel as if you are under the control of some force or power other than yourself?',
      'Do you ever hear voices when you are alone?',
      'Do you ever hear voices talking to each other when you are alone?',
      'Do you ever feel as if a double has taken the place of a family member, friend or acquaintance?',
      'Do you ever see objects, people or animals that other people cannot see?']);
    }

    var addSliders = function(questionOrder, questionNumber){

      followUpPrompts.forEach(function(text, index){
        var sliderId = questionNumber+'_'+index;
      });

    };

    // questions = ['question0', 'question1', 'question2'];


/*
trial setup
*/

    // shuffle order of questions
    var questionOrder = [];
    questions.forEach(function(e,i){
      questionOrder.push(i);
    });
    if( trial.randomizeOrder ){
      var order_original = questionOrder;
      questionOrder = jsPsych.randomization.repeat(order_original, 1);
    }

    // set up basic html

    var html = '<style id="jspsych-PDI-css"></style>';
    html += '<div id="questionContainer" style="width: 800px"><div class="container instructions left">'+
    'Answer YES/NO to the following questions.<br>'+
    'For the questions you answer YES to, we are interested in:'+
    '<ol><li>How distressing those beliefs or experiences are</li>'+
    '<li>How often you think about them; and</li>' +
    '<li>How true you believe them to be</li></ol>' +
    'On the right side of the page we would like you to click the number which corresponds ' +
    'most closely to how distressing this belief is, how often you think about it, '+
    'and how much you believe that it is true. ' +
    'If you answer NO please move on to the next question.</div></div>' +
    '<div class="button container"><button id="submit">Submit</button></div>';
    display_element.innerHTML = html;

    // add style

    var cssString = '.column {width: 399px;}';
    cssString += '.left {text-align: left}';
    cssString += '.instructions {margin: 50px 0px; font-weight: 600}';
    cssString += '.button.container {margin: 40px}';
    cssString += '.dichotomous {margin: auto;}';
    cssString += '.column.right {line-height: normal;}';
    cssString += '.item.container {display: flex; height: 150px}';
    cssString += 'input.choice {visibility: hidden;}';
    cssString += 'ul {list-style: none; display: flex; justify-content: space-evenly; margin: 0px; padding-left: 0px; padding-bottom: 5px }';
    cssString += 'li.choice {display: inline-block; }';
    cssString += 'label {cursor: pointer; padding: 0px 10px; }';
    cssString += '.scale_anchors {font-size: 10px; display: flex; justify-content: space-between;}';
    cssString += '.anchor {width: 20%}';
    cssString += '.anchor.left {padding-left: 15px;}';
    cssString += '.anchor.right {padding-right: 15px; text-align: right}';
    cssString += '.scale.container:hover {background: #e5f2ff}';
    cssString += 'input.active:checked + label { background: #99ccff}';
    cssString += '.item.container {padding: 8px 0px;}';
    cssString += '.item.container:hover {background: #f5f9ff;}';
    cssString += '#questionContainer {margin-top: 20px}';
    cssString += '.highlight {color: red}';
    cssString += '.answered {color: black}';
    cssString += '#submit {width: 80px; height: 40px; font-size: 13px}';

    $('#jspsych-PDI-css').html(cssString);

/*
Content
*/

    questionOrder.forEach(function(shuffledIndex, unshuffledIndex){
      var textContainer = '<div class="left"><p>'+questions[shuffledIndex]+'</p></div>';
      var noResponse = '<input type="radio" class="dichotomous" name="response_'+shuffledIndex+'" value="yes"> Yes </input>';
      var yesResponse = '<input type="radio" class="dichotomous" name="response_'+shuffledIndex+'" value="no"> No </input>';
      var dichotomousContainer = '<div id="dichotomous_'+shuffledIndex+'" class="dichotomous">'+noResponse+yesResponse+'</div>';
      var leftBox = '<div id="main_'+shuffledIndex+'" class="container column">'+textContainer+dichotomousContainer+'</div>';

      var scaleHtml = '';
      followUpScales.forEach(function(text,followUpIndex){
        var suffix = shuffledIndex+'_'+followUpIndex;
        var name = 'scale_'+suffix;
        scaleHtml += '<div id="followup_container_'+suffix+'" class="scale container">';
        scaleHtml += '<div class="scale_anchors"><div class="anchor left">'+text[0]+'</div><div class="anchor right">' + text[1] + '</div></div>';
        var choiceHtml = '<ul>';
        scaleChoices.forEach(function(choice, choiceIndex){
          var choiceId = 'choice_'+suffix+'_'+choice;
          choiceHtml += '<li class="choice"><input type="radio" name="'+name+'" value='+choice+' class="choice inactive" id="'+choiceId+'"/>';
          choiceHtml += '<label for="'+choiceId+'" class="choice">'+choice+'</label></li>';
        });
        choiceHtml += '</ul>';
        scaleHtml += choiceHtml;
        scaleHtml += '</div>';
      });
      var rightBox = '<div id=scales_'+shuffledIndex+' class="right container column">'+scaleHtml+'</div>';

      var itemContainer = '<div id="item_'+shuffledIndex+'" class="item container">'+leftBox+rightBox+'</div>';
      $('#questionContainer').append(itemContainer);
    });


/*
Inputs + event handling
*/

    $('input.dichotomous[type=radio]').on('click', function(e){
      var name = e.target.name;
      var questionRegEx = new RegExp('[0-9]+');
      var questionNumber = questionRegEx.exec(name)[0];
      var val = e.target.value;
      //  if YES response selected, allow follow-up scales to be used (and clear any checks made previously)
      if (val=='yes'){
        $('#scales_'+questionNumber).find('input').removeClass('inactive').addClass('active');
      } else if (val=='no') {
        $('#scales_'+questionNumber).find('input').removeClass('active').addClass('inactive');
      }
    });

    $('input.choice').on('click', function(event){
      if( $(event.target).hasClass('inactive') ){
        $(event.target).prop('checked', false);
        alert('You only need to answer these follow-up questions if you answered YES to the question on the left');
      } else {
        $(event.target).closest('div').removeClass('highlight').addClass('answered');
      }
    });

    $('#submit').on('click', function(event){
      /*
      - Check that all dichotomous responses have been given
      - Freeze those that have
      - Highlight those that have not
      */
      var names = {};
      var yesNames = {};
      var dichotomousOk = false;
      var followupOk = false;
      $('input.dichotomous:radio').each(function(i, elem){
        names[$(this).attr('name')] = true;
      });

      var count = 0;
      $.each(names, function(key, value){
        var questionRegEx = new RegExp('[0-9]+');
        var questionNumber = questionRegEx.exec(key)[0];

        if($('input[name='+key+']').is(':checked')){
          // freeze those that have a response
          $('input[name='+key+']').attr('disabled', true);
          $('#dichotomous_'+questionNumber).removeClass('highlight').addClass('answered');
          count+=1;
          // collect YES responses
          if($('input[name='+key+']:checked').val()=='yes'){
              yesNames[key] = true;
          }

        } else {
          // highlight those that don't
          $('#dichotomous_'+questionNumber).addClass('highlight');
        }
      });
      if (count==questions.length){
        dichotomousOk = true;
      } else {
        alert("Make sure you answer YES/NO to each question on the left. Questions missing answers are highlighted in red.")
      }

      if (dichotomousOk){
        // check that all YES answers have follow-up scales answered
        var yesCount = 0;

        $.each(yesNames, function(key, value){
          var questionRegEx = new RegExp('[0-9]+');
          var questionNumber = questionRegEx.exec(key)[0];
          var answeredCount = 0;
          followUpScales.forEach(function(scales, i){
            var choice = $('input[name=scale_'+questionNumber+'_'+i+']:checked').val();
            if (choice) {
              answeredCount +=1;
              $('#followup_container_'+questionNumber+'_'+i).removeClass('highlight').addClass('answered');
              $('input[name=scale_'+questionNumber+'_'+i+']').attr('disabled', true);
            } else {
              $('#followup_container_'+questionNumber+'_'+i).addClass('highlight');
            }
          });
          if (answeredCount==followUpScales.length){
            yesCount+=1;
          }
        });

        if (yesCount==Object.keys(yesNames).length){
          followUpOk = true;
        } else {
          alert('For each question you responded YES to, make sure you answer all the additional questions on the right. Questions missing answers are in red.');
        }

      }


      if (dichotomousOk && followUpOk){
        //save responses, end trial
        var data = [];
        $('.item.container').each(function(index, item){
          var id = $(this).attr('id');
          var questionRegEx = new RegExp('[0-9]+');
          var questionNumber = questionRegEx.exec(id)[0];
          var dichotomousChoice = $(this).find('input.dichotomous:checked').val();
          var choices = {};
          if (dichotomousChoice == 'yes'){
            followUpScales.forEach(function(scales, i){
              var choice = $('input[name=scale_'+questionNumber+'_'+i+']:checked').val();
              choices[i] = choice;
            });
          }
          itemData = {index: index,
            id: id,
            qNo: questionNumber,
            dichotomous: dichotomousChoice,
            scales: choices
          };
          data.push(itemData);
        });

        display_element.innerHTML = '';
        trial_data.data = data;
        var endTime =  Date.now();
        var rt = endTime - startTime;
        trial_data.rt = rt;
        jsPsych.finishTrial(trial_data);

      }

    });

    var startTime = Date.now();

  };

  return plugin;
})();
