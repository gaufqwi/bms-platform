function say(x) {
    $("#text").val(x);
}

$(function () {
   var script=document.createElement('script');
    script.type='text/javascript';
    script.src="code.js";

    $("body").append(script);
});
    