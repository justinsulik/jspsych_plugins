/*
 * jsPsych plugin for entering text field, with clickable prompts provided
 * autocomplete based on https://www.w3schools.com/howto/howto_js_autocomplete.asp

  Author: Justin Sulik
  Contact:
   justin.sulik@gmail.com
   twitter.com/justinsulik
   github.com/justinsulik
   justinsulik.com

  */

jsPsych.plugins['tagging'] = (function() {
  var plugin = {};

  plugin.info = {
    name: 'tagging',
    description: '',
    parameters: {
      tags: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Tags',
        default: 5,
        description: 'Max number of tags that can be provided'
      },
      preamble: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Preamble',
        default: null,
        description: 'HTML formatted string to display at the top of the page above all the questions.'
      },
      tag_name: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Tag name',
        default:  'Tag',
        description: 'Label of responses.'
      },
      button_label: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Button label',
        default:  'Submit',
        description: 'Label of the button.'
      },
      autocomplete_options: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Autocomplete options',
        array: true,
        default: null,
        description: "Suggestions for autocomplete"
      }
    }
  };

  plugin.trial = function(display_element, trial) {
    var plugin_id_name = "jspsych-tagging";

    var css ="";
    var html = "";

    // inject CSS for trial
    css += '<style id="jspsych-tagging-css">';
    css += ".jspsych-tagging-question { margin-top: 2em; margin-bottom: 2em; text-align: left; }";
    css += ".autocomplete {position: relative;}";

    css += ".autocomplete-items {"+
      "font-size: 0.7em;"+
      "position: absolute;"+
      "border: 1px solid #d4d4d4;"+
      "border-bottom: none;"+
      "border-top: none;"+
      "z-index: 99;"+
      /*position the autocomplete items to be the same width as the container:*/
      "top: 100%;"+
      "left: 0;"+
      "right: 0;}";

    css += ".autocomplete-items div {"+
      "padding: 10px;"+
      "cursor: pointer;"+
      "background-color: #fff;"+
      "border-bottom: 1px solid #d4d4d4;}";

    css += ".autocomplete-items div:hover {"+
      /*when hovering an item:*/
      "background-color: #e9e9e9;}";

    css += ".autocomplete-active {"+
      /*when navigating through the items using the arrow keys:*/
      "background-color: DodgerBlue !important;"+
      "color: #ffffff;}";

    css += '</style>';

    // show preamble text
    if(trial.preamble !== null){
      html += '<div id="jspsych-tagging-preamble" class="jspsych-tagging-preamble">'+trial.preamble+'</div>';
    }

    // form element
    html += '<form autocomplete="off" id="jspsych-tagging-form">';

    // add multiple-choice questions
    var question_order = [];
    for (var i = 0; i < trial.tags; i++) {
      question_order.push(i);
      // get question based on question_order
      var question_id = i;
      var question_label = i + 1;

      // create question container
      var question_classes = ['jspsych-tagging-question', 'autocomplete'];
      html += '<div id="jspsych-tagging-'+question_id+'" class="'+question_classes.join(' ')+'">';

      // add tag description
      html += '<label for="" class="jspsych-tagging-text jspsych-tag-label">' + trial.tag_name + ' ' + question_label + ' </label>';
      html += '<input type="text" id="jspsych-tag-'+i+'" name="tag-'+i+'" class="jspsych-tag-input" size="40"></input>';
      html += '</div>';
    }

    // add submit button
    html += '<input type="submit" id="'+plugin_id_name+'-next" class="'+plugin_id_name+' jspsych-btn"' + (trial.button_label ? ' value="'+trial.button_label + '"': '') + '></input>';
    html += '</form>';

    // render
    display_element.innerHTML = css + html;

    // add autocomplete functionality to all text inputs

    var tag_inputs = document.getElementsByClassName("jspsych-tag-input");
    for (var j = 0; j < tag_inputs.length; j++) {
      autocomplete(tag_inputs[j], trial.autocomplete_options);
    }

    function autocomplete(inp, arr) {
      /*the autocomplete function takes two arguments,
      the text field element and an array of possible autocompleted values:*/
      var currentFocus;
      /*execute a function when someone writes in the text field:*/
      inp.addEventListener("input", function(e) {
          var a, b, i, val = this.value;
          /*close any already open lists of autocompleted values*/
          closeAllLists();
          if (!val) { return false;}
          currentFocus = -1;
          /*create a DIV element that will contain the items (values):*/
          a = document.createElement("DIV");
          a.setAttribute("id", this.id + "autocomplete-list");
          a.setAttribute("class", "autocomplete-items");
          /*append the DIV element as a child of the autocomplete container:*/
          this.parentNode.appendChild(a);
          /*for each item in the array...*/
          for (i = 0; i < arr.length; i++) {
            /*check if the item starts with the same letters as the text field value:*/
            if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
              /*create a DIV element for each matching element:*/
              b = document.createElement("DIV");
              /*make the matching letters bold:*/
              b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
              b.innerHTML += arr[i].substr(val.length);
              /*insert a input field that will hold the current array item's value:*/
              b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
              /*execute a function when someone clicks on the item value (DIV element):*/
                  b.addEventListener("click", function(e) {
                  /*insert the value for the autocomplete text field:*/
                  inp.value = this.getElementsByTagName("input")[0].value;
                  /*close the list of autocompleted values,
                  (or any other open lists of autocompleted values:*/
                  closeAllLists();
              });
              a.appendChild(b);
            }
          }
      });
      /*execute a function presses a key on the keyboard:*/
      inp.addEventListener("keydown", function(e) {
          var x = document.getElementById(this.id + "autocomplete-list");
          if (x) x = x.getElementsByTagName("div");
          if (e.keyCode == 40) {
            /*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
            currentFocus++;
            /*and and make the current item more visible:*/
            addActive(x);
          } else if (e.keyCode == 38) { //up
            /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
            currentFocus--;
            /*and and make the current item more visible:*/
            addActive(x);
          } else if (e.keyCode == 13) {
            /*If the ENTER key is pressed, prevent the form from being submitted,*/
            e.preventDefault();
            if (currentFocus > -1) {
              /*and simulate a click on the "active" item:*/
              if (x) x[currentFocus].click();
            }
          }
      });
      function addActive(x) {
        /*a function to classify an item as "active":*/
        if (!x) return false;
        /*start by removing the "active" class on all items:*/
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        /*add class "autocomplete-active":*/
        x[currentFocus].classList.add("autocomplete-active");
      }
      function removeActive(x) {
        /*a function to remove the "active" class from all autocomplete items:*/
        for (var i = 0; i < x.length; i++) {
          x[i].classList.remove("autocomplete-active");
        }
      }
      function closeAllLists(elmnt) {
        /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
          if (elmnt != x[i] && elmnt != inp) {
          x[i].parentNode.removeChild(x[i]);
        }
      }
    }
    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
    }

    document.querySelector('form').addEventListener('submit', function(event) {
      event.preventDefault();
      // measure response time
      var endTime = performance.now();
      var response_time = endTime - startTime;

      // create object to hold responses
      var question_data = {};
      for(var i=0; i<trial.tags; i++){
        var match = display_element.querySelector('#jspsych-tag-'+i);
        var id = "Q" + i;

        var val = match.value;
        var obje = {};
        var name = id;
        obje[name] = val;
        Object.assign(question_data, obje);
      }
      // save data
      var trial_data = {
        "rt": response_time,
        "responses": JSON.stringify(question_data),
        "question_order": JSON.stringify(question_order)
      };
      display_element.innerHTML = '';
      // next trial
      jsPsych.finishTrial(trial_data);
    });

    var startTime = performance.now();
  };

  return plugin;
})();
