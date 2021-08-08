module.exports = {
    generateHtml: function() {
        const list = document.getElementById("list");
        for (i = 0; i < data.size; i++) {
            list.innerHTML += "<a href=\"edit\"" + user.username + "\" class=\"list-group-item list-group-item-action\">" + user.username + "</a>";
        }
    }
}
