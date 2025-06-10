// variables are dynamically typed

let x = 255;
let sentence = "xdddd"
let online = true
let arrayofthing = [1, 2, 3];

console.log(typeof x);
console.log(x);

console.log(typeof sentence)
console.log(`Your gay ${sentence}`)

console.log(typeof online);
console.log(`I'm online: ${online}`)

document.getElementById("p1").textContent = x;
document.getElementById("p2").textContent = sentence;
document.getElementById("p3").textContent = arrayofthing[0];

let money = 30000;
money = 30000 ** 2;

console.log(money);