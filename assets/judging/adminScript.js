// #region prep
const categories = {
    OST: [`Gen-OST`, `OST`],
    FullSpreadMap: [`Gen-FullSpread`, `Full Spread`],
    AlternativeMap: [`Gen-NonStandard`, `Non-Standard`],

    LightshowVanilla: [`Lightshow-Vanilla`, `Lightshow Vanilla`],
    LightshowVanillaPlus: [`Lightshow-VanillaPlus`, `Lightshow Vanilla+`],
    LightshowChroma: [`Lightshow-Chroma`, `Lightshow Chroma`],
    LightshowChromaPlus: [`Lightshow-ChromaPlus`, `Lightshow Chroma+`],
    LightshowVivify: [`Lightshow-Vivify`, `Lightshow Vivify`],

    Modchart: [`Mods-GameplayModchart`, `Gameplay Modchart`],
    //ArtMap: [`Mods-ArtMap`, `Art Map`],

    RankedMapBLLessThan8: [`Ranked-BLLessThan8`, `BL Ranked Less than 8*`],
    RankedMapBL8To12: [`Ranked-BL8To12`, `BL Ranked 8* to 12*`],
    RankedMapBL12Plus: [`Ranked-BL12Plus`, `BL Ranked 12* and above`],
    RankedMapSSLessThan8: [`Ranked-SSLessThan8`, `SS Ranked Less than 8*`],
    RankedMapSS8To12: [`Ranked-SS8To12`, `SS Ranked 8* to 12*`],
    RankedMapSS12Plus: [`Ranked-SS12Plus`, `SS Ranked 12* and above`],

    BalancedMap: [`Style-Balanced`, `Balanced`],
    LowTechMap: [`Style-LowTech`, `Low Tech`],
    HighTechMap: [`Style-HighTech`, `High Tech`],
    SpeedMap: [`Style-Speed`, `Speed`],
    DanceMap: [`Style-Dance`, `Dance`],
    FitnessMap: [`Style-Fitness`, `Fitness`],
    ChallengeMap: [`Style-Challenge`, `Challenge`],
    AccMap: [`Style-Acc`, `Acc`],
    PoodleMap: [`Style-Poodle`, `Poodle`],
    WildcardMap: [`Style-Wildcard`, `Wildcard`],

    MapOfTheYear: [`OTY-Map`, `Map of the Year`],
    ModdedMapOfTheYear: [`OTY-ModdedMap`, `Modded Map of the Year`],
    MapperOfTheYear: [`OTY-Mapper`, `Mapper of the Year`],
    LighterOfTheYear: [`OTY-Lighter`, `Lighter of the Year`],
    RookieMapperOfTheYear: [`OTY-RookieMapper`, `Rookie Mapper of the Year`],
    RookieLighterOfTheYear: [`OTY-RookieLighter`, `Rookie Lighter of the Year`],
    PackOfTheYear: [`OTY-Pack`, `Pack of the Year`],
};

let categorySelect = document.getElementById(`category1`);
let categorySelect2 = document.getElementById(`category2`);
let categorySelect3 = document.getElementById(`category3`);
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

    let option3 = document.createElement(`option`);
    option3.classList.add(`categoryOption`);
    option3.value = categories[key][0];
    option3.innerText = categories[key][1];
    categorySelect3.appendChild(option3);
}
// #endregion

// #region oneshot
document.getElementById(`updateNullValues`).addEventListener(`click`, () => {
    fetch(`/api/admin/updateNullValues`, { method: `POST` }).then(response => {
        response.json().then(data => {
            alert(data.message);
        });
    });
});

document.getElementById(`runInvolvedCheck`).addEventListener(`click`, () => {
    fetch(`/api/admin/runInvolvedCheck`, { method: `POST` }).then(response => {
        response.json().then(data => {
            alert(data.message);
        });
    });
});

document.getElementById(`checkDuplicateVotes`).addEventListener(`click`, () => {
    fetch(`/api/admin/checkDuplicateVotes`, { method: `GET` }).then(response => {
        response.json().then(data => {
            alert(data.message);
        });
    });
});

document.getElementById(`repopulateSortedSubmissions`).addEventListener(`click`, () => {
    let category = document.getElementById(`category1`).value;
    fetch(`/api/admin/repopulateSortedSubmissions`, { method: `POST`, headers: { 'Content-Type': `application/json` }, body: JSON.stringify({ category: category }) }).then(response => {
        response.json().then(data => {
            alert(data.message);
        });
    });
});

document.getElementById(`cutSubmissions`).addEventListener(`click`, () => {
    let category = document.getElementById(`category1`).value;
    let amount = parseInt(document.getElementById(`amount`).value);
    let noThreshold = parseInt(document.getElementById(`noThreshold`).value);
    let fakeRun = document.getElementById(`fakeRun`).checked;

    if (isNaN(amount) && isNaN(noThreshold)) {
        alert(`Please enter a valid amount or noThreshold value.`);
        return;
    }

    fetch(`/api/admin/cutSubmissions`, { method: `DELETE`, headers: { 'Content-Type': `application/json` }, body: JSON.stringify({
        category: category,
        amount: isNaN(amount) ? null : amount,
        noThreshold: isNaN(noThreshold) ? null : noThreshold,
        fakeRun: fakeRun
    }) }).then(response => {
        response.json().then(data => {
            alert(data.message);
        });
    });
});

document.getElementById(`resetCategoryVotes`).addEventListener(`click`, () => {
    let category = document.getElementById(`category1`).value;
    let userIdToRun = parseInt(document.getElementById(`userIdToRun`).value);
    fetch(`/api/admin/resetVotes`, { method: `DELETE`, headers: { 'Content-Type': `application/json` }, body: JSON.stringify({
        category: category,
        userIdToRun: isNaN(userIdToRun) ? null : userIdToRun
    }) }).then(response => {
        response.json().then(data => {
            alert(data.message);
        });
    });
});

document.getElementById(`getFinalVotes`).addEventListener(`click`, () => {
    let category = document.getElementById(`category1`).value;
    let runTotal = document.getElementById(`total`).checked;
    let runAdjusted = document.getElementById(`adjusted`).checked;
    let buttonElement = document.getElementById(`getFinalVotes`);
    buttonElement.disabled = true;
    let counter = 0;
    let interval = setInterval(() => {
        counter++;
        buttonElement.innerText = `Getting final votes${`.`.repeat(counter % 4)}`;
    }, 500);
    fetch(`/api/admin/getFinalVotes?category=${encodeURIComponent(category)}&total=${encodeURIComponent(runTotal)}&adjusted=${encodeURIComponent(runAdjusted)}`).then(response => {
        if (response.status !== 200) {
            alert(response.statusText);
            return;
        }

        response.blob().then(blob => {
            let url = window.URL.createObjectURL(blob);
            let a = document.createElement(`a`);
            a.href = url;
            a.download = `finalVotes_${category}.json`;
            a.click();
            window.URL.revokeObjectURL(url);

            clearInterval(interval);
            buttonElement.disabled = false;
            buttonElement.innerText = `Get Final Votes`;
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

document.getElementById(`deleteSubmission`).addEventListener(`click`, () => {
    let id = document.getElementById(`submissionId`).value;
    fetch(`/api/admin/database/data/submissions/${encodeURIComponent(id)}`, {
        method: `DELETE`
    }).then(response => {
        response.json().then(data => {
            if (response.status !== 200) {
                alert(data.message);
                return;
            }
            loadTable(data);
        });
    });
});

document.getElementById(`deleteSortedSubmission`).addEventListener(`click`, () => {
    let id = document.getElementById(`sortedSubmissionId`).value;
    fetch(`/api/admin/database/data/sortedSubmissions/${encodeURIComponent(id)}`, {
        method: `DELETE`
    }).then(response => {
        response.json().then(data => {
            if (response.status !== 200) {
                alert(data.message);
                return;
            }
            loadTable(data);
        });
    });
});

document.getElementById(`loadSubmissionBsr`).addEventListener(`click`, () => {
    let searchValue = document.getElementById(`submissionBsr`).value;
    fetch(`/api/admin/database/data/submissions?bsr=${encodeURIComponent(searchValue)}`).then(response => {
        response.json().then(data => {
            if (response.status !== 200) {
                alert(data.message);
                return;
            }
            loadTable(data);
        });
    });
});

document.getElementById(`loadSortedSubmissionBsr`).addEventListener(`click`, () => {
    let searchValue = document.getElementById(`sortedSubmissionBsr`).value;
    fetch(`/api/admin/database/data/sortedSubmissions?bsr=${encodeURIComponent(searchValue)}`).then(response => {
        response.json().then(data => {
            if (response.status !== 200) {
                alert(data.message);
                return;
            }
            loadTable(data);
        });
    });
});

document.getElementById(`recategorizeSortedSubmission`).addEventListener(`click`, () => {
    let id = document.getElementById(`sortedSubmissionId`).value;
    let newCategory = document.getElementById(`category3`).value;
    fetch(`/api/admin/database/recategorizeSortedSubmission`, {
        method: `POST`,
        headers: { 'Content-Type': `application/json` },
        body: JSON.stringify({ sortedSubmissionId: id, toCategory: newCategory })
    }).then(response => {
        console.log(response);
        response.json().then(data => {
            alert(data.message);
        });
    });
});
document.getElementById(`bulkRecategorizeSortedSubmission`).addEventListener(`click`, () => {
    let idStr = document.getElementById(`sortedSubmissionIdArray`).value;
    let idArr = idStr.split(`,`).map(x => x.trim()).filter(x => x.length > 0).map(x => parseInt(x));
    if (idArr.some(isNaN)) {
        alert(`Please enter a valid list of sorted submission IDs.`);
        return;
    }
    let newCategory = document.getElementById(`category3`).value;
    fetch(`/api/admin/bulkChangeCategory`, {
        method: `POST`,
        headers: { 'Content-Type': `application/json` },
        body: JSON.stringify({ sortedSubmissionIds: idArr, toCategory: newCategory })
    }).then(response => {
        console.log(response);
        response.json().then(data => {
            alert(data.message);
        });
    });
});

// #endregion

// #region updateJudge
document.getElementById(`addCategory`).addEventListener(`click`, () => {
    let id = document.getElementById(`judgeId`).value;
    let category = document.getElementById(`category2`).value;
    fetch(`/api/admin/judges/${encodeURIComponent(id)}/addCategory`, { method: `POST`, headers: { 'Content-Type': `application/json` }, body: JSON.stringify({ category: category }) }).then(response => {
        response.json().then(data => {
            alert(data.message);
        });
    });
});

document.getElementById(`removeCategory`).addEventListener(`click`, () => {
    let id = document.getElementById(`judgeId`).value;
    let category = document.getElementById(`category2`).value;
    fetch(`/api/admin/judges/${encodeURIComponent(id)}/removeCategory`, { method: `POST`, headers: { 'Content-Type': `application/json` }, body: JSON.stringify({ category: category }) }).then(response => {
        response.json().then(data => {
            alert(data.message);
        });
    });
});

document.getElementById(`addSortingRole`).addEventListener(`click`, () => {
    let id = document.getElementById(`judgeId`).value;
    fetch(`/api/admin/judges/${encodeURIComponent(id)}/addRole`, { method: `POST`, headers: { 'Content-Type': `application/json` }, body: JSON.stringify({ role: `sort` }) }).then(response => {
        response.json().then(data => {
            alert(data.message);
        });
    });
});

document.getElementById(`removeSortingRole`).addEventListener(`click`, () => {
    let id = document.getElementById(`judgeId`).value;
    fetch(`/api/admin/judges/${encodeURIComponent(id)}/removeRole`, { method: `POST`, headers: { 'Content-Type': `application/json` }, body: JSON.stringify({ role: `sort` }) }).then(response => {
        response.json().then(data => {
            alert(data.message);
        });
    });
});

document.getElementById(`addJudgeRole`).addEventListener(`click`, () => {
    let id = document.getElementById(`judgeId`).value;
    fetch(`/api/admin/judges/${encodeURIComponent(id)}/addRole`, { method: `POST`, headers: { 'Content-Type': `application/json` }, body: JSON.stringify({ role: `judge` }) }).then(response => {
        response.json().then(data => {
            alert(data.message);
        });
    });
});

document.getElementById(`removeJudgeRole`).addEventListener(`click`, () => {
    let id = document.getElementById(`judgeId`).value;
    fetch(`/api/admin/judges/${encodeURIComponent(id)}/removeRole`, { method: `POST`, headers: { 'Content-Type': `application/json` }, body: JSON.stringify({ role: `judge` }) }).then(response => {
        response.json().then(data => {
            alert(data.message);
        });
    });
});
// #endregion