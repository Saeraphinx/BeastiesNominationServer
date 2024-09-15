/*
<select id="background" class="background" onchange="changeBackground()">
            <option value="default">Default</option>
            <option value="dark">Dark</option>
            <option value="darkest">Darkest</option>
        </select>
        */
let select = document.createElement(`select`);
select.id = `background`;
select.className = `background`;
select.onchange = changeBackground;
let options = [[`Default Theme`, `default`], [`Dark`, `dark`], [`Darkest`, `darkest`], [`Forest`, `/cdn/Forest.png`], [`Lily's Outlook`, `/cdn/Lily.png`], [`Madeline and Theo`, `/cdn/MadelineAndTheo.png`], [`XI's Shadow`, `/cdn/XI.png`]];

for (let i = 0; i < options.length; i++) {
    let option = document.createElement(`option`);
    option.value = options[i][1];
    option.innerText = options[i][0];
    select.appendChild(option);
}

let bg = document.createElement(`div`);
bg.classList.add(`bg`);
document.getElementsByTagName(`nav`)[0].appendChild(select);

let currentBackground = localStorage.getItem(`backgroundSetting`);
if (currentBackground) {
    document.getElementById(`background`).value = currentBackground;
    changeBackground();
}
function changeBackground() {
    let background = document.getElementById(`background`).value;
    localStorage.setItem(`backgroundSetting`, background);

    tryRemoveBackground();
    if (background == `dark`) {
        document.body.style.background = `linear-gradient(127deg, #540348, #1e0468, #3e1c63, #34095a, #550350)`;
        document.body.style.backgroundSize = `1000% 1000%`;
    } else if (background == `darkest`) {
        document.body.style.background = `black`;
    } else if (background == `default`) {
        document.body.style.background = null;
    } else {
        document.body.style.background = `black`;
        bg.style.backgroundImage = `url(${background})`;
        document.body.appendChild(bg);
    }
}

function tryRemoveBackground() {
    try {
        document.body.removeChild(bg);
    } catch (e) {
        console.log(`No background to remove`);
    }
}