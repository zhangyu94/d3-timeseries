//version 2017.2.19 12:00
//dependency:
//d3.js version 3.5.17
//jquery.js version 2.1.1

(function(){
    d3.multiresolution = function() 
    {
        var width = 640,  
            height = 480, 
            margin = {top: 20, right: 20, bottom: 20, left: 20},
            duration = 500,
            color_scale = undefined,
            //[-无穷, 5)对应resolution0, [5,20)对应resolution1, [20, 无穷]对应resolution2
            thersholds = d3.scale.threshold().domain([5, 20]).range([0, 1, 2]);
        
        function _get_horizon_data(heavy_line)
        {
            var light_linechart = [];
            for (var i = 0; i < heavy_line.data.length; ++i)
            {
                var x = heavy_line.data[i].x;
                var y = heavy_line.data[i].y;
                light_linechart.push([x,y])
            }
            return light_linechart;
        }

        function chart(selection) {
            selection.each(function(dataset_line) {

                var div = d3.select(this);
                console.log(this,dataset_line)

                var resolution = 

                
                
                var horizon_data = _get_horizon_data(dataset_line);
                var mean = horizon_data.reduce(function(sum, cur){return sum + cur[1]}, 0) / horizon_data.length;
                var normlized_horizon_data = horizon_data.map(function(d){return [d[0], d[1] - mean]})



                return;

                var svg = d3.select(this)
                    .attr("width", width)
                    .attr("height", height)
                

                //render horizon_graph

                
                var horizon = d3.horizon()
                    .width($("#renderplace2").width())
                    .height($("#renderplace2").height())
                    .bands(10)
                    .colors(["green", "yellow", "yellow", "red"])
                    .opacity(0.3)
                    .interpolate("basis");

                var svg = d3.select("#renderplace2")
                    .append("svg")
                    .data([normlized_light_line_data]).call(horizon);

                console.log(svg,horizon)
                //svg.call(horizon.duration(1000).bands(4).height(200));


            //render light_linechart

                function get_light_data(horizon_data)
                {
                    var transformed_data = {
                      x: [],
                      y: [],
                    };
                    for (var i = 0; i < horizon_data.length; ++i)
                    {
                      transformed_data.x.push(horizon_data[i][0]);
                      transformed_data.y.push(horizon_data[i][1])
                    }
                    return transformed_data;
                }

                var transformed_data = get_light_data(horizon_data);

                var svg = d3.select("#renderplace3").append("svg")
                var linechart = d3.linechart_light()
                    .width(width)
                    .height(height)
                    .draw_xGrid(true)
                    .draw_yGrid(true)
                    .draw_xAxis(true)
                    .draw_yAxis(true)
                    .draw_datalabel(true)
                    .margin({top: 50, right: 10, bottom: 20, left: 100})
                    .xlabel('xab')
                    .ylabel('yab')
                svg.data([[transformed_data]]).call(linechart.duration(0));
                  
                console.log(svg,linechart)
                //svg.call(linechart.duration(1000).width(200));


            //render bitmap
                var matrix = [[]];
                var line_data = DATACENTER.GLOBAL_STATIC.raw_data[0];
                for (var i = 0; i < line_data.data.length; ++i)
                {
                    matrix[0][i] = {
                        val: line_data.data[i].y,
                    }
                }

                
                var canvas = d3.select("#renderplace4").append("canvas")

                var bitmap = d3.bitmap()
                    .width(width)
                    .height(height)
                    .margin({top: 50, right: 10, bottom: 20, left: 100})
                    .color_scale(traffic_light_color_scale())
                canvas.data([matrix]).call(bitmap);

                /*
                console.time('bitmap')
                for (var i = 900; i > 100; --i)
                {
                    canvas.call(bitmap.width(i))
                }
                console.timeEnd('bitmap')
                */
                

                /*
                ($("#renderplace4").d3_bitmap()
                    .data([matrix])
                    .width(width)
                    .height(height)
                    .margin( {top: 50, right: 0, bottom: 0, left: 100} )
                    .color_scale(traffic_light_color_scale())
                    .render())();
                */
                //($("#renderplace4").d3_bitmap().scale_rerender())(0.5,0.5);
                

                function traffic_light_color_scale(value)
                {
                    var color = d3.scale.linear()
                            .domain([0, 0.5, 1])
                            .range(["green", "yellow", "red"]);
                    var left = 0;
                    var right = 0.9;
                    var cscale = d3.scale.linear()
                                   .domain([0,1])
                                   .range([left,right]);

                    var compound_scale = function(value){
                        return color(cscale(value))
                    }
                    return compound_scale;
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

        chart.color_scale = function(value){
            if (!arguments.length) return color_scale;
            if (typeof(value)!="function")
            {
                console.warn("invalid value for color_scale",value);
                return;
            }
            color_scale = value;
            return chart;
        };

        

        return chart;
    }
})();

