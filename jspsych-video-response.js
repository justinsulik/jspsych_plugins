/*
  jsPsych plugin for displays a video and asks for a slider response. The trial ends when the 'submit' button is clicked.
  Based on a plugin by Josh de Leeuw
  Adapted by: Justin Sulik
  Contact:
   justin.sulik@gmail.com
   justinsulik.com,
   twitter.com/justinsulik
   github.com/justinsulik

 */

jsPsych.plugins['video-response'] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'video-response',
    description: '',
    parameters: {
      sources: {
        type: jsPsych.plugins.parameterType.VIDEO,
        pretty_name: 'Sources',
        array: true,
        default: undefined,
        description: 'The video file to play.'
      },
      width: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Width',
        default: undefined,
        description: 'The width of the video in pixels.'
      },
      height: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Height',
        default: undefined,
        description: 'The height of the video display in pixels.'
      },
      autoplay: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Autoplay',
        default: true,
        description: 'If true, the video will begin playing as soon as it has loaded.'
      },
      controls: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Controls',
        default: false,
        description: 'If true, the subject will be able to pause the video or move the playback to any point in the video.'
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt',
        default: 'Did you see this person during stage 1?',
        description: 'Any content here will be displayed below the video content.'
      },
      start: {
        type: jsPsych.plugins.parameterType.FLOAT,
        pretty_name: 'Start',
        default: null,
        description: 'Time to start the clip.'
      },
      stop: {
        type: jsPsych.plugins.parameterType.FLOAT,
        pretty_name: 'Stop',
        default: null,
        description: 'Time to stop the clip.'
      },
      scale_labels: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Scale labels',
        default: ['Definitely\nnot',
                  'Probably\nnot',
                  'Maybe\nnot',
                  'As likely\nas not',
                  'Maybe\nyes',
                  'Probably\nyes',
                  'Definitely\nyes'],
        description: 'Labels for the response slider scale'
      },
      autoreplay: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Auto-replay',
        default: true,
        description: 'If true, play the video on a loop until submit is clicked'
      },
    }
  };

  plugin.trial = function(display_element, trial) {

    // display stimulus

    var video_html = '<video id="jspsych-video-player" width="'+trial.width+'" height="'+trial.height+'" '
    if(trial.autoplay){
      video_html += "autoplay "
    }
    if(trial.controls){
      video_html += "controls "
    }
    video_html+=">"
    for(var i=0; i<trial.sources.length; i++){
      var s = trial.sources[i];
      if(s.indexOf('?') > -1){
        s = s.substring(0, s.indexOf('?'));
      }
      var type = s.substr(s.lastIndexOf('.') + 1);
      type = type.toLowerCase();

      // adding start stop parameters if specified
      video_html+='<source src="'+trial.sources[i]

      if (trial.start !== null) {
        video_html+= '#t=' + trial.start;
      } else {
        video_html+= '#t=0';
      }

      if (trial.stop !== null) {
        video_html+= ',' + trial.stop
      }

      video_html+='" type="video/'+type+'">';
    }
    video_html +="</video>"

    var slider_html = '<div id="promptContainer" class="container" style="width:500px;height:50px"><p></p></div>';
    slider_html += '<div id="sliderContainer" class="container" style="width:500px;height:105px"></div>';

    var button_html = '<div id="buttonContainer" class="container" style="height:50px;position:relative;"><button id="submitButton" style="position:absolute;right:0;bottom:0;">Submit</button></div>';

    display_element.innerHTML = video_html + slider_html + button_html;

    $('#submitButton').css({'visibility': 'hidden'});

    // show prompt if there is one

    if (trial.prompt !== null) {

      $('#promptContainer>p').html(trial.prompt);

    }

    // autoreplay
    if (trial.autoreplay) {
      console.log('here');
      display_element.querySelector('#jspsych-video-player').onended = function(){
        this.pause();
        this.currentTime = 0;
        this.load();
      };
    }

    // define slider hover colors

    $( '#sliderContainer' ).mouseenter( function(){
        $( this ).css('background', '#EFF5FB');
        $( this ).attr('over', true);
    }).mouseleave( function(){
      $( this ).css('background', 'white');
      $( this ).attr('over', false);
    });

    // p5 slider pseudoclass

    function Scrollbar(sketch, xPosition, yPosition, sliderWidth, sliderHeight){

      this.sketch = sketch;
      this.overThumb = false;
      this.overTrack = false;
      this.thumbCreated = false;
      this.thumbColor = 70;
      this.thumbX = 0;
      this.background = 200;
      this.sliderWidth = sliderWidth;
      this.offset = sketch.offset;

      sketch.tickInterval = sliderWidth/(trial.scale_labels.length-1);

      this.display = function() {

        sketch.rectMode(sketch.RADIUS);

        // labels
        if( sketch.over ){
          this.label();
        }

        // track
        sketch.fill(this.background);
        sketch.stroke(200);
        sketch.rect(sketch.width*xPosition, sketch.height*yPosition, sliderWidth/2, sliderHeight/2);

        // thumb
        if( this.thumbCreated ){
          sketch.fill(this.thumbColor);
          sketch.stroke(40);
          sketch.rect(this.thumbX,sketch.height*yPosition, 5, 8, 3, 3, 3, 3);
          $('#submitButton').css({'visibility': 'visible'});
        }

      };

      this.label = function() {
        trial.scale_labels.forEach(function(e,i){
          var tickX = sketch.offset+i*sketch.tickInterval;
          var tickY = sketch.height*yPosition-sliderHeight/2;
          sketch.stroke(110);
          sketch.line(tickX,tickY,tickX,tickY-5);
          sketch.textSize(10);
          sketch.fill(40);
          sketch.strokeWeight(0);
          sketch.textAlign(sketch.CENTER);
          sketch.text(e, tickX, tickY-22);
          sketch.strokeWeight(1);
        });
      };

      this.updateThumb = function() {
          this.thumbX = sketch.mouseX;
      };

      this.overTrack = function(){
        if( sketch.mouseX > sketch.offset & sketch.mouseX < sketch.offset+sliderWidth ){
          return true;
        } else {
          return false;
        }
      };

      this.move = function() {
        if( sketch.over & this.overTrack() ){
          this.updateThumb();

          if( !this.thumbCreated  & sketch.mouseY > 30 & sketch.mouseY < 92){
            this.thumbCreated = true;
          }

        }
      };

      this.drag = function() {
        if( sketch.over & this.overTrack() & currentSketch == this.explNo ){
          this.updateThumb();
        }
      };
    }

    // p5 sketch

    var confidenceSketch = new p5(function( sketch ){

      var sketchWidth = $('#sliderContainer').css('width').match(/\d+/);
      var sketchHeight = $('#sliderContainer').css('height').match(/\d+/);

      sketch.setup = function(){
        backgroundColor = 'white';
        sketch.offset = 27; //allow space on either end of slider track
        sketch.trackwidth = sketchWidth-2*sketch.offset;
        sketch.over = false;
        canvas = sketch.createCanvas(sketchWidth, sketchHeight);
        sketch.background(backgroundColor);
        sketch.slider = new Scrollbar(sketch, 0.5,0.7, sketch.trackwidth, 8);
      };

      sketch.draw = function(){

        sketch.focus();

        backgroundColor = function(){
          if(sketch.over){
            return sketch.color('#EFF5FB');
          }else{
            return sketch.color('white');
          }
        };

        sketch.background(backgroundColor());

          sketch.slider.display();
      };

      sketch.focus = function() {
        var over = $('#sliderContainer').attr('over');
        if( over == 'true' ){
          sketch.over = true;
        } else {
          sketch.over = false;
        }
      };

      sketch.mouseDragged = function() {
            sketch.slider.drag();
      };

      sketch.mouseClicked = function() {
          sketch.slider.move();
      };

      sketch.mousePressed = function() {
          if(sketch.over){
            currentSketch = sketch.id;
          }
          sketch.slider.move();
      };

    }, 'sliderContainer');


    // input button

    $('#buttonContainer').click(function(){
      confidenceSketch.slider.thumbCreated = false;
      end_trial();
    });

    // function to end trial when submit button clicked

    var end_trial = function() {

      $('#submitButton').css('visibility', 'hidden');

      // gather the data to store for the trial
      var trial_data = {
        stimulus: JSON.stringify(trial.sources)
        //add slider response
      };

      // clear the display
      display_element.innerHTML = '';

      // reset the button


      // move on to the next trial
      jsPsych.finishTrial(trial_data);
    };
  };

  return plugin;
})();
