//version 2017.3.26 12:00
//dependency:
//d3.js version 3.5.17
//jquery.js version 2.1.1

(function() {
    d3.bitmap = function() {
        //渲染前强制要求绑定好的属性
        //data的数据结构为:
        //2维数组matrix(不要求一定为方形数组)
        //每个元素形如:
        //matrix[i][j] = {val:..., info:...}
        //info用来存储各种与应用相关的信息
        //matrix的尺寸不需要保证与提供的div或canvas的像素数一致
        let data = undefined;
        let color_scale = undefined; //[0,1]到颜色的映射函数

        //绑定时自动加上的属性
        let parent = undefined; //用jquery选中的parent

        //在chart中不会修改的渲染外形变量
        let width = 640,
            height = 480,
            margin = {
                top: 20,
                right: 20,
                bottom: 20,
                left: 20
            },
            _calInnerWidth = () => width - margin.left - margin.right,
            _calInnerHeight = () => height - margin.top - margin.bottom,
            duration = 500,
            opacity = 1;

        //在chart中不会修改的其他变量
        let id = undefined,
            global_value_extent = undefined;

        //在chart中会修改的变量
        let x = {
                data_max: undefined, //这里的各类min,max都是可取到的闭区间
                mousemove_value: undefined,
                display_min: undefined, //[display_min,display_max]用于在zoom时记录zoom以后显示的范围
                display_max: undefined,
            },
            y = {
                data_max: undefined,
                mousemove_value: undefined,
                display_min: undefined,
                display_max: undefined,
            };

        //开放的渲染层
        let canvas = undefined;

        //在chart中会修改的函数，且不允许赋值，只允许访问
        let scale_rerender = undefined;
        let render = function() {
            d3.select(parent[0]).selectAll("canvas")
                .data(data)
                .enter().append("canvas")
            d3.select(parent[0]).selectAll("canvas")
                .call(chart);
        };

        //local function & variable
        function _get_color(bitmap, i, j) {
            let index = 4 * (i * bitmap.width + j);
            if (index > bitmap.length)
                console.warn('_get_color out of range', bitmap, i, j)
            let color = {
                r: bitmap.data[index],
                g: bitmap.data[index + 1],
                b: bitmap.data[index + 2],
                alpha: bitmap.data[index + 3],
            }
        }

        function _set_color(bitmap, i, j, color) {
            let index = 4 * (i * bitmap.width + j);
            if (index > bitmap.length) {
                console.warn('_set_color out of range', bitmap, i, j);
                return;
            }
            bitmap.data[index] = color.r;
            bitmap.data[index + 1] = color.g;
            bitmap.data[index + 2] = color.b;
            bitmap.data[index + 3] = color.alpha;
        }

        function _set_smoothing(ctx, should_smooth) {
            //不smooth的话可以缩短渲染时间
            if (typeof(should_smooth) != 'boolean') {
                console.warn('_set_smoothing invalid input', should_smooth);
                return;
            }
            ctx.imageSmoothingEnabled = should_smooth;
            ctx.mozImageSmoothingEnabled = should_smooth;
            ctx.webkitImageSmoothingEnabled = should_smooth;
            ctx.msImageSmoothingEnabled = should_smooth;
        }

        //renderer
        function chart(selection) {
            if (selection.length > 1)
                console.warn("selection length > 1", selection);
            //数据是传入一个二维数组matrix
            //每个最基本的元素是一个{val:...}
            selection.each(function(matrix) {
                let innerWidth = _calInnerWidth();
                let innerHeight = _calInnerHeight();

                let d3SelectedCanvas = d3.select(this)
                    .attr("width", innerWidth)
                    .attr("height", innerHeight)
                    .style("transform", "translate(" + margin.left + "px," + margin.top + "px)")

                canvas = d3SelectedCanvas.node();
                let ctx = canvas.getContext('2d');

                let virtual_bitmap = null;
                if (matrix.length != 0) {
                    //统计矩阵matrix[y][x]的x取值范围
                    y.data_max = matrix.length - 1;
                    [y.display_min, y.display_max] = [0, y.data_max];
                    //将matrix的某一行映射到bitmap的某一行
                    let y2height = d3.scale.linear()
                        .domain([0, y.data_max])
                        .rangeRound([innerHeight - 1, 0]);
                    let height2y = y2height.invert;

                    x.data_max = d3.max(matrix, line => line.length - 1);
                    [x.display_min, x.display_max] = [0, x.data_max];
                    //将matrix的某一列映射到bitmap的某一列
                    let x2width = d3.scale.linear()
                        .domain([0, x.data_max])
                        .rangeRound([0, innerWidth - 1]); //取整的mapping
                    let width2x = x2width.invert;

                    //尺寸与matrix完全一致的虚拟bitmap,实际使用时需要resize
                    virtual_bitmap = new ImageData(x.data_max + 1, y.data_max + 1);
                    for (let i = 0; i < virtual_bitmap.height; ++i) {
                        let cur_line = matrix[i];

                        //如果传入了global_value_extent,就用它来初始化颜色映射的定义域
                        let value_domain = global_value_extent != undefined ? global_value_extent :
                            d3.extent(cur_line, d => d.val)

                        let cur_val_scale = d3.scale.linear()
                            .domain(value_domain)
                            .range([0, 1]);
                        for (let j = 0; j < virtual_bitmap.width; ++j) {
                            let cur_point = cur_line[j];
                            let cur_color_string = color_scale(cur_val_scale(cur_point.val));
                            let cur_color = d3.rgb(cur_color_string);
                            _set_color(virtual_bitmap, i, j, {
                                r: cur_color.r,
                                g: cur_color.g,
                                b: cur_color.b,
                                alpha: opacity * 255,
                            })
                        }
                    }
                } else {
                    //尺寸与matrix完全一致的虚拟bitmap,实际使用时需要resize
                    virtual_bitmap = new ImageData(1, 1);
                    _set_color(virtual_bitmap, 0, 0, {
                        r: 0,
                        g: 0,
                        b: 0,
                        alpha: 0,
                    })
                }

                //离屏canvas上面存储着虚拟bitmap, 离屏canvas的尺寸与数据矩阵一样大
                let offscreen = document.createElement('canvas');
                d3.select(offscreen)
                    .attr("width", virtual_bitmap.width)
                    .attr("height", virtual_bitmap.height)
                let offscreen_ctx = offscreen.getContext('2d');
                offscreen_ctx.putImageData(virtual_bitmap, 0, 0)

                //修正尺寸以后进行正式的渲染
                scale_rerender = function(width_rate, height_rate) {
                    canvas.width = canvas.width * width_rate;
                    canvas.height = canvas.height * height_rate;

                    _set_smoothing(ctx, false)
                    ctx.scale(canvas.width / virtual_bitmap.width, canvas.height / virtual_bitmap.height)
                    ctx.drawImage(offscreen, 0, 0)
                }
                scale_rerender(1.0, 1.0)
            });
        }

        //setter & getter
        chart.canvas = function() {
            if (!arguments.length) return canvas;
            console.warn("cannot be customized: canvas")
        };

        chart.scale_rerender = function() {
            if (!arguments.length) return scale_rerender;
            console.warn("cannot be customized: scale_rerender")
        };

        chart.render = function() {
            if (!arguments.length) return render;
            console.warn("cannot be customized: render")
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

        chart.opacity = function(value) {
            if (!arguments.length) return opacity;
            if (typeof(value) != "number") {
                console.warn("invalid value for opacity", value);
                return;
            }
            opacity = value;
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

        chart.id = function(value) {
            if (!arguments.length) return id;
            if (typeof(value) != "string") {
                console.warn("invalid value for id", value);
                return;
            }
            id = value;
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

        chart.parent = function(value) {
            if (!arguments.length) return parent;
            if (typeof(value) != "object") {
                console.warn("invalid value for parent", value);
                return;
            }
            parent = value;
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
})()

$.fn.d3_bitmap = function() {
    if ($(this).data('d3_bitmap') == undefined) {
        let renderer = d3.bitmap()
            .parent(this)
            .width(this.width())
            .height(this.height())
        $(this).data('d3_bitmap', renderer)
    }
    return $(this).data('d3_bitmap');
}