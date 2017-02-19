//version 1.5 2017.2.18 20:00
//dependency:
//d3.js version 3.5.17
//jquery.js version 2.1.1
(function(){
    d3.multiresolution = function() 
    {
        var width = 640,  
            height = 480, 
            margin = {top: 20, right: 20, bottom: 20, left: 20},
            duration = 500;
        
        function chart(selection) {
            selection.each(function(datasets) {

                var svg = d3.select(this)
                    .attr("width", width)
                    .attr("height", height)
                


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

        

        return chart;
    }
})();
