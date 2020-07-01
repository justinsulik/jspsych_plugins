/*
Description: jsPsych plugin for a task where the participant gives an explantion in response to a question, based on prompts

Uses wordcloud function based on https://bl.ocks.org/jyucsiro/767539a876836e920e38bc80d2031ba7

 // Author: Justin Sulik
 // Contact:
 //  justin.sulik@gmail.com
 //  twitter.com/justinsulik
 //  github.com/justinsulik
 //  justinsulik.com

*/


jsPsych.plugins["prompted-explanation"] = (function() {

  var plugin = {};

  plugin.info = {
    name: "prompted-explanation",
    parameters: {
      input: {
        type: jsPsych.plugins.parameterType.OBJECT, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: {},
        pretty_name: 'Input',
        description: 'An object consisting with words as keys, and frequencies as values'
      },
      question: {
        type: jsPsych.plugins.parameterType.STRING,
        default: '',
        pretty_name: 'Question',
        description: 'A question asking for an explanation'
      },
      explanations: {
        type: jsPsych.plugins.parameterType.COMPLEX,
        default: [],
        pretty_name: 'Explanations',
        description: 'A list of strings, each representing one explanation'
      }
    }
  };

  plugin.trial = function(display_element, trial) {


/*
trial variables and functions
*/
    var trial_data = {};

    // trial variables

    var closedClassWords = ["I", "me", "you", "he", "him", "she", "her", "it", "we", "us", "they", "them", "one", "myself", "yourself", "himself", "herself", "itself", "ourselves", "yourselves", "themselves", "oneself", "my", "mine", "your", "yours", "his", "her", "hers", "its", "our", "ours", "their", "theirs", "this", "these", "that", "those", "a", "an", "the", "who", "whom", "whose", "what", "which", "some", "somebody", "someone", "something", "any", "anybody", "anyone", "anything", "every", "everybody", "everyone", "everything", "each", "all", "both", "many", "much", "more", "most", "too", "enough", "few", "little", "fewer", "less", "least", "no", "nobody", "nothing", "none", "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety", "hundred", "thousand", "million", "billion", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth", "twentieth", "thirtieth", "fortieth", "fiftieth", "sixtieth", "seventieth", "eightieth", "ninetieth", "hundredth", "thousandth", "millionth", "billionth", "be", "am", "are", "is", "was", "were", "been", "being", "have", "has", "had", "having", "will", "would", "can", "cannot", "could", "shall", "should", "may", "might", "must", "do", "does", "did", "done", "doing", "here", "there", "now", "then", "where", "when", "how", "why", "somewhere", "sometime", "somehow", "anywhere", "anytime", "anyhow", "anyway", "everywhere", "always", "nowhere", "never", "aboard", "about", "above", "across", "after", "against", "ago", "along", "alongside", "amid", "among", "amongst", "around", "as", "astride", "at", "atop", "before", "behind", "below", "beneath", "beside", "besides", "between", "beyond", "by", "despite", "de", "down", "during", "en", "except", "for", "from", "in", "inside", "into", "lest", "like", "minus", "near", "next", "notwithstanding", "of", "off", "on", "onto", "opposite", "out", "outside", "over", "par", "past", "per", "plus", "post", "since", "through", "throughout", "'til", "till", "to", "toward", "towards", "under", "underneath", "unlike", "until", "unto", "up", "upon", "versus", "via", "vs.", "with", "within", "without", "worth", "&", "and", "both", "but", "either", "et", "less", "minus", "'n", "'n'", "neither", "nor", "or", "plus", "so", "times", "v.", "versus", "vs.", "yet", "albeit", "although", "because", "'cause", "if", "neither", "since", "so", "than", "that", "though", "'til", "till", "unless", "until", "whereas", "whether", "which", "while", "yes", "no", "not", "to", "it'll", "I'll", "you'll", "he'll", "she'll", "we'll", "they'll", "I'm", "you're", "he's", "she's", "it's", "we're", "they're", "everybody's", "everyone's", "somebody's", "someone's", "where's", "who's", "what's", "how's", "why's", "", "can't", "don't", "doesn't", "won't", "haven't", "hasn't", "aren't", "isn't", "wasn't", "weren't", "mustn't", "couldn't", "hadn't", "I've", "you've", "we've", "they've"];

    var explanationWords = trial.explanations.split(" ");
    var questionWords = trial.question.replace(/[^\w]+$/, "").toLowerCase().split(" ");

    var punctuation = ",.;'()!&:";

    // trial functions

    function drawWordCloud(text_string){

        var word_count = {};

        var words = text_string.split(/[ '\-\(\)\*":;\[\]|{},.!?]+/);
          if (words.length == 1){
            word_count[words[0]] = 1;
          } else {
            words.forEach(function(word){
              var word = word.toLowerCase();
              if (word != "" && closedClassWords.indexOf(word)==-1 && word.length>1){
                if (word_count[word]){
                  word_count[word]++;
                } else {
                  word_count[word] = 1;
                }
              }
            });
          }

        var svg_location = "#chart";
        var width = 500;
        var height = 500;

        var fill = d3.scale.category20();

        var word_entries = d3.entries(word_count);

        var xScale = d3.scale.linear()
           .domain([0, d3.max(word_entries, function(d) {
              return d.value;
            })
           ])
           .range([10,100]);

        d3.layout.cloud().size([width, height])
          .timeInterval(20)
          .words(word_entries)
          .fontSize(function(d) { return xScale(+d.value); })
          .text(function(d) { return d.key; })
          .rotate(function() { return ~~(Math.random() * 2) * 90; })
          .font("Impact")
          .on("end", draw)
          .start();

        function draw(words) {
          d3.select(svg_location).append("svg")
              .attr("width", width)
              .attr("height", height)
            .append("g")
              .attr("transform", "translate(" + [width >> 1, height >> 1] + ")")
            .selectAll("text")
              .data(words)
            .enter().append("text")
              .style("font-size", function(d) { return xScale(d.value) + "px"; })
              .style("font-family", "Impact")
              .style("fill", function(d, i) { return fill(i); })
              .attr("text-anchor", "middle")
              .attr("transform", function(d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
              })
              .text(function(d) { return d.key; });
        }

        d3.layout.cloud().stop();
      }

/*
trial setup
*/

    // set up basic html

    var html = '<style id="jspsych-explanation-css"></style>';
    html += '<div id="wordCloud" class="container"><div id="chart"></div></div>';
    html += '<div id="question" class="container"></div>';
    html += '<div id="prompt" class="container"></div>';
    html += '<div class="responseBox"><div id="answer" class="container"><div id="fakeText" class="overlay responseBox"></div><textarea id="textBox" name="textResponse" class="overlay responseBox"></textarea></div></div>';
    html += '<div id="submitBox" class="container"><button id="submit">Submit</button></div>';

    display_element.innerHTML = html;

    // style

    var cssString = '#answer {position: relative}';
    cssString += '.responseBox {width:600px; height:150px;}';
    cssString += '.overlay {position: absolute; top: 0px; font-size: 18px; font-family: sans-serif; line-height: 1.2}';
    cssString += '#fakeText {text-align: left; left: 2px}';
    cssString += '#textBox {left: 0px; color: transparent; background: transparent; caret-color: black}';
    $('#jspsych-explanation-css').html(cssString);

/*
trial content
*/
    // add wordcloud
    drawWordCloud(trial.explanations);

    // add question
    $('#question').html(trial.question);

    // add prompt
    $('#prompt').html('Answer using "so that"');


/*
inputs
*/
    // word highlighting
    $('#textBox').keyup(function(e){
      var inputText = $('#textBox').val();
      var formattedText = colorize(inputText);
      $('#fakeText').html(formattedText);
    });

    function colorize(text){
      text = text.replace("so that", "so_that");
      var textArr = text.split(" ");
      var formatted = [];
      textArr.forEach(function(word, i){
        wordChar = word.replace(/[^\w]+$/, "").toLowerCase();

        if( explanationWords.indexOf(wordChar) != -1 || questionWords.indexOf(wordChar) != -1) {
          formatted.push('<span style="color:#3CB371">'+word+'</span>');
        } else if ( closedClassWords.indexOf(word) != -1 || closedClassWords.indexOf(wordChar) != -1 ) {
          formatted.push('<span style="color:#2E8B57">'+word+'</span>');
        } else if ( wordChar == 'so_that') {
          formatted.push('<span style="color:black;">so that</span>');
        } else {
          formatted.push('<span style="color:red">'+word+'</span>');
        }
      });

      formatted = formatted.join(" ");
      return formatted;
    }

    // button handler
    $('#submit').on('click', function(e){
      var text =  $('#textBox').val();
      var alertMessage = '';
      if (text.length < 25) {
        alertMessage = alertMessage + "Your answer is too short! Please try adding more detail. ";
      }
      if (text.indexOf('so that') == -1){
        alertMessage = alertMessage + "Please make sure you used the exact phrase 'so that' in your response. ";
      }
      if (alertMessage.length > 0){
        alert(alertMessage);
      } else {
        // clear screen
        display_element.innerHTML = '';

        // collect trial data
        trial_data.response = text;
        var end_time = Date.now();
        var rt = end_time - start_time;
        trial_data.rt = rt;
        jsPsych.finishTrial(trial_data);
        console.log(trial_data);
      }

    });

    // record start time once basics set up
    var start_time = Date.now();

  };

  return plugin;
})();
