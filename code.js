strokeMode(false);

for (var i=0; i<8; i++)
    for (var j=0; j<8; j++) {
        if ((i+j) % 2)
            fillColor("red");
        else
            fillColor("black");
        rectangle(i*35, j*35, 35, 35);
    }