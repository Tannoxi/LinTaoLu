let width = 1920;
let height = 1080;

let svg = d3.select('#kg-container');
let maingroup = svg.append('g').attr('id', 'maingroup').attr('viewBox','0 0 1920 1080').attr('transform', 'translate(0, 0) scale(1)');
let linkGroup = maingroup.append('g')
let circleGroup = maingroup.append('g')
let links,nodes;
let simulation;

let color;
let circles,lines;
let options;
let filterSelect = d3.select('search-input');
let nodes_option;
let linktexts,nodetexts;
let selectedNode;

// 为maingroup添加放大缩小的功能
const zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on("zoom", zoomed);
// 此处是svg响应鼠标中间的缩放输入，鼠标在svg范围内交互即可放大缩小
svg.call(zoom);


// 初始渲染函数
const render_init = function (data) {

    lines = linkGroup.selectAll('line').data(links).join('line')
    .attr('class','singleline')
    .attr('stroke','black')
    .attr('opacity',0.6)
    .attr('fill','#0d0d0d')
    .attr('stroke-width',0.8);
    
    circles = circleGroup.append('g').selectAll('circle').data(nodes).join('circle')
    .attr('class','singlenode')
    .attr('r',20)
    .attr('stroke','#0d0d0d')
    .attr('fill', d => (d.category === 'father' ? '#ff8e3c' : '#fffffe'))
    .call(d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended))
    .on("mouseover", (event,d)=>{
      d3.select(event.currentTarget).attr('opacity', 1);
      console.log(d.id)
      d3.selectAll('.singleline').filter(dd => d.group !== dd.group ).transition().duration(500).ease(d3.easeLinear).attr('opacity', 0.3);
      d3.selectAll('.singlenode').filter(dd => d.group !== dd.group ).transition().duration(500).ease(d3.easeLinear).attr('opacity', 0.3);
      d3.selectAll('.linktext').filter(dd => d.group !== dd.group ).transition().duration(500).ease(d3.easeLinear).attr('opacity', 0.3);
      d3.selectAll('.nodetext').filter(dd => d.group !== dd.group ).transition().duration(500).ease(d3.easeLinear).attr('opacity', 0.3);
    })
    .on("mouseout", (event,d)=>{
      d3.select(event.currentTarget).attr('opacity', 1);
      console.log(d.id)
      d3.selectAll('.singleline').filter(dd => d.group !== dd.group ).transition().duration(500).ease(d3.easeLinear).attr('opacity', 1);
      d3.selectAll('.singlenode').filter(dd => d.group !== dd.group ).transition().duration(500).ease(d3.easeLinear).attr('opacity', 1);
      d3.selectAll('.linktext').filter(dd => d.group !== dd.group ).transition().duration(500).ease(d3.easeLinear).attr('opacity', 1);
      d3.selectAll('.nodetext').filter(dd => d.group !== dd.group ).transition().duration(500).ease(d3.easeLinear).attr('opacity', 1);
    });

    nodetexts = circleGroup.selectAll('text').data(nodes).join('text')
    .attr('class','nodetext')
    .attr('fill','#2a2a2a')
    .attr('font-weight',d => (d.category === 'father' ? 'bold' : 'normal'))
    .attr('text-anchor', 'middle')
    .style('font-size', 12)
    .text(d=>(d.name));

    linktexts = linkGroup.selectAll('text').data(links).join('text')
    .attr('class','linktext')
    .attr('fill','#2a2a2a')
    .text(d=>(d.relation))
    .attr('font-size','0.7em');

}

// 局部渲染函数
const updateGraph = function(data,selectedNode){

    // 监听下拉列表选项，更新力导向图的节点和链接
    // 此处注意selectnode需要使用parseInt函数转为整型才能与nodes中的id比较
    // 运用 ||（或）运算符，只要一边为true就是真
    const nodes_up = data.nodes.filter(node => node.id === parseInt(selectedNode)|| data.links.some(link => link.source === parseInt(selectedNode) || link.target === parseInt(selectedNode)));
    const links_up = data.links.filter(link => link.source.id === parseInt(selectedNode) || link.target.id === parseInt(selectedNode));

    // nodes_up参数只读取父节点，但是没办法把子节点一起提出来，需要将links_up的子节点提取到nodes_up中
    links_up.forEach(d =>{
        nodes_up.push(d['target'])
        // nodes_up.push(d['source'])
    })

    console.log(nodes_up)

    // 更新下拉列表选中状态
    filterSelect.property('value', selectedNode);

    // 清空原有的图形内容
    maingroup.selectAll("*").remove();

    // 重新渲染线条和节点
    lines = maingroup.append('g').selectAll('line').data(links_up).join('line')
    .attr('stroke','black')
    .attr('opacity',0.6)
    .attr('fill','#0d0d0d')
    .attr('stroke-width',0.8)
    
    circles = maingroup.append('g').selectAll('circle').data(nodes_up).join('circle')
    .attr('r',20)
    .attr('stroke','#0d0d0d')
    .attr('fill', d => (d.category === 'father' ? '#ff8e3c' : '#fffffe'))
    .call(d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended));

    linktexts = maingroup.append('g').selectAll('text').data(links_up).join('text')
    .attr('class','linktext')
    .attr('fill','#2a2a2a')
    .text(d=>(d.relation))
    .attr('font-size','0.7em');

    nodetexts = maingroup.append('g').selectAll('text').data(nodes_up).join('text')
    .attr('fill','#2a2a2a')
    .attr('font-weight',d => (d.category === 'father' ? 'bold' : 'normal'))
    .attr('text-anchor', 'middle')
    .style('font-size', 12)
    .text(d=>(d.name));

    simulation = d3.forceSimulation(nodes_up)
    .force('manyBody', d3.forceManyBody().strength(-50))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force("link", d3.forceLink(links).id((d) => d.id).strength(0.1).distance(100)) //此处d3.forceLinks()已在官方文档更新为d3.forceLink(links).id((d) => d.id)
    .on('tick', ticked);

}

function ticked() {
    lines
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y);

    linktexts
    .attr('x', d => (d.source.x + d.target.x) / 2)
    .attr('y', d => (d.source.y + d.target.y) / 2)

    circles
    .attr('cx', d => d.x)
    .attr('cy', d => d.y);

    nodetexts
    .attr('x', d => d.x)
    .attr('y', d => d.y);

}

function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  
function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}
  
function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

// 缩放事件的处理函数，此处是存储节点、连接的maingroup改变scale和transform属性
function zoomed(event) {
    const { transform } = event;
    maingroup.transition().duration(300).attr("transform", transform);
}

d3.json("new_json.json").then(data=>{
    links = data.links;
    // console.log(links);
    nodes = data.nodes; //把nodes从json数据转为数组[{},{},{},{}]的格式 (object改array)
    console.log(nodes);

    color = d3.scaleSequential(d3.interpolateRainbow)
    .domain([0, nodes.length-1]);

    // 初始化渲染所有节点
    render_init(data);

    // 设置力学模拟的参数
    simulation = d3.forceSimulation(nodes)
    .force('manyBody', d3.forceManyBody().strength(-50))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force("link", d3.forceLink(links).id((d) => d.id).strength(0.1).distance(100)) //此处d3.forceLinks()已在官方文档更新为d3.forceLink(links).id((d) => d.id)
    .on('tick', ticked);

    // 保留节点数组中的父节点生成下拉选项
    nodes_option = nodes.filter(d => d.category === 'father')
    // console.log(nodes_option);

    // 生成下拉列表
    // options = filterSelect.selectAll('option')
    // .data(nodes_option)
    // .enter()
    // .append('option')
    // .text(d => d.name)
    // .attr('value', d => d.id);

    const searchInput = document.getElementById('search-input');
    const dropdownMenu = document.getElementById('dropdown-menu');
    
    searchInput.addEventListener('input', handleSearchInput);
    
    function handleSearchInput() {
      const searchTerm = this.value.trim();
      console.log('searchTerm.length:',searchTerm.length)
      if (searchTerm.length > 0) {
        const matchedNodes = nodes_option.filter(node => node.name.includes(searchTerm));
		console.dir(matchedNodes)
        showDropdownMenu(matchedNodes, searchTerm);
      } else {
        hideDropdownMenu();
      }
    }
    
    function showDropdownMenu(matchedNodes, searchTerm) {
      dropdownMenu.innerHTML = '';
      
      matchedNodes.forEach(node => {
        const item = document.createElement('li');
        item.classList.add('dropdown-item');
        
        // 将匹配关键词用黄色标注
        const highlightedName = node.name.replace(new RegExp(searchTerm, 'gi'), match => `<span class="highlight">${match}</span>`);
        item.innerHTML = highlightedName;
        
        item.addEventListener('click', () => {
          searchInput.value = node.name;
          hideDropdownMenu();
          selectedNode = node.id;
          updateGraph(data,selectedNode);
        });
        
        dropdownMenu.appendChild(item);
      });
      
      dropdownMenu.style.display = 'block';
    }
    
    function hideDropdownMenu() {
      dropdownMenu.style.display = 'none';
    }

    // 监听下拉列表变化事件
    // filterSelect.on('change', function() {
    //     const selectedNode = filterSelect.node().value;
    //     console.log(selectedNode)
    //     updateGraph(data,selectedNode);
    // });
})

