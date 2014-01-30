"use strict";

var BMS = (function ($) {
    var context, codeUrl, codeList, callbacks;
    var  $text, api, $message, $st, $source, $field, $buttons, $choice, $submit;
    var fillMode = true, strokeMode = true, consoleColor;
    var canvasW = 400, canvasH = 400;
    
    // Utility functions
    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }
    
    // Clear console
    function resetConsole() {
        consoleColor = "white";
        $text.css("background-color", "black").empty();
    }
    
    // Clear canvas and reset defaults
    function resetCanvas() {
        fillMode = true;
        strokeMode = true;
        context.fillStyle = "black";
        context.strokeStyle = "black";
        context.lineWidth = 1;
        context.clearRect(0, 0, canvasW, canvasH);
    }
    
    // Reset input panel
    function  resetInput() {
        // Reset callbacks
        callbacks = {
            field: null,
            buttons: [null, null, null, null],
            choice: null
        };
        
        // Clear field
        $field.val();
        
        // Reset labels
        $buttons.each(function (i) {
            $(this).html("Button " + (i+1));
        });
        $submit.html("Submit");
        
        // Reset select menu
        $choice.empty();
        for (var i=1; i<=3; i++) {
            $choice.append("<option>Choice " + i + "</option>");
        }
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
        
        // Default visibility
        $("#console").show();
        $("#canvas").show();
        $("#input").show();
        
        // Reset UI
        resetConsole();
        resetCanvas();
        resetInput();
        
        try {
            // Wrap code in function to create private namespace
            codeFunc = new Function("window", code + "\n\n//@ sourceURL=" + codeUrl);
            //$("#source textarea").val(code);
            $source.html(code);
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
        
        //  General
        
        // Show/hide UI elements
        toggleFeatures: function (features, state) {
            features.forEach(function (f) {
                switch (f) {
                    case "console":
                        $("#console").toggle(state);
                        break;
                    case "canvas":
                        $("#canvas").toggle(state);
                        break;
                    case "input":
                        $("#input").toggle(state);
                        break;
                }
            });
        },
        
        // Input
        
        // Change button labels
        setButtonLabel: function (but, label) {
            if (but===0) {      // 0 is the submit button
                $submit.html(label);
            } else {
                $buttons.eq(but-1).html(label);
            }
        },
        
        // Change options for select menu
        setChoices: function (choices) {
            $choice.empty();
            choices.forEach(function (c) {
                $choice.append("<option>" + c + "</option>");
            });
        },
        
        // Get current choice
        getChoice: function () {
            return $choice.find(":selected").text();
        },
        
        // Set callbacks
        setFieldCallback: function (f) {
            callbacks.field = f;
        },
        
        setChoiceCallback: function (f) {
            callbacks.choice = f;
        },
        
        setButtonCallback: function (but, f) {
            callbacks.buttons[but-1] = f;  
        },
        
        // Console
        
        // print to console
        print: function (s) {
            //$text.val($text.val() + s + "\n");
            $text.append($("<span>" + s + "</span>").css("color", consoleColor));
            $text.append("\n");
        },
        
        // clear text from consol
        clearConsole: function () {
            $text.empty()
        },
        
        // reset console completely, including colors
        resetConsole: function () {
            resetConsole();
        },
        
        consoleColor: function (color) {
            if (arguments.length==3) {
                color = rgbToHex(arguments[0], arguments[1], arguments[2]);
            }
            consoleColor = color;
        },
        
        consoleBackground: function (color) {
            if (arguments.length==3) {
                color = rgbToHex(arguments[0], arguments[1], arguments[2]);
            }
            $text.css("background-color", color);
        },
        
        // Canvas

        fillMode: function (mode) {
            fillMode = mode;
        },
        
        strokeMode: function (mode) {
            strokeMode = mode;
        },
        
        fillColor: function (color) {
            if (arguments.length==3) {
                color = rgbToHex(arguments[0], arguments[1], arguments[2]);
            }
            context.fillStyle  = color;
        },
        
        strokeColor: function (color) {
            if (arguments.length==3) {
                color = rgbToHex(arguments[0], arguments[1], arguments[2]);
            }
            context.strokeStyle = color;
        },
        
        lineWidth: function (w) {
            context.lineWidth = w;
        },
        
        background: function (color) {
            var oldFillStyle = context.fillStyle;
            if (arguments.length==3) {
                color = rgbToHex(arguments[0], arguments[1], arguments[2]);
            }
            context.fillStyle  = color;
            context.fillRect(0, 0, canvasW, canvasH);
            context.fillStyle = oldFillStyle;
        },
        
        rectangle: function (x, y, w, h) {
            if (fillMode) {
                context.fillRect(x, y, w, h);
            }
            if (strokeMode) {
                context.strokeRect(x, y, w, h);
            }
        },
        
        triangle: function (x1, y1, x2, y2, x3, y3) {
            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x2, y2);
            context.lineTo(x3, y3);
            context.closePath();
            if (fillMode) {
                context.fill();
            }
            if (strokeMode) {
                context.stroke();
            }
         },
        
        ellipse: function (x, y, hr, vr) {
            context.save();
            context.translate(x, y);
            context.scale(1, vr / hr);
            context.beginPath();
            context.arc(0, 0, hr, 0, 2*Math.PI, false);
            context.restore();
            if (fillMode) {
                context.fill();
            }
            if (strokeMode) {
                context.stroke();
            }
        },
        
        circle: function (x, y, r) {
            api.ellipse(x, y, r, r);
        },
        
        line: function (x1, y1, x2, y2) {
            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x2, y2);
            context.stroke();
        }
        
    }

    // On document ready
    $(function() {
        var $select = $("#codeselect"), $showcode = $("#showcode"),
            $shade = $("#shade");
        var m, sourceVisible = false, stVisible = false;
        
        // Cache some (mostly jquery) variables
        $message = $("#message");
        $st = $("#stacktrace");
        $source = $("#source");
        $text = $("#text");
        $field = $("#field");
        $submit = $("#submit");
        $buttons = $(".cbtn");
        $choice = $("#choice");
        context = $("#graphics")[0].getContext("2d");
        
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
               $showcode.html("Show Code");
               $shade.fadeOut();
               $source.fadeOut();
               sourceVisible = false;
           } else {
               $showcode.html("Hide Code");
               $shade.fadeIn();
               $source.fadeIn();
               sourceVisible = true;
           }
        });
        
        // Bind "Reload Code" button
        $("#reloadcode").click(loadCode);
        
        // Bind input elements
        
        // Submit
        $submit.click(function () {
            if (typeof callbacks.field === "function") {
                callbacks.field($field.val());
                $field.val("");
            }
        });
        
        // Buttons
        $buttons.each(function (i) {
            $(this).click(i, function (evt) {
                if(typeof callbacks.buttons[i] === "function") {
                    callbacks.buttons[i]();
                }
            });
        });
        
        $choice.change(function () {
            if (typeof callbacks.choice === "function") {
                callbacks.choice($(this).find(":selected").text());
            }
        });
        
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
            codeUrl = $select.val();
            loadCode();
        });

        // Canvas
        
        // Set up canvas api
        // api.fillMode = function(mode) {
        //     fillMode = mode;
        // };
        // api.strokeMode = function(mode) {
        //     strokeMode = mode;
        // };
        // api.fillColor = function(color) {
        //     if (arguments.length==3)
        //         color = rgbToHex(arguments[0], arguments[1], arguments[2]);
        //         context.fillStyle  = color;
        // };
        // api.strokeColor = function(color) {
        //     if (arguments.length==3)
        //         color = rgbToHex(arguments[0], arguments[1], arguments[2]);
        //         context.strokeStyle = color;
        // };
        // api.lineWidth = function(w) {
        //     context.lineWidth = w;
        // };
        // api.rectangle = function(x, y, w, h) {
        //     if (fillMode)
        //         context.fillRect(x, y, w, h);
        //     if (strokeMode)
        //         context.strokeRect(x, y, w, h);
        // };
        // api.ellipse = function(x, y, hr, vr) {
        //     context.save();
        //     context.translate(x, y);
        //     context.scale(1, vr / hr);
        //     context.beginPath();
        //     context.arc(0, 0, hr, 0, 2*Math.PI, false);
        //     context.restore();
        //     if (fillMode)
        //         context.fill();
        //     if (strokeMode)
        //         context.stroke();
        // };
        // api.circle = function(x, y, r) {
        //     api.ellipse(x, y, r, r);
        // };
        // api.line = function(x1, y1, x2, y2) {
        //     context.beginPath();
        //     context.moveTo(x1, y1);
        //     context.lineTo(x2, y2);
        //     context.stroke();
        // }
        
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
        // api.print = function(s) {
        //     $text.val($text.val() + s + "\n");
        // }

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
