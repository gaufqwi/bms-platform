"use strict";

var BMS = (function ($) {
    var context, $text, api, $message, $st, codeUrl, codeList;
    var fillMode = true, strokeMode = true, canvasW = 400, canvasH = 400;
    
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
        fillMode = true;
        strokeMode = true;
        context.fillStyle = "black";
        context.strokeStyle = "black";
        context.lineWidth = 1;
        context.clearRect(0, 0, canvasW, canvasH);
    }
    
    // Set stack trace
    function setStackTrace (trace) {
        if (!arguments.length) {
            $st.empty();
            $st.slideUp();
            $st.click();        // To hide panel if visible
        } else {
            $st.html(trace);
        }
    }
    
    // Display error in header bar
    function setError (severity, error) {
        if (!arguments.length) {
            $message.html("");
            setStackTrace();
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
                setStackTrace();
            } else {
                $message.html(error.name + ": " + error.message);
                setStackTrace(error.stack);
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
            codeFunc = new Function("window", code + "\n\n//@ sourceURL=" + codeUrl);
            $("#source textarea").val(code);
            codeFunc();
            setError("info", "Done");
        } catch (e) {
            setError("error", e);
        }
    }
    
    // Parse/filter code directory contents.
    // In the absence of a json API, screen scrape
    function parseCodeDir (data) {
        var files = [], $dom = $(data);
        $dom.find("tr").each(function () {
            var url, name, timestamp, $a;
            $a = $(this).find("a");
            url = $a.attr("href");
            name = $a.html();
            timestamp = new Date($(this).find("td:nth-child(4)").html());
            if (/^.+\.js$/i.test(name)) {
                files.push({url: url, name: name, timestamp: timestamp});
            }
        });
        files.sort(function (a, b) {
           return (a.timestamp < b.timestamp ? 1 : -1); 
        });
        return files;
    }
    
    // External API for console/canvas/input panel
    api = {
        
        // Console
        
        // print to console
        print: function(s) {
            $text.val($text.val() + s + "\n");
        },
        
        // Canvas

        fillMode: function(mode) {
            fillMode = mode;
        },
        
        strokeMode: function(mode) {
            strokeMode = mode;
        },
        
        fillColor: function(color) {
            if (arguments.length==3) {
                color = rgbToHex(arguments[0], arguments[1], arguments[2]);
            }
            context.fillStyle  = color;
        },
        
        strokeColor: function(color) {
            if (arguments.length==3) {
                color = rgbToHex(arguments[0], arguments[1], arguments[2]);
            }
            context.strokeStyle = color;
        },
        
        lineWidth: function(w) {
            context.lineWidth = w;
        },
        
        background: function(color) {
            var oldFillStyle = context.fillStyle;
            if (arguments.length==3) {
                color = rgbToHex(arguments[0], arguments[1], arguments[2]);
            }
            context.fillStyle  = color;
            context.fillRect(0, 0, canvasW, canvasH);
            context.fillStyle = oldFillStyle;
        },
        
        rectangle: function(x, y, w, h) {
            if (fillMode)
                context.fillRect(x, y, w, h);
            if (strokeMode)
                context.strokeRect(x, y, w, h);
        },
        
        ellipse: function(x, y, hr, vr) {
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
        },
        
        circle: function(x, y, r) {
            api.ellipse(x, y, r, r);
        },
        
        line: function(x1, y1, x2, y2) {
            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x2, y2);
            context.stroke();
        }
        
    }

    $(function() {
        var m, $select = $("#codeselect"), sourceVisible = false,
            stVisible = false;
        
        // Cache message and stacktrace divs
        $message = $("#message");
        $st = $("#stacktrace");
        
        // Bind mouseover to show/hide stack trace when appropriate
        $message.click(function () {
            if (stVisible) {
                $st.slideUp();
                stVisible = false;
            } else if ($st.html() !== "") {
                $st.slideDown();
                stVisible = true;
            }
        });
        
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
        
        // Read code dir and set up drop down
        $.ajax({url: "code/", dataType: "text", success: function (data) {
            codeList = parseCodeDir(data);
            codeList.forEach(function (spec) {
                $select.append($("<option>").html(spec.name).val(spec.url));
            });
            //codeUrl = "code.js";
            codeUrl = codeList[0].url;
            loadCode();
        }});
        $select.change(function () {
            console.log("change");
            codeUrl = $select.val();
            loadCode();
        });

        // Canvas
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
        $text = $("#text");
        api.print = function(s) {
            $text.val($text.val() + s + "\n");
        }

        // Make api global    
        // if (features.globals)
        //     for (m in api)
        //         window[m] = api[m];
    
        //console.log(codeUrl);
        //loadCode();
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
