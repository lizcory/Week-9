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

const columns = ['hp', 'speed', 'attack', 'defense', 'total'];


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
}

function prepareSankeyData(pokemon) {
}

function drawSankey(data) {
}