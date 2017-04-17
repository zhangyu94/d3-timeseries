//version 2017.4.8 12:00
//dependency:
//d3.js version 3.5.17
//jquery.js version 2.1.1

(function() {
    d3.multiresolution = function() {
        let width = 640,
            height = 480,
            margin = {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            },
            duration = 500,
            color_scale = undefined,
            opacity = 0.6,
            //[-无穷, 5)对应resolution0, [5,20)对应resolution1, [20, 无穷]对应resolution2
            enable_transition = false, //启用同视图transition时渲染速度会严重减慢,比删掉以后重新渲染还慢
            thersholds = d3.scale.threshold().domain([5, 20]).range([0, 1, 2]),
            global_value_extent = undefined

        //local function & variable
        let _previous_resolution = undefined

        function _get_horizon_data(heavy_line) {
            let light_linechart = []
            for (let i = 0; i < heavy_line.data.length; ++i) {
                let x = heavy_line.data[i].x
                let y = heavy_line.data[i].y
                light_linechart.push([x, y])
            }
            return light_linechart
        }

        function _get_bitmap_data(heavy_line) {
            let matrix = [
                []
            ]
            for (let i = 0; i < heavy_line.data.length; ++i) {
                //此处假设heavy_line.data[...].x都是等间距的
                matrix[0][i] = {
                    val: heavy_line.data[i].y,
                }
            }
            return matrix
        }

        function _get_light_data(heavy_line) {
            let transformed_data = {
                x: [],
                y: [],
            }
            for (let i = 0; i < heavy_line.data.length; ++i) {
                transformed_data.x.push(heavy_line.data[i].x)
                transformed_data.y.push(heavy_line.data[i].y)
            }
            return transformed_data
        }

        //renderer
        function chart(selection) {
            selection.each(function(dataset_line) {
                let innerHeight = height - margin.top - margin.bottom

                let div = d3.select(this)
                let resolution = thersholds(innerHeight)

                function _handle_renderplace(div, resolution, _previous_resolution, enable_transition) {
                    if ((resolution == _previous_resolution) && enable_transition)
                        return

                    div.selectAll('canvas').remove()
                    div.selectAll('svg').remove()
                    if (resolution == 0) {
                        div.append("canvas")
                            .style('display', 'block')
                    }
                    if (resolution == 1) {
                        div.append("svg")
                            .style('display', 'block')
                    }
                    if (resolution == 2) {
                        div.append("svg")
                            .style('display', 'block')
                    }

                }
                _handle_renderplace(div, resolution, _previous_resolution, enable_transition)
                if (resolution == 0) //render bitmap
                {
                    let bitmap_data = _get_bitmap_data(dataset_line)

                    let bitmap = d3.bitmap()
                        .width(width)
                        .height(height)
                        .margin(margin)
                        .opacity(opacity)
                        .color_scale(color_scale)
                    if (typeof(global_value_extent) != 'undefined')
                        bitmap.global_value_extent(global_value_extent)

                    let canvas = div.select("canvas")
                    canvas.data([bitmap_data]).call(bitmap.duration(duration))
                } else if (resolution == 1) //render horizon_graph
                {
                    let horizon_data = _get_horizon_data(dataset_line)
                    let mean = horizon_data.reduce((sum, cur) => sum + cur[1], 0) / horizon_data.length
                    let normalized_horizon_data = horizon_data.map(d => [d[0], d[1] - mean])


                    let horizon = d3.horizon()
                        .width(width)
                        .height(height)
                        .bands(2)
                        .colors(["green", "yellow", "yellow", "red"])
                        .opacity(opacity)
                        .margin(margin)
                        .interpolate("basis")
                    if (typeof(global_value_extent) != 'undefined') {
                        let normalized_global_value_extent = global_value_extent.map(d => d - mean)
                        horizon.global_value_extent(normalized_global_value_extent)
                    }

                    let svg = div.select("svg")
                    svg.data([normalized_horizon_data]).call(horizon.duration(duration))
                } else if (resolution == 2) //render light_linechart
                {
                    let transformed_data = _get_light_data(dataset_line)

                    let linechart = d3.linechart_light()
                        .width(width)
                        .height(height)
                        .margin(margin)
                    if (typeof(global_value_extent) != 'undefined')
                        linechart.global_value_extent(global_value_extent)

                    let svg = div.select("svg")
                    svg.data([
                        [transformed_data]
                    ]).call(linechart.duration(duration))
                }

                _previous_resolution = resolution

            })
        }

        //setter & getter
        chart.width = function(value) {
            if (!arguments.length) return width
            width = value
            return chart
        }

        chart.height = function(value) {
            if (!arguments.length) return height
            height = value
            return chart
        }

        chart.margin = function(value) {
            if (!arguments.length) return margin
            if (typeof(value) != "object") {
                console.warn("invalid value for margin", value)
                return
            }
            if (typeof(value.top) == "number")
                margin.top = value.top
            if (typeof(value.right) == "number")
                margin.right = value.right
            if (typeof(value.bottom) == "number")
                margin.bottom = value.bottom
            if (typeof(value.left) == "number")
                margin.left = value.left
            return chart
        }

        chart.duration = function(value) {
            if (!arguments.length) return duration
            if (typeof(value) != "number") {
                console.warn("invalid value for duration", value)
                return
            }
            duration = value
            return chart
        }

        chart.opacity = function(value) {
            if (!arguments.length) return opacity
            if (typeof(value) != "number") {
                console.warn("invalid value for opacity", value)
                return
            }
            opacity = value
            return chart
        }

        chart.color_scale = function(value) {
            if (!arguments.length) return color_scale
            if (typeof(value) != "function") {
                console.warn("invalid value for color_scale", value)
                return
            }
            color_scale = value
            return chart
        }

        chart.enable_transition = function(value) {
            if (!arguments.length) return enable_transition
            if (typeof(value) != "boolean") {
                console.warn("invalid value for enable_transition", value)
                return
            }
            enable_transition = value
            return chart
        }

        chart.global_value_extent = function(value) {
            if (!arguments.length) return global_value_extent
            if (typeof(value) != "object") {
                console.warn("invalid value for global_value_extent", value)
                return
            }
            global_value_extent = value
            return chart
        }

        return chart
    }
})()

$.fn.d3_multiresolution = function() {
    if ($(this).data('d3_multiresolution') == undefined) {
        let this_width = this.width()
        let this_height = this.height()
        let renderer = d3.multiresolution()
            .width(this_width)
            .height(this_height)
            .margin({
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            })
        $(this).data('d3_multiresolution', renderer)
    }
    return $(this).data('d3_multiresolution')
}