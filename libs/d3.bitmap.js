//version 1.5 2017.2.18 20:00
//dependency:
//d3.js version 3.5.17
//jquery.js version 2.1.1

(function(){
    d3.bitmap = function() 
    {
        //渲染前强制要求绑定好的属性
        //data的数据结构为:
        //2维数组matrix(不要求一定为方形数组)
        //每个元素形如:
        //matrix[i][j] = {val:..., info:...}
        //info用来存储各种与应用相关的信息
        //matrix的尺寸不需要保证与提供的div的像素数一致
        var data = undefined;
        var color_scale = undefined;//[0,1]到颜色的映射函数
        
        //绑定时自动加上的属性
        var parent = undefined;//用jquery选中的parent
        var parent_id = undefined;

        //在chart中不会修改的渲染外形变量
        var width = 640,  
            height = 480, 
            margin = {top: 20, right: 20, bottom: 20, left: 20},
            _calInnerWidth = function() {return width - margin.left - margin.right},
            _calInnerHeight = function() {return height - margin.top - margin.bottom},
            render_interaction_layer = false;

        //在chart中不会修改的其他变量
        var id = undefined;

        //在chart中会修改的变量
        var x = {   data_max:undefined,//这里的各类min,max都是可取到的闭区间
                    mousemove_value:undefined,
                    display_min:undefined,//[display_min,display_max]用于在zoom时记录zoom以后显示的范围
                    display_max:undefined,},
            y = {   data_max:undefined,
                    mousemove_value:undefined,
                    display_min:undefined,
                    display_max:undefined,};

        //开放的渲染层
        var canvas = undefined;
        //开放的交互层
        var interaction_layer = undefined;
        var div = undefined;

        //在chart中会修改的函数，且不允许赋值，只允许访问
        var render = function(){
            if (d3.select(_get_jquery_core_element(parent)).select(".bitmap_div")[0][0] === null)
            {
                d3.select(_get_jquery_core_element(parent)).append("div")
                    .attr('class','bitmap_div')
                    .style('transform', function(){
                        //注意, translate(0,0)与不translate效果不完全一样
                        //translate(0,0)以后外层div会有白边
                        if ( (margin.left!=0)||(margin.right!=0) )
                            return 'translate(' + margin.left + 'px,' + margin.top + 'px)'
                    })
                    .style('width', _calInnerWidth() + 'px')
                    .style('height', _calInnerHeight() + 'px')
            }
            d3.select(_get_jquery_core_element(parent)).select(".bitmap_div")
                .datum(data)
                .call(chart)
        };

        function _get_jquery_core_element(jquery_element){
            return jquery_element[0];
        }

        function _get_d3_core_element(d3_element){
            return d3_element[0][0];
        }

        function _get_color(bitmap, i, j){
            var index = 4 * (i * bitmap.width + j);
            if (index > bitmap.length)
                console.warn('_get_color out of range',bitmap,i,j)
            var color = {
                r: bitmap.data[index],
                g: bitmap.data[index + 1],
                b: bitmap.data[index + 2],
                alpha: bitmap.data[index + 3],
            }
        }

        function _set_color(bitmap, i, j, color){
            var index = 4 * (i * bitmap.width + j);
            if (index > bitmap.length)
            {
                console.warn('_set_color out of range',bitmap,i,j);
                return;
            }
            bitmap.data[index] = color.r;
            bitmap.data[index + 1] = color.g;
            bitmap.data[index + 2] = color.b;
            bitmap.data[index + 3] = color.alpha;
        }

        function _set_smoothing(ctx, should_smooth){
            //不smooth的话可以缩短渲染时间
            if (typeof(should_smooth) != 'boolean')
            {
                console.warn('_set_smoothing invalid input', should_smooth);
                return;
            }
            ctx.imageSmoothingEnabled = should_smooth;
            ctx.mozImageSmoothingEnabled = should_smooth;
            ctx.webkitImageSmoothingEnabled = should_smooth;
            ctx.msImageSmoothingEnabled = should_smooth;
        }
        
        function chart(selection) 
        {
            if (selection.length > 1)
                console.warn("selection length > 1",selection);

            selection.each(function(matrix) 
            {
                div = d3.select(this)
                var innerWidth = _calInnerWidth();
                var innerHeight = _calInnerHeight();

            //
                /*******************************************************************************
                 ***********************start of canvas render part*****************************
                 *******************************************************************************/

                if (div.select('canvas')[0][0] === null)
                {
                    div.append('canvas');
                }
                var d3SelectedCanvas = div.select('canvas')
                        .attr("width", innerWidth)
                        .attr("height", innerHeight)
                        .style('position', 'absolute')

                canvas = _get_d3_core_element(d3SelectedCanvas);
                var ctx = canvas.getContext('2d');

                //统计矩阵matrix[y][x]的x取值范围
                x.data_max = d3.max(matrix, function(line) { return line.length - 1; });
                [x.display_min, x.display_max] = [0, x.data_max];
                //将matrix的某一列映射到bitmap的某一列
                var x2width = d3.scale.linear()
                    .domain([0, x.data_max])
                    .rangeRound([0, innerWidth - 1]);//取整的mapping
                var width2x = x2width.invert;

                y.data_max = matrix.length - 1;
                [y.display_min, y.display_max] = [0, y.data_max];
                //将matrix的某一行映射到bitmap的某一行
                var y2height = d3.scale.linear()
                    .domain([0, y.data_max])
                    .rangeRound([innerHeight - 1, 0]);
                var height2y = y2height.invert;

                //尺寸与matrix完全一致的虚拟bitmap,实际使用时需要resize
                var virtual_bitmap = new ImageData(x.data_max + 1, y.data_max + 1);
                for (var i = 0; i < virtual_bitmap.height; ++i)
                {
                    var cur_line = matrix[i];
                    var cur_val_scale = d3.scale.linear()
                            .domain(d3.extent(cur_line,function(d){ return d.val }))
                            .range([0,1]);
                    for (var j = 0; j < virtual_bitmap.width; ++j)
                    {
                        var cur_point = cur_line[j];
                        var cur_color_string = color_scale(cur_val_scale(cur_point.val));
                        var cur_color = d3.rgb(cur_color_string);
                        _set_color(virtual_bitmap, i, j, {
                            r: cur_color.r,
                            g: cur_color.g,
                            b: cur_color.b,
                            alpha: 150,
                        })
                    }
                }

                //离屏canvas上面存储着虚拟bitmap, 离屏canvas的尺寸与数据矩阵一样大
                var offscreen = document.createElement('canvas');
                d3.select(offscreen)//.attr('display','none')
                    .attr("width", virtual_bitmap.width)
                    .attr("height", virtual_bitmap.height)
                var offscreen_ctx = offscreen.getContext('2d');
                offscreen_ctx.putImageData(virtual_bitmap,0,0)

                //修正尺寸以后进行正式的渲染
                _set_smoothing(ctx, false)
                ctx.scale(canvas.width / virtual_bitmap.width, canvas.height / virtual_bitmap.height)
                ctx.drawImage(offscreen,0,0)

                

                /*******************************************************************************
                 ***********************end of canvas render part*****************************
                 *******************************************************************************/
            //
                if (render_interaction_layer == true)
                {
                    div.selectAll('svg').remove();
                    interaction_layer = div.append('svg')
                            .attr("width", innerWidth)
                            .attr("height", innerHeight)
                            .style('position', 'absolute')
                }
                return
            });
        }

        chart.div = function(){
            if (!arguments.length) return div;
            console.warn("cannot be customized: div")
        };

        chart.canvas = function(){
            if (!arguments.length) return canvas;
            console.warn("cannot be customized: canvas")
        };

        chart.interaction_layer = function(){
            if (!arguments.length) return interaction_layer;
            console.warn("cannot be customized: interaction_layer")
        };

        chart.render = function(){
            if (!arguments.length) return render;
            console.warn("cannot be customized: render")
        };

        chart.data = function(value){
            if (!arguments.length) return data;
            if (typeof(value)!="object")
            {
                console.warn("invalid value for data",value);
                return;
            }
            data = value;
            return chart;
        };

        chart.render_interaction_layer = function(value) {
            if (!arguments.length) return render_interaction_layer;
            if (typeof(value)!="boolean")
            {
                console.warn("invalid value for render_interaction_layer",value);
                return;
            }
            render_interaction_layer = value;
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

        chart.id = function(value){
            if (!arguments.length) return id;
            if (typeof(value)!="string")
            {
                console.warn("invalid value for id",value);
                return;
            }
            id = value;
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

        chart.width = function(value) {
            if (!arguments.length) return width;
            if (typeof(value)!="number")
            {
                console.warn("invalid value for width",value);
                return;
            }
            width = value;
            return chart;
        };

        chart.height = function(value) {
            if (!arguments.length) return height;
            if (typeof(value)!="number")
            {
                console.warn("invalid value for height",value);
                return;
            }
            height = value;
            return chart;
        };

        chart.parent_id = function(value){
            if (!arguments.length) return parent_id;
            if (typeof(value)!="string")
            {
                console.warn("invalid value for parent_id",value);
                return;
            }
            parent_id = value;
            return chart;
        };

        chart.parent = function(value){
            if (!arguments.length) return parent;
            if (typeof(value)!="object")
            {
                console.warn("invalid value for parent",value);
                return;
            }
            parent = value;
            return chart;
        };

        return chart;
    }
})()

_d3_bitmap_dict = {};
$.fn.d3_bitmap = function(){
    var this_id = this.attr("id");
    var this_width = this.width();
    var this_height = this.height();
    if (! (this_id in _d3_bitmap_dict) )
    {
        _d3_bitmap_dict[this_id] = d3.bitmap()
            .parent(this)
            .parent_id(this_id)
            .width(this_width)//默认撑满div
            .height(this_height)
    }
    return _d3_bitmap_dict[this_id];
}
