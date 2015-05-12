"use strict";

var render = require("./render.js");
var d3 = require("d3");

var Rx = require("rx");

var util = require("./utils.js")

var xy = (x, y) => { return {"x": x, "y": y} };

function regressionForData(data, degree) {
  var prep = { "degree": degree, "data": data };
  var $ = require("jquery");
  return $.ajax({
    url: "http://localhost:9000",
    data: JSON.stringify(prep),
    method: "POST",
    dataType: "json"
  })
}

var inputSelectors = {
  labelDegree: document.getElementById("labelDegree"),
  degree: document.getElementById("inputDegree"),
  svg: document.getElementById("mainSvg"),
  divSvg: document.getElementById("divSvg"),
  resetButton: document.getElementById("resetButton")
};
var outputSelectors = {
  error: document.getElementById("inputError")
};

var relativeEventPositon = e => { 
  var coords = util.getRelativeCoordinates(e, inputSelectors.divSvg);
  return xy(coords.x - render.svgData.margin.left, coords.y - render.svgData.margin.top); // super hacky margins :F, change it
};

var xyFromMouseEvent = x => { 
  var a = render.fromScreenCords(relativeEventPositon(x)); return a;
};

var addEventSource = 
  Rx.Observable.fromEvent(inputSelectors.divSvg, "click")
    .map(xyFromMouseEvent);

var addPointsSource = addEventSource;

var removeEventSource = 
  Rx.Observable.fromEvent(inputSelectors.resetButton, "click");

var removePointsSource = removeEventSource;

var pointsSource = 
  Rx.Observable.merge(
    [
    addPointsSource.map(x => [0, x]), 
    removePointsSource.map(x => [1, x])
    ])
    .scan([], (acc, x) => {
      var delElem = (acc, x) => [];
      var addElem = (acc, x) => acc.concat(x);
      var behvrs = [addElem, delElem];
      return behvrs[x[0]](acc, x[1]);
    });

var degreeEventSource = Rx.Observable.fromEvent(inputSelectors.degree, "change");
var degreeSource = degreeEventSource.map(e => e.target.value).startWith(1);

var dataSources = {
  "pointsSource": pointsSource,
  "degreeSource": degreeSource
}

var regressionSource = 
  dataSources.pointsSource
    .combineLatest(dataSources.degreeSource, (x, y) => [x, y])
    .flatMap(x => {
      if(x[0].length == 0 || x[0].length == 1) 
        return Rx.Observable.just({ "error": false, "coeff": [], "err": "" });
      return Rx.Observable.fromPromise(regressionForData(x[0], x[1]));
    });

var errorSource =
  regressionSource
    .filter(x => x.error);

var goodSource = 
  regressionSource
    .filter(x => !x.error)
    .map(x => {x.coeff = x.coeff.map(z => parseFloat(z)); return x});

var outputD3Source = 
  Rx.Observable.combineLatest(
    pointsSource, 
    goodSource, 
    (x, y) => { 
      return {"points" : x, "line" : y.coeff} 
    })
    .debounce(200);


render.init("#mainSvg", "#divSvg");


errorSource.subscribe(x => {
  inputSelectors.labelDegree.setAttribute("style", "color:red");
  outputSelectors.error.value = "";
  inputSelectors.labelDegree.innerHTML = "Polynomial Degree ( too high values ! )";
});

goodSource.subscribe(x => {
  inputSelectors.labelDegree.removeAttribute("style");
  inputSelectors.labelDegree.innerHTML = "Polynomial Degree";
  outputSelectors.error.value = x.err;
});


outputD3Source.subscribe(x => {
  return render.update("#mainSvg", x);
});


