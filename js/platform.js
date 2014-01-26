"use strict";

var API = (function ($) {
    var context, $text, api = {}, $message, codeUrl = "code.js";
    var fillMode = true, strokeMode = true, sourceVisible = false;
    
    // Utility functions
    function componentToHex (c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    function rgbToHex (r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }
    
    // Clear console
    function resetConsole () {
        $text.val("");
    }
    
    // Clear canvas and reset defaults
    function resetCanvas () {
        return;  // FIXME
    }
    
    // Display error in header bar
    function setError (severity, error) {
        if (!arguments.length) {
            $message.html("");
        } else {
            switch (severity) {
                case "info":
                    $message.css("color", "blue");
                    break;
                case "network":
                    $message.css("color", "yellow");
                    break;
                case "error":
                    $message.css("color", "red");
                    break;
            }
            if ((typeof error) === "string") {
                $message.html(error);
            } else {
                $message.html(error.name + ": " + error.message);
                // FIXME: Do something with stack trace
            }
        }
    }
    
    // Initiate AJAX call to download code
    function loadCode () {
        $.ajax({url: codeUrl, dataType: "text", success: resetPlatform, 
            error: function () {
                setError("network", "Could not load " + codeUrl);
                }});
    }
    
    // Accept dynamically loaded code and reset UI
    function resetPlatform (code) {
        var codeFunc, e;
        
        resetConsole();
        resetCanvas();
        
        try {
            // Wrap code in function to create private namespace
            codeFunc = new Function(code + "\n\n//@ sourceURL=code.js");
            $("#source textarea").val(code);
            codeFunc();
            setError("info", "Done");
        } catch (e) {
            setError("error", e);
        }
    }

    $(function() {
        var script, features = {}, m;
        
        // Build script element "by hand" to bypass jquery preprocessing
        //script = document.createElement('script');
        //script.type = 'text/javascript';
        //script.src = "code.js";
        
        // Cache message div
        $message = $("#message");
        
        // Bind "Show Source" button
        $("#showcode").click(function () {
           if (sourceVisible) {
               $("#showcode").html("Show Code");
               $("#shade").fadeOut();
               $("#source").fadeOut();
               sourceVisible = false;
           } else {
               $("#showcode").html("Hide Code");
               $("#shade").fadeIn();
               $("#source").fadeIn();
               sourceVisible = true;
           }
        });
        
        // Bind "Reload Code" button
        $("#reloadcode").click(loadCode);

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
            
        // Set up web worker
        /*$.ajax({url: "code.js", dataType: "text", success: function(script) {
            var worker = new Worker("js/worker.js");
            
            // proxy message to API object
            worker.onmessage = function(msg) {
                api[msg.data.func].apply(null, msg.data.args);
            };
            
            // pass script to worker
            worker.postMessage(script);
        }});*/
            
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
    
        loadCode();
        // Append script element to get and run code
        //$.getScript("code.js", function (code) {
        //    $("#source textarea").val(code);
        //});
        //$.ajax({url: "code.js", dataType: "text", success: resetPlatform, 
        //    error: function () {setError("network", "Could not load code.js");}});
        //$("body").append(script);
        //$("body").append($('<iframe class="hidden" src="iframe.html"></iframe>'));
    });
    
    return api;
})(jQuery);
