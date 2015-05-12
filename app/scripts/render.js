"use strict";

var d3 = require("d3");

var svgData = {
    height: 400,
    width: 600,
    margin: {
        left: 40,
        right: 40,
        top: 40,
        bottom: 40
    }
};

function sampleFunction(X, x1, x2, count) {
    if(x1 >= x2 || X.length == 0) return [];
    var step = (x2 - x1) / count;
    var sampled = [];
    for(; x2 >= x1; x1 += step)
        sampled.push({x: x1, y: X.reduce((acc, z, i) => acc + z * Math.pow(x1, i), 0)});
    return sampled;
}

module.exports.svgData = svgData;

function init(svgElem, svgDiv) {

    // domain translation
    svgData.x = 
    d3.scale.linear()
        .range([0, svgData.width])
        .domain([-10, 10]);

    svgData.y = 
    d3.scale.linear()
        .range([svgData.height, 0])
        .domain([-10, 10]);

    svgData.xAxis = d3.svg.axis().orient("bottom").scale(svgData.x);
    svgData.yAxis = d3.svg.axis().orient("left").scale(svgData.y);

    // line function ( for regression path )
    svgData.line = d3.svg.line();

    svgData.line.x(d => svgData.x(d.x))
                .y(d => svgData.y(d.y))
                .interpolate("linear");

    var margin = svgData.margin;
    d3.select(svgDiv)
        .attr("style", "width: " + (svgData.width + margin.left + margin.right) 
            + "px;height: " + (svgData.height + margin.top + margin.bottom) + "px");
    
    var svgPar = d3.select(svgElem);
    svgPar
    .attr("width", svgData.width + margin.left + margin.right)
    .attr("height", svgData.height + margin.top + margin.bottom);
    var svg = svgPar
            .select("g")
            .attr("transform", "translate(" + ((margin.left + margin.right)) /2 + 
                "," + ((margin.top + margin.bottom)/2 )+ ")")

    var clipP = svg.append("clipPath")
                   .attr("id", "clipP");

    clipP.append("rect")
         .attr("x", 0)
         .attr("y", 0)
         .attr("width", svgData.width)
         .attr("height", svgData.height);

    svg.append("path")
        .attr("clip-path", "url(#clipP)")
        .attr("class", "regression");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + svgData.height + ")")
        .call(svgData.xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(0,0)")
        .call(svgData.yAxis);

}

function fromScreenCords(point) {
    return {
        x : svgData.x.invert(point.x),
        y : svgData.y.invert(point.y)
    }
}
module.exports.fromScreenCords = fromScreenCords;

module.exports.init = init;

function setBetterDomain(x, y) {
    var xdmin = x.domain()[0];
    var xdmax = x.domain()[1];
    var ydmin = y.domain()[0];
    var ydmax = y.domain()[1];

    var changex = (xdmax - xdmin) / 5.0;
    var changey = (ydmax - xdmin) / 5.0;
    
    x.domain([xdmin - changex, xdmax + changex]);
    y.domain([ydmin - changey, ydmax + changey]);
}

function update(svgElem, data) {
    var SAMPLE = 400;
    
    // regression line data    
    var pointsData = data["points"];
    var svgPar = d3.select(svgElem)
    var svg = svgPar.select("g");

    svg.selectAll(".point")
    .data(pointsData)
    .enter()
        .append("circle")
        .attr("class", "point")
        .attr("r", 5)
        .attr("cx", d => svgData.x(d.x))
        .attr("cy", d => svgData.y(d.y));

    if(data["points"].length > 2) {
        svgData.x.domain(d3.extent(pointsData.map(x => x.x)));
        svgData.y.domain(d3.extent(pointsData.map(x => x.y)));
        setBetterDomain(svgData.x, svgData.y);
    }

    var [x1, x2] = svgData.x.domain();
    var lineData = sampleFunction(data["line"], x1, x2, SAMPLE);


    svgData.xAxis.scale(svgData.x);
    svgData.yAxis.scale(svgData.y);
    
    var svg = d3.select(svgElem).select("g");

    svg.select(".x.axis")
        .transition().duration(300).ease('exp-in-out')
        .call(svgData.xAxis);

    svg.select(".y.axis")
        .transition().duration(300).ease('exp-in-out')
        .call(svgData.yAxis);

    console.log(pointsData);
    var updtPoints = svg.selectAll(".point")
    .data(pointsData)

    updtPoints.transition().ease('exp-in-out').duration(300)
        .attr("cx", d => svgData.x(d.x))
        .attr("cy", d => svgData.y(d.y))

    updtPoints.exit().remove();

    


    svg.select(".regression")
    .datum(lineData)
        .transition()
        .ease('exp-in-out')
        .duration(300)
        .attr("d", svgData.line)
}

module.exports.update = update;

