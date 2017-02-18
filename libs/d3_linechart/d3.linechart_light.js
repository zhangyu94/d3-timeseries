//version 1.5 2017.2.18 20:00
//dependency:
//d3.js version 3.5.17
//jquery.js version 2.1.1
(function(){
    d3.linechart_light = function() 
    {
        var width = 640,  
            height = 480, 
            xlabel = "",
            ylabel = "" ,
            draw_xGrid = false,
            draw_yGrid = false,
            draw_xAxis = false,
            draw_yAxis = false,
            draw_datalabel = false,
            margin = {top: 20, right: 20, bottom: 20, left: 20},
            duration = 500;
        
        function chart(selection) {
            selection.each(function(datasets) {
                //
                // Create the plot. 
                //
                var innerwidth = width - margin.left - margin.right,
                    innerheight = height - margin.top - margin.bottom ;
                
                var x_scale = d3.scale.linear()
                    .range([0, innerwidth])
                    .domain([ d3.min(datasets, function(d) { return d3.min(d.x); }), 
                              d3.max(datasets, function(d) { return d3.max(d.x); }) ]) ;
                
                var y_scale = d3.scale.linear()
                    .range([innerheight, 0])
                    .domain([ d3.min(datasets, function(d) { return d3.min(d.y); }),
                              d3.max(datasets, function(d) { return d3.max(d.y); }) ]) ;

                var color_scale = d3.scale.category10()
                    .domain(d3.range(datasets.length)) ;


                var x_axis = d3.svg.axis()
                    .scale(x_scale)
                    .orient("bottom") ;

                var y_axis = d3.svg.axis()
                    .scale(y_scale)
                    .orient("left") ;

                var svg = d3.select(this)
                    .attr("width", width)
                    .attr("height", height)
                

                var g = svg.selectAll(".container")
                    .data([null])
                    .enter().append("g")
                    .attr("class", "container")
                svg.selectAll(".container").transition()
                    .duration(duration)
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                g = svg.selectAll(".container")

                if (draw_xGrid)//如果需要画x轴向上的grid
                {
                    var x_grid = d3.svg.axis()
                        .scale(x_scale)
                        .orient("bottom")
                        .tickSize(-innerheight)
                        .tickFormat("") ;

                    var x_grid_selection = g.selectAll(".x.grid")
                        .data([null])
                    x_grid_selection.enter().append('g')
                        .attr("class", "x grid");
                    g.selectAll(".x.grid").transition()
                        .duration(duration)
                        .attr("transform", "translate(0," + innerheight + ")")
                        .call(x_grid);  
                }

                if (draw_yGrid)//如果需要画y轴向上的grid
                {
                    var y_grid = d3.svg.axis()
                        .scale(y_scale)
                        .orient("left") 
                        .tickSize(-innerwidth)
                        .tickFormat("") ;

                    var y_grid_selection = g.selectAll(".y.grid")
                        .data([null])
                    y_grid_selection.enter().append('g')
                        .attr("class", "y grid");
                    g.selectAll(".y.grid").transition()
                        .duration(duration)
                        .call(y_grid);  
                }
                
                if (draw_xAxis)//如果需要画x轴
                {
                    var xAxis_selection = g.selectAll(".x.axis")
                        .data([null])
                    xAxis_selection.enter().append('g')
                        .attr("class", "x axis")
                    g.selectAll(".x.axis").transition()
                        .duration(duration)
                        .attr("transform", "translate(0," + innerheight + ")") 
                        .call(x_axis)
                         
                    var text_selection = g.selectAll(".x.axis").selectAll('.x.label')
                        .data([null])
                    text_selection.enter().append('text')
                        .attr("class", "x label")
                        .style("text-anchor", "end")
                        .attr("dy", "-.71em")
                    g.selectAll(".x.axis").selectAll('.x.label').transition()
                        .duration(duration)
                        .attr("x", innerwidth)
                        .text(xlabel)
                }
                
                if (draw_yAxis)//如果需要画y轴
                {
                    var yAxis_selection = g.selectAll(".y.axis")
                        .data([null])
                    yAxis_selection.enter().append('g')
                        .attr("class", "y axis")        
                    g.selectAll(".y.axis").transition()
                        .duration(duration)
                        .call(y_axis);  
                        
                    var text_selection = g.selectAll(".y.axis").selectAll('.y.label')
                        .data([null])
                    text_selection.enter().append('text')
                        .attr("class", "y label")
                        .attr("transform", "rotate(-90)")
                        .style("text-anchor", "end")
                        .attr("y", 6)
                        .attr("dy", "0.71em")
                    g.selectAll(".y.axis").selectAll('.y.label').transition()
                        .duration(duration)
                        .text(ylabel)
                }

                var draw_line = d3.svg.line()
                    .interpolate("basis")
                    .x(function(d) { return x_scale(d[0]); })
                    .y(function(d) { return y_scale(d[1]); }) ;


                var data_lines_selection = g.selectAll(".d3_linechart_line")
                    .data(datasets.map(function(d) {return d3.zip(d.x, d.y);}))
                data_lines_selection.enter().append("g")
                    .attr("class", "d3_linechart_line") ;
                data_lines_selection.exit().remove();

                var line_selection = g.selectAll(".d3_linechart_line").selectAll('.line')
                    .data(function(d){return [d]})
                line_selection.enter().append('path')
                    .attr("class", "line")
                g.selectAll(".d3_linechart_line").selectAll('.line').transition()
                    .duration(duration)
                    .attr("d", function(d) {return draw_line(d); })
                    .attr("stroke", function(_, i) {return color_scale(i);}) ;

                
                if (draw_datalabel)//如果需要画线末尾的label
                {
                    g.selectAll(".d3_linechart_line").append("text")
                        .datum(function(d, i) { return {name: datasets[i].label, final: d[d.length-1]}; }) 
                        .attr("transform", function(d) { 
                            return ( "translate(" + x_scale(d.final[0]) + "," + 
                                     y_scale(d.final[1]) + ")" ) ; })
                        .attr("x", 3)
                        .attr("dy", ".35em")
                        .attr("fill", function(_, i) { return color_scale(i); })
                        .text(function(d) { return d.name; }) ;
                }

            }) ;
        }

        chart.width = function(value) {
            if (!arguments.length) return width;
            width = value;
            return chart;
        };

        chart.height = function(value) {
            if (!arguments.length) return height;
            height = value;
            return chart;
        };

        chart.margin = function(value) {
            if (!arguments.length) return margin;
            if (typeof(value)!="object")
            {
                console.warn("invalid value for margin",value);
                return;
            }
            if (typeof(value.top)=="number")
                margin.top = value.top;
            if (typeof(value.right)=="number")
                margin.right = value.right;
            if (typeof(value.bottom)=="number")
                margin.bottom = value.bottom;
            if (typeof(value.left)=="number")
                margin.left = value.left;
            return chart;
        };

        chart.duration = function(value){
            if (!arguments.length) return duration;
            if (typeof(value)!="number")
            {
                console.warn("invalid value for duration",value);
                return;
            }
            duration = value;
            return chart;
        };

        chart.xlabel = function(value) {
            if(!arguments.length) return xlabel ;
            xlabel = value ;
            return chart ;
        } ;

        chart.ylabel = function(value) {
            if(!arguments.length) return ylabel ;
            ylabel = value ;
            return chart ;
        } ;

        chart.draw_yAxis = function(value){
            if (!arguments.length) return draw_yAxis;
            if (typeof(value)!="boolean")
            {
                console.warn("invalid value for draw_yAxis",value);
                return;
            }
            draw_yAxis = value;
            return chart;
        };

        chart.draw_xAxis = function(value){
            if (!arguments.length) return draw_xAxis;
            if (typeof(value)!="boolean")
            {
                console.warn("invalid value for draw_xAxis",value);
                return;
            }
            draw_xAxis = value;
            return chart;
        };

        chart.draw_xGrid = function(value){
            if (!arguments.length) return draw_xGrid;
            if (typeof(value)!="boolean")
            {
                console.warn("invalid value for draw_xGrid",value);
                return;
            }
            draw_xGrid = value;
            return chart;
        };

        chart.draw_yGrid = function(value){
            if (!arguments.length) return draw_yGrid;
            if (typeof(value)!="boolean")
            {
                console.warn("invalid value for draw_yGrid",value);
                return;
            }
            draw_yGrid = value;
            return chart;
        };

        chart.draw_datalabel = function(value){
            if (!arguments.length) return draw_datalabel;
            if (typeof(value)!="boolean")
            {
                console.warn("invalid value for draw_datalabel",value);
                return;
            }
            draw_datalabel = value;
            return chart;
        };

        return chart;
    }
})();
