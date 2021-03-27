const margin = {t: 50, r:50, b: 50, l: 50};
const size = {w: 1000, h: 800};
const svg = d3.select('svg#parallel');

svg.attr('width', size.w)
    .attr('height', size.h);

const containerG = svg.append('g')
    .classed('container', true)
    .attr('transform', `translate(${margin.t}, ${margin.l})`);


const sankeySVG = d3.select('svg#sankey')
    .attr('width', size.w)
    .attr('height', size.h);
const sankeyG = sankeySVG.append('g')
    .classed('container', true)
    .attr('transform', `translate(${margin.t}, ${margin.l})`);
size.w = size.w - margin.l - margin.r;
size.h = size.h - margin.t - margin.b;

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

    let types = new Set(data.map(d => d.type));
    type = Array.from(types);

    console.log(types);

    let scales = {
        type: d3.scalePoint().domain(types).range([0, size.h])
    }
    // console.log(scales.type("Grass"));

    columns.forEach(columnName => {
        
        let scale = d3.scaleLinear()
            .domain(d3.extent(data,d => d[columnName]))
            .range([0, size.h]);

        scales[columnName] = scale;
    });

    // make an x scale
    let xScale = d3.scalePoint()
        .domain(Object.keys(scales))
        .range([0, size.w]);


    // draw x-axis
    containerG.append('g')
        .classed('axis-x', true)
        .attr('transform', `translate(0, ${size.h + 20})`)
        .call(d3.axisBottom(xScale));

    
    containerG.append('g')
        .selectAll('g')
        .data(xScale.domain())
        .join('g')
        .classed('parallel-axis', true)
        .each(function(d) {
            let g = d3.select(this);
            let scale = scales[d];
            let axis = d3.axisLeft(scale);
            
            g.attr('transform', `translate(${xScale(d)}, 0)`);
            g.call(axis);
        })

    // need to get multiple scales into here
    let line = d3.line()
        .x(d => xScale(d.x))
        .y(d => {
            return d.scale(d.value);
        })

    containerG.append('g')
        .classed('lines', true)
        .selectAll('path')
        .data(data)
        .join('path')
        // .attr('stroke', d => "orange")
        .attr('d', pokemon => {
            let columnNames = xScale.domain();
            let crossProd = d3.cross(columnNames, [pokemon], (key, value) => {
                // console.log('cross', column, value);
                return {
                    scale: scales[key],
                    value: value[key],
                    x: key
                }
            });

            return line(crossProd);
        });

}

function prepareSankeyData(pokemon) {

    let nodes = columns.map(d => { return {name: d } });

    let links = columns.filter(d => d !== 'total')
        .map(d => {

            return {
                source: 'total',
                target: d,
                value: pokemon[d]
            };
        });

    return {nodes: nodes, links: links };

}

function drawSankey(data) {

    let sankeyLayout = d3.sankey()
        .nodeId(d => d.name)
        .nodeWidth(15)
        .nodePadding(15)
        .extent([ [0, 0], [size.w, size.h] ]);

    let sankey = sankeyLayout(data);

    sankeyG.selectAll('rect')
        .data(sankey.nodes)
        .join('rect')
        .attr('x', d => d.x0)
        .attr('y', d => d.y0)
        .attr('width', d => d.x1-d.x0)
        .attr('height', d => d.y1-d.y0);

    sankeyG.selectAll('path')
        .data(sankey.links)
        .join('path')
        .attr('d', d3.sankeyLinkHorizontal())
        .attr('stroke-width', d => d.width);

    sankeyG.selectAll('text')
        .data(sankey.nodes)
        .join('text')
        .text(d => d.name)
        .attr('transform', d => `translate(${d.x0}, ${d.y0}) rotate(90)`);


}