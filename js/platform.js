"use strict";

(function ($) {
    var context, codeUrl, codeList, callbacks;
    var  $text, api, $message, $st, $source, $field, $buttons, $choice, $submit, $shade, $dialog;
    var fillMode = true, strokeMode = true, consoleColor;
    var canvasW = 400, canvasH = 400;
    var interpreter;
    var interpreterRunning = false;
    var interpreterPaused = false;
    var futureStep = null;
    var dialogResult = null;
    var dialogMode = 'alert';
    
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

    // Show dialog box
    function showDialog (mode, message, deftext) {
        $dialog.find('.dialog-message').html(message);
        switch (mode) {
            case 'alert':
                $dialog.find('.cancel').hide();
                $dialog.find('.dialog-input').hide();
                break;
            case 'confirm':
                $dialog.find('.cancel').show();
                $dialog.find('.dialog-input').hide();
                break;
            case 'prompt':
                $dialog.find('.cancel').show();
                $dialog.find('.dialog-input').show();
                if (deftext) {
                    $dialog.find('.prompt').val(deftext);
                } else {
                    $dialog.find('.prompt').val('');
                }
                break;
            default:
                return;
        }
        dialogMode = mode;
        $shade.css('z-index', 200).fadeIn(0);
        $dialog.fadeIn(20);
    }

    // Hide dialog box
    function hideDialog () {
        $dialog.fadeOut(20);
        $shade.fadeOut(0);
    }

    // Display error in header bar
    function setError (severity, error) {
        if (!arguments.length) {
            $message.html("");
            setStackTrace();
        } else {
            switch (severity) {
                case "info":
                    $message.css("color", "green");
                    break;
                case "network":
                    $message.css("color", "blue");
                    break;
                case "warning":
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
        var url = codeUrl + '?' + Math.floor(Math.random()*18446744073709551557).toString(36);
        $.ajax({url: url, dataType: "text", success: resetPlatform,
            error: function () {
                setError("network", "Could not load " + codeUrl);
                }});
    }
    
    // Accept dynamically loaded code and reset UI
    function resetPlatform (code) {
        var e;
        var realCode = modalCode + code;

        // Default visibility
        $("#console").show();
        $("#canvas").show();
        $("#input").show();

        // Load code in hidden div
        $source.html(code);

        // Reset UI
        resetConsole();
        resetCanvas();
        resetInput();
        
        try {
            interpreter = new Interpreter(realCode, interpreterInit);
            interpreterRunning = true;
            setError("info", "Running");
            setImmediate(doStep);
        } catch (e) {
            setError("error", e);
        }
    }
    
    // Parse/filter code directory contents.
    // In the absence of a json API, screen scrape
    function parseCodeDir (data) {
        var files = [], $dom = $(data);
        $dom.find("a").each(function () {
            var url, name, timestamp, $a;
            //$a = $(this).find("a");
            $a = $(this);
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

    // Code for communicating across the sandbox
    var modalCode = "BMS.prompt = function (message, deftext) {\n" +
        "_showDialog('prompt', message, deftext);\n" +
        "_pause();\n" +
        "return _getDialogResult();\n" +
        "}\n" +
        "BMS.confirm = function (message) {\n" +
        "_showDialog('confirm', message);\n" +
        "_pause();\n" +
        "return _getDialogResult();\n" +
        "}\n" +
        "BMS.alert = function (message) {\n" +
        "_showDialog('alert', message);\n" +
        "_pause();\n" +
        "}\n";

    // Initialize JS Interpreter + create API
    function interpreterInit (terp, scope) {
        var BMS = terp.createObject(null);
        terp.setProperty(scope, 'BMS', BMS, true);

        // Public api
        for (var name in api) {
            terp.setProperty(BMS, name, terp.createNativeFunction(api[name]), true);
        }

        // Private functions
        var wrapper = function () {
            interpreterPaused = true;
        }
        terp.setProperty(scope, '_pause', terp.createNativeFunction(wrapper));
        wrapper = function (mode, message, deftext) {
            mode = mode.toString();
            message = message.toString();
            deftext = deftext && (deftext.type === 'undefined' ? '' : deftext.toString());
            showDialog(mode, message, deftext);
        }
        terp.setProperty(scope, '_showDialog', terp.createNativeFunction(wrapper));
        wrapper = function () {
            return terp.createPrimitive(dialogResult);
        }
        terp.setProperty(scope, '_getDialogResult', terp.createNativeFunction(wrapper));
    }

    function scheduleStep () {
        if (!futureStep) {
            futureStep = setImmediate(doStep);
        }
    }

    function doStep () {
        // TODO: Runaway loop detection
        futureStep = null;
        if (interpreterRunning) {
            interpreterPaused = false;
            if (!interpreter.step()) {
                setError('info', 'Done');
            } else if (!interpreterPaused) {
                scheduleStep();
            }
        } else {
            setError('error', 'Stopped');
        }
    }

    // External API for console/canvas/input panel. Wrapped to close interpreter reference
        api = {

            //  General

            // Show/hide UI elements
            toggleFeatures: function (features, state) {
                state = state.toBoolean();
                for (var i = 0, l = features.length.toNumber(); i < l; i++) {
                    var f = interpreter.getProperty(features, terp.createPrimitive(i)).toString();
                    switch (f) {
                        case 'console':
                            $('#console').toggle(state);
                            break;
                        case 'canvas':
                            $('#canvas').toggle(state);
                            break;
                        case 'input':
                            $('#input').toggle(state);
                            break;
                    }
                }
            },

            // Input

            // Change button labels
            setButtonLabel: function (but, label) {
                but = but.toNumber();
                label = label.toString();
                if (but === 0) {      // 0 is the submit button
                    $submit.html(label);
                } else {
                    $buttons.eq(but - 1).html(label);
                }
            },

            // Change options for select menu
            setChoices: function (choices) {
                $choice.empty();
                for (var i = 0, l = choices.length.toNumber(); i < l; i++) {
                    var c = interpreter.getProperty(choices, interpreter.createPrimitive(i)).toString();
                    $choice.append("<option>" + c + "</option>");
                }
            },

            // Get current choice
            getChoice: function () {
                return interpreter.createPrimitive($choice.find(":selected").text());
            },

            // Set callbacks << FIXME
            setFieldCallback: function (f) {
                callbacks.field = f;
            },

            setChoiceCallback: function (f) {
                callbacks.choice = f;
            },

            setButtonCallback: function (but, f) {
                callbacks.buttons[but - 1] = f;
            },

            // Console

            // print to console
            print: function () {
                var slist = [];
                for (var i = 0, l = arguments.length; i < l; i++) {
                    slist.push(arguments[i].toString());
                }
                $text.append($('<span>' + slist.join(' ') + '</span>').css('color', consoleColor));
                $text.append('\n');
            },

            // clear text from console
            clearConsole: function () {
                $text.empty()
            },

            // reset console completely, including colors
            resetConsole: function () {
                resetConsole();
            },

            consoleColor: function (color) {
                if (arguments.length == 3) {
                    consoleColor = rgbToHex(arguments[0].toNumber(), arguments[1].toNumber(), arguments[2].toNumber());
                } else {
                    consoleColor = color.toString();
                }
            },

            consoleBackground: function (color) {
                if (arguments.length == 3) {
                    color = rgbToHex(arguments[0].toNumber(), arguments[1].toNumber(), arguments[2].toNumber());
                } else {
                    color = color.toString();
                }
                $text.css("background-color", color);
            },

            // Canvas

            fillMode: function (mode) {
                fillMode = mode.toBoolean();
            },

            strokeMode: function (mode) {
                strokeMode = mode.toBoolean();
            },

            fillColor: function (color) {
                if (arguments.length == 3) {
                    color = rgbToHex(arguments[0].toNumber(), arguments[1].toNumber(), arguments[2].toNumber());
                } else {
                    color = color.toString();
                }
                context.fillStyle = color;
            },

            strokeColor: function (color) {
                if (arguments.length == 3) {
                    color = rgbToHex(arguments[0].toNumber(), arguments[1].toNumber(), arguments[2].toNumber());
                } else {
                    color = color.toString();
                }
                context.strokeStyle = color;
            },

            lineWidth: function (w) {
                context.lineWidth = w.toNumber();
            },

            background: function (color) {
                var oldFillStyle = context.fillStyle;
                if (arguments.length == 3) {
                    color = rgbToHex(arguments[0].toNumber(), arguments[1].toNumber(), arguments[2].toNumber());
                } else {
                    color = color.toString();
                }
                context.fillStyle = color;
                context.fillRect(0, 0, canvasW, canvasH);
                context.fillStyle = oldFillStyle;
            },

            rectangle: function (x, y, w, h) {
                x = x.toNumber();
                y = y.toNumber();
                w = w.toNumber();
                h = h.toNumber();
                if (fillMode) {
                    context.fillRect(x, y, w, h);
                }
                if (strokeMode) {
                    context.strokeRect(x, y, w, h);
                }
            },

            triangle: function (x1, y1, x2, y2, x3, y3) {
                x1 = x1.toNumber();
                y1 = y1.toNumber();
                x2 = x2.toNumber();
                y2 = y2.toNumber();
                x3 = x3.toNumber();
                y3 = y3.toNumber();
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
                x = x.toNumber();
                y = y.toNumber();
                hr = hr.toNumber();
                vr = vr.toNumber();
                context.save();
                context.translate(x, y);
                context.scale(1, vr / hr);
                context.beginPath();
                context.arc(0, 0, hr, 0, 2 * Math.PI, false);
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
                x1 = x1.toNumber();
                y1 = y1.toNumber();
                x2 = x2.toNumber();
                y2 = y2.toNumber();
                context.beginPath();
                context.moveTo(x1, y1);
                context.lineTo(x2, y2);
                context.stroke();
            }
    };

    // On document ready
    $(function() {
        var $select = $("#codeselect"), $showcode = $("#showcode");
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
        $shade = $("#shade");
        $dialog = $("#dialog");
        
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
               $shade.css('z-index', 100);
               $shade.fadeIn();
               $source.fadeIn();
               sourceVisible = true;
           }
        });
        
        // Bind "Reload Code" button
        $("#reloadcode").click(loadCode);

        // Bind dialog buttons
        $dialog.find('.ok').click(function () {
            if (dialogMode === 'confirm') {
                dialogResult = true;
            } else if (dialogMode === 'prompt') {
                dialogResult = $dialog.find('.prompt').val();
            } else {
                dialogResult = null;
            }
            hideDialog();
            scheduleStep();
        });

        $dialog.find('.cancel').click(function () {
            if (dialogMode === 'confirm') {
                dialogResult = false;
            } else {
                dialogResult = null;
            }
            hideDialog();
            scheduleStep();
        });
        
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
        $.ajax({url: "code/index.php", dataType: "json", success: function (data) {
            codeList = data;
            codeList.forEach(function (spec) {
                $select.append($("<option>").html(spec).val('code/' + spec));
            });
            //codeUrl = "code.js";
            codeUrl = 'code/' + codeList[0];
            loadCode();
        }});
        $select.change(function () {
            codeUrl = $select.val();
            loadCode();
        });
    });

})(jQuery);
