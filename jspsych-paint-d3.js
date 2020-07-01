/*
 jsPsych plugin for body typology task (based on emBODY task, https://doi.org/10.1073/pnas.1321664111)
 LOAD D3.JS in the main experiment script

 // Author: Justin Sulik
 // Contact:
 //  justin.sulik@gmail.com
 //  twitter.com/justinsulik
 //  github.com/justinsulik
 //  justinsulik.com

 */

jsPsych.plugins['paint'] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'paint',
    description: '',
    parameters: {
      instructions: {
        type: jsPsych.plugins.parameterType.STRING,
        default: '',
        description: "instructions for the task"
      },
      labels: {
        type: jsPsych.plugins.parameterType.INT,
        array: true,
        default: ['uncomfortable', 'comfortable'],
        description: 'Array of labels for the coloring categories'
      },
      colors: {
        type: jsPsych.plugins.parameterType.STRING,
        default: [[255, 0, 0], [0, 255, 255]],
        array: true,
        description: 'RGB values for color categories (array of arrays)'
      },
      mask_labels: {
        type: jsPsych.plugins.parameterType.STRING,
        default: ['front', 'back'],
        array: true,
        description: 'RGB values for color categories (array of arrays)'
      },
      submit: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'Continue',
        description: 'text for submit button'
      },
      lg: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'en',
        description: 'language'
      },
      mask: {
        type: jsPsych.plugins.parametersType.STRING,
        default: 'img/body/body_mask.png',
        description: 'path to the mask image'
      }
    }
  };

  plugin.trial = function(display_element, trial) {

/***
Setup
***/

    var css = '<style id="jspsych-paint-css">';
    css += '.paint-instructions {padding: 5px; margin: 0px; font-size 13px; line-height: 1.3em; text-align: left;}';
    css += '#gradient-label {justify-content: space-between; font-size: 1em; line-height:1em}';
    css += '.gradient-label.left {text-align: left}';
    css += '.gradient-label.right {text-align: right}';
    css += '#gradient-box.row {justify-content: flex-start}';
    css += '.smaller {font-size: 2vw; width: 10vw; word-break: break-word}';
    css += '.flex {display: flex; justify-content: flex-start;}';
    css += '.wrap {flex-wrap: wrap}';
    css += '.flex.spread {justify-content: space-between;}';
    css += '.flex.around {justify-content: space-around;}';
    css += '.flex.row {flex-direction: row;}';
    css += '.flex.column {flex-direction: column;}';
    css += '#color-bar {cursor: pointer}';
    css += '.paint-button {border: 1px solid grey; border-radius: 3px; padding: 5px}';
    css += '#submit {margin-top: 0px; line-height: 0.9em}';
    css += '.center {align-items: center}';
    css += '</style>';

    var start_time;
    var trial_data = {instructions: trial.instructions};
    var orientation = $(window).width() > $(window).height() ? 'landscape' : 'portrait';
    var smaller = false;
    if((orientation == 'landscape' && $(window).width()<=600)||(orientation=="portrait")){
      smaller = true;
    }
    var height;
    var width;
    var tools_flex;
    var main_flex;
    var gradient_w;
    var gradient_h;
    var starting_stroke_width = 15;
    var lineWidth = {
      value: starting_stroke_width
    };

    var brush_small = '<svg class="bi bi-brush" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'+
                '<path d="M15.213 1.018a.572.572 0 01.756.05.57.57 0 01.057.746C15.085 3.082 12.044 7.107 9.6 9.55c-.71.71-1.42 1.243-1.952 1.596-.508.339-1.167.234-1.599-.197-.416-.416-.53-1.047-.212-1.543.346-.542.887-1.273 1.642-1.977 2.521-2.35 6.476-5.44 7.734-6.411z"/>'+
                '<path d="M7 12a2 2 0 01-2 2c-1 0-2 0-3.5-.5s.5-1 1-1.5 1.395-2 2.5-2a2 2 0 012 2z"/>'+
                '</svg>';
    var brush_big = '<svg class="bi bi-brush" width="2.1em" height="2.1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'+
                '<path d="M15.213 1.018a.572.572 0 01.756.05.57.57 0 01.057.746C15.085 3.082 12.044 7.107 9.6 9.55c-.71.71-1.42 1.243-1.952 1.596-.508.339-1.167.234-1.599-.197-.416-.416-.53-1.047-.212-1.543.346-.542.887-1.273 1.642-1.977 2.521-2.35 6.476-5.44 7.734-6.411z"/>'+
                '<path d="M7 12a2 2 0 01-2 2c-1 0-2 0-3.5-.5s.5-1 1-1.5 1.395-2 2.5-2a2 2 0 012 2z"/>'+
                '</svg>';
    var brush_color = '<svg id="color-brush" class="bi bi-brush" width="4em" height="4em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'+
                '<path d="M15.213 1.018a.572.572 0 01.756.05.57.57 0 01.057.746C15.085 3.082 12.044 7.107 9.6 9.55c-.71.71-1.42 1.243-1.952 1.596-.508.339-1.167.234-1.599-.197-.416-.416-.53-1.047-.212-1.543.346-.542.887-1.273 1.642-1.977 2.521-2.35 6.476-5.44 7.734-6.411z"/>'+
                '<path d="M7 12a2 2 0 01-2 2c-1 0-2 0-3.5-.5s.5-1 1-1.5 1.395-2 2.5-2a2 2 0 012 2z"/>'+
                '</svg>';

    var html = '';
    if(trial.instructions){
      html += '<div class="paint-instructions">'+trial.instructions+'</div>';
    }
    html += '<div id="paint-container" class="flex wrap" style="width:100%;">';
    html += '<div id="paint-board" style="position:relative;"></div>';
    html += '<div id="gradient-container" class="flex"><div id="gradient-box" class="flex"><canvas id="color-bar"></canvas></div>';
    html += '<div id="gradient-label" class="flex"><div id="gradient-label-0" class="gradient-label left">'+trial.labels[0]+'</div><div id="gradient-label-1" class="gradient-label right">'+trial.labels[1]+'</div></div></div>';
    html += '<div id="paint-tools" class="flex around">';
    html += '<div id="undo-redo" class="flex around"><div id="undo" class="paint-button"><img src="img/icons/undo.png" width="20" height="20"></div>';
    html += '<div id="redo" class="paint-button"><img src="img/icons/redo.png" width="20" height="20"></div></div>';
    html += '<div id="lineWidth">';
    html += '<div class="flex spread" style="align-items: flex-end;">'+brush_small+brush_big+'</div>';
    html += '<input name="linewidth" id="linewidth" type="range" min="0.5" max="60" value="'+starting_stroke_width+'" step="0.5" style="width:100px;">';
    html += '</div>';
    html += '<div id="current-color" style="padding: 1px; border: solid 1px black;">'+brush_color+'</div>';
    html += '</div>';
    html += '</div>';

    var submit = '<div>'+
                  '<br><button type="button" id="submit">'+trial.submit+'</button>'+
                  '</div>';

    display_element.innerHTML = css + html + submit;

    function setupDivs(orientation){
      if(orientation=='landscape'){
        height = Math.min(0.6*$(window).width(), 0.9*$(window).height(), 480);
        width = height;
        gradient_w = 45;
        gradient_h = height;
        $('#paint-container').removeClass('column').addClass('row').css('width', '100%');
        $('#gradient-container').removeClass('column').addClass('row');
        $('#gradient-box').removeClass('column').addClass('row');
        $('#gradient-label').removeClass('row').addClass('column');
        $("#gradient-label-1").removeClass('right').addClass('left');
        $('#paint-tools').removeClass('row center').addClass('column');
        if(smaller){
          $('.gradient-label').addClass('smaller');
        }
      } else {
        width = Math.min(0.6*$(window).height(), 0.9*$(window).width(), 480);
        height = width;
        gradient_w = width;
        gradient_h = 45;
        $('#paint-container').removeClass('row').addClass('column').css('width', width+'px');
        $('#gradient-container').removeClass('row').addClass('column');
        $('#gradient-box').removeClass('row').addClass('column');
        $('#gradient-label').removeClass('column').addClass('row');
        $("#gradient-label-1").removeClass('left').addClass('right');
        $('#paint-tools').removeClass('column').addClass('row center');
        $('.gradient-label').removeClass('smaller');
      }
      $('#color-brush').css({'width': '2em', 'height': '2em'});
      $('#paint-board').css('width', width+'px').css('height', height+'px');
      $('#color-bar').css('width', gradient_w+'px').css('height', gradient_h+'px');
    }
    setupDivs(orientation);


/***
Canvas
***/

    var imageObj = new Image();
    imageObj.src = trial.mask;
    var strokeStyle = {value: 'grey'};

    function colorBar(orientation){
      var c = document.getElementById("color-bar");
      var ctx = c.getContext("2d");
      ctx.clearRect(0, 0, c.width, c.height);
      var grd;
      if(orientation=='landscape'){
        grd = ctx.createLinearGradient(0, 0, 0, c.height);
      } else {
        grd = ctx.createLinearGradient(0, 0, c.width, 0);
      }

      grd.addColorStop(0, "cyan");
      grd.addColorStop(1, "red");

      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, c.width, c.height);
    }
    colorBar(orientation);


    var base = d3.select('#paint-board');
    var canvas = base.append('canvas')
      .attr('width', width)
      .attr('height', height)
      .style('position', 'absolute')
      .style('background-color', 'grey')
      .style('left', 0)
      .style('top', 0)
      .style('z-index', 0);

    var mask = base.append('canvas')
      .attr('width', width)
      .attr('height', height)
      .style('position', 'absolute')
      .style('left', 0)
      .style('top', 0)
      .style('z-index', 1)
      .node()
      .getContext('2d');

    if(($(window).width()>360 && $(window).height()>360) || trial.lg=='cs'){
      mask.font = "16px Open Sans";
    } else {
      mask.font = "0.6em Open Sans";
    }
    mask.textBaseline = "hanging";

    imageObj.onload = function() {
      var shift = 35;
      if($(window).width()<=380||$(window).height()<=380){
        shift = 18;
      }
      mask.drawImage(imageObj, 0, 0, width/2, height);
      mask.drawImage(imageObj, width/2, 0, width/2, height);

      if(trial.lg!='cs'){
        mask.translate(width, 0);
        mask.rotate(0.5*Math.PI);
        mask.fillText(trial.mask_labels[0], shift, width/2+shift);
        mask.fillText(trial.mask_labels[1], shift, width/2-shift);
      } else {
        mask.fillText(trial.mask_labels[0], width/2-shift, shift);
        mask.fillText(trial.mask_labels[1], width/2+shift, shift);
      }

    };

    var context = canvas.node().getContext('2d');

    var strokes = context.canvas.value = [];
    var curve = d3.curveBasis(context);
    var redo = [];

    context.lineJoin = "round";
    context.lineCap = "round";

    // Render and report the new value.
    function render() {
      context.clearRect(0, 0, width, height);
      for (var stroke of strokes) {
        context.beginPath();
        curve.lineStart();
        for (var point of stroke) {
          curve.point(...point);
        }
        if (stroke.length === 1) curve.point(...stroke[0]);
        curve.lineEnd();
        context.lineWidth = stroke.lineWidth;
        context.strokeStyle = stroke.strokeStyle;
        context.stroke();
      }
      context.canvas.value = strokes;
      context.canvas.dispatchEvent(new CustomEvent("input"));
    }

    d3.select(mask.canvas).call(d3.drag()
        .container(context.canvas)
        .subject(dragsubject)
        .on("start drag", dragged)
        .on("start.render drag.render", render));

    context.canvas.undo = () => {
      if (strokes.length === 0) return;
      redo.push(strokes.pop());
      render();
    };

    context.canvas.redo = stroke => {
      if (redo.length === 0) return;
      strokes.push(redo.pop());
      render();
    };

    // Create a new empty stroke at the start of a drag gesture.
    function dragsubject() {
      var stroke = [];
      stroke.lineWidth = lineWidth.value;
      stroke.strokeStyle = strokeStyle.value;
      strokes.push(stroke);
      redo.length = 0;
      return stroke;
    }

    // Add to the stroke when dragging.
    function dragged() {
      d3.event.subject.push([d3.event.x, d3.event.y]);
    }

/***
Inputs + events
***/

    $('#submit').on('click', function(e){
      var stroke_data = [];
      for(var stroke of strokes){
        var color = stroke.strokeStyle;
        var size = stroke.lineWidth;
        stroke_data.push({color: color, size: size, width: width, height: height, stroke: stroke});
      }
      endTrial(stroke_data);
    });

    $('#undo').on('click', function(e){
      context.canvas.undo();
    });

    $('#redo').on('click', function(e){
      context.canvas.redo();
    });

    $('#linewidth').on('click touchend', function(e){
      lineWidth.value = this.value;
    });

    $('#color-bar').on('click', function(e){
      var position = getMousePos(this, e);
      var col;
      var val;
      if(orientation=='landscape'){
        val = position.y/gradient_h;
      } else {
        val = position.x/gradient_w;
      }
      var new_r = Math.round((val)*255);
      var new_g = Math.round((1-val)*255);
      var new_b = Math.round((1-val)*255);
      var new_hex = RGBToHex(new_r, new_g, new_b);
      strokeStyle.value = new_hex;
      $('#current-color').css('background-color', new_hex);
    });

    $( window ).resize(function() {
      var new_orientation = $(window).width() > $(window).height() ? 'landscape' : 'portrait';
      if(new_orientation!=orientation){
        setupDivs(new_orientation);
        colorBar(new_orientation);
        orientation = new_orientation;
        // console.log($('#paint-box').offset().top)
        $('html, body').animate({scrollTop:$('#paint-board').offset().top}, 100);
      }
    });


/***
Data + finishing
***/


    function endTrial(responses){
      var end_time = Date.now();
      var rt = end_time - start_time;
      trial_data.rt = rt;
      trial_data.strokes = JSON.stringify(responses);

      // kill any remaining setTimeout handlers/listeners
      jsPsych.pluginAPI.clearAllTimeouts();
      $('body').off();

      // clear screen
      display_element.innerHTML = '';

      jsPsych.finishTrial(trial_data);
      // console.log(trial_data);
    }

    $( document ).ready(function() {
      start_time = Date.now();
      $("html,body").animate({scrollTop: 0}, 100);
      $('tbody').scrollTop(0);
    });

/**
Helpers
**/
    function getMousePos(canvas, e){
      //https://www.html5canvastutorials.com/advanced/html5-canvas-mouse-coordinates/
      var rect = canvas.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      return {x: x, y: y};
    }

    function RGBToHex(r,g,b) {
      r = r.toString(16);
      g = g.toString(16);
      b = b.toString(16);

      if (r.length == 1)
        r = "0" + r;
      if (g.length == 1)
        g = "0" + g;
      if (b.length == 1)
        b = "0" + b;

      return "#" + r + g + b;
    }

  };

  return plugin;
})();
