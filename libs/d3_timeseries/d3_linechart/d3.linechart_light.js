//version 2017.3.26 12:00
//dependency:
//d3.js version 3.5.17
//jquery.js version 2.1.1

(function() {
    d3.linechart_light = function() {
        let width = 640,
            height = 480,
            xlabel = "",
            ylabel = "",
            draw_xGrid = false,
            draw_yGrid = false,
            draw_xAxis = false,
            draw_yAxis = false,
            draw_datalabel = false,
            margin = {
                top: 20,
                right: 20,
                bottom: 20,
                left: 20
            },
            duration = 500

        let global_value_extent = undefined

        function chart(selection) {
            //传入的dataset_lines目前只是一条直线的数据
            //dataset_lines是{x:arr1,y:arr2}的形式
            //arr1和arr2都是直接的数字的数组
            selection.each(function(dataset_lines) {
                let innerWidth = width - margin.left - margin.right,
                    innerHeight = height - margin.top - margin.bottom

                let x_scale = d3.scale.linear()
                    .range([0, innerWidth])
                    .domain([
                        d3.min(dataset_lines, line => d3.min(line.x)),
                        d3.max(dataset_lines, line => d3.max(line.x))
                    ])

                //如果传入了global_value_extent,就用它来初始化y的定义域
                let value_domain = global_value_extent != undefined ? global_value_extent :
                    [
                        d3.min(dataset_lines, line => d3.min(line.y)),
                        d3.max(dataset_lines, line => d3.max(line.y))
                    ]

                let y_scale = d3.scale.linear()
                    .range([innerHeight, 0])
                    .domain(value_domain)

                let color_scale = d3.scale.category10()
                    .domain(d3.range(dataset_lines.length))

                let x_axis = d3.svg.axis()
                    .scale(x_scale)
                    .orient("bottom")

                let y_axis = d3.svg.axis()
                    .scale(y_scale)
                    .orient("left")

                let svg = d3.select(this)
                    .attr("width", width)
                    .attr("height", height)

                svg.selectAll(".container")
                    .data([null])
                    .enter().append("g")
                    .attr("class", "container")
                svg.selectAll(".container").transition()
                    .duration(duration)
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                let g = svg.selectAll(".container")

                if (draw_xGrid) //如果需要画x轴向上的grid
                {
                    let x_grid = d3.svg.axis()
                        .scale(x_scale)
                        .orient("bottom")
                        .tickSize(-innerHeight)
                        .tickFormat("");

                    let x_grid_selection = g.selectAll(".x.grid")
                        .data([null])
                    x_grid_selection.enter().append('g')
                        .attr("class", "x grid");
                    g.selectAll(".x.grid").transition()
                        .duration(duration)
                        .attr("transform", "translate(0," + innerHeight + ")")
                        .call(x_grid);
                }

                if (draw_yGrid) //如果需要画y轴向上的grid
                {
                    let y_grid = d3.svg.axis()
                        .scale(y_scale)
                        .orient("left")
                        .tickSize(-innerWidth)
                        .tickFormat("");

                    let y_grid_selection = g.selectAll(".y.grid")
                        .data([null])
                    y_grid_selection.enter().append('g')
                        .attr("class", "y grid");
                    g.selectAll(".y.grid").transition()
                        .duration(duration)
                        .call(y_grid);
                }

                if (draw_xAxis) //如果需要画x轴
                {
                    let xAxis_selection = g.selectAll(".x.axis")
                        .data([null])
                    xAxis_selection.enter().append('g')
                        .attr("class", "x axis")
                    g.selectAll(".x.axis").transition()
                        .duration(duration)
                        .attr("transform", "translate(0," + innerHeight + ")")
                        .call(x_axis)

                    let text_selection = g.selectAll(".x.axis").selectAll('.x.label')
                        .data([null])
                    text_selection.enter().append('text')
                        .attr("class", "x label")
                        .style("text-anchor", "end")
                        .attr("dy", "-.71em")
                    g.selectAll(".x.axis").selectAll('.x.label').transition()
                        .duration(duration)
                        .attr("x", innerWidth)
                        .text(xlabel)
                }

                if (draw_yAxis) //如果需要画y轴
                {
                    let yAxis_selection = g.selectAll(".y.axis")
                        .data([null])
                    yAxis_selection.enter().append('g')
                        .attr("class", "y axis")
                    g.selectAll(".y.axis").transition()
                        .duration(duration)
                        .call(y_axis);

                    let text_selection = g.selectAll(".y.axis").selectAll('.y.label')
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

                let draw_line = d3.svg.line()
                    .interpolate("basis")
                    .x(d => x_scale(d[0]))
                    .y(d => y_scale(d[1]))

                let data_lines_selection = g.selectAll(".d3_linechart_line")
                    .data(dataset_lines.map(d => d3.zip(d.x, d.y)))
                data_lines_selection.enter().append("g")
                    .attr("class", "d3_linechart_line")
                data_lines_selection.exit().remove()

                let line_selection = g.selectAll(".d3_linechart_line").selectAll('.line')
                    .data(d => [d])

                line_selection.enter().append('path')
                    .attr("class", "line")
                g.selectAll(".d3_linechart_line").selectAll('.line').transition()
                    .duration(duration)
                    .attr("d", draw_line)
                    .attr("stroke", (_, i) => color_scale(i))

                if (draw_datalabel) //如果需要画线末尾的label
                {
                    g.selectAll(".d3_linechart_line").append("text")
                        .datum(function(d, i) {
                            return {
                                name: dataset_lines[i].label,
                                final: d[d.length - 1]
                            };
                        })
                        .attr("transform", function(d) {
                            return ("translate(" + x_scale(d.final[0]) + "," +
                                y_scale(d.final[1]) + ")");
                        })
                        .attr("x", 3)
                        .attr("dy", ".35em")
                        .attr("fill", (_, i) => color_scale(i))
                        .text(d => d.name)
                }

            });
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
            if (typeof(value) != "object") {
                console.warn("invalid value for margin", value);
                return;
            }
            if (typeof(value.top) == "number")
                margin.top = value.top;
            if (typeof(value.right) == "number")
                margin.right = value.right;
            if (typeof(value.bottom) == "number")
                margin.bottom = value.bottom;
            if (typeof(value.left) == "number")
                margin.left = value.left;
            return chart;
        };

        chart.duration = function(value) {
            if (!arguments.length) return duration;
            if (typeof(value) != "number") {
                console.warn("invalid value for duration", value);
                return;
            }
            duration = value;
            return chart;
        };

        chart.xlabel = function(value) {
            if (!arguments.length) return xlabel;
            xlabel = value;
            return chart;
        };

        chart.ylabel = function(value) {
            if (!arguments.length) return ylabel;
            ylabel = value;
            return chart;
        };

        chart.draw_yAxis = function(value) {
            if (!arguments.length) return draw_yAxis;
            if (typeof(value) != "boolean") {
                console.warn("invalid value for draw_yAxis", value);
                return;
            }
            draw_yAxis = value;
            return chart;
        };

        chart.draw_xAxis = function(value) {
            if (!arguments.length) return draw_xAxis;
            if (typeof(value) != "boolean") {
                console.warn("invalid value for draw_xAxis", value);
                return;
            }
            draw_xAxis = value;
            return chart;
        };

        chart.draw_xGrid = function(value) {
            if (!arguments.length) return draw_xGrid;
            if (typeof(value) != "boolean") {
                console.warn("invalid value for draw_xGrid", value);
                return;
            }
            draw_xGrid = value;
            return chart;
        };

        chart.draw_yGrid = function(value) {
            if (!arguments.length) return draw_yGrid;
            if (typeof(value) != "boolean") {
                console.warn("invalid value for draw_yGrid", value);
                return;
            }
            draw_yGrid = value;
            return chart;
        };

        chart.draw_datalabel = function(value) {
            if (!arguments.length) return draw_datalabel;
            if (typeof(value) != "boolean") {
                console.warn("invalid value for draw_datalabel", value);
                return;
            }
            draw_datalabel = value;
            return chart;
        };

        chart.global_value_extent = function(value) {
            if (!arguments.length) return global_value_extent;
            if (typeof(value) != "object") {
                console.warn("invalid value for global_value_extent", value);
                return;
            }
            global_value_extent = value;
            return chart;
        };

        return chart;
    }
})();