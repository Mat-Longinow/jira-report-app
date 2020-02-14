let slowLoad = () => {
    setTimeout(function () {
        window.location.href = '/report';
    }, 10000);
};

let popup = () => {
    let messagePicker = Math.floor(Math.random() * 3);
    let message = document.getElementById('popUpMessage');
    let messageOptions = [
        'Resurrecting Harambe, hang tight...',
        'Identifying the second shooter, one seco... *gun fires*',
        "Proving the moon landing wasn't rea... *knock at the door*"
    ];

    message.innerText = messageOptions[messagePicker];

    document.getElementById('popup').style.display = 'initial'
};

if(document.getElementById('generate_button')) {
    document.getElementById('generate_button').addEventListener("click", popup);
    document.getElementById('generate_button').addEventListener("click", slowLoad);
}
