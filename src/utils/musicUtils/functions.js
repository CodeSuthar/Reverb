function checkIfSearchResultIsPlaylist(searchResult) {
    if (searchResult.loadType === "playlist") return true;
    return false;
}

function checkIfURIIsYoutubeBased(url) {
    return /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi.test(url);
}

function convertMillisecondsToTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formattedTime = [
        hours > 0 ? String(hours).padStart(2, "0") : null,
        String(minutes).padStart(2, "0"),
        String(seconds).padStart(2, "0"),
    ]
        .filter(Boolean)
        .join(":");

    return formattedTime;
}

module.exports = {
    checkIfSearchResultIsPlaylist,
    checkIfURIIsYoutubeBased,
    convertMillisecondsToTime
};