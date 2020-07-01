/*jshint esversion: 6*/

/*
Description: jsPsych plugin for sorting simuli in a 2D space (an 'arena') to derive a measure of similarty
This requires a number of packages. Preferlably load them in the main experiment page,
otherwise they'll be downloaded from cdnjs.cloudflare.com when the trial begins
They are:
jquery
math (different from Math, included in base js)
d3
lodash

Author: Justin Sulik
Contact:
 justin.sulik@gmail.com
 twitter.com/justinsulik
 github.com/justinsulik
 justinsulik.com


 to do:
 set max imgs to display at one time
 prevent trial of just two items (need to rejig order of decisions)
 if > 10 imgs, display on both sides of arena
 check+load libraries
 fix cardinal points being shaved off
*/


jsPsych.plugins["multi-arrangement"] = (function() {

  var plugin = {};

  plugin.info = {
    name: "multi-arrangement",
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
        description: 'Array of stimuli to arrange.'
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
      },
      threshold: {
        type: jsPsych.plugins.parameterType.FLOAT,
        default: 0.5,
        description: 'Evidence weight threshold. When all items have a total evidence weight above this threshold, the trial ends.'
      },
      timeout: {
        type: jsPsych.plugins.parameterType.INT,
        default: 600000,
        description: 'Time out ends the trial, even if the evidence-weight threshold has not been reached'
      },
      imgWidth: {
        type: jsPsych.plugins.parameterType.INT,
        default: 160,
        description: 'Width in pixels for displaing the stimulus image'
      }
    }
  };

  plugin.trial = function(display_element, trial) {

    // trial variables
    var stimList = trial.stimuli.slice();
    var stimNumber = stimList.length;
    var trialData = {rts: []};
    var arrangements = [];

    // setup basic html
    var css = '<style id="jspsych-similarity-css"></style>';
    var htmlTop = '<div id="top" style="width:900px;height:60px;font-size:12px;margin:auto;">'+trial.prompt+'</div>';
    var htmlLeft = '<div id="sidebar_1" class="sidebar" style="width:'+(trial.imgWidth*2+50)+'px;height:'+trial.width+'px;"></div>';
    var htmlRight = '<div id="sidebar_2" class="sidebar" style="width:'+(trial.imgWidth*2+50)+'px;height:'+trial.width+'px;"></div>';
    var svg = '<svg id="arena" style="width:'+trial.width+'px;height:'+trial.width+'px;"></svg>';
    var htmlArena = '<div id="arena-container" style="width:'+trial.width+'px; height:'+trial.width+'px;">'+svg+'</div>';
    var htmlBottom = '<div id="bottom-container" style="display:flex">'+htmlLeft+htmlArena+htmlRight+'</div>';

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
    var cssString = '.img_container {display: inline-block; padding: 1px; width: '+(trial.imgWidth+3)+'px; height: 116px; position: relative; left: -'+(trial.imgWidth/2)+'px; }';
    cssString += 'img {position: absolute; z-index: 9; cursor: move;}';
    cssString += '.outside:hover {border: 2px solid red}';
    cssString += '.inert {color: #C0C0C0;}';
    cssString += '.clickable {color: black;}';
    $('#jspsych-similarity-css').html(cssString);

/**
 * Trial control functions
 */

    // Start the trial with the full set of stims
    $(document).ready(function(){
      runTrial();
    });

    function runTrial(){
      // clear images
      $('.sidebar').html('');

      if (arrangements.length>0){
        // lift the weakest
        var nextSubset = liftTheWeakest(arrangements);
        stimList = _.map(nextSubset, function(d){
          return trial.stimuli[d];
        });
      }
      // shuffle image order
      var stimsShuffled = jsPsych.randomization.repeat(stimList, 1);
      // add images to sidebar
      stimsShuffled.forEach(function(e, i){
        var idString = 'stim_'+i;
        if (i<trial.stimuli.length/2){
          $('#sidebar_1').append('<div id="static_'+idString+'" class="img_container"><img id="'+idString+'" stimName="'+e+'" class="outside" src="./img/gifCroppedOptimized/'+e+'.' + trial.suffix + '" style="width:'+trial.imgWidth+'px"/></div>');
        } else {
          $('#sidebar_2').append('<div id="static_'+idString+'" class="img_container"><img id="'+idString+'" stimName="'+e+'" class="outside" src="./img/gifCroppedOptimized/'+e+'.' + trial.suffix + '" style="width:'+trial.imgWidth+'px"/></div>');
        }

        DragElement(document.getElementById(idString));
      });
    }

/**
 * Functions for handling inputs
 */

    $('#reset').on('click', function(){
      // reset images back to the sidebar
      runTrial(stimList);
    });

    $('#finish').on('click', function(){
      // check if all images in arena
      var done = allInside();
      if (done){
        proceed();
      } else {
        alert("You cannot finish this trial until all the images are inside the circle. Once they are inside, their border will no longer appear red when you hover over them, and this button will no longer appear greyed out.");
      }

    });

    $('#random').on('click', function(){
      // clear images and reset
      $('.sidebar').html('');
      runTrial(stimList);
      $('.outside').each(function(index,element){
        randomlyPlace(element);
        resolveStatus(element);
      });
    });

/**
 * Functions for draggable images
 */

    var allInside = function(){
      // check if all the images are inside the arena
      var inside = 0;
      $('img').each(function(i, e){
        if (e.classList.contains('inside')){
          inside += 1;
        }
      });

      if (inside==stimList.length){
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
        // stop dragging when mouse released:
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
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

/**
 * Functions for handling data and ending the trial
 */

   class Arrangement {
      /**
       * An object containing the data for one arrangement of stims
       */
       constructor(data) {
         /**
          * @param {object} data Data output by getData() function
          */
          this.stims = data;
       }

       distance() {
         /**
          * Return a 2D matrix with eucludian distances between all pairs of points
          */
          var stims = this.stims;
          var distanceArray = _.map(stims, function(d1, i){
            var dist_ = _.map(stims, function(d2, j){

              if(!d1 || !d2){
                return NaN;
              } else {
                var x1 = d1.coords.x;
                var y1 = d1.coords.y;
                var x2 = d2.coords.x;
                var y2 = d2.coords.y;
                if(d1.id!=d2.id){
                  return Math.hypot(x2-x1, y2-y1);
                } else {
                  return NaN;
                }
              }
            });
            return dist_;
          });
          return math.matrix(distanceArray);
       }

       distanceSq(matrix) {
         /**
          * Return a matrix with distances squared
          */
         var dist = this.distance();
         var distSq = math.square(dist);
         return math.square(dist);
       }
    }

    function proceed() {
      /**
       * Test whether either of the ending criteria have been met
       * If so, finish the trial. Else run another trial.
       */

      var stims = getData();
      var dataArr = new Arrangement(stims);
      arrangements.push(dataArr);

      // decide either to do another trial, or finish
      var endTime = (new Date()).getTime();
      var rt = endTime-startTime;
      trialData.rts.push(rt);
      var evidenceOk = passedThreshold();
      if (rt >= trial.timeout || evidenceOk ){
        // end the trial
        display_element.innerHTML = '';
        trialData.arrangements = arrangements;
        trialData.rdm = dissimilarity(arrangements);
        console.log(trialData);
        jsPsych.finishTrial(trialData);
      } else {
        // run another trial
        runTrial();
      }
    }

    function passedThreshold() {
      // Check if all evidence weights are above trial threshold
      var evidenceWeights = evidenceMatrix(arrangements);
      var pass = true;
      evidenceWeights.map(function(value, [row, col]){
        if (value <= trial.threshold && row != col){
          pass = false;
        }
      });
      console.log('passed evidence threshold: ', pass);
      return pass;
    }

    function getData() {
      var stims = new Array(trial.stimuli.length);
      $('img').each(function(i,element){
        var stimName = element.getAttribute('stimName');
        var stimIndex = trial.stimuli.indexOf(stimName);
        var coords_ = coords(element, normed=true);
        stims[stimIndex] = {id: stimName, coords: coords_};
      });
      return stims;
    }

    var startTime = (new Date()).getTime();

/**
 * Functions for handling the multiarrangement iterations
 * based on the algorithms described in Kriegeskorte & Mur (2012)
 */

    function weakestEvidence(evidence_matrix){
      /* Find the item pair with the weakest current dissimilarity-evidence
       *  I.e. the minimum value in the matrix
       */
      var accumulator = {row: null, col: null, min_val: Number.POSITIVE_INFINITY};
      evidence_matrix.forEach(function(value,[row,col]){
        if(value < accumulator.min_val && row!=col){
          accumulator.row = row;
          accumulator.col = col;
          accumulator.min_val = value;
        }
      });
      return accumulator;
    }

    function evidenceMatrix(arrangements){
      /* Estimate the combined current evidence for the dissimilarity
       * of each item pair by summing the evidence weights across trials where
       * evidence weight = onscreen distance squared
       */
      var evidence_matrix = _.reduce(arrangements, function(accumulator, arrangement){

        accumulator = addMatrices(arrangement.distanceSq(), accumulator);
        return accumulator;
      }, zeroMatrix());
      // console.log('evidence', evidence_matrix);
      return evidence_matrix;
    }

    function liftTheWeakest(arrangements, time=0){
      /**
       * Calculate what subset of items to test in the next round
       * @param {Array} arrangements A list of all previous arrangements (see Arrangement class below)
       */
      var currentEvidenceMatrix = evidenceMatrix(arrangements, trial.stimuli.length);
      var weakest = weakestEvidence(currentEvidenceMatrix);
      // initialise the next Item-SubSet for the follow trial with those two values
      var nextISS = [weakest.row, weakest.col];
      // initialize current-trial efficiency
      var curTE = 0;
      evaluateEfficiency(curTE, arrangements, currentEvidenceMatrix, nextISS);
      return nextISS;
    }

    // currently allowing sets of 2. should definitely include at least 3 so looping isn't happening in right place
    // should evaluate, then return next_SS (if len > 2) or next_SS + optItem
    function evaluateEfficiency(cur_te, arrangements, current_evidence_matrix, next_iss){
      // Estimate of current dissimilarity
      var currentDissimilarity = dissimilarity(arrangements);
      // find the next item to add
      var optItem = findOptItem(currentDissimilarity, current_evidence_matrix, next_iss);
      // calculate trial effeciency as benefit/cost
      var cost = Math.pow(next_iss.length+1, 1.5);
      var trialEfficiency = optItem.benefit/cost;
      if (trialEfficiency<=cur_te || next_iss.length == trial.stimuli.length - 1){
        return next_iss;
      } else {
        next_iss.push(optItem.candidate);
        evaluateEfficiency(trialEfficiency, arrangements, current_evidence_matrix, next_iss);
      }
    }

    function findOptItem(current_dissimilarity, current_evidence, next_subset){
      /**
       * For each item in the current matrix not already in the next subset,
       * evaluate the trial efficiency if that item were in the next subset.
       * Identify the item that would maximise the trial efficiency
       */

       /* Iterate over the stims not already in the nextISS to find the candidate
        * that maximises the trial benefit
        */
       var nextCandidate = _.reduce(_.range(trial.stimuli.length), function(accumulator, stim_number){
         if(!next_subset.includes(stim_number)){

           var indexes = next_subset.slice();
           indexes.push(stim_number);

           var scale_factor = scaleFactor(current_dissimilarity, indexes);
           var potentialSubsetScaled = scalePotentialSubset(current_dissimilarity, indexes, scale_factor);

           // Calculate the expected evidence utility of the potential subset
           var evidence_gain = evidenceGain(potentialSubsetScaled, current_evidence);

           if (evidence_gain > accumulator.benefit){
             accumulator.candidate = stim_number;
             accumulator.benefit = evidence_gain;
           }
         }
         return accumulator;
       }, {candidate: null, benefit: 0});

       return nextCandidate;
    }

    function evidenceUtility(evidence_weight){
      var d = 10;
      return 1 - Math.exp(-1*evidence_weight*d);
    }

    function dissimilarity(arrangements){
      /**
      * Weighted average of iteratively scaled-to-match subset dissimilarity matrices
      */
      var seed = initialEstimate(arrangements);
      var scaled = scaleArrangements(arrangements, seed);
      var threshold = Number.POSITIVE_INFINITY;
      iterations = 0;
      var next_estimate;

      while (threshold>0.01 && iterations < 50){
        next_estimate = scaledWeightedAverage(arrangements, scaled);
        var difference = math.subtract(next_estimate, seed);
        var differenceRMS = rms(difference);
        threshold = differenceRMS;
        iterations+=1;
        seed = next_estimate;
      }
      return next_estimate;
    }


    function initialEstimate(arrangements){
      /**
       * Compute an initial estimate of the RDM used weighted-averaging of subset RDMs
       */

      var initial_estimate;
      if (arrangements.length == 1) {
        /* If a full arrangement (e.g. from the first trial) is included,
         * use this as the current RDM estimate */
        initial_estimate = arrangements[0].distance();
      } else {
        /* Otherwise, use the evidence-weighted averge across arrangements of the
         * on-screen distances as the current RDM estimate */
        initial_estimate = weightedAverage(arrangements);
      }
      // Scale to have an RMS of 1
      initial_estimate = scaleMatrix(initial_estimate);
      // console.log('estimate ', initial_estimate);
      return initial_estimate;
    }

    function weightedAverage(){
      // Provide evidence-weighted average as seed
      var fraction = _.reduce(arrangements, function(accumulator, arrangement){
        accumulator.numerator = addMatrices(accumulator.numerator, math.dotMultiply(arrangement.distanceSq(), arrangement.distance()));
        accumulator.denominator = addMatrices(accumulator.denominator, arrangement.distanceSq());
        return accumulator;
      }, {numerator: zeroMatrix(), denominator: zeroMatrix()});
      var average = math.dotDivide(fraction.numerator, fraction.denominator);
      return average;
    }

    function addMatrices(matrix1, matrix2){
      // Unlike plain math.add, treat NaNs as zeros for the purposes of adding matrices
      return math.add(fillNaNs(matrix1), fillNaNs(matrix2));
    }

    function fillNaNs(matrix){
      var matrix_ = matrix.map(function(value){
        if (isNaN(value)){
          return 0;
        } else {
          return value;
        }
      });
      return matrix_;
    }

    function zeroMatrix(){
      return math.zeros(trial.stimuli.length, trial.stimuli.length);
    }

    function scaleArrangements(arrangements, seed){
      /* Scale the distance matrix of the arrangement,
       * such that the RMS of its distances match the RMS
       * of the same item pair entries of the current RDM estimate
       */
      var scaled = _.map(arrangements, function(arrangement, i){
        // Create a list of stims used in a particular trial
        var includedIndexes = [];
        arrangement.stims.forEach(function(stim){
          if (stim.id){
            includedIndexes.push(trial.stimuli.indexOf(stim.id));
          }
        });
        // Subset the current (seed) estimate to include only the rows/columns corresponding to those stims
        var seedSubset = math.subset(seed, math.index(includedIndexes, includedIndexes));
        // Calculate the RMS of that subset
        var rmsSeedSubset = rms(seedSubset);
        // Scale the distances of the current arrangement to match the rms of the
        // corresponding items from the subsetted seed
        var distances = arrangement.distance();
        var arrangementScaled = math.multiply(math.divide(distances,rms(distances)), rmsSeedSubset);
        return arrangementScaled;
      });

      return scaled;
    }

    function scaledWeightedAverage(arrangements, scaled){
      // Replace the current RDM estimate with an evidence-weighted average of the scaled distance matrices

      // Iterate over each pair of items ...
      var next_estimate = _.map(_.range(trial.stimuli.length), function(i){
        row_estimate = _.map(_.range(trial.stimuli.length), function(j){
          if (i!=j){
            // ... and then across all trials that pair appeared in
            var cell_estimate = _.reduce(arrangements, function(accumulator, trial, trial_index){
              var scaled_distance = math.subset(scaled[trial_index], math.index(i,j));
              var unscaled_distance_sq = math.subset(trial.distanceSq(), math.index(i,j));
              upper = isNaN(scaled_distance*unscaled_distance_sq) ? 0 : scaled_distance*unscaled_distance_sq;
              lower = isNaN(unscaled_distance_sq) ? 0 : unscaled_distance_sq;
              accumulator.numerator += upper;
              accumulator.denominator += lower;
              return accumulator;
            }, {numerator: 0, denominator: 0});

            cell_estimate = cell_estimate.numerator/cell_estimate.denominator;
            return cell_estimate;
          } else {
            return NaN;
          }
        });
        return row_estimate;
      });
      return math.matrix(next_estimate);
    }

    function rms(matrix){
      /* Calculate the root mean square (RMS) of the matrix values.
       * Doing it in this roundabout way, since math.mean(matrix) can't cope with NaNs
       */
      var matrix_squared = math.square(matrix);
      var total_ = 0;
      var count_ = 0;
      matrix_squared.map(function(value){
        if (!isNaN(value)){
          total_ += value;
          count_ += 1;
        }
      });
      var mean_ = total_/count_;
      var rms_ = math.sqrt(mean_);
      return rms_;
    }

    function scaleMatrix(matrix, scale_factor=null){
      // If no scale factor is provided, scale the matrix to have an RMS of 1
      if (!scale_factor){
        scale_factor = rms(matrix);
      }
      var normed = math.dotDivide(matrix, scale_factor);
      return normed;
    }

    function scaleFactor(current_dissimilarity, indexes){
      /**
       * Assuming the most distant pair of items in the potential subset are placed
       * at opposite ends of the arena, they would have a distance of 1
       * Find the scaling factor that, multiplied by the current dissimilarity subset,
       * would yield a max distance of 1
       */
      var tempSubset = math.subset(current_dissimilarity, math.index(indexes,indexes));
      var maxDistance = 0;
      var temp_ = tempSubset.map(function(value, [row,col]){
        if (value>maxDistance){
          maxDistance = value;
        }
      });
      var scale_factor = 1/maxDistance;
      return scale_factor;
    }

    function scalePotentialSubset(current_dissimilarity, indexes, scale_factor){
      // Scale the potential subset to have a max distance of 1
      var scaled = current_dissimilarity.map(function(value, [row,col]) {
        if (indexes.includes(row) && indexes.includes(col)) {
          return value*scale_factor;
        } else {
          return 0;
        }
      });
      return scaled;
    }

    function evidenceGain(potential_subset_scaled, current_evidence){
      /**
       * Work out utility of current evidence, and of potential subset
       * Calculate the gain in evidence utility
       */
      var currentEvidenceUtility = current_evidence.map(function(value){
        return evidenceUtility(value);
      });
      var potentialEvidence = math.square(potential_subset_scaled);
      var totalEvidence = addMatrices(potentialEvidence, current_evidence);
      var potentialEvidenceUtility = totalEvidence.map(function(value){
        return evidenceUtility(value);
      });

      var difference = math.subtract(potentialEvidenceUtility, currentEvidenceUtility);
      var gain = 0;
      difference.map(function(value){
        if (!isNaN(value)){
          gain+=value;
        }
      });
      return gain;
    }

  };

  return plugin;
})();
