/*jshint esversion: 6*/

/*
Description: jsPsych plugin for sorting simuli in a 2D space (an 'arena') to derive a measure of similarty
Preferably load d3.min.js in the main experiment page (otherwise it will be downloaded from cdnjs.cloudflare.com when the trial begins)

Author: Justin Sulik
Contact:
 justin.sulik@gmail.com
 twitter.com/justinsulik
 github.com/justinsulik
 justinsulik.com


 to do:
 collect, check, save data
 fix cardinal points being shaved off
*/


jsPsych.plugins["similarity"] = (function() {

  var plugin = {};

  plugin.info = {
    name: "similarity",
    parameters: {
      shape: {
        type: jsPsych.plugins.parameterType.STRING, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: 'rect',
        pretty_name: 'Shape',
        description: 'Whether the arena is rectangular or circular'
      },
      gridlines: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        default: true,
        pretty_name: 'Gridline',
        description: 'Show gridlines or not'
      },
      width: {
        type: jsPsych.plugins.parameterType.INT,
        default: 700,
        pretty_name: 'Width',
        description: 'Width of the arena (or diameter, if circle)'
      },
      height: {
        type: jsPsych.plugins.parameterType.INT,
        default: 700,
        pretty_name: 'Height',
        description: 'Height of the arena (if not circle)'
      },
      stimuli: {
        type: jsPsych.plugins.parameterType.STRING,
        default: [],
        pretty_name: 'Stimuli',
        description: 'Array of stimuli to sort'
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'Drag the images into the circle, placing them based on similarity. The red borders will disappear when enough of the image is in the circle.',
        description: 'Prompt to display at the top of the page'
      },
      divisions: {
        type: jsPsych.plugins.parameterType.INT,
        default: 5,
        description: 'How many positioning divisions to draw inside arena'
      },
      test: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        default: false,
        pretty_name: 'Test trial',
        description: 'If true, simulated decisions'
      },
      suffix: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'jpg',
        pretty_name: 'Suffix',
        description: 'File extension'
      }
    }
  };

  plugin.trial = function(display_element, trial) {

    var trial_data = {};
    // setup basic html
    var imgWidth = 160;
    var css = '<style id="jspsych-similarity-css"></style>';
    var htmlTop = '<div id="top" style="width:900px;height:80px;font-size:14px;">'+trial.prompt+'</div>';
    var htmlLeft = '<div id="sidebar" style="width:'+(imgWidth*2+50)+'px;height:'+trial.width+'px;"></div>';
    var svg = '<svg id="arena" style="width:'+trial.width+'px;height:'+trial.width+'px;"></svg>';
    var htmlRight = '<div id="arena-container" style="width:'+trial.width+'px; height:'+trial.width+'px;">'+svg+'</div>';
    var htmlBottom = '<div id="bottom-container" style="display:flex">'+htmlLeft+htmlRight+'</div>';

    display_element.innerHTML = css+'<div id="trialArea">'+htmlTop+htmlBottom+'</div>';

    // add arena
    $('#arena').html('<circle  id="cir_0" cx="'+trial.width/2+'" cy="'+trial.width/2+'" r="'+trial.width/2+'" fill="white" stroke="black"/>');
    var circleAnchor = offset(document.getElementById("cir_0"));
    var circleCenter = {x: circleAnchor.left+trial.width/2, y: circleAnchor.top+trial.width/2};

    // add buttons
    var resetButton = '<button id="reset">Reset</button>';
    var finishButton = '<button id="finish" class="inert">Finish</button>';
    var randomButton = '<button id="random">Randomise</button>';
    if (trial.test) {
      $('#top').append('<div id="buttonBar">'+resetButton+finishButton+randomButton+'</div>');
    } else {
      $('#top').append('<div id="buttonBar">'+resetButton+finishButton+'</div>');
    }

    // add rings
    for (i = trial.divisions-1; i >0; i--){
      d3.select('#arena')
        .append('circle')
        .attr('cx', trial.width/2)
        .attr('cy', trial.width/2)
        .attr('r', (i/trial.divisions)*(trial.width/2))
        .attr('fill', 'white')
        .attr('stroke', '#DCDCDC');
    }
    // add gridlines
    var pathString = 'M0 350 L700 350 M350 0 L 350 700';
    d3.select('#arena')
      .append('path')
      .attr('d', pathString)
      .attr('stroke', '#C0C0C0');

    // style
    var cssString = '.img_container {display: inline-block; width: '+(imgWidth+3)+'px; height: 115px; position: relative; left: -'+(imgWidth/2+1)+'px; }';
    cssString += 'img {position: absolute; z-index: 9; cursor: move;}';
    cssString += '.outside:hover {border: 2px solid red}';
    cssString += '.inert {color: #C0C0C0;}';
    cssString += '.clickable {color: black;}';
    $('#jspsych-similarity-css').html(cssString);

    // shuffle stimuli and add to side bar
    var setup = function(){
      var stimsShuffled = jsPsych.randomization.repeat(trial.stimuli, 1);
      stimsShuffled.forEach(function(e, i){
        var idString = 'stim_'+i;
        $('#sidebar').append('<div id="static_'+idString+'" class="img_container"><img id="'+idString+'" stimName="'+e+'" class="outside" src="./img/'+e+'.' + trial.suffix + '" style="width:'+imgWidth+'px"/></div>');
        DragElement(document.getElementById(idString));
      });
    };

    setup();

    // button functionality

    $('#reset').on('click', function(){
      // clear images
      $('#sidebar').html('');
      // reset images
      setup();
    });

    $('#finish').on('click', function(){
      // check if all images in arena
      var done = allInside();
      if (done){
        finishTrial();
      } else {
        alert("You cannot finish this trial until all the images are inside the circle. Once they are inside, their border will no longer appear red when you hover over them, and this button will no longer appear greyed out.");
      }

    });

    $('#random').on('click', function(){
      // clear images and reset
      $('#sidebar').html('');
      setup();
      $('.outside').each(function(index,element){
        randomlyPlace(element);
        resolveStatus(element);
      });
    });

    var allInside = function(){
      // check if all the images are inside the arena
      var inside = 0;
      $('img').each(function(i, e){
        if (e.classList.contains('inside')){
          inside += 1;
        }
      });

      if (inside==trial.stimuli.length){
        return true;
      } else {
        return false;
      }
    };

    // class for making images draggable
    // based on https://www.w3schools.com/howto/howto_js_draggable.asp
    function DragElement(element) {
      var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      element.onmousedown = dragMouseDown;

      function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
        // work out where it is in relation to the circular arena
      }

      function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        topPoint = element.offsetTop - pos2;
        leftPoint = element.offsetLeft - pos1;
        element.style.top = (topPoint) + "px";
        element.style.left = (leftPoint) + "px";
        // var euclidian = distanceFromCenter(element);
        resolveStatus(element);
      }

      function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
      }

    }

  function resolveStatus(element){

    var distance = distanceFromCenter(element);
    // console.log(distance)

    if (distance < trial.width/2){
      element.classList.remove('outside');
      element.classList.add('inside');
    } else {
      element.classList.remove('inside');
      element.classList.add('outside');
    }
    var done = allInside();
    if (done){
      $('#finish').css('color', 'black');
    } else {
      $('#finish').css('color', '#C0C0C0');
    }
  }

  function distanceFromCenter(element){
    /* Calculate how far the image's centre is from the arena's centre */
    var delta = coords(element);
    var euclidian = Math.round(Math.sqrt(Math.pow(delta.x, 2)+Math.pow(delta.y, 2)), 2);
    return euclidian;
  }

  function coords(element, normed=false){
    /* Calculate x,y coordinates for image (relative to arena centre) */
    var centerCoords = imgCenter(element);
    var delta = {x: centerCoords.x-circleCenter.x, y: circleCenter.y-centerCoords.y};
    if (normed) {
      delta.x = delta.x/(trial.width);
      delta.y = delta.y/(trial.height);
    }
    return delta;
  }

  function imgCenter(element){
    // Return x,y coordinates for the center of the image (relative to the parent div)
    var imgAnchor = offset(element);
    var centerCoords = {x: imgAnchor.left+element.width/2, y:imgAnchor.top+element.height/2};
    return centerCoords;
  }

  function randomlyPlace(element){
    var imgAnchor = offset(element);
    var centerCoords = imgCenter(element);
    var distFromCentSq = Math.pow(Math.random()*trial.width/2, 2);
    // allow root to be positive or negative
    var xSide = Math.random()<0.5 ? 1 : -1;
    var ySide = Math.random()<0.5 ? 1 : -1;
    var xSq = Math.random()*distFromCentSq;
    var ySq = distFromCentSq-xSq;
    var newOffset = {x: xSide*Math.sqrt(xSq)-imgAnchor.left, y: ySide*Math.sqrt(ySq)-imgAnchor.top};
    $(element).css({'left': circleCenter.x+newOffset.x,
                  'top': circleCenter.y+newOffset.y});
  }

  function offset(element) {
      var rect = element.getBoundingClientRect(),
      scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
      scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
  }

  function finishTrial() {
    var stims = getData();
    var endTime = (new Date()).getTime();
    var rt = endTime-startTime;
    trial_data.rt = endTime - startTime;
    // display_element.innerHTML = '';
    trial_data.stims = stims;
    jsPsych.finishTrial(trial_data);
  }

  function getData() {
    var stims = [];
    $('img').each(function(i,element){
      var stimName = element.getAttribute('stimName');
      var stimIndex = trial.stimuli.indexOf(stimName);
      var coords_ = coords(element, normed=true);
      stims[stimIndex] = {id: stimName, coords: coords_};
    });
    return stims;
  }

  var startTime = (new Date()).getTime();
  };

  return plugin;
})();
