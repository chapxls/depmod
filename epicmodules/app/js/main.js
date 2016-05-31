var d3 = require('d3');
var _ = require('lodash');

var r = 20,
    epicticketR = 50,
    width = 1200,
    height = 1000,
    ticketW = 80,
    ticketH = 80;

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
    .gravity(.05)
    .linkDistance(150)
    .charge(function(d) {
        var charge = -500;
        if (d.index === 0) charge = 10 * charge;
        return charge;
    })
    .size([width, height]);

var columns = ["", "module",
    "in",
    "out"
];

var table = d3.select('#table')
    .append('table');

var thead = table.append('thead');

var tbody = table.append('tbody');

thead.append("tr")
    .selectAll("th")
    .data(columns)
    .enter()
    .append("th")
    .text(function(column) {
        return column;
    });

//fetch epic ticket and set up menu
function epict() {

    //returns the value of the selected option in the selected element elt
    function getSelectedValue(elt) {
        if (elt.selectedIndex == -1)
            return null;
        return elt.options[elt.selectedIndex].value;
    }

    d3.json('/epictickets', function(error, data) {

        var epicTicketById = _.keyBy(data, 'id');
        var select = d3.select("#epicticket")
            .on("change", function(d) {
                //user have selected an epic ticket in the menu
                var id = getSelectedValue(this);
                if (id) {
                    render(id);
                }
            })
            .selectAll("option")
            .data(data)
            .enter()
            .append("option")
            .attr("value", function(d) {
                return d.id;
            })
            .text(function(d) {
                return d.label;
            });
        render(data[0].id);
    });
}

epict();

//add to data.nodes all modules that depends on the nodes in data.nodes
function collectDependentModules(data, nodeById, allData, allNodeById) {

    var dependentNodes = [],
        dependentLinks = [];

    var startNodes = data.nodes;

    while (true) {

        dependentNodes = [];
        dependentLinks = [];

        for (var node of startNodes) {
            for (var link of allData.links) {
                if (node.id == link.to && !nodeById[link.from]) {
                    dependentNodes.push(allNodeById[link.from]);
                    dependentLinks.push(link);
                }
            }
        }
        //when dependentNodes is empty, break loop
        if (dependentNodes.length == 0) {
            break;
        }

        for (var node of dependentNodes) {
            if (!nodeById[node.id]) {
                data.nodes.push(node);
                nodeById[node.id] = node;
            }
        }
        for (var link of dependentLinks) {
            data.links.push(link);
        }
        startNodes = dependentNodes;
    }
}

//d3 json som hämtar alla nodes and links
//  console.log(JSON.stringify(data, null, '  '));
function render(ticketid) {

    d3.select('#table').select('tbody')
        .selectAll('tr')
        .remove();

    d3.select('#graph')
        .selectAll('g')
        .remove();

    d3.select('#graph')
        .selectAll('line')
        .remove();

    //get ticket modules
    d3.json('/epictickets/' + ticketid + '/nodesandlinks', function(error, data) {

        var nodeById = _.keyBy(data.nodes, 'id');

        //get all modules
        d3.json('/nodesandlinks', function(error, allData) {

            var allNodeById = _.keyBy(allData.nodes, 'id');

            _.forEach(data.nodes, function(node) {
                if (node.type == 'module') {
                    data.links.push({
                        'from': ticketid,
                        'to': node.id
                    })
                }
            });

            collectDependentModules(data, nodeById, allData, allNodeById);

            var epicTicketNode = {
                'id': ticketid,
                'label': data.ticketLabel,
                'type': 'epicticket'
            };

            data.nodes.push(epicTicketNode);

            nodeById[epicTicketNode.id] = epicTicketNode;

            calculateInOutCounts(data, nodeById);

            renderTable();

            var checkedList = [];

            function calculateChecklist() {
                checkedList = [];
                table.selectAll('input')
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
                renderDiagram(data, checkedList, nodeById);
            });

            d3.select('#uncheckAll').on('click', function() {
                table.selectAll('input')
                    .property('checked', false);
                calculateChecklist();
                renderDiagram(data, checkedList, nodeById);
            });

            var newTbody, rows, tr;

            function renderTable() {

                newTbody = table.selectAll('tbody')
                    .data(['dummy']);

                newTbody.enter()
                    .append('tbody')
                    .attr('id', 'moduleTbody');

                rows = newTbody.selectAll('.moduleRow')
                    .data(data.nodes, function(d) {
                        return d.id
                    });

                tr = rows.enter()
                    .append('tr')
                    .attr('class', 'moduleRow');

                tr.append('td')
                    .append('input')
                    .attr('type', 'checkbox')
                    .attr('checked', 'true')
                    .on('change', function(d) {
                        calculateChecklist();
                        renderDiagram(data, checkedList, nodeById);
                    });

                tr.append('td')
                    .text(function(d) {
                        return d.label
                    });

                tr.append('td')
                    .attr('class', 'incount');

                tr.append('td')
                    .attr('class', 'outcount');

                rows.select('.incount')
                    .text(function(d) {
                        return d.inCount
                    });

                rows.select('.outcount')
                    .text(function(d) {
                        return d.outCount
                    });

                rows.exit().remove();
            }

            calculateChecklist();
            renderDiagram(data, checkedList, nodeById);

        });
    });
}

function calculateInOutCounts(data, nodeById) {

    _.forEach(data.nodes, function(node) {
        node.inCount = 0;
        node.outCount = 0;
    });

    _.forEach(data.links, function(link) {
        if (nodeById[link.from]) {
            nodeById[link.from].outCount += 1;
        }
        if (nodeById[link.to]) {
            nodeById[link.to].inCount += 1;
        }
    });
}

function renderDiagram(data, checkedList, nodeById) {

    function getSelectedLinks(links) {
        return _.filter(links, function(link) {
            return checkedList.indexOf(link.from) != -1 && checkedList.indexOf(link.to) != -1;
        });
    }

    var dataLinks = getSelectedLinks(data.links);

    var forceLinks = _.map(dataLinks, function(link) {
        return {
            source: nodeById[link.from],
            target: nodeById[link.to]
        };
    });

    force.nodes(data.nodes)
        .links(forceLinks)
        .start();

    function getSelectedNodes(nodes) {
        return _.filter(nodes, function(node) {
            return _.includes(checkedList, node.id)
        });
    }

    var nodesByType = _.groupBy(data.nodes, 'type');

    var nodes, ticketNodes, links;

    renderNodes();

    renderLinks();
    renderTickedNode();

    function renderNodes() {

        nodes = svg.selectAll('.node')
            .data(getSelectedNodes(nodesByType['module']), function(d) {
                return d.id
            });

        var nodesEnter = nodes.enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', 'translate(50, 50)')
            .call(force.drag);

        nodesEnter.append('circle')
            .attr('r', r)
            .style('fill', '#e1e1e1')
            .call(addmouseHandling);

        nodesEnter.append('text');

        nodes.select('text')
            .attr("text-anchor", "middle")
            .attr("dy", ".35em")
            .text(function(d) {
                return d.label
            });

        nodes.exit()
            .remove();
    }

    function renderTickedNode() {

        // console.log(getSelectedNodes(nodesByType['epicticket']));
        // console.log(nodesByType['epicticket']);

        ticketNodes = svg.selectAll('.ticketnode')
            .data(getSelectedNodes(nodesByType['epicticket']), function(d) {
                return d.id
            });

            console.log(ticketNodes);

        var ticketNodesEnter = ticketNodes.enter()
            .append('g')
            .attr('class', 'ticketnode')
            .attr('transform', 'translate(50, 50)')
            .call(force.drag);

        ticketNodesEnter.append('rect')
            .attr("width", ticketW)
            .attr("height", ticketH)
            .call(function(node) {
                addmouseHandling(node)
            });

        ticketNodesEnter.append('text');

        ticketNodes.select('text')
            .attr("text-anchor", "right")
            .attr("dy", "2em")
            .text(function(d) {
                return d.label
            });

        ticketNodes.exit()
            .remove();
    }

    function renderLinks() {

        links = svg.selectAll('.link')
            .data(dataLinks, function(d) {
                return String(d.from) + '_' + String(d.to)
            });

        links.enter()
            .append('line')
            .attr('class', 'link')
            .attr('marker-end', 'url(#markerArrowEnd)');

        links.exit()
            .remove();
    }

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

    function addmouseHandling(node) {
        node.on("mouseover", function(node) {
                var radius = 50;
                if (node.type == 'epicticket') {
                    radius = epicticketR * 2;
                }

                d3.select(this)
                    .transition()
                    .duration(750)
                    .attr('r', radius)
                    .style('z-index', 5);

                d3.select(this.parentElement)
                    .select('text')
                    .classed("mouseIsOver", true)
                    .style("font-size", "25px");
            })
            .on("mouseout", function(node) {
                var radius = 20;
                if (node.type == 'epicticket') {
                    radius = epicticketR;
                }

                svg.selectAll('.link').style('stroke-width', function(link) {
                    if (node === link.from || node === link.to) {
                        return 2;
                    }
                });

                d3.select(this.parentElement)
                    .select('text')
                    .style("font-size", "15px");

                d3.select(this).transition().duration(750).attr('r', radius)
            });
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

        ticketNodes.each(function(d) {
            d3.select(this)
                .attr('transform', 'translate(' + (d.x - 40) + ', ' + (d.y - 40) + ')');
        });

        links.each(function(d) {

            var adjustedEnds = adjustEnds(nodeById[d.from], nodeById[d.to]);

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
