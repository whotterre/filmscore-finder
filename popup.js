// Ensure the title ends with " - YouTube Music"
// Use a regular expression that matches the suffix ' - YouTube Music' (case-insensitive).
// This will match titles like: "Song Name - YouTube Music"
let titleRegex = / - YouTube Music$/i;
let title = document.querySelector("title").innerText
let messages = document.querySelector("messages")
if (!titleRegex.test(title)){
    messages.innerText = "Tab has to be running YouTube Music, sowwie"
    console.log("Tab has to be running YouTube Music, sowwie")
}

