var API = (function ($) {
    var context, $text, api = {}, fillMode = true, strokeMode = true;;
    
    // Utility functions
    
    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    $(function() {
        var script, features = {}, m;
        
        // Build script element "by hand" to bypass jquery preprocessing
        script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = "code.js";
        
        // Get and features
        $("html").data("features").split(/\s+/).forEach(function(f) {
           features[f] = true; 
        });
        
        // Canvas
        if (features.canvas) {
            context = $("#graphics")[0].getContext("2d");
            
            // Set up canvas api
            api.fillMode = function(mode) {
                fillMode = mode;
            };
            api.strokeMode = function(mode) {
                strokeMode = mode;
            };
            api.fillColor = function(color) {
                if (arguments.length==3)
                    color = rgbToHex(arguments[0], arguments[1], arguments[2]);
                    context.fillStyle  = color;
            };
            api.strokeColor = function(color) {
                if (arguments.length==3)
                    color = rgbToHex(arguments[0], arguments[1], arguments[2]);
                    context.strokeStyle = color;
            };
            api.lineWidth = function(w) {
                context.lineWidth = w;
            };
            api.rectangle = function(x, y, w, h) {
                if (fillMode)
                    context.fillRect(x, y, w, h);
                if (strokeMode)
                    context.strokeRect(x, y, w, h);
            };
            api.ellipse = function(x, y, hr, vr) {
                context.save();
                context.translate(x, y);
                context.scale(1, vr / hr);
                context.beginPath();
                context.arc(0, 0, hr, 0, 2*Math.PI, false);
                context.restore();
                if (fillMode)
                    context.fill();
                if (strokeMode)
                    context.stroke();
            };
            api.circle = function(x, y, r) {
                api.ellipse(x, y, r, r);
            };
            api.line = function(x1, y1, x2, y2) {
                context.beginPath();
                context.moveTo(x1, y1);
                context.lineTo(x2, y2);
                context.stroke();
            }
        } else
            $("div.canvas").hide();
            
        // Console
        if (features.console) {
            $text = $("#text");
            api.print = function(s) {
                $text.val($text.val() + s + "\n");
            };
        } else
            $("div.console").hide();
            
        // Make api global    
        if (features.globals)
            for (m in api)
                window[m] = api[m];
    
        // Append script element to get and run code
        $("body").append(script);
    });
    
    return api;
})(jQuery);
