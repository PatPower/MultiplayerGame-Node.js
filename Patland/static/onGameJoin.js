var name = "Pat";

function show_prompt() {

    do {
        name = prompt("Please enter your name (max length 5)");
    }
    while (name.length > 5) {
        $('#myinput').val(name);
    }
}

show_prompt();
