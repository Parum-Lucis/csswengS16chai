/*
    Two Ways:

    Window Prompt
    or External HTML
*/

/*
let username;

username = window.prompt("What's your usename?");

console.log(username);
*/

let username;

document.getElementById("mySubmit").onclick = function(){
    username = document.getElementById("myInput").value;
    document.getElementById("myh1").textContent = `Hello ${username}`
}