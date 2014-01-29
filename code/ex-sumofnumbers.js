// Find the sum of the first 20 natural numbers

var total = 0;      // Running total of the numbers

// Loop through the numbers 1 to 20
for (var i=1; i<=20; i++) {
    total += i;     // Add the current number to the total
}

BMS.print("The sum of the first 20 natural numbers is " + total);

// Find the sum of the first 20 perfect squares

var sqtotal = 0;    // Another variable for another total

// Loop through the numbers 1 to 20
// Don't try to write a loop to give you the squares directly
for (var i=1; i<=20; i++) {
    sqtotal += i*i;     // i*i is the square of i
}

BMS.print("The sum of the first 20 perfect squares is " + sqtotal);
