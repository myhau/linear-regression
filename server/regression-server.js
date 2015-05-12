var http = require("http");
var fs = require("fs");
var Promise = require("bluebird");
var exec = require('child_process').exec
fs.writeFile = Promise.promisify(fs.writeFile);

/* HI, I'M POOR, UGLY AND UNSAFE SERVER :D */ 

function getRegressionData(parsed) {
    console.log("INPUT: " + parsed);
    console.log(parsed);
    var degree = parsed.degree;
    var toSave = parsed.data.map(function(x) { return x.x + " " + x.y} );
    toSave = toSave.join("\n");
    toSave += "\n";
    return fs.writeFile("data", toSave)
    .then(function() {
        return new Promise(function(resolve, reject) {
            exec("./data.sh data " + degree, function(e, o, er){
                if(er) reject(e)
                resolve(o);
            });
        });
    })
    .then(function(d1) {
        var ret = {"error": false};
        var splitted = d1.split("\n");
        var err = splitted[0].split(" ")[1];
        var coeff = splitted[1].trim().split(" ");
        ret.err = err;
        ret.coeff = coeff;
        console.log("OUTPUT: " + ret.coeff + " " + ret.error + " " + ret.err);
        return ret;
    },
    function() {
        return {"error": true}
    }); 
}

function handleRequest(req, resp) {
    var headerz = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
    resp.writeHead(200, headerz);
    data = ""
    
    req.on("data", function(data1){data += data1 })
    req.on("end", function() {
        getRegressionData(JSON.parse(data))
        .then(function(data2) {
            resp.end(JSON.stringify(data2))
        })
    }) 
    
}
var server = http.createServer(handleRequest);
server.listen(9000)