function toogle() {
    
    var i = document.getElementById("senha");
    if (i.type == "password") {
        i.type = "text";
    }
    else {
        i.type = "password";
    }
}