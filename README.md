# d3-timeseries

D3 3.0 implementation of timeseries plugin that supports easy customization of bitmap / horizongraph / linechart or multiresolution layout self adaptive to display height. 

The plugin is implemented as a closure that support method chaining.

Notice: the Horizon Graph layout is currently a version with minor revision to the layout in https://bl.ocks.org/mbostock/1483226

## Installing

Dependency: D3-timeseries requires D3 3.x version and jquery as dependency
Installing: All the content of d3-timeseries plugin is in the folder libs/d3_timeseries. To use bitmap or horizon or linechart, you can just download the corresponding single file (and corresponding css, if it has) in the folder. Two different versions of linechart are provided that share the same css file.

## To render a line chart, follow the listed steps

**Step1**. Binding: use jquery to select a div, and bind a d3_linechart object to it with $("#"+divID).d3_linechart()

**Step2**. Style specification: customize it with method chaining, such as $("#"+divID).d3_linechart().height(200).data(data)

**Step3**. Render: Evoke ($("#"+divID).d3_linechart().render())() to get the chart rendered. Another option is to use d3_linechart = $("#"+divID).d3_linechart() to get the renderer, and render the chart yourself with svg.datum(data).call(d3_linechart)

## Usage example
```js
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
```

## Usage scenarios in our lab
### 1. fakestation
![image](http://note.youdao.com/yws/public/resource/79e994a9eae80352b49dda8385f14c83/xmlnote/94132835EF4F4FEB81200B2D1BCA44F2/958)

- play 
- adjust slidling window size
- click and drag to move slidling window position
- adjust play speed 
- stack bar 

### 2. flight 
![image](http://note.youdao.com/yws/public/resource/79e994a9eae80352b49dda8385f14c83/xmlnote/0AD49C8F4FC5433DAAA7A4E86832549F/991)
- brush a timeline region

### 3. Weibo Footprint 
![image](http://note.youdao.com/yws/public/resource/79e994a9eae80352b49dda8385f14c83/xmlnote/C6F64A1AC7D7462C8E6E3A8C461EE5FE/995)

### 4. Weibo Geo  
![image](http://note.youdao.com/yws/public/resource/79e994a9eae80352b49dda8385f14c83/xmlnote/8ACF803568E34CBF83CD45CCBCA75123/1003)

- mix line chart with bar chart

### 5. Trajectory Cleaning
![image](http://note.youdao.com/yws/public/resource/79e994a9eae80352b49dda8385f14c83/xmlnote/0D9799E4C2214B4FB568F6C982F9B37E/1008)

- mix parallel coordinates with bar chart

### 6. Earthquake
![image](http://note.youdao.com/yws/public/resource/79e994a9eae80352b49dda8385f14c83/xmlnote/9D06355B04144A3B8F02CC63C1766CC0/1017)

- multi-level timeline to support overview and detail selecting

## Existing Tools
### 1. Hightchart
![image](http://note.youdao.com/yws/public/resource/79e994a9eae80352b49dda8385f14c83/xmlnote/28DB115AA72C4BE293718D54857A08A6/1023)


### 2. Echart
![image](http://note.youdao.com/yws/public/resource/79e994a9eae80352b49dda8385f14c83/xmlnote/9F4146CF605E43D68CE3532DC1D7EA93/1029)




## Sub components
- axis scale
    1. time scale
    2. linear scale
    3. ....

- axis text
    1. font-size 
    2. color
    3. ...
- label text
    1. location
    2. direction
    3. ...
- tip
    1.  location
    2.  style
- interaction
    1.  click
    2.  brush
    3.  moveover
    4.  play


