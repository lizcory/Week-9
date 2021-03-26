const margin = {t: 50, r:50, b: 50, l: 50};
const size = {w: 1000, h: 800};
const svg = d3.select('svg#parallel');

svg.attr('width', size.w)
    .attr('height', size.h);

const containerG = svg.append('g')
    .classed('container', true)
    .attr('transform', `translate(${margin.t}, ${margin.l})`);

// SVG Element for sankey diagram
const sankeySVG = d3.select('svg#sankey')
    .attr('width', size.w)
    .attr('height', size.h);
const sankeyG = sankeySVG.append('g')
    .classed('container', true)
    .attr('transform', `translate(${margin.t}, ${margin.l})`);
size.w = size.w - margin.l - margin.r;
size.h = size.h - margin.t - margin.b;

// columns for CSV that will become parallel coordinates
const columns = ['hp', 'speed', 'attack', 'defense', 'spAtk', 'spDef', 'total'];


d3.csv('data/Pokemon.csv', function(d) {
    return {
        name: d.Name,
        type: d['Type 1'],
        total: +d.Total,
        hp: +d.HP,
        attack: +d.Attack,
        defense: +d.Defense,
        spAtk: +d['Sp. Atk'],
        spDef: +d['Sp. Def'],
        speed: +d.Speed
    }
})
.then(function(data) {
    
    console.log(data[0]);

    parallelCoordinates(data);

    let sankeyData = prepareSankeyData(data[0]);
    drawSankey(sankeyData);
});


function parallelCoordinates(data) {

    // let's extract all the types (of pokemon) from the dataset
    // as this will be our first axis
    let types = new Set(data.map(d => d.type));
    types = Array.from(types);

    console.log(types);

    // since we have multiple axis, we need multiple scales as well
    // this scales object will keep record of all the scales
    // and is mapped to the respective variables
    // e.g
    // for a scale of type
    // we can write scales['type'] or scales.type
    let scales = {
        type: d3.scalePoint().domain(types).range([0, size.h])
    };

    // create the scales for all axis
    // and add them to scales variable
    columns
        .forEach(key => {
            let scale = d3.scaleLinear()
                .domain(d3.extent(data, d => d[key]))
                .range([0, size.h])
            scales[key] = scale;
        });

    console.log(Object.keys(scales));

    // all the above scales are placed on an x-axis
    // so this is what we use for that
    const xScale = d3.scalePoint(Object.keys(scales), [0, size.w]);

    // drawing the x-axis
    containerG.append('g')
        .attr('transform' , `translate(0, ${size.h+20})`)
        .classed('axis-x', true)
        .call(d3.axisBottom(xScale));

    // drawing all the y-axis
    containerG.append('g')
        .classed('axes', true)
        .selectAll('g')
        .data(xScale.domain())
        .join('g')
        .attr('transform', d => `translate(${xScale(d)}, 0)`)
        .attr('key', d => d)
        .each(function(d) {
            d3.select(this).call(d3.axisLeft(scales[d]));
        });

    // The line function for our convenience
    let line = d3.line()
        .y(([key, value]) =>  scales[key](value) )
        // since y scale is different for each x value
        // we need to pass in the scale along with each y value
        .x(([key]) => xScale(key));
        // x scale is just one, so we can just use that one

    // drawing the lines
    containerG.append('g')
        .classed('lines', true)
        .selectAll('path')
        .data(data)
        .join('path')
        .attr('d', d => {
            let cross = d3.cross(Object.keys(scales), [d], (key, d) => [key, d[key]])
            return line(cross);
        });

        /**
         * d3.cross([1, 2], ["x", "y"]);
         * // returns [[1, "x"], [1, "y"], [2, "x"], [2, "y"]]
         * 
         * d3.cross([1, 2], ["x", "y"], (a, b) => a + b);
         * // returns ["1x", "1y", "2x", "2y"]
         */
}

function prepareSankeyData(pokemon) {

    let data = {
        nodes: columns.map(d => { return { name: d }; }),
        links: columns.filter(d => d !== 'total').map(d => {
            return { source: 'total', target: d, value: pokemon[d] };
        })
    }

    // here we are preparing the sankey data
    // sankey diagram is essentially a network diagram
    // which needs nodes and links

    return data;
}

function drawSankey(data) {
    console.log(data);

    // creating the sankey layout
    // from the network data
    let sankey = d3.sankey()
        .nodeId(d => d.name)
        .nodeAlign(d3.sankeyJustify)
        .nodeWidth(15)
        .nodePadding(10)
        .extent([[0, 0], [size.w, size.h]]);
    sankey = sankey(data);
    // this gives us x,y values for all nodes
    // this also gives us paths for links

    console.log(data);

    // drawing the nodes as rectangles
    sankeyG.selectAll('rect')
        .data(sankey.nodes)
        .join('rect')
        .attr('x', d => d.x0)
        .attr('y', d => d.y0)
        .attr('width', d => d.x1-d.x0)
        .attr('height', d => d.y1-d.y0);

    // drawing the links as paths
    sankeyG.selectAll('path')
        .data(sankey.links)
        .join('path')
        .attr('d', d3.sankeyLinkHorizontal())
        .attr('stroke-width', d => d.width)
}