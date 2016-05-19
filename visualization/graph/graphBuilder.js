/*
 * Keep track of which level you are
 */
var packagesLevel = true;
var graphTrace = [];
var graphTraceIndex = 0;

//private var
var refreshing = false;

/*
 * Returns the length of a link
 */
function linkDistance(d) {
    if (packagesLevel) {
        return 25 * d.value;
    } else {
        return 15 * d.value;
    }
}
/*
 * Returns the width of a stroke
 */
function linkStrokeWidth(d) {
    if (packagesLevel) {
        return 2;
    } else {
        return 2;
    }
}

/*
 * Returns the radius of a node
 */
function nodeRadius(d) {
    if (packagesLevel) {
        return Math.sqrt(d.numberOfClasses) * 5;
    } else {
        return Math.sqrt(d.loc) * 2.25;
    }
}
/*
 * Returns the colour of a node
 * Uses a range of 100 values between green and red
 * The closer the value is to 0, the more green it will use
 * The closer the value is to 100, the more red it will use
 */
function nodeColour(d) {
    if (packagesLevel) {
       var ratio = 200 * (d.totalWarnings) / d.loc;
        return colorScale.getColor(ratio);
    } else {
        var ratio = 200 * (d.warnings) / d.loc;
        return colorScale.getColor(ratio);
    }
}
/*
 * Returns what should happen on a double click
 */
function nodeDoubleClick(d, i) {
    if (packagesLevel) {
        sessionStorage.setItem('packageName', d.fileName);
        packagesLevel = false
        removeChart();

        graphTraceIndex++;

        var packages = filterTypeRuleName(acceptedTypes, acceptedCategories);
        var input = createJsonGraphClasses(packages, d.fileName);

        if (typeof graphTrace[graphTraceIndex] === 'undefined') {
            graphTrace.push(input);
        } else {
            graphTrace[graphTraceIndex] = input;
        }

        var graphButton = document.getElementById('back-button');
        graphButton.firstChild.data = "Go one level back";
        graphButton.disabled = false;

        createGraph(graphTrace[graphTraceIndex]);
    } else {
        // For later: click multiple levels deep and keep track of where you are
        /*
        graphTraceIndex++;

        var packages = filterTypeRuleName(acceptedTypes, acceptedCategories);
        var input = createJsonGraphClasses(packages, d.fileName);

        if(typeof graphTrace[graphTraceIndex] === 'undefined') {
        	graphTrace.push(input);
        } else {
        	graphTrace[graphTraceIndex] = input;
        }

        runGraph(graphTrace[graphTraceIndex]);
        */

        window.open("http://9gag.com/", "_self")
    }
}

/*
 * Update the graph accordingly
 */
function redrawGraph() {
    removeChart();
    if (packagesLevel) {
        var packages = filterTypeRuleName(acceptedTypes, acceptedCategories);
        var input = createJsonGraphPackages(packages);

        if (typeof graphTrace[graphTraceIndex] === 'undefined') {
            graphTrace.push(input);
        } else {
            graphTrace[graphTraceIndex] = input;
        }
        createGraph(graphTrace[graphTraceIndex]);
    } else {
        var packages = filterTypeRuleName(acceptedTypes, acceptedCategories);
        var input = createJsonGraphClasses(packages, sessionStorage.getItem('packageName'));

        if (typeof graphTrace[graphTraceIndex] === 'undefined') {
            graphTrace.push(input);
        } else {
            graphTrace[graphTraceIndex] = input;
        }
        createGraph(graphTrace[graphTraceIndex]);
    }
}

/*
 * Set the title of the graph
 */
function setTitle() {
    var element = document.getElementById("main-title");
    if (packagesLevel) {
        element.innerHTML = "Graph view of all packages";
    } else {
        element.innerHTML = "Graph view of package '" + sessionStorage.getItem('packageName') + "'";
        //element = document.getElementById('sub-title');
        //element.innerHTML = element.innerHTML + '';
    }
}

/*
 * Go one view back if possible
 */
function goBack() {
    removeChart();
    packagesLevel = true;
    var graphButtonDiv = document.getElementById("sub-title");
    graphButtonDiv.style.display = 'inline';
    var graphButton = document.getElementById('back-button');
    graphButton.firstChild.data = "This is the upperview";
    graphButton.disabled = true;
    graphTraceIndex--;
    var packages = filterTypeRuleName(acceptedTypes, acceptedCategories);
    var input = createJsonGraphPackages(packages);
    if (typeof graphTrace[graphTraceIndex] === 'undefined') {
        graphTrace.push(input);
    } else {
        graphTrace[graphTraceIndex] = input;
    }
    createGraph(graphTrace[graphTraceIndex]);
}

/*
 * Main function for drawing the graph with its components
 */
function createGraph(graph) {

    setTitle();

    /*
     * Defines the height and width of the graph
     */
    var width = window.innerWidth - 350,
        height = window.innerHeight - 175


    var force = d3.layout.force()
        .charge(-120)
        .linkDistance(linkDistance)
        .size([width, height]);

    var svg = d3.select("#chart").append("svg")
        .attr("width", width)
        .attr("height", height);

    force
        .nodes(graph.nodes)
        .links(graph.links)
        .start();

    /*
     * Creates link elements with
     * Specific length and stroke width based on the corresponding functions
     */
    var link = svg.selectAll(".link")
        .data(graph.links)
        .enter().append("line")
        .attr("class", "link")
        .style("stroke-width", linkStrokeWidth);

    /*
     * Creates a tooltip that will be shown on hover over a node
     */
    var tooltip = d3.select("#chart")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden");

    if (packagesLevel) {
        /*
         * Creates node elements with
         * Specific radius, colours and double click actions based on the corresponding functions
         * On hover over a node it will show statistics of the package (name, classes, loc and warnings)
         */
        var node = svg.selectAll(".node")
            .data(graph.nodes)
            .enter().append("circle")
            .attr("class", "node")
            .attr("r", nodeRadius)
            .style("fill", nodeColour)
            .on('dblclick', nodeDoubleClick)
            .on("mouseover", function(d) {
                tooltip.text(d.fileName + ": " + +d.numberOfClasses + " classes || " + d.loc + " lines" + " || " + d.totalWarnings + " warnings");
                return tooltip.style("visibility", "visible");
            })
            .on("mousemove", function(d) {
                return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
            })
            .on("mouseout", function(d) {
                return tooltip.style("visibility", "hidden");
            })
            .call(force.drag);
    } else {
        /*
         * Creates node elements with
         * Specific radius, colours and double click actions based on the corresponding functions
         * On hover over a node it will show statistics of the class (name, loc and warnings)
         */
        var node = svg.selectAll(".node")
            .data(graph.nodes)
            .enter().append("circle")
            .attr("class", "node")
            .attr("r", nodeRadius)
            .style("fill", nodeColour)
            .on('dblclick', nodeDoubleClick)
            .on("mouseover", function(d) {
                tooltip.text(d.fileName + ": " + d.loc + " lines" + " || " + d.warnings + " warnings");
                return tooltip.style("visibility", "visible");
            })
            .on("mousemove", function(d) {
                return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
            })
            .on("mouseout", function(d) {
                return tooltip.style("visibility", "hidden");
            })
            .call(force.drag);
    }

    force.on("tick", function() {
        link.attr("x1", function(d) {
                return d.source.x;
            })
            .attr("y1", function(d) {
                return d.source.y;
            })
            .attr("x2", function(d) {
                return d.target.x;
            })
            .attr("y2", function(d) {
                return d.target.y;
            });

        node.attr("cx", function(d) {
                return d.x;
            })
            .attr("cy", function(d) {
                return d.y;
            });
    });
	
	// all the updateContent class will trigger this refresh of data
	// so that the input of the user (checkboxes/radiobuttons) will update the content of 
    $(".updateContent").off("click").on('click', function(view) {
        if (document.getElementById('graphButton').checked && !refreshing) {
			refreshing = true;
			reloadContent(view.target)
           
			var millisecondsToWait = 200;
			setTimeout(function() {
				refreshing = false;
			}, millisecondsToWait);

        }	
    });
	
	 function reloadContent(cb){
		 if (cb.name == "sat") {
            handleClickTreeMapTypeSat(cb.value, cb.checked);
		 }
            removeChart();
            var packages = filterTypeRuleName(acceptedTypes, acceptedCategories);
            if (packagesLevel) {
                var input = createJsonGraphPackages(packages);

               
            } else {
                var input = createJsonGraphClasses(packages, sessionStorage.getItem('packageName'));
            }
			if(typeof graphTrace[graphTraceIndex] === 'undefined') {
                graphTrace.push(input);
            } else {
                graphTrace[graphTraceIndex] = input;
            }
            createGraph(graphTrace[graphTraceIndex]);
        
	 }
};