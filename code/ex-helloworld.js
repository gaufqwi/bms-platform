// Hello world
BMS.print("Hello, world!");

// Space
BMS.background("black");

// Stars
BMS.fillColor("yellow");
for (var i=0; i<40; i++) {
    // Math.random() returns a number between 0 and 1
    // Multiplying it by 400 gives a n umber between 0 and 400 
    BMS.circle(400*Math.random(), 400*Math.random(), 1);
}

// Earth
BMS.fillColor("blue");
BMS.strokeColor("gray");
BMS.circle(200, 200, 150);

// For land
BMS.strokeMode(false);
BMS.fillColor("green");

// N. + S. America
BMS.rectangle(60, 160, 100, 80);
BMS.rectangle(152, 240, 10, 15);
BMS.rectangle(154, 255, 10, 15);
BMS.rectangle(155, 155, 10, 10);
BMS.rectangle(160, 150, 10, 10);
BMS.triangle(60, 240, 90, 240, 105, 310);
BMS.rectangle(75, 125, 60, 35);

// Europe
BMS.rectangle(225, 120, 7, 15);
BMS.rectangle(240, 120, 80, 30);
BMS.rectangle(225, 145, 20, 20);
BMS.rectangle(280, 150, 8, 12);

// Africa
BMS.rectangle(240, 170, 80, 50);
BMS.rectangle(280, 220, 40, 55);

// For ice
BMS.fillColor("white");

// Artic
BMS.rectangle(180, 55, 40, 10);
BMS.rectangle(170, 60, 60, 10);

// antrtic
BMS.rectangle(180, 335, 40, 10);
BMS.rectangle(170, 330, 60, 10);
