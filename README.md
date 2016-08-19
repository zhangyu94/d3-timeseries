# d3_linechart.js

d3_linechart.js is a D3.js based line chart library that supports easy customization of line chart. 

<a href="https://d3js.org"><img src="http://vis.pku.edu.cn/wiki/_detail/visgroup/projects/timeline_explorer/system_8_19.png?id=visgroup%3Aprojects%3Atimeline_explorer%3Astart" align="left" hspace="10" vspace="6"></a>

##To render a line chart, follow the listed steps:

**Step1**. Binding: use jquery to select a div, and bind a d3_linechart object to it with $("#"+divID).d3_linechart()

**Step2**. Style specification: customize it with method chaining, such as $("#"+divID).d3_linechart().height(200).data(data)

**Step3**. Render: Evoke ($("#"+divID).d3_linechart().render())() to get the chart rendered. Another option is to use d3_linechart = $("#"+divID).d3_linechart() to get the renderer, and render the chart yourself with svg.datum(data).call(d3_linechart)

##Notice: 
To facilitate rendering in Step3, it is compulsory that data has been bound to the linechart.


##Usage example: 
var data = [{   
    	label: "Data Set 1", 
    	data: [
	{x:0,y:0},
	{x:1,y:1,color:"red"},
	{x:2,y:2,color:"red"},
	{x:3,y:-3},
	{x:4,y:4,color:"red"},
	{x:5,y:17},
	{x:6,y:3},
	{x:7,y:3},
],}, 

($("#"+divID).d3_linechart()
            .data(data)
            .height(200)
            .width(width)
            .x_scale_type("time")
            .xlabel("")
            .ylabel("") 
            .draw_xgrid(true)
            .draw_ygrid(true)
            .draw_datalabel(true)
            .linechart_id("linechart1")
            .margin({top: 20, right: 80, bottom:20, left: 40})
            .yTickNum(5)
            .draw_xAxis(true)
            .draw_yAxis(true)
            .color_scale(d3.scale.category10())
            .mousemove(function(){/*$("#renderplace1").d3_linechart().x().mousemove_value*/})
            .render())();

Dependency: d3.js version 3.x and jquery.js
