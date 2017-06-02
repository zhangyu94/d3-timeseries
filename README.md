# d3-timeseries

D3 3.0 implementation of timeseries plugin that supports easy customization of bitmap / horizongraph / linechart or multiresolution layout self adaptive to display height. 

The plugin is implemented as a closure that support method chaining.

## Installing

Dependency: D3-timeseries requires D3 3.x version and jquery as dependency
Installing: All the content of d3-timeseries plugin is in the folder libs/d3_timeseries. To use bitmap or horizon or linechart, you can just download the corresponding single file (and corresponding css, if it has) in the folder. Two different versions of linechart are provided that share the same css file.

## How to render a line chart

**Step1**. Binding: use jquery to select a div, and bind a d3_linechart object to it with $("#"+divID).d3_linechart()

**Step2**. Style specification: customize it with method chaining, such as $("#"+divID).d3_linechart().height(200).data(data)

**Step3**. Render: Evoke ($("#"+divID).d3_linechart().render())() to get the chart rendered. Another option is to use d3_linechart = $("#"+divID).d3_linechart() to get the renderer, and render the chart yourself with svg.datum(data).call(d3_linechart)

## Usage example
```js
var linechart = [{   
        label: "Data Set 1", 
        data: [
		{x:0,y:0},
	    	{x:1,y:1,color:"red"},
	    	{x:2,y:2,color:"red"},
	    	{x:3,y:-3},
	    	{x:4,y:4,color:"red"},
	    	{x:5,y:17},
	    	{x:6,y:3},
	    	{x:7,y:3}
	]
}]

var renderer = $("#"+divID).d3_linechart()
	.data([linechart])
        .x_scale_type("linear")
        .draw_xgrid(true)
        .draw_ygrid(true)
        .margin({top: 20, right: 80, bottom:20, left: 40})
        .render()
renderer()
```

## Credits

The Horizon Graph layout is credit to the layout in https://bl.ocks.org/mbostock/1483226
