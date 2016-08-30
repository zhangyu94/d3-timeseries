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
        var width  = $("#"+divID).width();
        var height  = $("#"+divID).height();

        var div = d3.select("#"+divID);
        if (FIRST_CALLED)
            div.selectAll("*").remove();
        
        ($("#"+divID).d3_linechart()
            .data(DATACENTER.GLOBAL_STATIC.raw_data)
            //.height(200)
            //.width(width)
            //.x_scale_type("time")
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

        ($("#"+divID).d3_linechart().draw_tick())(2.4,"hhhh");

        //($("#"+divID).d3_linechart().zoom_to_xrange())([1,2]);

        ($("#"+"renderplace2").d3_linechart()
            .data(DATACENTER.GLOBAL_STATIC.raw_data)
            .render())()

    },

}