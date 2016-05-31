var d3 = require('d3');
var _ = require('lodash');

var r = 20,
    width = 1200,
    height = 1000;

var svg = d3.select('#graph')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

svg.append('defs').append('marker')
    .attr("id", 'markerArrowEnd')
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 10)
    .attr("refY", 0)
    .attr("markerWidth", 8)
    .attr("markerHeight", 8)
    .attr("orient", "auto")
    .append("path")
    .attr("d", 'M0,-5 L10,0 L0,5')
    .attr('fill', 'black');

var force = d3.layout.force()
    .charge(function(d, i) {
        return i == 0 ? -1000 : -500;
    })
    .linkDistance(200)
    .size([width, height]);

function render() {
    d3.json('/nodesandlinks', function(error, data) {

        var alpha = '-abcdefghijklmnopqrstuvwxyz';
        var permutedAlpha = '-gbjltmndzrockivxhuqwsayfpe';

        function scramble(s) {
            return _.map(s, function(c) {
                return permutedAlpha[alpha.indexOf(c)];
            }).join('');
        }

        var nodeById = _.keyBy(data.nodes, 'id');

        _.forEach(data.nodes, function(node) {
            node.inCount = 0;
            node.outCount = 0;
            node.weight = -1;
        });

        _.forEach(data.links, function(link) {
            nodeById[link.source].outCount += 1;
            nodeById[link.target].inCount += 1;
        });

        _.forEach(data.nodes, function(node) {
            node.weight = node.inCount + node.outCount;
        });

        var columns = ["", "module",
            "in",
            "out"
        ];

        var table = d3.select('#table')
            .append('table');

        var thead = table.append('thead');

        thead.append("tr")
            .selectAll("th")
            .data(columns)
            .enter()
            .append("th")
            .text(function(column) {
                return column;
            });

        var rows = table.selectAll('tr')
            .data(data.nodes);

        var tr = rows.enter().append('tr');

        var checkedList = [];

        function calculateChecklist() {
            checkedList = [];
            tr.select('input')
                .filter(function(d) {
                    return this.checked;
                }).each(function(d) {
                    checkedList.push(d.id);
                });
        }

        d3.select('#checkAll').on('click', function() {
            table.selectAll('input')
                .property('checked', true);
            calculateChecklist();
            renderDiagram();
        });

        d3.select('#uncheckAll').on('click', function() {
            table.selectAll('input')
                .property('checked', false);
            calculateChecklist();
            renderDiagram();
        });

        tr.append('td')
            .append('input')
            .attr('type', 'checkbox')
            .attr('checked', 'true')
            .style('float', 'left')
            .on('change', function(d) {
                calculateChecklist();
                renderDiagram();
            });

        tr.append('td')
            .text(function(d) {
                return scramble(d.label)
            });

        tr.append('td')
            .text(function(d) {
                return d.inCount
            });

        tr.append('td')
            .text(function(d) {
                return d.outCount
            });

        calculateChecklist();
        renderDiagram();

        var optArray = [];
        for (var i = 0; i < data.nodes.length - 1; i++) {
            optArray.push(data.nodes[i].label);
        }
        optArray = optArray.sort();
        $(function() {
            $("#search").autocomplete({
                source: optArray
            });
        });

        function searchNode() {
            //find the node
            var selectedVal = document.getElementById('search').value;

            var node = svg.selectAll(".node");

            if (selectedVal == "none") {
                node.style("stroke", "white")
                    .style("stroke-width", "1");
            } else {
                var selected = node.filter(function(d, i) {
                    return d.label != selectedVal;
                });

                selected.style("opacity", "0");

                var link = svg.selectAll(".link");

                link.style("opacity", "0");

                d3.selectAll(".node, .link")
                    .transition()
                    .duration(5000)
                    .style("opacity", 1);
            }
        }

        d3.select("#searchButton").on('click', searchNode);

        function renderDiagram() {

            function getSelectedLinks(links) {
                return _.filter(links, function(link) {
                    return checkedList.indexOf(link.source) != -1 && checkedList.indexOf(link.target) != -1;

                });
            }

            var dataLinks = getSelectedLinks(data.links);

            var fixedLinks = _.map(dataLinks, function(link) {
                return {
                    source: nodeById[link.source],
                    target: nodeById[link.target]
                };
            });

            //Toggle stores whether the highlighting is on
            var toggle = 0;

            //Create an array logging what is connected to what
            var linkedByIndex = [];

            for (i = 0; i < data.nodes.length; i++) {
                linkedByIndex[i + "," + i] = 1;
            };

            data.links.forEach(function(d) {
                linkedByIndex[d.source + "," + d.target] = 1;
            });

            //This function looks up whether a pair are neighbours
            function neighboring(a, b) {
                return linkedByIndex[a.id + "," + b.id];
            }

            function connectedNodes() {

                var node = svg.selectAll(".node");
                var link = svg.selectAll(".link");

                if (toggle == 0) {
                    //Reduce the opacity of all but the neighbouring nodes
                    var d = d3.select(this).node().__data__;

                    // console.log(d);

                    node.style("opacity", function(o) {
                        return neighboring(d, o) | neighboring(o, d) ? 1 : 0.1;
                    });

                    link.style("opacity", function(o) {
                        return d.index == o.source.index | d.index == o.target.index ? 1 : 0.1;
                    });

                    //Reduce the op
                    toggle = 1;
                } else {
                    //Put them back to opacity=1
                    node.style("opacity", 1);
                    link.style("opacity", 1);
                    toggle = 0;
                }
            }

            force.nodes(data.nodes)
                .links(fixedLinks)
                .start();

            var tooltip = d3.select("body")
                .append("div")
                .style("position", "absolute")
                .style("font-size", "40px")
                .style("font-family", "calibri")
                .style("color", "white")
                .style("z-index", "10")
                .style("text-shadow", "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000")
                .style("visibility", "hidden")
                .text("a simple tooltip");

            function getSelectedNodes(nodes) {
                return _.map(checkedList, function(id) {
                    return nodeById[id];
                });
            }

            // render node
            var nodes = svg.selectAll('.node')
                .data(getSelectedNodes(data.nodes), function(d) {
                    return d.id
                });

            var nodesEnter = nodes.enter()
                .append('g')
                .attr('class', 'node')
                .attr('transform', 'translate(50, 50)')
                .call(force.drag)
                .on('dblclick', connectedNodes);

            nodesEnter.append('circle')
                .attr('r', r)
                .style('fill', function(a) {
                    if (a.weight > 10) {
                        return '#f00';
                    } else if (a.weight > 5) {
                        return '#f55'
                    } else if (a.weight > 1) {
                        return '#5f5'
                    } else if (a.weight <= 1) {
                        return '#55f'
                    } else {
                        return '#999';
                    }
                })
                .on("mouseover", function(a) {

                    var radius = 50;

                    d3.select(this)
                        .transition()
                        .duration(750)
                        .attr('r', radius)
                        .style('z-index', -100000);

                    d3.select(this.parentElement)
                        .select('text')
                        .classed("mouseIsOver", true)
                        .style("font-size", "25px");
                })
                .on("mousemove", function() {
                    return tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
                })
                .on("mouseout", function() {
                    var radius = 20;

                    d3.select(this.parentElement)
                        .select('text')
                        .style("font-size", "15px");

                    d3.select(this).transition().duration(750).attr('r', r);
                });

            nodesEnter.append('text');

            nodes.select('text').text(function(d) {
                return scramble(d.label)
            });

            // lägga text i mitten av cirkeln
            nodes.select('text')
                .attr("text-anchor", "middle")
                .attr("dy", ".35em")
                .text(function(d) {
                    return scramble(d.label)
                });

            nodes.exit()
                .remove();

            // render links
            var links = svg.selectAll('.link')
                .data(dataLinks, function(d) {
                    return String(d.source) + '_' + String(d.target)
                });

            var linksEnter = links.enter()
                .append('line')
                .attr('class', 'link')
                .attr('marker-end', 'url(#markerArrowEnd)');

            links.exit()
                .remove();

            function adjustEnds(fromPoint, toPoint) {
                var dx = toPoint.x - fromPoint.x,
                    dy = toPoint.y - fromPoint.y,
                    length = Math.sqrt(dx * dx + dy * dy);
                dx = dx / length * r;
                dy = dy / length * r;
                return {
                    source: {
                        x: fromPoint.x + dx,
                        y: fromPoint.y + dy
                    },
                    target: {
                        x: toPoint.x - dx,
                        y: toPoint.y - dy
                    }
                };
            }

            force.on("tick", function() {

                var q = d3.geom.quadtree(data.nodes),
                    i = 0,
                    n = data.nodes.length;

                while (++i < n) q.visit(collide(data.nodes[i]));

                nodes.each(function(d) {

                    d3.select(this)
                        .attr('transform', 'translate(' + d.x + ', ' + d.y + ')');
                });

                links.each(function(d) {
                    var adjustedEnds = adjustEnds(nodeById[d.source], nodeById[d.target]);

                    d3.select(this)
                        .attr("x1", function(d) {
                            return adjustedEnds.source.x;
                        })
                        .attr("y1", function(d) {
                            return adjustedEnds.source.y;
                        })
                        .attr("x2", function(d) {
                            return adjustedEnds.target.x;
                        })
                        .attr("y2", function(d) {
                            return adjustedEnds.target.y;
                        });
                });
            });
        }
    });
}

function collide(node) {
    var r = node.radius + 16,
        nx1 = node.x - r,
        nx2 = node.x + r,
        ny1 = node.y - r,
        ny2 = node.y + r;
    return function(quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== node)) {
            var x = node.x - quad.point.x,
                y = node.y - quad.point.y,
                l = Math.sqrt(x * x + y * y),
                r = node.radius + quad.point.radius;
            if (l < r) {
                l = (l - r) / l * .5;
                node.x -= x *= l;
                node.y -= y *= l;
                quad.point.x += x;
                quad.point.y += y;
            }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    };
}

d3.select('#reload').on('click', function() {
    render();
})

render();
