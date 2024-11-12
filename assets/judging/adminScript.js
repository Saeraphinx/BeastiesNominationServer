// #region prep
const categories = {
    OST: [`Gen-OST`, `OST`],
    FullSpreadMap: [`Gen-FullSpread`, `Full Spread`],
    AlternativeMap: [`Gen-Alternative`, `Non-Standard`],

    LightshowVanilla: [`Lightshow-Vanilla`, `Lightshow Vanilla`],
    LightshowVanillaPlus: [`Lightshow-VanillaPlus`, `Lightshow Vanilla+`],
    LightshowChroma: [`Lightshow-Chroma`, `Lightshow Chroma`],
    LightshowChromaPlus: [`Lightshow-ChromaPlus`, `Lightshow Chroma+`],

    Modchart: [`Mods-Modchart`, `Modchart`],
    ArtMap: [`Mods-ArtMap`, `Art Map`],

    RankedMapLower: [`Ranked-RankedMapLower`, `Ranked-RankedMapLower`],
    RankedMapHigher: [`Ranked-RankedMapHigher`, `Ranked-RankedMapHigher`],

    BalancedMap: [`Style-Balanced`, `Balanced`],
    TechMap: [`Style-Tech`, `Tech`],
    SpeedMap: [`Style-Speed`, `Speed`],
    DanceMap: [`Style-Dance`, `Dance`],
    FitnessMap: [`Style-Fitness`, `Fitness`],
    ChallengeMap: [`Style-Challenge`, `Challenge`],
    AccMap: [`Style-Acc`, `Acc`],
    PoodleMap: [`Style-Poodle`, `Poodle`],
    GimmickMap: [`Style-Gimmick`, `Gimmick`],

    MapOfTheYear: [`OTY-Map`, `Map of the Year`],
    MapperOfTheYear: [`OTY-Mapper`, `Mapper of the Year`],
    LighterOfTheYear: [`OTY-Lighter`, `Lighter of the Year`],
    RookieMapperOfTheYear: [`OTY-RookieMapper`, `Rookie Mapper of the Year`],
    RookieLighterOfTheYear: [`OTY-RookieLighter`, `Rookie Lighter of the Year`],
    PackOfTheYear: [`OTY-Pack`, `Pack of the Year`],
};

let categorySelect = document.getElementById(`category1`);
let categorySelect2 = document.getElementById(`category2`);
for (let key in categories) {
    let option = document.createElement(`option`);
    option.classList.add(`categoryOption`);
    option.value = categories[key][0];
    option.innerText = `${categories[key][1]} (${categories[key][0]})`;
    categorySelect.appendChild(option);

    let option2 = document.createElement(`option`);
    option2.classList.add(`categoryOption`);
    option2.value = categories[key][0];
    option2.innerText = categories[key][1];
    categorySelect2.appendChild(option2);
}
// #endregion

// #region oneshot
document.getElementById(`updateNullValues`).addEventListener(`click`, () => {
    fetch(`/api/admin/updateNullValues`).then(response => {
        response.json().then(data => {
            alert(data.message);
        });
    });
});

document.getElementById(`runInvolvedCheck`).addEventListener(`click`, () => {
    fetch(`/api/admin/runInvolvedCheck`).then(response => {
        response.json().then(data => {
            alert(data.message);
        });
    });
});

document.getElementById(`repopulateSortedSubmissions`).addEventListener(`click`, () => {
    let category = document.getElementById(`category1`).value;
    fetch(`/api/admin/repopulateSortedSubmissions?category=${encodeURIComponent(category)}`).then(response => {
        response.json().then(data => {
            alert(data.message);
        });
    });
});
// #endregion

// #region database
function loadTable(data) {
    let table = document.getElementById(`activeTable`);
    table.innerHTML = ``;
    let tableHeaders = document.createElement(`tr`);
    if (Array.isArray(data)) {
        Object.keys(data[0]).forEach(key => {
            let header = document.createElement(`th`);
            header.innerText = key;
            tableHeaders.appendChild(header);
        });
        table.appendChild(tableHeaders);
        
        for (let obj of data) {
            let tableBody = document.createElement(`tr`);
            Object.keys(obj).forEach(key => {
                let header = document.createElement(`th`);
                header.innerText = key;
                tableHeaders.appendChild(header);
            });

            Object.values(obj).forEach(value => {
                let cell = document.createElement(`td`);
                cell.innerText = value;
                tableBody.appendChild(cell);
            });

            table.appendChild(tableBody);
        }
    } else {
        let tableBody = document.createElement(`tr`);
        Object.keys(data).forEach(key => {
            let header = document.createElement(`th`);
            header.innerText = key;
            tableHeaders.appendChild(header);
        });

        Object.values(data).forEach(value => {
            let cell = document.createElement(`td`);
            cell.innerText = value;
            tableBody.appendChild(cell);
        });

        table.appendChild(tableHeaders);
        table.appendChild(tableBody);
    }
}

document.getElementById(`loadSubmission`).addEventListener(`click`, () => {
    let id = document.getElementById(`submissionId`).value;
    fetch(`/api/admin/database/data/submissions/${encodeURIComponent(id)}`).then(response => {
        response.json().then(data => {
            if (response.status !== 200) {
                alert(data.message);
                return;
            }
            loadTable(data);
        });
    });
});

document.getElementById(`loadSortedSubmission`).addEventListener(`click`, () => {
    let id = document.getElementById(`sortedSubmissionId`).value;
    fetch(`/api/admin/database/data/sortedSubmissions/${encodeURIComponent(id)}`).then(response => {
        response.json().then(data => {
            if (response.status !== 200) {
                alert(data.message);
                return;
            }
            loadTable(data);
        });
    });
});

document.getElementById(`loadJudge`).addEventListener(`click`, () => {
    let id = document.getElementById(`judgeId`).value;
    fetch(`/api/admin/database/data/judges/${encodeURIComponent(id)}`).then(response => {
        response.json().then(data => {
            if (response.status !== 200) {
                alert(data.message);
                return;
            }
            loadTable(data);
        });
    });
});
// #endregion

// #region updateJudge
document.getElementById(`addCategory`).addEventListener(`click`, () => {
    let id = document.getElementById(`judgeId`).value;
    let category = document.getElementById(`category2`).value;
    fetch(`/api/admin/judges/addCategory?id=${encodeURIComponent(id)}&category=${encodeURIComponent(category)}`).then(response => {
        response.json().then(data => {
            alert(data.message);
        });
    });
});

document.getElementById(`removeCategory`).addEventListener(`click`, () => {
    let id = document.getElementById(`judgeId`).value;
    let category = document.getElementById(`category2`).value;
    fetch(`/api/admin/judges/removeCategory?id=${encodeURIComponent(id)}&category=${encodeURIComponent(category)}`).then(response => {
        response.json().then(data => {
            alert(data.message);
        });
    });
});