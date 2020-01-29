let slowLoad = () => {
    setTimeout(function () {
        window.location.href = '/report';
    }, 10000);
};

let popup = () => {
    document.getElementById('popup').style.display = 'initial'
};

if(document.getElementById('generate_button')) {
    document.getElementById('generate_button').addEventListener("click", popup);
    document.getElementById('generate_button').addEventListener("click", slowLoad);
}
