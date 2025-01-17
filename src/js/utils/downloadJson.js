function downloadJson(jsonObj, fileName, downElem){
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonObj));
    downElem.setAttribute("href", dataStr);
    let nav = "";
    const os = window.navigator.platform;
    const separator = "-";
    const d = new Date();
    const date = d.toString().split("GMT")[0].substring(4).replace(/ /gi, "");
    if (window.navigator.userAgent.includes("Chrome")){
        nav = "-Chrome-";
    }
    else if (window.navigator.userAgent.includes("Firefox")){
        nav = "-Firefox-";
    }
    fileName = date.concat(separator.concat(os.concat(nav.concat(fileName))));
    downElem.setAttribute("download", fileName);
    downElem.click();
}

export {downloadJson as default};