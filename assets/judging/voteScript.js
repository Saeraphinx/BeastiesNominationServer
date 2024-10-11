/* eslint-disable @typescript-eslint/no-unused-vars */
let activePage = 1;
let cache = [];
let username = ``;
const global_category = document.querySelector(`meta[name="category-prog-name"]`).getAttribute(`content`);
//#region onload
fetch(`/api/auth/judging`).then(response => {
    if (response.status == 200) {
        response.json().then(data => {
            if (data.username) {
                document.getElementById(`username`).innerText = `Logout (${data.username})`;
                username = data.username;
            }
        });
    } else {
        window.location.href = `/judging`;
    }
});

//#endregion
function loadSubmissions(page = activePage) {
    activePage = page;
    fetch(`/api/judge/getSubmissions?page=${page}&pageSize=10&category=${global_category}`).then(response => response.json()).then(res => {
        const submissionData = res.submissiondata; //this should be capitalized :(
        const voteData = res.voteData;
        document.getElementById(`submissionList`).innerHTML = ``;
        for (let i = 0; i < submissionData.length; i++) {
            let voteCurrent = voteData.find(vote => vote?.submissionId === submissionData[i].id);
            loadSubmission(submissionData[i].id, submissionData[i].bsrId, submissionData[i].name, submissionData[i].category, submissionData[i].difficulty, submissionData[i].characteristic, submissionData[i].category.includes(`Mods`), submissionData[i].category.includes(`Ranked`), submissionData[i].category.includes(`FullSpread`), voteCurrent ? voteCurrent.score : -1, voteCurrent ? voteCurrent.notes : ``);
        }
        let pageDiv = document.getElementById(`pages`);
        pageDiv.innerHTML = ``;
        for (let i = 0; i < res.totalPages; i++) {
            let button = document.createElement(`button`);
            button.innerText = i + 1;
            button.onclick = (e) => {
                loadSubmissions(i + 1);
            }
            if (i + 1 === page) {
                button.classList.add(`active`);
            }
            pageDiv.appendChild(button);
        }
    });
}
loadSubmissions(1);
//loadSubmission(`1`, null, `https://beatsaver.com/profile/4234633`, `OTY-Mapper`, null, null, false, false, false);
//loadSubmission(`2`, `d00c`, null, `Mods-Modchart`, `ExpertPlus`, `Standard`, true, false, false);
//#region beatmaps
function loadSubmission(submissionId, bsrId, name, category, selectedDiff, selectedChar, showMods, showRanked, validFullSpread, voteScore = -1, notes = null) {
    if (bsrId == null || bsrId.length < 3) {
        if ((category.includes(`Mapper`) || category.includes(`Lighter`))) {
            let nonEmbedElement = document.getElementById(`submissionList`).appendChild(createName(submissionId, name, null, name, null, category, voteScore, notes));
            let id = name;
            fetch(`https://api.beatsaver.com/users/id/${id}`).then(response => response.json()).then(data => {
                nonEmbedElement.remove();
                document.getElementById(`submissionList`).appendChild(createName(submissionId, data.name, data.stats.firstUpload, name, data.avatar, category, voteScore, notes));
            });
            return;
        } else if (category.includes(`Pack`)) {
            let nonEmbedElement = document.getElementById(`submissionList`).appendChild(createName(submissionId, name, null, name, null, category, voteScore, notes));
            let id = name;
            fetch(`/api/beatsaver/playlist/${id}`).then(response => response.json()).then(data => {
                let pData = data.playlist;
                nonEmbedElement.remove();
                document.getElementById(`submissionList`).appendChild(createName(submissionId, pData.name, pData.songsChangedAt, name, pData.playlistImage, category, voteScore, notes));
            });
            return;
        }
        document.getElementById(`submissionList`).appendChild(createName(submissionId, name, null, name, null, category));
        return; //temp fix for invalid bsr keys
    }
    if (cache.find(beatmap => beatmap.id === bsrId)) {
        document.getElementById(`submissionList`).appendChild(
            createBeatmap(submissionId, cache.find(beatmap => beatmap.id === bsrId), category, selectedDiff, selectedChar, showMods, showRanked, validFullSpread, voteScore, notes)
        );
        return;
    }
    fetch(`https://api.beatsaver.com/maps/id/` + bsrId).then(response => response.json()).then(data => {
        //console.log(data);
        cache.push(data);
        document.getElementById(`submissionList`).appendChild(
            createBeatmap(submissionId, data, category, selectedDiff, selectedChar, showMods, showRanked, validFullSpread, voteScore, notes)
        );
    });
}

// TODO:
// Add Diff & Char + Add Category
function createBeatmap(nomId, bsapi, category = `you fucked up`, selectedDiff = `ExpertPlus`, selectedChar = `Standard`, showMods = false, showRanked = false, validFullSpread = false, voteScore = -1, notes = ``) {
    let currDiff = bsapi.versions[0].diffs.find(diff => diff.difficulty === selectedDiff && diff.characteristic === selectedChar);

    let beatmap = document.createElement(`div`);
    beatmap.classList.add(`beatmap`);

    //diff & char
    let diffColors = document.createElement(`div`);
    diffColors.classList.add(`beatmaps`);
    diffColors.classList.add(`difficulties`);
    if (!validFullSpread) {
        let bnsStuff = convertToBNS(selectedChar, selectedDiff);
        let diff = document.createElement(`div`);
        diff.classList.add(`beatmaps`);
        diff.classList.add(`difficulty`);
        diff.style.backgroundColor = `#` + bnsStuff.color;
        let img = document.createElement(`img`);
        img.src = `/cdn/char/` + bnsStuff.charecteristic + `.svg`;
        img.alt = selectedChar + ` ` + selectedDiff;
        img.width = `20`;
        img.height = `20`;
        img.style = `padding-left: 4px;`;
        img.title = selectedChar + ` ` + selectedDiff;
        diff.appendChild(img);
        diffColors.appendChild(diff);
    }
    let catText = document.createElement(`p`);
    catText.classList.add(`category`);
    catText.innerText = `${selectedChar} ${selectedDiff}`;
    diffColors.appendChild(catText);
    beatmap.appendChild(diffColors);

    //title
    let title = document.createElement(`p`);
    title.classList.add(`title`);
    let aTitle = document.createElement(`a`);
    aTitle.classList.add(`title`);
    aTitle.href = `https://beatsaver.com/maps/${bsapi.id}`;
    aTitle.target = `_blank`;
    aTitle.innerText = `${bsapi.metadata.songName}${bsapi.metadata.songSubName ? ` ${bsapi.metadata.songSubName}` : ``} by ${bsapi.metadata.songAuthorName}`;
    title.title = aTitle.innerText;
    aTitle.title = aTitle.innerText;
    if (aTitle.innerText.length > 18) {
        aTitle.innerText = aTitle.innerText.substring(0, 15) + `...`;
    }
    title.appendChild(aTitle);
    beatmap.appendChild(title);

    //subtext
    let subtext = document.createElement(`p`);
    subtext.classList.add(`subtext`);
    subtext.innerText = `!bsr ${bsapi.id}`;
    beatmap.appendChild(subtext);
    if (showMods) {
        subtext.innerText += ` | NE: ${currDiff.ne} | Chroma: ${currDiff.chroma}`;
    } else if (showRanked) {
        subtext.innerText += ` | SS: ${currDiff.stars || `N/A`}★ | BL: ${currDiff.blStars || `N/A`}★`;
    } else if (validFullSpread) {
        if (bsapi.versions[0].diffs.find(diff => diff.difficulty === `Easy`) && bsapi.versions[0].diffs.find(diff => diff.difficulty === `Normal`) && bsapi.versions[0].diffs.find(diff => diff.difficulty === `Hard`) && bsapi.versions[0].diffs.find(diff => diff.difficulty === `Expert`) && bsapi.versions[0].diffs.find(diff => diff.difficulty === `ExpertPlus`)) {
            subtext.innerText += ` | Full Spread`;
        } else {
            subtext.innerText += ` | Missing Difficulties`;
        }
    }

    //cover
    let cover = document.createElement(`div`);
    let coverImg = document.createElement(`img`);
    coverImg.src = bsapi.versions[0].coverURL;
    coverImg.width = 128;
    coverImg.height = 128;
    cover.appendChild(coverImg);
    beatmap.appendChild(cover);

    //mappers
    let mapperText = document.createElement(`p`);
    mapperText.innerText = `Mapper(s):`;
    mapperText.classList.add(`mapperText`);
    beatmap.appendChild(mapperText);
    let mappers = document.createElement(`div`);
    mappers.classList.add(`mappers`);
    mappers.appendChild(generateMapperBlurb(bsapi.uploader));
    if (bsapi.collaborators) {
        for (let i = 0; i < bsapi.collaborators.length; i++) {
            mappers.appendChild(generateMapperBlurb(bsapi.collaborators[i]));
        }
    }
    beatmap.appendChild(mappers);

    //buttons
    let buttons = document.createElement(`div`);
    buttons.classList.add(`actions`);
    let rejectButton = document.createElement(`button`);
    rejectButton.innerText = `No`;
    let involvedButton = document.createElement(`button`);
    involvedButton.innerText = `Involved`;
    let approveButton = document.createElement(`button`);
    approveButton.innerText = `Yes`;
    voteScore == 1 || voteScore == -1 ? approveButton.classList.add(`green-glow`) : null;
    voteScore == 0.5 || voteScore == -1 ? involvedButton.classList.add(`yellow-glow`) : null;
    voteScore == 0 || voteScore == -1 ? rejectButton.classList.add(`red-glow`) : null;
    let noteTextArea = document.createElement(`textarea`); //pretend this bit is lower
    noteTextArea.placeholder = `Notes`;
    noteTextArea.classList.add(`notes`);
    noteTextArea.value = notes ? notes : ``;
    rejectButton.onclick = (e) => {
        sendVote(nomId, 0, noteTextArea.value);
    };
    approveButton.onclick = (e) => {
        sendVote(nomId, 1, noteTextArea.value);
    };
    involvedButton.onclick = (e) => {
        sendVote(nomId, 0.5, noteTextArea.value);
    };

    switch (voteScore) {
        case 0:
            beatmap.classList.add(`red-glow-big`);
            username == `undeceiver` ? rejectButton.style.backgroundColor = `#f00` : null;
            username == `undeceiver` ? rejectButton.style.color = `#000` : null;
            break;
        case 0.5:
            beatmap.classList.add(`yellow-glow-big`);
            username == `undeceiver` ? involvedButton.style.backgroundColor = `#fF0` : null;
            username == `undeceiver` ? involvedButton.style.color = `#000` : null;
            break;
        case 1:
            beatmap.classList.add(`green-glow-big`);
            username == `undeceiver` ? approveButton.style.backgroundColor = `#0F0` : null;
            username == `undeceiver` ? approveButton.style.color = `#000` : null;
            break;
        default:
            break;
    }
    buttons.appendChild(rejectButton);
    buttons.appendChild(involvedButton);
    buttons.appendChild(approveButton);
    beatmap.appendChild(buttons);

    // buttons
    let buttonContainer = document.createElement(`div`);
    buttonContainer.classList.add(`buttonContainer`);
    let infoButton = document.createElement(`a`);
    infoButton.innerText = `🛈`;
    infoButton.onclick = (e) => openDescModal(e, `${bsapi.metadata.songAuthorName} - ${bsapi.metadata.songName}${bsapi.metadata.songSubName ? ` ${bsapi.metadata.songSubName}` : ``}`, bsapi.description);
    buttonContainer.appendChild(infoButton);
    let viewButton = document.createElement(`a`);
    viewButton.innerText = `▶`;
    viewButton.onclick = (e) => openArcViewer(e, bsapi.id);
    viewButton.href = `https://allpoland.github.io/ArcViewer/?id=${bsapi.id}`;
    viewButton.target = `_top`;
    buttonContainer.appendChild(viewButton);
    let oneclickButton = document.createElement(`a`);
    oneclickButton.innerText = `☁`;
    oneclickButton.href = `beatsaver://${bsapi.id}`;
    buttonContainer.appendChild(oneclickButton);
    let downloadButton = document.createElement(`a`);
    downloadButton.innerText = `⬇`;
    downloadButton.href = bsapi.versions[0].downloadURL;
    downloadButton.target = `_blank`;
    buttonContainer.appendChild(downloadButton);
    beatmap.appendChild(buttonContainer);

    beatmap.appendChild(noteTextArea);

    return beatmap;
}

function createName(nomId, titleText, subtextText, rawnameText, imageUrl, category = `you fucked up`, voteScore = -1, notes = ``) {
    let beatmap = document.createElement(`div`);
    beatmap.classList.add(`beatmap`);

    //let catText = document.createElement(`p`);
    //catText.classList.add(`category`);
    //catText.innerText = category;
    //beatmap.appendChild(catText);

    //title
    let title = document.createElement(`p`);
    title.classList.add(`title`);
    let aTitle = document.createElement(`a`);
    aTitle.classList.add(`title`);
    aTitle.href = category.includes(`Pack`) ? `https://beatsaver.com/playlists/${rawnameText}` : `https://beatsaver.com/profile/${rawnameText}`;
    aTitle.target = `_blank`;
    aTitle.innerText = titleText;
    title.title = aTitle.innerText;
    aTitle.title = aTitle.innerText;
    if (aTitle.innerText.length > 18) {
        aTitle.innerText = aTitle.innerText.substring(0, 15) + `...`;
    }
    title.appendChild(aTitle);
    beatmap.appendChild(title);

    //subtext
    let subtext = document.createElement(`p`);
    subtext.classList.add(`subtext`);
    subtext.innerText = `${subtextText || rawnameText}`;
    beatmap.appendChild(subtext);

    //cover
    if (imageUrl) {
        let cover = document.createElement(`div`);
        let coverImg = document.createElement(`img`);
        coverImg.src = imageUrl;
        coverImg.width = 128;
        coverImg.height = 128;
        cover.appendChild(coverImg);
        beatmap.appendChild(cover);
    }

    //buttons
    let buttons = document.createElement(`div`);
    buttons.classList.add(`actions`);
    let rejectButton = document.createElement(`button`);
    rejectButton.innerText = `No`;
    let involvedButton = document.createElement(`button`);
    involvedButton.innerText = `Involved`;
    let approveButton = document.createElement(`button`);
    approveButton.innerText = `Yes`;
    voteScore == 1 || voteScore == -1 ? approveButton.classList.add(`green-glow`) : null;
    voteScore == 0.5 || voteScore == -1 ? involvedButton.classList.add(`yellow-glow`) : null;
    voteScore == 0 || voteScore == -1 ? rejectButton.classList.add(`red-glow`) : null;
    let noteTextArea = document.createElement(`textarea`); //pretend this bit is lower
    noteTextArea.placeholder = `Notes`;
    noteTextArea.classList.add(`notes`);
    noteTextArea.value = notes ? notes : ``;
    rejectButton.onclick = (e) => {
        sendVote(nomId, 0, noteTextArea.value);
    };
    approveButton.onclick = (e) => {
        sendVote(nomId, 1, noteTextArea.value);
    };
    involvedButton.onclick = (e) => {
        sendVote(nomId, 0.5, noteTextArea.value);
    };

    switch (voteScore) {
        case 0:
            beatmap.classList.add(`red-glow-big`);
            username == `undeceiver` ? rejectButton.style.backgroundColor = `#f00` : null;
            username == `undeceiver` ? rejectButton.style.color = `#000` : null;
            break;
        case 0.5:
            beatmap.classList.add(`yellow-glow-big`);
            username == `undeceiver` ? involvedButton.style.backgroundColor = `#fF0` : null;
            username == `undeceiver` ? involvedButton.style.color = `#000` : null;
            break;
        case 1:
            beatmap.classList.add(`green-glow-big`);
            username == `undeceiver` ? approveButton.style.backgroundColor = `#0F0` : null;
            username == `undeceiver` ? approveButton.style.color = `#000` : null;
            break;
        default:
            break;
    }
    buttons.appendChild(rejectButton);
    buttons.appendChild(involvedButton);
    buttons.appendChild(approveButton);
    beatmap.appendChild(buttons);
    beatmap.appendChild(noteTextArea);

    return beatmap;
}

function convertToBNS(charecteristic, difficulty) {
    let returnObj = {
        charecteristic: ``,
        color: `000`
    };
    switch (charecteristic) {
        case `Standard`:
            returnObj.charecteristic = `standard`;
            break;
        case `OneSaber`:
            returnObj.charecteristic = `one-saber`;
            break;
        case `NoArrows`:
            returnObj.charecteristic = `no-arrows`;
            break;
        case `360Degree`:
            returnObj.charecteristic = `360-degree`;
            break;
        case `90Degree`:
            returnObj.charecteristic = `90-degree`;
            break;
        case `Lawless`:
            returnObj.charecteristic = `lawless`;
            break;
        case `Lightshow`:
            returnObj.charecteristic = `lightshow`;
            break;
        case `Legacy`:
            returnObj.charecteristic = `legacy`;
            break;
    }
    switch (difficulty) {
        case `Easy`:
            returnObj.color = `008055`;
            break;
        case `Normal`:
            returnObj.color = `1268a1`;
            break;
        case `Hard`:
            returnObj.color = `bd5500`;
            break;
        case `Expert`:
            returnObj.color = `b52a1c`;
            break;
        case `ExpertPlus`:
            returnObj.color = `7646af`;
            break;
    }
    return returnObj;
}

function generateMapperBlurb(bsapi) {
    let mapperLink = document.createElement(`a`);
    mapperLink.href = `https://beatsaver.com/profile/${bsapi.id}`;
    mapperLink.target = `_blank`;
    let mapper = document.createElement(`div`);
    let mappername = document.createElement(`p`);
    mapper.classList.add(`mapper`);
    mapperLink.classList.add(`mapper`);
    mappername.innerText = bsapi.name;
    let mapperimg = document.createElement(`img`);
    mapperimg.src = bsapi.avatar;
    mapperimg.width = 24;
    mapperimg.height = 24;
    mapper.appendChild(mapperimg);
    mapper.appendChild(mappername);
    mapperLink.appendChild(mapper);
    return mapperLink;
}

function openArcViewer(e, bsr) {
    e.preventDefault();
    let iframe = document.getElementById(`ArcViewer`)
    iframe.src = `https://allpoland.github.io/ArcViewer/?id=${bsr}`;
    let overlay = document.getElementById(`avoverlay`);
    overlay.style.display = `block`;
}

function closeArcViewer() {
    let iframe = document.getElementById(`ArcViewer`)
    iframe.src = ``;
    let overlay = document.getElementById(`avoverlay`);
    overlay.style.display = `none`;
}

function openDescModal(e, title, desc) {
    e.preventDefault();
    let titleElement = document.getElementById(`overlay_title`);
    titleElement.innerText = title;
    let descElement = document.getElementById(`overlay_desc`);
    let links = desc.matchAll(/(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gim);
    let output = desc.replaceAll(`\n`, `<br>`);
    Array.from(links).forEach(link => {
        output = output.replace(link[0], `<a href="${link[0]}" target="_blank">${link[0]}</a>`);
    });
    descElement.innerHTML = output;
    let overlay = document.getElementById(`descriptionmodal`);
    overlay.style.display = `block`;
}

function closeDescModal() {
    let overlay = document.getElementById(`descriptionmodal`);
    overlay.style.display = `none`;
}

function downloadPlaylist(e) {
    e.preventDefault();
    let a = document.createElement(`a`);
    a.href = `/api/judge/playlist?category=${global_category}`;
    a.download = global_category + `.bplist`;
    a.click();
}
//#endregion
//#region submit
function sendVote(submissionId, vote, notes) {
    fetch(`/api/judge/vote`, {
        method: `POST`,
        headers: {
            'Content-Type': `application/json`
        },
        body: JSON.stringify({
            submissionId: submissionId,
            vote: vote,
            note: notes ? notes : ``
        })
    }).then(response => response.json()).then(data => {
        console.log(data);
        loadSubmissions(activePage);
    });
}

function openSortModal(sortsubId, category) { //old
    let overlay = document.getElementById(`sortmodal`);
    overlay.style.display = `block`;
    let form = document.getElementById(`form`); 
    form.sortsubId.value = sortsubId || ``;
    form.category.value = category || ``;
    form.removeEventListener(`submit`, handleSubmit);
    form.addEventListener(`submit`, handleSubmit);
} 

function handleReclassifySubmit(e) {
    console.log(`submit`);
    e.preventDefault();
    let form = document.getElementById(`form`);
    let data = new FormData(form);
    let nomId = data.get(`nomId`);
    let category = data.get(`category`);
    let bsr = data.get(`bsrId`);
    let name = data.get(`name`);
    let char = data.get(`char`);
    let diff = data.get(`diff`);
    fetch(`/api/sort/approveSubmission`, {
        method: `POST`,
        headers: {
            'Content-Type': `application/json`
        },
        body: JSON.stringify({
            nominationId: nomId,
            bsrId: bsr,
            category: category,
            characteristic: char,
            difficulty: diff,
            name: name.toString().trim()
        })
    }).then(response => response.json()).then(data => {
        console.log(data);
        closeModal();
        loadSubmissions(activePage);
    });
    return false; 
}

function closeModal() {
    let modal = document.getElementById(`sortmodal`);
    modal.style.display = `none`;
}

function stopBubble(e) {
    e.cancelBubble = true;
}
//#endregion