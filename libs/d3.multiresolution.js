//version 2017.2.19 12:00
//dependency:
//d3.js version 3.5.17
//jquery.js version 2.1.1

(function(){
    d3.multiresolution = function() 
    {
        var width = 640,  
            height = 480, 
            margin = {top: 0, right: 20, bottom: 0, left: 20},
            duration = 500,
            color_scale = undefined,
            //[-无穷, 5)对应resolution0, [5,20)对应resolution1, [20, 无穷]对应resolution2
            thersholds = d3.scale.threshold().domain([5, 20]).range([0, 1, 2]);

        var previous_resolution = undefined;
        
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

        function _get_bitmap_data(heavy_line)
        {
            var matrix = [[]];
            for (var i = 0; i < heavy_line.data.length; ++i)
            {
                //此处假设heavy_line.data[...].x都是等间距的
                matrix[0][i] = {
                    val: heavy_line.data[i].y,
                }
            }
            return matrix;
        }

        function get_light_data(heavy_line)
        {
            var transformed_data = {
              x: [],
              y: [],
            };
            for (var i = 0; i < heavy_line.data.length; ++i)
            {
              transformed_data.x.push(heavy_line.data[i].x);
              transformed_data.y.push(heavy_line.data[i].y)
            }
            return transformed_data;
        }

        function chart(selection) {
            selection.each(function(dataset_line) {
                var innerHeight = height - margin.top - margin.bottom;

                var div = d3.select(this);
                var resolution = thersholds(innerHeight);

                function _handle_layouts(div,resolution,previous_resolution)
                {
                    if (resolution == previous_resolution)
                        return;
                    div.selectAll('canvas').remove();
                    div.selectAll('svg').remove();
                    if (resolution == 0)
                    {
                        div.append("canvas");
                    }
                    if (resolution == 1)
                    {
                        div.append("svg");
                    }
                    if (resolution == 2)
                    {
                        div.append("svg");
                    }
                }
                _handle_layouts(div,resolution,previous_resolution);
                if (resolution == 0)//render bitmap
                {
                    var bitmap_data = _get_bitmap_data(dataset_line);

                    var bitmap = d3.bitmap()
                        .width(width)
                        .height(height)
                        .margin(margin)
                        .color_scale(color_scale)

                    var canvas = div.select("canvas")
                    canvas.data([bitmap_data]).call(bitmap.duration(duration));
                }
                else if (resolution == 1)//render horizon_graph
                {
                    var horizon_data = _get_horizon_data(dataset_line);
                    var mean = horizon_data.reduce(function(sum, cur){return sum + cur[1]}, 0) / horizon_data.length;
                    var normlized_horizon_data = horizon_data.map(function(d){return [d[0], d[1] - mean]})
                
                    var horizon = d3.horizon()
                        .width(width)
                        .height(height)
                        .bands(10)
                        .colors(["green", "yellow", "yellow", "red"])
                        .opacity(0.3)
                        .margin(margin)
                        .interpolate("basis");

                    var svg = div.select("svg")
                    svg.data([normlized_horizon_data]).call(horizon.duration(duration));
                }
                else if (resolution == 2)//render light_linechart
                {
                    var transformed_data = get_light_data(dataset_line);

                    var linechart = d3.linechart_light()
                        .width(width)
                        .height(height)
                        .margin(margin)

                    var svg = div.select("svg")
                    svg.data([[transformed_data]]).call(linechart.duration(duration));
                }

                previous_resolution = resolution;

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

