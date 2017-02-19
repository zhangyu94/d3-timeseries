var linechart_view = {
    linechart_view_DIV_ID : "renderplace1",
    FIRST_CALLED : true,

    dataModel:function()
    {
        var data = [];

        function dataProcessor()
        {

        }

        dataProcessor.get = function(value)
        {
            if (typeof(eval(value))=="undefined")
            {
                console.warn("invalid dataModel member ",value);
            }
            return eval(value);
        }

        //计算这个view需要的初始数据
        dataProcessor.initialize = function()
        {
        
            function generator()
            {
                var identity = undefined;

                function _generator()
                {
                    return {}
                }

                _generator.identity = function(value){
                    if (!arguments.length) return identity;
                    identity = value;
                    return _generator;
                };

                return _generator;
            }

            return dataProcessor;
        };


        return dataProcessor;
    },

	obsUpdate:function(message, data)
	{
        if (message == "display:linechart_view")
        {
            $("#"+this.linechart_view_DIV_ID).css("display","block");
            if (this.FIRST_CALLED)
            {
                var dataModel = this.dataModel().initialize();
                this.update_render(this.linechart_view_DIV_ID,this.FIRST_CALLED)
                this.FIRST_CALLED = false;
            }
        }

        if (message == "hide:linechart_view")
        {
            $("#"+this.linechart_view_DIV_ID).css("display","none");
        }

	},

    update_render:function(divID,FIRST_CALLED)
    {

    //render heavy_linechart

        var width  = $("#"+divID).width();
        var height  = $("#"+divID).height();

        var div = d3.select("#"+divID);
        if (FIRST_CALLED)
            div.selectAll("*").remove();
        
        ($("#"+divID).d3_linechart()
            .data([DATACENTER.GLOBAL_STATIC.raw_data])
            //.height(200)
            //.width(width)
            .x_scale_type("linear")
            .xlabel("xab")
            .ylabel("yab") 
            .draw_xgrid(true)
            .draw_ygrid(true)
            .draw_datalabel(true)
            .linechart_id("linechart1")
            .margin({top: 20, right: 80, bottom:20, left: 40})
            .yTickNum(5)
            .draw_xAxis(true)
            .draw_yAxis(true)
            .color_scale(d3.scale.category10())
            .mousemove_trigger(function(){console.log('mousemove233')})
            .zoom_trigger(function(){console.log('zoom233')})
            .pan_trigger(function(){console.log('pan233')})
            .render())();

        ($("#"+divID).d3_linechart().draw_tick())(2.4,"hhhh");

        //($("#"+divID).d3_linechart().zoom_to_xrange())([1,2]);

        /*
        ($("#"+"renderplace2").d3_linechart()
            .data(DATACENTER.GLOBAL_STATIC.raw_data)
            .x_scale_type("linear")
            .render())()
        */


    //render horizon_graph

        function get_horizon_data(heavy_linechart)
        {
            var light_linechart = [];
            for (var i = 0; i < heavy_linechart.data.length; ++i)
            {
                var x = heavy_linechart.data[i].x;
                var y = heavy_linechart.data[i].y;
                light_linechart.push([x,y])
            }
            return light_linechart;
        }

        var horizon_data = get_horizon_data(DATACENTER.GLOBAL_STATIC.raw_data[0]);

        var mean = horizon_data.reduce(function(sum, cur){return sum + cur[1]}, 0) / horizon_data.length;
        var normlized_light_line_data = horizon_data.map(function(d){return [d[0], d[1] - mean]})

        var horizon = d3.horizon()
            .width($("#renderplace2").width())
            .height($("#renderplace2").height())
            .bands(10)
            .colors(["green", "yellow", "yellow", "red"])
            .opacity(0.3)
            .margin({top: 50, right: 10, bottom: 20, left: 100})
            .interpolate("basis");

        var svg = d3.select("#renderplace2").append("svg")
        svg.data([normlized_light_line_data]).call(horizon);
        //svg.data([[]]).call(horizon);

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
        //svg.data([[]]).call(linechart.duration(1000));
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
            .margin({top: 10, right: 10, bottom: 20, left: 100})
            .color_scale(traffic_light_color_scale())
        canvas.data([matrix]).call(bitmap);
        //canvas.data([[]]).call(bitmap/*.width(200)*/);

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

    //render multiresolution
    
        var div = d3.select("#renderplace5")
        var multiresolution = d3.multiresolution()
            .width($("#renderplace5").width())
            .height(200)
            .margin({top: 50, right: 10, bottom: 20, left: 100})
            .color_scale(traffic_light_color_scale())
        div.data([DATACENTER.GLOBAL_STATIC.raw_data[0]]).call(multiresolution);
        
        div.call(multiresolution.duration(1000).height(100));
        //div.call(multiresolution.duration(1000).height(80));
        div.call(multiresolution.duration(1000).height(72));
        
        console.log(div,multiresolution)

    },

}