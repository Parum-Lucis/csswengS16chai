const myButton = document.getElementById("myDice");
const myLabel = document.getElementById("myLabel");
const myLabel2 = document.getElementById("myLabel2");
const myLabel3 = document.getElementById("myLabel3");
const min = 1;
const max = 6;
let randomNum;
let randomNum2;
let randomNum3;

myButton.onclick = function(){
    randomNum = Math.floor(Math.random() * max) + min;
    randomNum2 = Math.floor(Math.random() * max) + min;
    randomNum3 = Math.floor(Math.random() * max) + min;
    myLabel.textContent = randomNum;
    myLabel2.textContent = randomNum2;
    myLabel3.textContent = randomNum3;
}

