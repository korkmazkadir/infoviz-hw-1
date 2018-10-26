var app = angular.module("infoVizApp", []);

app.controller("infoVizCtrl", function($scope, $http) {

    $scope.dataset1 = [];
    $scope.dataset2 = [];
    $scope.dataset3 = [];
    $scope.dataset4 = [];

    $scope.dataset1Color = "#03AEBF";
    $scope.dataset2Color = "#C9D83D";
    $scope.dataset3Color = "#EB9732";
    $scope.dataset4Color = "#F35551";

    $scope.count = 0;
    $scope.mean = { x: 0, y: 0};
    $scope.stDeviation = { x: 0, y: 0};

    $scope.dataset1Selected = false;
    $scope.dataset2Selected = false;
    $scope.dataset3Selected = false;
    $scope.dataset4Selected = false;

    $scope.selectedDataSet = 0;

    var margin = {top: 20, right: 15, bottom: 60, left: 60}
         , width = 600 - margin.left - margin.right
         , height = 450 - margin.top - margin.bottom;

     var x = d3.scaleLinear()
               .domain([0, 16])
               .range([ 0, width ]);

     var y = d3.scaleLinear()
     	      .domain([0, 16])
     	      .range([ height, 0 ]);

    var chart = d3.select('#chart-container')
            	.append('svg:svg')
            	.attr('width', width + margin.right + margin.left)
            	.attr('height', height + margin.top + margin.bottom)
            	.attr('class', 'chart')

    var main = chart.append('g')
          	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
          	.attr('width', width)
          	.attr('height', height)
          	.attr('class', 'main')

    // draw the x axis
    var xAxis = d3.axisBottom()
          	.scale(x);

    main.append('g')
  	.attr('transform', 'translate(0,' + height + ')')
  	.attr('class', 'main axis date')
  	.call(xAxis);

    // draw the y axis
    var yAxis = d3.axisLeft()
          	.scale(y);

    main.append('g')
	.attr('transform', 'translate(0,0)')
	.attr('class', 'main axis date')
	.call(yAxis);

  var g = main.append("svg:g")
                .attr("class", "dot-container");

  // Define the div for the tooltip
  var divTooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

  d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
      this.parentNode.appendChild(this);
    });
  };
  d3.selection.prototype.moveToBack = function() {
      return this.each(function() {
          var firstChild = this.parentNode.firstChild;
          if (firstChild) {
              this.parentNode.insertBefore(this, firstChild);
          }
      });
  };


    $scope.drawChart = function(hoverValue){

        console.log("Hover value : " + hoverValue);

        var dataArray = getDataArray();

        g.selectAll("circle").remove();

        g.selectAll("circle")
          .data(dataArray)
          .enter().append("svg:circle")
              .attr("class", "scatter-dots")
              .attr("class", function (d,i) {
                switch(d.dataset) {
                    case 1:
                        return "data-from-set-1";
                    case 2:
                        return "data-from-set-2";
                    case 3:
                        return "data-from-set-3";
                    case 4:
                        return "data-from-set-4";
                }})
              .attr("cx", function (d,i) { return x(d.x ); } )
              .attr("cy", function (d) { return y(d.y ); } )
              .attr("r", 8)
              .style("fill", function (d,i) { return d3.rgb( dataPointColor(d,i) ); })
              .style("stroke-width", function (d,i) {
                  if(typeof hoverValue != "undefined"){
                      if(hoverValue === d.dataset ){
                          return 2;
                      }
                  }
                  return 0;
              })
              .style("stroke", function (d,i) {
                  if(typeof hoverValue != "undefined"){
                      if(hoverValue === d.dataset ){
                          return "black";
                      }
                  }
                  return d3.rgb(dataPointColor(d,i));
              })
              .on("mouseover", function(d) {

                  $scope.selectedDataSet = d.dataset;

                  $scope.$apply();

                  console.log("selected data set : " +  $scope.selectedDataSet);

                  divTooltip.transition()
                      .duration(200)
                      .style("opacity", .9);

                  divTooltip.html( "<span>" + "x : " + d.x + "<br/>"  + "y : " + d.y + "</span>")
                      .style("left", (d3.event.pageX) + "px")
                      .style("top", (d3.event.pageY - 28) + "px");


                  })
              .on("mouseout", function(d) {

                  $scope.selectedDataSet = 0;

                  $scope.$apply();

                  divTooltip.transition()
                      .duration(500)
                      .style("opacity", 0);

              });


            if(typeof hoverValue != "undefined"){
                var className = ".data-from-set-" + hoverValue;
                console.log("Class : " + className);
                g.selectAll(className).moveToFront();
                console.log(JSON.stringify(g.select(className)));
            }



          //.exit()
          //.remove();


       calculateCount(dataArray);
       calculateMean(dataArray);
       $scope.stDeviation = { x : getStdX(dataArray).toFixed(2), y : getStdY(dataArray).toFixed(2) }
    }

    function dataPointColor(obj,index){
      switch(obj.dataset) {
          case 1:
              return $scope.dataset1Color;
          case 2:
              return $scope.dataset2Color;
          case 3:
              return $scope.dataset3Color;
          case 4:
              return $scope.dataset4Color;
              break;
          default:
              console.log("(Color selection)Unclassified data : " + JSON.stringify(obj));
      }
        return "";
    }

    function calculateCount(dataArray){
        $scope.count = dataArray.length;
    }

    function calculateMean(dataArray){
        var sumX = 0;
        var sumY = 0;

        dataArray.forEach(function(data) {
            sumX = sumX + data.x;
            sumY = sumY + data.y;
        });

        $scope.mean.x =  (sumX / dataArray.length).toFixed(2);
        $scope.mean.y =  (sumY / dataArray.length).toFixed(2);
    }


    function getStdX(data){
        const xValues = data.map(d => d.x);
        return standardDeviation(xValues);
    }

    function getStdY(data){
      const yValues = data.map(d => d.y);
      return standardDeviation(yValues);
    }


    function standardDeviation(values){
      var avg = average(values);

      var squareDiffs = values.map(function(value){
        var diff = value - avg;
        var sqrDiff = diff * diff;
        return sqrDiff;
      });

      var avgSquareDiff = average(squareDiffs);

      var stdDev = Math.sqrt(avgSquareDiff);
      return stdDev;
    }

    function average(data){
      var sum = data.reduce(function(sum, value){
        return sum + value;
      }, 0);

      var avg = sum / data.length;
      return avg;
    }


    function getDataArray(){
      var dataArray = [];

      if($scope.dataset1Selected){
        dataArray = dataArray.concat($scope.dataset1);
      }

      if($scope.dataset2Selected){
        dataArray = dataArray.concat($scope.dataset2);
      }

      if($scope.dataset3Selected){
        dataArray = dataArray.concat($scope.dataset3);
      }

      if($scope.dataset4Selected){
        dataArray = dataArray.concat($scope.dataset4);
      }

      return dataArray;
    }


    //
    // File Parsing
    //

    function parseDataFile(data){
        var lines = data.split("\n");
        //removes header line
        lines.shift();
        lines.forEach(function(line) {
            var tokens = line.split("\t");
            var obj = createDataObject(tokens[0],tokens[1],tokens[2],tokens[3]);

            switch(obj.dataset) {
                case 1:
                    $scope.dataset1.push(obj)
                    break;
                case 2:
                    $scope.dataset2.push(obj)
                    break;
                case 3:
                    $scope.dataset3.push(obj)
                    break;
                case 4:
                    $scope.dataset4.push(obj)
                    break;
                default:
                    console.log("Unclassified data : " + JSON.stringify(obj));
            }
        });
    }

    function createDataObject(dataset, observation,x,y){
        return{
            dataset : Number(dataset),
            observation : Number(observation),
            x : Number(x),
            y : Number(y)
        };
    }

    $http.get("anscombe.tsv")
    .then(function(response) {
        parseDataFile(response.data);
    });

});
