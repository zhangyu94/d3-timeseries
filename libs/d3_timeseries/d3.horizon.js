//version 2017.2.19 12:00
//dependency:
//d3.js version 3.5.17

(function() {
    d3.horizon = function() 
    {
        var bands = 1, // between 1 and 5, typically
            mode = "offset", // or mirror
            interpolate = "linear", // or basis, monotone, step-before, etc.
            x = d3_horizonX,
            y = d3_horizonY,
            width = 960,
            height = 40,
            margin = {top: 20, right: 20, bottom: 20, left: 20},
            duration = 0;

        var opacity = 1;
        var color = d3.scale.linear()
            .domain([-1, 0, 0, 1])
            .range(["#08519c", "#bdd7e7", "#bae4b3", "#006d2c"]);

        // For each small multiple…
        function horizon(selection) {
            selection.each(function(d, i) 
            {
                var innerWidth = width - margin.left - margin.right,
                    innerHeight = height - margin.top - margin.bottom ;

                var svg = d3.select(this)
                    .attr("width", width)
                    .attr("height", height)

                var n = 2 * bands + 1,
                    xMin = Infinity,
                    xMax = -Infinity,
                    yMax = -Infinity,
                    x0, // old x-scale
                    y0, // old y-scale
                    id; // unique id for paths

                // Compute x- and y-values along with extents.
                var data = d.map(function(d, i) {
                    var xv = x.call(this, d, i),
                        yv = y.call(this, d, i);
                    if (xv < xMin) xMin = xv;
                    if (xv > xMax) xMax = xv;
                    if (-yv > yMax) yMax = -yv;
                    if (yv > yMax) yMax = yv;
                    return [xv, yv];
                });

                // Compute the new x- and y-scales, and transform.
                var x1 = d3.scale.linear().domain([xMin, xMax]).range([0, innerWidth]),
                    y1 = d3.scale.linear().domain([0, yMax]).range([0, innerHeight * bands]),
                    t1 = d3_horizonTransform(bands, innerHeight, mode);

                // Retrieve the old scales, if this is an update.
                if (this.__horizon__) {
                    x0 = this.__horizon__.x;
                    y0 = this.__horizon__.y;
                    t0 = this.__horizon__.t;
                    id = this.__horizon__.id;
                } else {
                    x0 = x1.copy();
                    y0 = y1.copy();
                    t0 = t1;
                    id = ++d3_horizonId;
                }

                // We'll use a defs to store the area path and the clip path.
                var defs = svg.selectAll("defs")
                    .data([null]);

                // The clip path is a simple rect.
                defs.enter().append("defs").append("clipPath")
                        .attr("id", "d3_horizon_clip" + id)
                    .append("rect")
                        .attr("width", innerWidth)
                        .attr("height", innerHeight);

                defs.select("rect").transition()
                    .duration(duration)
                    .attr("width", innerWidth)
                    .attr("height", innerHeight);

                // We'll use a container to clip all horizon layers at once.
                svg.selectAll("g")
                        .data([null])
                    .enter().append("g")
                        .attr("clip-path", "url(#d3_horizon_clip" + id + ")")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                // Instantiate each copy of the path with different transforms.
                var path = svg.select("g").selectAll("path")
                    .data(d3.range(-1, -bands - 1, -1).concat(d3.range(1, bands + 1)), Number);

                var d0 = d3_horizonArea
                    .interpolate(interpolate)
                    .x(function(d) { return x0(d[0]); })
                    .y0(innerHeight * bands)
                    .y1(function(d) { return innerHeight * bands - y0(d[1]); })
                    (data);

                var d1 = d3_horizonArea
                    .x(function(d) { return x1(d[0]); })
                    .y1(function(d) { return innerHeight * bands - y1(d[1]); })
                    (data);

                path.enter().append("path")
                    .attr('opacity',opacity)
                    .style("fill", color)
                    .attr("transform", t0)
                    .attr("d", d0);

                path.transition()
                    .duration(duration)
                    .attr('opacity',opacity)
                    .style("fill", color)
                    .attr("transform", t1)
                    .attr("d", d1);

                path.exit().transition()
                    .duration(duration)
                    .attr("transform", t1)
                    .attr("d", d1)
                    .remove();

                // Stash the new scales.
                this.__horizon__ = {x: x1, y: y1, t: t1, id: id};
            });
            d3.timer.flush();
        }

        horizon.margin = function(value) {
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
            return horizon;
        };

        horizon.duration = function(x) {
            if (!arguments.length) return duration;
            duration = +x;
            return horizon;
        };

        horizon.bands = function(x) {
            if (!arguments.length) return bands;
            bands = +x;
            color.domain([-bands, 0, 0, bands]);
            return horizon;
        };

        horizon.mode = function(x) {
            if (!arguments.length) return mode;
            mode = x + "";
            return horizon;
        };

        horizon.opacity = function(x) {
            if (!arguments.length) return opacity;
            opacity = x;
            return horizon;
        };

        horizon.colors = function(x) {
            if (!arguments.length) return color.range();
            color.range(x);
            return horizon;
        };

        horizon.interpolate = function(x) {
            if (!arguments.length) return interpolate;
            interpolate = x + "";
            return horizon;
        };

        horizon.x = function(z) {
            if (!arguments.length) return x;
            x = z;
            return horizon;
        };

        horizon.y = function(z) {
            if (!arguments.length) return y;
            y = z;
            return horizon;
        };

        horizon.width = function(x) {
            if (!arguments.length) return width;
            width = +x;
            return horizon;
        };

        horizon.height = function(x) {
            if (!arguments.length) return height;
            height = +x;
            return horizon;
        };

        return horizon;
    };

    var d3_horizonArea = d3.svg.area(),
        d3_horizonId = 0;

    function d3_horizonX(d) {
        return d[0];
    }

    function d3_horizonY(d) {
        return d[1];
    }

    function d3_horizonTransform(bands, height, mode) {
        return mode == "offset"
            ? function(d) { return "translate(0," + (d + (d < 0) - bands) * height + ")"; }
            : function(d) { return (d < 0 ? "scale(1,-1)" : "") + "translate(0," + (d - bands) * height + ")"; };
    }
})();
