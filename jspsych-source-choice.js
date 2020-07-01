/*
Description: jsPsych plugin for running a decision-making task that tests people's sensitivity to non-independence of information
Preferably load p5.min.js in the main experiment page (otherwise it will be downloaded from cdnjs.cloudflare.com)

Author: Justin Sulik
Contact:
 justin.sulik@gmail.com
 justinsulik.com,
 twitter.com/justinsulik
 github.com/justinsulik
*/

jsPsych.plugins['source-choice'] = (function(){

  var plugin = {};

  plugin.info = {
    name: 'source-choice',
    parameters: {
      training: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        pretty_name: 'Training trial',
        default: false,
        description: 'If true, shows only the instructions so participants can see how a trial would work'
      },
    }
  };

  plugin.trial = function(display_element, trial){

    // check if p5 script is loaded
    if (window.p5){
        console.log('p5 already loaded...');
        createSketch();
    } else {
      $.ajax({
          url: "https://cdnjs.cloudflare.com/ajax/libs/p5.js/0.5.16/p5.min.js",
          dataType: "script",
          success: function() {
            console.log("p5 downloaded...");
            createSketch();
          }
      });
    }

    // set up basic html for trial

    var css = '<style id="jspsych-source-choice-css"></style>';
    var html = '<div id="mainSketchContainer"></div>';

    display_element.innerHTML = css + html;

/*
 P5.js Pseudo-classes for multiple sketches
*/

  function createSketch(){
    var mainSketch = new p5(function( sketch ) {

      // declare sketch variables
      var logo1;
      var logo2;
      var logo3;


      // sketch functions & pseudo-classes


      // preload images

      sketch.preload = function() {
        logo1 = sketch.loadImage('/Documents/munich/stream1/pragmatics/material/tvlogos/edited/0.png');
      };

      // set up sketch

      sketch.setup = function() {
        logo1.loadPixels();
        sketch.createCanvas(800, 600);
      };

      // draw sketch

      sketch.draw = function() {

        sketch.background(255);

      };

    }, 'mainSketchContainer');

  }
};

  return plugin;

})();
