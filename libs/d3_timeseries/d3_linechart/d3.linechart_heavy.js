//version 2017.3.28 12:00
//dependency:
//d3.js version 3.5.17
//jquery.js version 2.1.1

(function() {
    d3.linechart = function() {
        //data是唯一的在渲染前强制要求绑定好的属性
        var data = undefined;

        //绑定时自动加上的属性
        var parent = undefined; //用jquery选中的parent
        var parent_id = undefined;

        //在chart中不会修改的渲染外形变量
        var width = 640,
            height = 480,
            xlabel = "", //"X Axis Label"
            ylabel = "", //"Y Axis Label"
            draw_xgrid = false,
            draw_ygrid = false,
            draw_datalabel = true,
            margin = {
                top: 20,
                right: 20,
                bottom: 20,
                left: 20
            },
            yTickNum = undefined,
            draw_xAxis = true,
            draw_yAxis = true,
            duration = 500,
            color_scale = function(d, i) {
                return "#80B0FF";
            },
            x_scale_type = "time", //time或linear
            line_width = 1;

        //在chart中不会修改的其他变量
        var linechart_id = undefined;
        var mouseover_trigger_tip = true;
        var mouseover_trigger_point = true;
        var tip_option = {
            use_multi_tip: true,
            rigid_position: true,
        }
        var enable_zoom = true;

        //在chart中会修改的变量
        var x = {
                data_min: undefined,
                data_max: undefined,
                mousemove_value: undefined,
                display_min: undefined,
                display_max: undefined,
            },
            y = {
                data_min: undefined,
                data_max: undefined,
                mousemove_value: undefined,
                display_min: undefined,
                display_max: undefined,
            },
            g = undefined;

        //在chart中会修改的函数，且不允许赋值，只允许访问
        var zoom_to_xrange = undefined;
        var draw_tick = undefined;
        var render = function() {
            d3.select(parent[0]).selectAll("svg")
                .data(data)
                .enter().append("svg")
            d3.select(parent[0]).selectAll("svg")
                .call(chart);
        };
        var x_scale = undefined;
        var y_scale = undefined;
        var draw_line = undefined;

        //在chart中不会修改的函数，允许修改
        var click_line_trigger = function() {};
        var mousedown_line_trigger = function() {};
        var mouseover_line_trigger = function() {};
        var mouseup_line_trigger = function() {};
        var mousemove_trigger = function() {};
        var zoom_trigger = function() {};
        var pan_trigger = function() {};

        function chart(selection) {
            if (selection.length > 1)
                console.warn("selection length > 1", selection);

            selection.each(function(dataset_lines) {
                var innerWidth = width - margin.left - margin.right;
                var innerHeight = height - margin.top - margin.bottom;

                //统计x轴的scale取多少
                x.data_min = d3.min(dataset_lines, d => d.data[0].x)
                x.data_max = d3.max(dataset_lines, d => d.data[d.data.length - 1].x)
                x.display_min = x.data_min;
                x.display_max = x.data_max;

                if (x_scale_type == "linear")
                    x_scale = d3.scale.linear()
                else if (x_scale_type == "time")
                    x_scale = d3.time.scale()
                x_scale.range([0, innerWidth])
                    .domain([x.data_min, x.data_max]);

                let x_scale_safe = x => typeof(x) == "undefined" ? 0 : x_scale(x)

                //统计y轴的scale取多少
                y.data_min = d3.min(dataset_lines, function(d) {
                    var dataset_line = d.data;
                    return d3.min(dataset_line, d => d.y)
                });
                y.data_max = d3.max(dataset_lines, function(d) {
                    var dataset_line = d.data;
                    return d3.max(dataset_line, d => d.y)
                });
                y.display_min = y.data_min;
                y.display_max = y.data_max;
                y_scale = d3.scale.linear()
                    .range([innerHeight, 0])
                    .domain([y.data_min, y.data_max]);

                let y_scale_safe = y => typeof(y) == "undefined" ? 0 : y_scale(y)

                var x_axis = d3.svg.axis()
                    .scale(x_scale)
                    .orient("bottom");

                var y_axis = d3.svg.axis()
                    .scale(y_scale)
                    .orient("left")
                    .tickFormat(d3.format(".3g"))

                var tickValues = [];
                if (typeof(yTickNum) != "undefined") //如果需要约束y轴的tick的数量
                {
                    var yvalue_min = y_scale.domain()[0];
                    var yvalue_max = y_scale.domain()[1];
                    if (typeof(yvalue_min) == "number" && !isNaN(yvalue_min) && typeof(yvalue_max) == "number" && !isNaN(yvalue_max)) {
                        var step = (yvalue_max - yvalue_min) / (yTickNum - 1);
                        for (var i = 0; i < yTickNum; ++i) {
                            tickValues.push(yvalue_min + i * step);
                        }
                        y_axis.tickValues(tickValues);
                    }
                }

                //画线的函数
                draw_line = d3.svg.line()
                    //.interpolate("basis")
                    .interpolate("linear") //不使用linear时，画hover的点不一定能保证和线对齐
                    .x(d => x_scale_safe(d[0]))
                    .y(d => y_scale_safe(d[1]))

                var svg = d3.select(this)
                    .attr("width", width)
                    .attr("height", height)
                if (svg.attr("id") == null) //没有id时才会主动加id
                {
                    svg.attr("id", "svg_" + parent.attr("id"))
                }

                g = svg.append("g")
                    .attr('transform', function() {
                        //注意, translate(0,0)与不translate效果不完全一样
                        //translate(0,0)以后外层div会有白边
                        if ((margin.left != 0) || (margin.right != 0))
                            return 'translate(' + margin.left + ',' + margin.top + ')'
                    })
                    .on("mousemove", mouseover_g)
                    .on("mouseover", mouseover_g)
                    .on("mouseout", function() {
                        x.mousemove_value = undefined;
                        y.mousemove_value = undefined;
                        remove_points("mouseoverpoint")
                        remove_mouseovertip()
                    })

                function mouseover_g(d) {
                    var corrected_offsetX = d3.event.offsetX - margin.left;
                    var value_x = x_scale.invert(corrected_offsetX);
                    x.mousemove_value = value_x;
                    var corrected_offsetY = d3.event.offsetY - margin.top;
                    var value_y = y_scale.invert(corrected_offsetY);
                    y.mousemove_value = value_y;
                    if (tip_option.use_multi_tip == true) {
                        for (var j = 0; j < dataset_lines.length; ++j) {
                            var search_result = binary_search(value_x, dataset_lines[j].data, "x");
                            var search_item = search_result.item;
                            var item_x = search_item.x;
                            var item_y = search_item.y;
                            var item_color = search_item.color;
                            if ((typeof(item_color) == "undefined") && (typeof(item_y) == "undefined"))
                                item_color = "grey";

                            if (mouseover_trigger_point)
                                draw_mouseoverpoint(item_x, item_y, "mouseover_point_line_" + j, item_color);
                            if (mouseover_trigger_tip)
                                draw_mouseovertip(item_x, item_y, "mouseover_tip_" + j, item_color)
                        }
                    } else {
                        if (tip_option.rigid_position == false) {
                            var item_x = value_x;
                            var item_y = value_y;
                            var item_color = undefined;
                            if ((typeof(item_color) == "undefined") && (typeof(item_y) == "undefined"))
                                item_color = "grey";
                            if (mouseover_trigger_tip)
                                draw_mouseovertip(item_x, item_y, "mouseover_tip_" + 0, item_color)
                        } else {
                            var final_search_result = undefined;
                            for (var j = 0; j < dataset_lines.length; ++j) {
                                var temp_search_result = binary_search(value_x, dataset_lines[j].data, "x");
                                if (typeof(final_search_result) == "undefined")
                                    final_search_result = temp_search_result;
                                else {
                                    var temp_deviation = Math.pow(temp_search_result.item.x - value_x, 2) +
                                        Math.pow(temp_search_result.item.y - value_y, 2);
                                    var final_deviation = Math.pow(final_search_result.item.x - value_x, 2) +
                                        Math.pow(final_search_result.item.y - value_y, 2);
                                    if (final_deviation > temp_deviation)
                                        final_search_result = temp_search_result;
                                }
                            }

                            var search_item = final_search_result.item;
                            var item_x = search_item.x;
                            var item_y = search_item.y;
                            var item_color = search_item.color;
                            if ((typeof(item_color) == "undefined") && (typeof(item_y) == "undefined"))
                                item_color = "grey";
                            if (mouseover_trigger_tip)
                                draw_mouseovertip(item_x, item_y, "mouseover_tip_" + 0, item_color)
                        }
                    }

                    if (typeof(mousemove_trigger) != "undefined") {
                        mousemove_trigger(d, search_item);
                    }
                }

                if (draw_xgrid) //如果需要画x轴向上的grid
                {
                    var x_grid = d3.svg.axis()
                        .scale(x_scale)
                        .orient("top")
                        .tickSize(innerHeight)
                        .tickFormat("");

                    g.append("g")
                        .attr("class", "x grid")
                        .attr("transform", "translate(0," + innerHeight + ")")
                        .call(x_grid);
                }

                if (draw_ygrid) //如果需要画y轴向右的grid
                {
                    var y_grid = d3.svg.axis()
                        .scale(y_scale)
                        .orient("right")
                        .tickSize(innerWidth)
                        .tickFormat("")

                    if (typeof(yTickNum) != "undefined") //如果需要约束y轴的tick的数量
                    {
                        y_grid.tickValues(tickValues);
                    }

                    g.append("g")
                        .attr("class", "y grid")
                        .call(y_grid);
                }

                if (draw_xAxis) //如果需要画x轴
                {
                    g.append("g")
                        .attr("class", "x axis")
                        .attr("transform", "translate(0," + innerHeight + ")")
                        .call(x_axis)
                        .append("text")
                        .attr("class", "x label")
                        .attr("dy", "-.71em")
                        .attr("x", innerWidth)
                        .text(xlabel);
                }

                if (draw_yAxis) //如果需要画y轴
                {
                    g.append("g")
                        .attr("class", "y axis")
                        .call(y_axis)
                        .append("text")
                        .attr("class", "y label")
                        .attr("transform", "rotate(-90)")
                        .attr("y", 6)
                        .attr("dy", "0.71em")
                        .text(ylabel);
                }

                //加brush
                if (enable_zoom) {
                    var brush = d3.svg.brush()
                        .x(x_scale)
                        .on("brushstart", brushstart)
                        .on("brush", brushmove)
                        .on("brushend", brushend);
                    g.append("g")
                        .attr("class", "x brush")
                        .call(brush)
                        .selectAll("rect") //在call返回的语境，即g的语境下，selectAll
                        .attr("height", innerHeight);
                }

                //画线
                var line_g_selection = g.selectAll(".d3_linechart_line")
                    .data(dataset_lines.map(function(d) {
                        var zipped_array = [];
                        for (var j = 0; j < d.data.length; ++j) {
                            zipped_array.push([d.data[j].x, d.data[j].y])
                        }
                        return zipped_array;
                    }))
                    .enter().append("g") //每条线包在一个g里面
                    .attr("class", "d3_linechart_line")
                line_g_selection.append("path")
                    .attr("class", "line")
                    .attr("d", d => draw_line(d))
                    .attr("stroke", function(d, i) {
                        if (color_scale.length == 2)
                            return color_scale(d, i);
                        else
                            return color_scale(i);
                    })
                    .attr("stroke-width", line_width)
                    /*
                    .on("mouseover",function(){
                        d3.select(this).classed("mouseover_linechart",true)
                    })
                    .on("mouseout",function(){
                        d3.select(this).classed("mouseover_linechart",false)
                    })
                    */
                    .on("mousedown", mousedown_line_trigger)
                    .on("mouseover", mouseover_line_trigger)
                    .on("mouseup", mouseup_line_trigger)
                    .on("click", function(d, i) {
                        if (typeof(click_line_trigger) != "undefined") {
                            click_line_trigger(d, i);
                        }
                    })

                //画标记好颜色的特殊点
                var colored_point_line_storage = [];
                for (var i = 0; i < dataset_lines.length; ++i) {
                    var cur_dataset_line = dataset_lines[i].data;

                    var cur_line_storage = [];
                    for (var j = 0; j < cur_dataset_line.length; ++j) {
                        var cur_item = cur_dataset_line[j];
                        if (typeof(cur_item.color) == "undefined")
                            continue;

                        var cur_color = cur_item.color;
                        var length = 1;
                        var cur_seg_storage = [j];
                        for (var k = j + 1; k < cur_dataset_line.length; ++k) {
                            if (cur_dataset_line[k].color == cur_color) {
                                length = length + 1;
                                cur_seg_storage.push(k);
                            } else
                                break;
                        }

                        cur_line_storage.push(cur_seg_storage)
                        j = j + (length - 1);
                    }
                    colored_point_line_storage.push(cur_line_storage);
                }
                //画标记好颜色的特殊点
                line_g_selection.each(function(d, i) {
                    var data = dataset_lines[i].data;
                    var colored_storage = colored_point_line_storage[i];

                    for (var j = 0; j < colored_storage.length; ++j) {
                        var cur_seg = colored_storage[j];
                        var start_index = cur_seg[0];
                        var color = data[start_index].color;
                        var length = cur_seg.length;
                        if (length == 1) {
                            d3.select(this).append("circle")
                                .attr("class", "colored_point")
                                .data([{
                                    x: data[start_index].x,
                                    y: data[start_index].y
                                }])
                                .attr("cx", d => x_scale_safe(d.x))
                                .attr("cy", d => y_scale_safe(d.y))
                                .attr("r", line_width / 2)
                                .attr("fill", color)
                                //.attr("opacity",1-1/colored_storage.length*j);
                        } else {
                            var line_data = [];
                            for (var k = 0; k < length; ++k) {
                                line_data.push([data[start_index + k].x, data[start_index + k].y])
                            }

                            d3.select(this).append("path")
                                .attr("class", "colored_line")
                                .data([{
                                    line_data: line_data
                                }])
                                .attr("d", d => draw_line(d.line_data))
                                .attr("stroke-width", line_width)
                                .attr("fill", "none")
                                .attr("stroke", color)
                                //.attr("opacity",1-1/colored_storage.length*j)
                        }
                    }
                })

                //画标记好图形的特殊点
                line_g_selection.each(function(d, i) {
                    var data = dataset_lines[i].data;
                    for (var j = 0; j < data.length; ++j) {
                        if (typeof(data[j].style) != "undefined") {
                            if (color_scale.length == 2)
                                var color = color_scale(d, i);
                            else
                                var color = color_scale(i);

                            d3.select(this).append("circle")
                                .attr("class", "shaped_point")
                                .data([{
                                    x: data[j].x,
                                    y: data[j].y,
                                    radius: data[j].style.radius,
                                }])
                                .attr("cx", d => x_scale_safe(d.x))
                                .attr("cy", d => y_scale_safe(d.y))
                                .attr("r", d => d.radius)
                                .attr("fill", color)
                                .attr("z-index", 100)
                        }
                    }
                })

                if (draw_datalabel) //如果需要画线末尾的label
                {
                    line_g_selection.append("text")
                        .attr("class", "linechart_label_text")
                        .datum(function(d, i) {
                            return {
                                name: dataset_lines[i].label,
                                final: d[d.length - 1]
                            };
                        })
                        .attr("transform", function(d) {
                            return ("translate(" + x_scale_safe(d.final[0]) + "," + y_scale_safe(d.final[1]) + ")");
                        })
                        .attr("x", 3)
                        .attr("dy", ".35em")
                        .attr("fill", function(d, i) {
                            if (color_scale.length == 2)
                                return color_scale(d, i);
                            else
                                return color_scale(i);
                        })
                        .text(d => d.name)
                }

                zoom_to_xrange = function zoompan_x(extent, is_zoom, force_scale) {
                    if (typeof(is_zoom) == "undefined")
                        is_zoom = true;
                    if (typeof(force_scale) == "undefined")
                        force_scale = true;

                    if ((extent[0] == x.data_min) && (extent[1] == x.data_max)) //zoom回初始状态后删掉zoom按钮
                    {
                        d3.select(".linechart_reset_zoom" + "#linechart_reset_zoom_" + parent_id).remove()
                    }

                    hide_zoom_len() //不管任何情况，只要zoom或pan到一个范围后，都需要把len删掉

                    if (!force_scale) //force_scale时，即使没有brush，或者即使brush是空的，也要scale
                    {
                        if (brush.empty())
                            return;
                    }
                    x_scale.domain(extent); //zoom以后调整x轴scale的范围

                    x.display_min = extent[0];
                    x.display_max = extent[1];

                    if (is_zoom) {
                        g.selectAll(".d3_linechart_line").selectAll(".line")
                            .transition()
                            .duration(duration) //duration结束时换上新的折线
                            .attr("d", d => draw_line(d))

                        g.select(".x.axis")
                            .transition()
                            .duration(duration) //duration结束时换上新的x轴
                            .call(x_axis);

                        if (draw_xgrid) {
                            g.select(".x.grid")
                                .transition()
                                .duration(duration)
                                .call(x_grid);
                        }

                        g.selectAll(".label_tick")
                            .transition()
                            .duration(duration)
                            .attr("d", function(d, i) {
                                var display_x = x_scale(d);
                                return "M" + display_x + "," + 0 + "L" + display_x + "," + innerHeight;
                            })

                        g.selectAll(".mouseoverpoint")
                            .transition()
                            .duration(duration)
                            .attr("cx", d => x_scale_safe(d.x_value))
                            .attr("cy", d => y_scale_safe(d.y_value))

                        line_g_selection.selectAll(".linechart_label_text") //line尾巴上的text label
                            .transition()
                            .duration(duration)
                            .attr("transform", function(d) {
                                return ("translate(" + x_scale_safe(d.final[0]) + "," + y_scale_safe(d.final[1]) + ")");
                            })

                        line_g_selection.selectAll(".colored_point")
                            .transition()
                            .duration(duration)
                            .attr("cx", d => x_scale_safe(d.x))
                            .attr("cy", d => y_scale_safe(d.y))
                        line_g_selection.selectAll(".colored_line")
                            .transition()
                            .duration(duration)
                            .attr("d", d => draw_line(d.line_data))

                        line_g_selection.selectAll(".shaped_point")
                            .transition()
                            .duration(duration)
                            .attr("cx", d => x_scale_safe(d.x))
                            .attr("cy", d => y_scale_safe(d.y))
                    } else {
                        g.selectAll(".d3_linechart_line").selectAll(".line")
                            .attr("d", d => draw_line(d))

                        g.select(".x.axis")
                            .call(x_axis)

                        if (draw_xgrid) {
                            g.select(".x.grid")
                                .call(x_grid)
                        }

                        g.selectAll(".label_tick")
                            .attr("d", function(d, i) {
                                var display_x = x_scale_safe(d);
                                return "M" + display_x + "," + 0 + "L" + display_x + "," + innerHeight;
                            })

                        g.selectAll(".mouseoverpoint")
                            .attr("cx", d => x_scale_safe(d.x_value))
                            .attr("cy", d => y_scale_safe(d.y_value))

                        line_g_selection.selectAll(".linechart_label_text")
                            .attr("transform", function(d) {
                                return ("translate(" + x_scale_safe(d.final[0]) + "," + y_scale_safe(d.final[1]) + ")");
                            })

                        line_g_selection.selectAll(".colored_point")
                            .attr("cx", d => x_scale_safe(d.x))
                            .attr("cy", d => y_scale_safe(d.y))
                        line_g_selection.selectAll(".colored_line")
                            .attr("d", d => draw_line(d.line_data))

                        line_g_selection.selectAll(".shaped_point")
                            .attr("cx", d => x_scale_safe(d.x))
                            .attr("cy", d => y_scale_safe(d.y))

                    }

                    if ((extent[0] != x.data_min) || (extent[1] != x.data_max)) //如果没有reset zoom，就在svg上画一个reset按钮
                    {
                        var top = margin.top;
                        var left = margin.left;

                        if (d3.select(".linechart_reset_zoom" + "#linechart_reset_zoom_" + parent_id).node() === null) //如果之前body没有加过reset按钮，才再画一个，否则不画
                        {
                            _draw_reset_buttom()

                            function _draw_reset_buttom() {
                                d3.select("#" + parent_id)
                                    .append("div")
                                    .attr("id", "linechart_reset_zoom_" + parent_id)
                                    .attr("class", "linechart_reset_zoom")
                                    .style("left", left + "px")
                                    .style("top", top + "px")
                                    .on("click", function(d, i) {
                                        zoompan_x([x.data_min, x.data_max], true, true)

                                        if (typeof(zoom_trigger) != "undefined") {
                                            zoom_trigger();
                                        }
                                    })
                                    .append("text")
                                    .text("reset")
                            }
                        }
                    }
                }

                function hide_zoom_len() {
                    g.select(".x.brush").select(".extent").style("display", "none")
                    g.select(".x.brush").select(".resize.e").select("rect").style("display", "none")
                    g.select(".x.brush").select(".resize.w").select("rect").style("display", "none")
                }

                function show_zoom_len() {
                    g.select(".x.brush").select(".extent").style("display", "block")
                    g.select(".x.brush").select(".resize.e").select("rect").style("display", "block")
                    g.select(".x.brush").select(".resize.w").select("rect").style("display", "block")
                }

                var start_pageX = undefined;
                var end_pageX = undefined;

                function brushstart() {
                    show_zoom_len()
                    if (d3.event.sourceEvent.shiftKey)
                        start_pageX = d3.event.sourceEvent.pageX;
                }

                function brushmove() {
                    if (d3.event.sourceEvent.shiftKey) {
                        end_pageX = d3.event.sourceEvent.pageX;
                        var start_x = x_scale.invert(start_pageX);
                        var end_x = x_scale.invert(end_pageX);

                        start_pageX = end_pageX; //更新start的锚定点
                        end_pageX = undefined; //重置end

                        if (typeof(start_x) != "undefined" && typeof(end_x) != "undefined") //panning
                        {
                            var delta_x = end_x - start_x;
                            var display_min = x.display_min - delta_x;
                            var display_max = x.display_max - delta_x;

                            if (display_min < x.data_min) {
                                var display_min = x.data_min;
                                var display_max = x.data_min + (x.display_max - x.display_min);
                            } else if (display_max > x.data_max) {
                                var display_max = x.data_max;
                                var display_min = x.data_max - (x.display_max - x.display_min);
                            }
                            zoom_to_xrange([display_min, display_max], false, false)

                            if (typeof(pan_trigger) != "undefined") {
                                pan_trigger();
                            }
                        }
                    }
                }

                function brushend() {
                    if (!d3.event.sourceEvent.shiftKey) {
                        var extent = brush.extent();
                        if (!d3.event.sourceEvent.ctrlKey) //按住ctrl时不zoom in
                        {
                            zoom_to_xrange(extent, true, false)

                            if (typeof(zoom_trigger) != "undefined") {
                                zoom_trigger();
                            }
                        }
                    }
                }

                draw_tick = function(x_value, id, color) {
                    if (typeof(color) == "undefined")
                        color = "red";

                    if (!(g.select("#" + id).node() === null)) {
                        g.select("#" + id).remove();
                    }
                    g.append("path")
                        .attr("class", "label_tick")
                        .attr("pointer-events", "none")
                        .attr("id", id)
                        .data([x_value])
                        .attr("d", function(d, i) {
                            var display_x = x_scale(d);
                            return "M" + display_x + "," + 0 + "L" + display_x + "," + innerHeight;
                        })
                        .attr("stroke", color)
                        .attr("stroke-width", 1)
                }

                function draw_mouseoverpoint(x_value, y_value, id, color, r) {
                    if (typeof(r) == "undefined")
                        r = 5;

                    if (typeof(color) == "undefined")
                        var circle_color = "#80B0FF";
                    else
                        var circle_color = color;

                    var flag_new_point = false;
                    if (g.select("#" + id).node() == null) {
                        flag_new_point = true;
                    }
                    if (flag_new_point) {
                        g.append("circle")
                            .attr("id", id)
                            .attr("class", "mouseoverpoint")
                    }
                    var point = g.select("#" + id)
                        .data([{
                            x_value: x_value,
                            y_value: y_value
                        }])
                    if (!flag_new_point) {
                        point = point.transition()
                            .duration(2)
                    }
                    point.attr("cx", d => x_scale_safe(d.x_value))
                        .attr("cy", d => y_scale_safe(d.y_value))
                        .attr("r", r)
                        .attr("fill", circle_color)
                        .attr("stroke", d3.lab(circle_color).brighter(3))
                }

                function remove_points(class_name) {
                    g.selectAll("." + class_name).remove();
                }

                function draw_mouseovertip(x_value, y_value, id, color) {
                    if (x_value < x_scale.domain()[0] || x_value > x_scale.domain()[1]) //越界，此时需要专门删掉之前因为越界而不需要的tip
                    {
                        remove_mouseovertip();
                        return;
                    }

                    let tip_color = typeof(color) == "undefined" ? "#80B0FF" : color;

                    var flag_new_tip = false;
                    if (d3.select("body").select("#" + id).node() == null) {
                        flag_new_tip = true;
                    }
                    if (flag_new_tip) {
                        d3.select("body")
                            .append("div")
                            .attr("id", id)
                            .attr("class", "mouseovertip")
                    }
                    var div = d3.select("#" + id)
                        .data([{
                            x_value,
                            y_value
                        }])
                    div.html(function(d, i) {
                        if (x_scale_type == "time") {
                            return "<table>" +
                                "<tr><td>" + "time: " + (new Date(d.x_value)).toLocaleString() + "</tb></tr>" +
                                "<tr><td>" + "value: " + d.y_value + "</tb></tr>" +
                                "</table>"
                        } else {
                            return "<table>" +
                                "<tr><td>" + "x: " + d.x_value + "</tb></tr>" +
                                "<tr><td>" + "y: " + d.y_value + "</tb></tr>" +
                                "</table>"
                        }
                    })

                    var anchor_top = parent.offset().top;
                    var anchor_left = parent.offset().left;
                    var self_width = $("#" + id).width();
                    var self_height = $("#" + id).height();
                    var height_bias = 15;
                    var left_bias = 0;

                    if (!flag_new_tip) {
                        div = div.transition()
                            .duration(1);
                    }
                    div.style("border-color", tip_color)
                        .style("left", function(d) {
                            var x_pixel = x_scale_safe(d.x_value);
                            return x_pixel + anchor_left + margin.left - self_width / 2 - left_bias + "px";
                        })
                        .style("top", function(d) {
                            var y_pixel = y_scale_safe(d.y_value);
                            return y_pixel + anchor_top + margin.top - self_height - height_bias + "px";
                        })

                }

                function remove_mouseovertip() {
                    d3.select("body").selectAll(".mouseovertip").remove();
                }

                function binary_search(target_value, data_array, key_attr) //要求data_array从小到大sort过了
                {
                    var start_index = 0;
                    var end_index = data_array.length - 1;
                    while (start_index != end_index) {
                        var middle_index = Math.floor((start_index + end_index) / 2);
                        var middle_value = typeof(key_attr) == "undefined" ? data_array[middle_index] : data_array[middle_index][key_attr];

                        if (middle_value < target_value) {
                            start_index = middle_index + 1;
                        }
                        if (middle_value >= target_value) {
                            end_index = middle_index;
                        }

                        if (start_index == end_index) {
                            break;
                        }
                    }

                    var upper_bound_index = start_index;
                    var upper_bound_item = data_array[upper_bound_index];
                    var upper_bound_value = typeof(key_attr) == "undefined" ? upper_bound_item : upper_bound_item[key_attr];
                    var lower_bound_index = (start_index - 1) >= 0 ? (start_index - 1) : start_index;
                    var lower_bound_item = data_array[lower_bound_index];
                    var lower_bound_value = typeof(key_attr) == "undefined" ? lower_bound_item : lower_bound_item[key_attr];

                    if (Math.abs(upper_bound_value - target_value) < Math.abs(lower_bound_value - target_value)) {
                        return {
                            index: upper_bound_index,
                            value: upper_bound_value,
                            item: upper_bound_item
                        };
                    } else {
                        return {
                            index: lower_bound_index,
                            value: lower_bound_value,
                            item: lower_bound_item
                        };
                    }
                }

            });
        }

        chart.pan_trigger = function(value) {
            if (!arguments.length) return pan_trigger;
            if (typeof(value) != "function") {
                console.warn("invalid value for pan_trigger", value);
                return;
            }
            pan_trigger = value;
            return chart;
        };

        chart.zoom_trigger = function(value) {
            if (!arguments.length) return zoom_trigger;
            if (typeof(value) != "function") {
                console.warn("invalid value for zoom_trigger", value);
                return;
            }
            zoom_trigger = value;
            return chart;
        };


        chart.mouseover_line_trigger = function(value) {
            if (!arguments.length) return mouseover_line_trigger;
            if (typeof(value) != "function") {
                console.warn("invalid value for mouseover_line_trigger", value);
                return;
            }
            mouseover_line_trigger = value;
            return chart;
        };


        chart.mouseup_line_trigger = function(value) {
            if (!arguments.length) return mouseup_line_trigger;
            if (typeof(value) != "function") {
                console.warn("invalid value for mouseup_line_trigger", value);
                return;
            }
            mouseup_line_trigger = value;
            return chart;
        };

        chart.mousedown_line_trigger = function(value) {
            if (!arguments.length) return mousedown_line_trigger;
            if (typeof(value) != "function") {
                console.warn("invalid value for mousedown_line_trigger", value);
                return;
            }
            mousedown_line_trigger = value;
            return chart;
        };

        chart.click_line_trigger = function(value) {
            if (!arguments.length) return click_line_trigger;
            if (typeof(value) != "function") {
                console.warn("invalid value for click_line_trigger", value);
                return;
            }
            click_line_trigger = value;
            return chart;
        };

        chart.mousemove_trigger = function(value) {
            if (!arguments.length) return mousemove_trigger;
            if (typeof(value) != "function") {
                console.warn("invalid value for mousemove_trigger", value);
                return;
            }
            mousemove_trigger = value;
            return chart;
        };

        chart.draw_line = function() {
            if (!arguments.length) return draw_line;
            console.warn("cannot be customized: draw_line")
        };

        chart.x_scale = function() {
            if (!arguments.length) return x_scale;
            console.warn("cannot be customized: x_scale")
        };

        chart.y_scale = function() {
            if (!arguments.length) return y_scale;
            console.warn("cannot be customized: y_scale")
        };

        chart.draw_tick = function() {
            if (!arguments.length) return draw_tick;
            console.warn("cannot be customized: draw_tick")
        };

        chart.zoom_to_xrange = function() {
            if (!arguments.length) return zoom_to_xrange;
            console.warn("cannot be customized: zoom_to_xrange")
        };

        chart.render = function() {
            if (!arguments.length) return render;
            console.warn("cannot be customized: render")
        };

        chart.g = function(value) {
            if (!arguments.length) return g;
            if (typeof(value) != "object") {
                console.warn("invalid value for g", value);
                return;
            }
            g = value;
            return chart;
        };

        chart.line_width = function(value) {
            if (!arguments.length) return line_width;
            if (typeof(value) != "number") {
                console.warn("invalid value for line_width", value);
                return;
            }
            line_width = value;
            return chart;
        };

        chart.x_scale_type = function(value) {
            if (!arguments.length) return x_scale_type;
            if (typeof(value) != "string") {
                console.warn("invalid value for x_scale_type", value);
                return;
            }
            x_scale_type = value;
            return chart;
        };

        chart.color_scale = function(value) {
            if (!arguments.length) return color_scale;
            if (typeof(value) != "function") {
                console.warn("invalid value for color_scale", value);
                return;
            }
            color_scale = value;
            return chart;
        };

        chart.y = function(value) {
            if (!arguments.length) return y;
            if (typeof(value) != "object") {
                console.warn("invalid value for y", value);
                return;
            }
            if (typeof(value.data_min) == "number")
                y.data_min = value.data_min;
            if (typeof(value.data_max) == "number")
                y.data_max = value.data_max;
            if (typeof(value.mousemove_value) != "undefined")
                console.warn("cannot be customized: y.mousemove_value");
            if (typeof(value.display_min) == "number")
                y.display_min = value.display_min;
            if (typeof(value.display_max) == "number")
                y.display_max = value.display_max;
            return chart;
        };

        chart.x = function(value) {
            if (!arguments.length) return x;
            if (typeof(value) != "object") {
                console.warn("invalid value for x", value);
                return;
            }
            if (typeof(value.data_min) == "number")
                x.data_min = value.data_min;
            if (typeof(value.data_max) == "number")
                x.data_max = value.data_max;
            if (typeof(value.mousemove_value) != "undefined")
                console.warn("cannot be customized: x.mousemove_value");
            if (typeof(value.display_min) == "number")
                x.display_min = value.display_min;
            if (typeof(value.display_max) == "number")
                x.display_max = value.display_max;
            return chart;
        };

        chart.data = function(value) {
            if (!arguments.length) return data;
            if (typeof(value) != "object") {
                console.warn("invalid value for data", value);
                return;
            }
            data = value;
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

        chart.yTickNum = function(value) {
            if (!arguments.length) return yTickNum;
            if (typeof(value) != "number") {
                console.warn("invalid value for yTickNum", value);
                return;
            }
            yTickNum = value;
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

        chart.draw_xgrid = function(value) {
            if (!arguments.length) return draw_xgrid;
            if (typeof(value) != "boolean") {
                console.warn("invalid value for draw_xgrid", value);
                return;
            }
            draw_xgrid = value;
            return chart;
        };

        chart.draw_ygrid = function(value) {
            if (!arguments.length) return draw_ygrid;
            if (typeof(value) != "boolean") {
                console.warn("invalid value for draw_ygrid", value);
                return;
            }
            draw_ygrid = value;
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

        chart.width = function(value) {
            if (!arguments.length) return width;
            if (typeof(value) != "number") {
                console.warn("invalid value for width", value);
                return;
            }
            width = value;
            return chart;
        };

        chart.height = function(value) {
            if (!arguments.length) return height;
            if (typeof(value) != "number") {
                console.warn("invalid value for height", value);
                return;
            }
            height = value;
            return chart;
        };

        chart.xlabel = function(value) {
            if (!arguments.length) return xlabel;
            if (typeof(value) != "string") {
                console.warn("invalid value for xlabel", value);
                return;
            }
            xlabel = value;
            return chart;
        };

        chart.ylabel = function(value) {
            if (!arguments.length) return ylabel;
            if (typeof(value) != "string") {
                console.warn("invalid value for ylabel", value);
                return;
            }
            ylabel = value;
            return chart;
        };

        chart.enable_zoom = function(value) {
            if (!arguments.length) return enable_zoom;
            if (typeof(value) != "boolean") {
                console.warn("invalid value for enable_zoom", value);
                return;
            }
            enable_zoom = value;
            return chart;
        };

        chart.tip_option = function(value) {
            if (!arguments.length) return tip_option;
            if (typeof(value) != "object") {
                console.warn("invalid value for tip_option", value);
                return;
            } else {
                if (typeof(value.use_multi_tip) == "boolean")
                    tip_option.use_multi_tip = value.use_multi_tip;

                if (typeof(value.rigid_position) == "boolean")
                    tip_option.rigid_position = value.rigid_position;
            }
            return chart;
        };

        chart.mouseover_trigger_tip = function(value) {
            if (!arguments.length) return mouseover_trigger_tip;
            if (typeof(value) != "boolean") {
                console.warn("invalid value for mouseover_trigger_tip", value);
                return;
            }
            mouseover_trigger_tip = value;
            return chart;
        };

        chart.mouseover_trigger_point = function(value) {
            if (!arguments.length) return mouseover_trigger_point;
            if (typeof(value) != "boolean") {
                console.warn("invalid value for mouseover_trigger_point", value);
                return;
            }
            mouseover_trigger_point = value;
            return chart;
        };

        chart.linechart_id = function(value) {
            if (!arguments.length) return linechart_id;
            if (typeof(value) != "string") {
                console.warn("invalid value for linechart_id", value);
                return;
            }
            linechart_id = value;
            return chart;
        };

        chart.parent_id = function(value) {
            if (!arguments.length) return parent_id;
            if (typeof(value) != "string") {
                console.warn("invalid value for parent_id", value);
                return;
            }
            parent_id = value;
            return chart;
        };

        chart.parent = function(value) {
            if (!arguments.length) return parent;
            if (typeof(value) != "object") {
                console.warn("invalid value for parent", value);
                return;
            }
            parent = value;
            return chart;
        };

        return chart;
    }
})();

$.fn.d3_linechart = function() {
    if ($(this).data('d3_linechart') == undefined) {
        var renderer = d3.linechart()
            .parent(this)
            .parent_id(this.attr("id"))
            .width(this.width())
            .height(this.height())
        $(this).data('d3_linechart', renderer)
    }
    return $(this).data('d3_linechart');
}
