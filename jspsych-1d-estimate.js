//  requires d3.js and jstat to be loaded in the main experiment script

// Author: Justin Sulik
// Contact:
//  justin.sulik@gmail.com
//  twitter.com/justinsulik
//  github.com/justinsulik
//  justinsulik.com

jsPsych.plugins["1d-estimate"] = (function() {

  var plugin = {};

  plugin.info = {
    name: "1d-estimate",
    parameters: {
      sample_size: {
        type: jsPsych.plugins.parameterType.INT, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: 10,
        description: "The number of people in the group (excluding the focal participant)"
      },
      estimate: {
        type: jsPsych.plugins.parameterType.INT,
        default: undefined,
        description: "The participant's estimate for this question"
      },
      sd: {
        type: jsPsych.plugins.parameterType.INT,
        default: undefined,
        description: "The SD for the distribution to be sampled (only for normal dist.)"
      },
      mean: {
        type: jsPsych.plugins.parameterType.INT,
        default: undefined,
        descrption: "The mean of the distribution to be sampled"
      },
      display: {
        type: jsPsych.plugins.parameterType.OBJECT,
        default: {mean: true,
                  density: true,
                  quantile: true,
                  points: true}
      },
      normalise: {
        type: jsPsych.plugins.parameterType.BOOL,
        default: true,
        description: 'If false, sampling from distribution with sd=trial.sd might yield a sample with a slightly'+
        'different sd. If true, adjust this to precisely match trial.sd'
      },
      quantile: {
        type: jsPsych.plugins.parameterType.FLOAT,
        default: 0.8,
        description: "Quantile for error bars (value of 0.8 returns values for quantiles 0.1 and 0.9)"
      },
      shape: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'normal',
        description: 'The family of the sampling distribution (values: normal, poisson, )'
      },
      position: {
        type: jsPsych.plugins.parameterType.INT,
        default: 1,
        description: 'How many SDs away from the group mean the focal participant should be'
      },
      interactive: {
        type: jsPsych.plugins.parameterType.BOOL,
        default: true,
        description: "If true, participant can move the errorbars and group mean"
      }
    }
  };

  plugin.trial = function(display_element, trial) {

    // data saving
    var trial_data = {

    };

    // graphing variables
    var width;
    var height;

    // set up basic html

    var html = '<div id="top-panel" class="container top">top1';
    html += '<div id="instructions" class="container">top2</div><div id="button-container" class="container">top3</div></div>';

    html+= '<div id="bottom-panel" class="container bottom">';
    html += '<div id="canvas-container" class="container"></div></div>';

    // set up css

    var css = '<style>';
    css += '.container {width: 800px;}';
    css += '.top {height: 150px;}';
    css += '.bottom {height: 450px;}';
    css += '</style>';

    display_element.innerHTML = css + html;

    $(document).ready(function(){
      graph();
    });

    // set up d3
    function graph(){

      var data = generateSamples();
      var xMin = Math.min(...data)-10;
      var xMax = Math.max(...data)+10;
      var yMax = 0;

      var margin = {top: 10, right: 10, bottom: 20, left: 20},
      width = 600 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

      var svg = d3.select("#canvas-container")
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

      //x scale
      var x = d3.scaleLinear()
          .domain([xMin, xMax])
          .range([0, width]);

      svg.append("g")
      .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

      // Compute kernel density estimation
      var kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(40));
      var density =  kde(data);
      density.forEach(function(d){
        if(d[1]>yMax){
          yMax = d[1];
        }
      });

      //y scale
      var y = d3.scaleLinear()
          .domain([0, 1.05*yMax])
          .range([height, 0]);

      // Plot the area

      if(trial.display.density){
        svg.append("path")
            .attr("class", "density path")
            .datum(density)
            .attr("fill", "#a6e0f7")
            .attr("opacity", ".6")
            .attr("stroke", "#000")
            .attr("stroke-width", 1)
            .attr("stroke-linejoin", "round")
            .attr("d",  d3.line()
              .curve(d3.curveBasis)
                .x(function(d) { return x(d[0]); })
                .y(function(d) { return y(d[1]); })
            );
      }
      if(trial.display.points){
        //draw histogram
        updateHist(data, svg, x, y, height);
      }
      if(trial.display.quantile){
        var barHeight = yMax/3;
        var range = jStat.quantiles(data, [(1-trial.quantile)/2, 1-(1-trial.quantile)/2]);
        svg.append("line")
          .attr("class", "error whisker left")
          .attr("stroke", "#700eb5")
          .attr("stroke-width", 4)
          .attr("x1", x(range[0]))
          .attr("x2", x(range[0]))
          .attr("y1", y(barHeight+0.05*yMax))
          .attr("y2", y(barHeight-0.05*yMax));
        svg.append("line")
          .attr("class", "error whisker right")
          .attr("stroke", "#700eb5")
          .attr("stroke-width", 4)
          .attr("x1", x(range[1]))
          .attr("x2", x(range[1]))
          .attr("y1", y(barHeight+0.05*yMax))
          .attr("y2", y(barHeight-0.05*yMax));
        svg.append("line")
          .attr("class", "error beam")
          .attr("stroke", "#700eb5")
          .attr("stroke-width", 3)
          .attr("x1", x(range[0]))
          .attr("x2", x(range[1]))
          .attr("y1", y(barHeight))
          .attr("y2", y(barHeight));
      }
      if(trial.display.mean){
        var groupMean = jStat.mean(data);
        svg.append("circle")
          .attr("class", "mean point")
          .attr("r", 4.5)
          .attr("cx", x(groupMean))
          .attr("cy", y(yMax/3))
          .attr("fill", "#e06f04");
      }
      // participant's position
      if(trial.display.points){
        svg.append("line")
          .attr("stroke", "#32a852")
          .attr("stroke-width", 4)
          .attr("x1", x(trial.estimate))
          .attr("x2", x(trial.estimate))
          .attr("y1", y(0))
          .attr("y2", y(yMax));
      } else {
        svg.append("circle")
          .attr("class", "mean point")
          .attr("r", 4.5)
          .attr("cx", x(trial.estimate))
          .attr("cy", y(yMax/3))
          .attr("fill", "#32a852");
      }
      // add interaction
      let drag = d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);

      if(trial.interactive){
        svg.selectAll('.mean.point')
          .call(drag);
        svg.selectAll('.error.whisker')
          .call(drag);
      }

      function dragstarted() {
          d3.select(this).raise().classed('active', true);
      }

      function dragged() {
          var newX;
          newX = x.invert(d3.event.x);
          if(newX < xMin){
            newX = xMin;
          }
          if(newX > xMax){
            newX = xMax;
          }
          d3.select(this)
              .attr('cx', x(newX))
              .attr('x1', x(newX))
              .attr('x2', x(newX));
          if($(this).hasClass('whisker left')){
            d3.select('.error.beam')
              .attr('x1', x(newX));
          }
          if($(this).hasClass('whisker right')){
            d3.select('.error.beam')
              .attr('x2', x(newX));
          }

      }

      function dragended(d) {
          d3.select(this).classed('active', false);
      }

    }

    // Function to compute density
    function kernelDensityEstimator(kernel, X) {
      return function(V) {
        return X.map(function(x) {
          return [x, d3.mean(V, function(v) { return kernel(x - v); })];
        });
      };
    }
    function kernelEpanechnikov(k) {
      return function(v) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
      };
    }

    function generateSamples(){
      var data = [];
      for(i=0; i < trial.sample_size; i++){
          var val = jStat.normal.sample(0,trial.sd);
          data.push(val);
      }
      if(trial.normalise){
        //adjust the sd to match the trial parameter exactly
        var sd = jStat.stdev(data);
        var adjustmentRatio = sd/trial.sd;
        var dataNormalised = [];
        data.forEach(function(d){
          dataNormalised.push(d/adjustmentRatio);
        });
        data = dataNormalised;
      }
      // console.log('-->', jStat.stdev(data))
      var direction = jsPsych.randomization.sampleWithoutReplacement([-1, 1], 1);
      var endpoint = trial.estimate + direction*trial.position*trial.sd; // where the sample mean should end up
      var sampleMean = jStat.mean(data); // where the sample mean currently is
      var adjustment = endpoint - sampleMean;
      var dataAdjusted = [];
      data.forEach(function(d){
        dataAdjusted.push(d + adjustment);
      });
      return dataAdjusted;
    }

    function updateHist(data, svg, x, y, height){
        // https://bl.ocks.org/gcalmettes/95e3553da26ec90fd0a2890a678f3f69
        var nbins = 10;
        //histogram binning
        const histogram = d3.histogram()
          .domain(x.domain())
          .thresholds(x.ticks(nbins))
          .value(function(d) { return d;} );
        console.log(data);
        console.log(_.sortBy(data));
        //binning data
        const bins = histogram(data);
        console.log(bins);

        //g container for each bin
        var binContainer = svg.selectAll(".gBin")
          .data(bins);

        var binContainerEnter = binContainer.enter()
          .append("g")
            .attr("class", "gBin")
            .attr("transform", d => `translate(${x(d.x0)}, ${height})`);

        //need to populate the bin containers with data the first time
        binContainerEnter.selectAll("circle")
            .data(d => d.map((p, i) => {
              return {idx: i,
                      value: p,
                      radius: (x(d.x1)-x(d.x0))/2};
            }))
      .enter()
      .append("circle")
        .attr("cx", 0) //g element already at correct x pos
        .attr("cy", function(d) {
            return - d.idx * 2 * d.radius - d.radius; })
        .attr("r", function(d){
          return 0.8*d.radius;
        });
    }//update

    // $('#canvas-container').on('mousedown', function(e){
    //   var type = $(e.target).attr('class');
    //   console.log(type)
    //   switch(type){
    //     case 'mean point':
    //       console.log($(e.target).attr('cx'))
    //     break;
    //   }
    // })
  };


  return plugin;
})();
