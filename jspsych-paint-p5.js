/**
 * jspsych-survey-likert
 * a jspsych plugin for measuring items on a likert scale
 *
 * Josh de Leeuw
 *
 * documentation: docs.jspsych.org
 *
 * customization: made labels clickable
 */

jsPsych.plugins['paint'] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'paint',
    description: '',
    parameters: {
      preamble: {
        type: jsPsych.plugins.parameterType.STRING,
        default: '',
        description: "Preamble for the task"
      },
      labels: {
        type: jsPsych.plugins.parameterType.INT,
        array: true,
        default: ['Comfortable', 'Neutral', 'uncomfortable'],
        description: 'Array of labels for the coloring categories'
      },
      color_type: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'continuous',
        description: 'Whether colors are presented as CONTINUOUS strip or DISCRETE categories. Former just needs RGB values for end-points; latter needs RGB for each category'
      },
      colors: {
        type: jsPsych.plugins.parameterType.STRING,
        default: [[255, 0, 0], [0, 255, 255]],
        array: true,
        description: 'RGB values for color categories (array of arrays)'
      },
      silhouettes: {
        type: jsPsych.plugins.parameterType.STRING,
        array: true,
        description: 'Color-able parts'
      },
      masks: {
        type: jsPsych.plugins.parameterType.STRING,
        array: true,
        description: 'Non-color-able parts'
      }
    }
  };

  plugin.trial = function(display_element, trial) {

    var css = '<style id="jspsych-paint-css">';
    css += '.preamble {margin-bottom: 20px; font-weight: bold;}';

    // css += '#paint-board {border: 1px solid grey}';
    css += '</style>';

    var height = 480;
    var width = 720;
    var start_time;
    var trial_data = {};


    var html = '';
    if(trial.preamble){
      html += '<div class="preamble">'+trial.preamble+'</div>';
    }
    html += '<div id="paint-board" style="width: 100%" >';
    html += '<div id="paint-canvas" class="inline" style="height: '+height+'px; width: '+width+'px"></div>';
    html += '</div>';

    var submit = '<div>'+
                  '<br><button type="button" id="submit">Submit</button>'+
                  '</div>';

    display_element.innerHTML = css + html + submit;
    var paths = [{color: 128, line: [], radius: 30}];


    var main_sketch = new p5(function( sketch ){

      var sketch_width = $('#paint-canvas').width();
      var sketch_height = $('#paint-canvas').height();
      var silhouettes = [];
      var masks = [];
      var c = 128;
      var r = 30;
      var slider;
      var slider_size = 100;
      var button_size = 30;

      sketch.preload = function(){
        trial.silhouettes.forEach(function(d,i){
          var imgPath = 'img/body/'+d;
          silhouettes.push(sketch.loadImage(imgPath));
        });
        trial.masks.forEach(function(d,i){
          var imgPath = 'img/body/'+d;
          masks.push(sketch.loadImage(imgPath));
        });
      };

      sketch.setup = function(){
        var canvas = sketch.createCanvas(sketch_width, sketch_height);
        var canvas_pos = canvas.position();
        sketch.background(255);
        sketch.textSize(16);

        slider = sketch.createSlider(5, 100, 30, 5);
        slider.size(slider_size);
        slider.position(canvas_pos.x + 0.7*sketch_width-slider_size/2, canvas_pos.y + 2*sketch_height/3);

        button = sketch.createButton('<img src="img/icons/undo.png" style="width:'+button_size+'px; height:'+button_size+'px">');
        button.position(canvas_pos.x + 0.69*sketch_width-button_size/2, canvas_pos.y + 0.3*sketch_height);
        button.mousePressed(undoPaint);

        silhouettes.forEach(function(img){
          img.loadPixels();
        });
        masks.forEach(function(img){
          img.loadPixels();
        });
        start_time = Date.now();
      };

      sketch.draw = function(){
        r_new = slider.value();
        if(r_new != r){
          paths.push({color: c, radius: r_new, line: []});
        }
        r = r_new;
        sketch.stroke(255);

        // grey background for bodies
        sketch.push();
          sketch.fill(128);
          sketch.rect(0, 0, 2*sketch_width/3, sketch_height);
        sketch.pop();

        // draw lines
        sketch.push();
          paths.forEach(function(d){
            sketch.stroke(d.color);
            sketch.fill(d.color);
            sketch.strokeWeight(d.radius);
            d.line.forEach(function(points){
              sketch.line(points[0], points[1], points[2], points[3]);
            });
          });
        sketch.pop();

        // mask lines
        masks.forEach(function(mask){
          sketch.image(mask, 0, 0, sketch_width/3, sketch_height);
          sketch.image(mask, sketch_width/3, 0, sketch_width/3, sketch_height);
        });

        // white background
        sketch.push();
          sketch.fill(255);
          sketch.rect(2*sketch_width/3, 0, sketch_width/3, sketch_height);
        sketch.pop();

        createColorPicker();
        cursor();

        // current color block
        sketch.push();
          sketch.stroke(0);
          sketch.fill(c);
          sketch.rect(sketch_width/3-30, 1, 60, 40);
        sketch.pop();

        // labels
        sketch.textAlign(sketch.CENTER);
        sketch.text("Current color", sketch_width/3, 55);
        sketch.text("Brush size", 0.7*sketch_width, 2*sketch_height/3 + 40);
        sketch.text("Undo", 0.7*sketch_width, 0.3*sketch_height - 10);
        sketch.textSize(11);
        sketch.text("front", sketch_width/6, 10);
        sketch.text("back", sketch_width/2, 10);
        sketch.textAlign(sketch.RIGHT);
        sketch.textSize(18);
        trial.labels.forEach(function(label,i){
          sketch.text(label, 5*sketch_width/6-5, 15+(sketch_height-20)*(i/(trial.labels.length-1)));
        });

      };

      sketch.mousePressed = function(){
        if(sketch.mouseX > 5*sketch_width/6){// press in palette area
          c = sketch.get(sketch.mouseX, sketch.mouseY);
          if(paths[paths.length-1].line.length==0){ // update current color
            paths[paths.length-1].color = c;
          }
        } else if (sketch.mouseX < 2*sketch_width/3){// press in paint area
          if(paths[paths.length-1].line.length>0){
            paths.push({color: c, radius: r, line: []});
          }
        }
      };

      sketch.mouseDragged = function(){
        if(sketch.mouseX < 2*sketch_width/3 && sketch.pmouseX < 2*sketch_width/3){
          paths[paths.length-1].line.push([sketch.mouseX, sketch.mouseY, sketch.pmouseX, sketch.pmouseY]);
        }
      };

      sketch.mouseClicked = function(){
        if(sketch.mouseX > 5*sketch_width/6){
          c = sketch.get(sketch.mouseX, sketch.mouseY);
        } else if (sketch.mouseX < 2*sketch_width/3){
          paths[paths.length-1].line.push([sketch.mouseX, sketch.mouseY, sketch.pmouseX, sketch.pmouseY]);
        }
      };

      function cursor() {
        if(sketch.mouseX > 0 && sketch.mouseY > 0){
          sketch.push();
            sketch.stroke(0);
            if(sketch.mouseX < 5*sketch_width/6){
              sketch.fill(c);
            } else {
              sketch.noFill();
              // r = sketch.mouseX - 5*sketch_width/6;
            }
            sketch.circle(sketch.mouseX, sketch.mouseY, r);
          sketch.pop();
        }
      }

      function undoPaint(){
        var removed = paths.pop();
      }

      function createColorPicker() {
        var panel_width = sketch_width/6;
        colorPicker = sketch.createImage(panel_width, sketch_height);
        colorPicker.loadPixels();
        from = sketch.color(0, 255, 255);
        to = sketch.color(255 ,0 , 0);
        for (var y = 0; y < sketch_height; y++) {
          for (x = 0; x < panel_width; x++) {
            color1 = sketch.lerpColor(from, to, y / sketch_height);
            colorPicker.set(x, y, color1);
          }
        }
        colorPicker.updatePixels();
        sketch.image(colorPicker, 5/6*sketch_width, 0);
      }

    }, 'paint-canvas');

    $('#submit').on('click', function(e){
      var responses = getResponses();
      endTrial(responses);
    });

    function getResponses(){
      var responses = {};
      responses.paths = paths;
      responses.height = 480;
      responses.width = 720;
      return responses;
    }

    function endTrial(responses){
      var end_time = Date.now();
      var rt = end_time - start_time;
      trial_data.rt = rt;
      trial_data.responses = JSON.stringify(responses);

      // kill any remaining setTimeout handlers/listeners
      jsPsych.pluginAPI.clearAllTimeouts();
      $('body').off();

      // clear screen
      main_sketch.remove();
      display_element.innerHTML = '';

      jsPsych.finishTrial(trial_data);
      console.log(trial_data);
    }

  };

  return plugin;
})();
