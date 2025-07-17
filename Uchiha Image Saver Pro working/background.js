const formats = ["png", "jpeg", "webp", "gif"];

chrome.runtime.onInstalled.addListener(() => {
  formats.forEach(format => {
    chrome.contextMenus.create({
      id: format,
      title: `Save Image as ${format.toUpperCase()}`,
      contexts: ["image"]
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const format = info.menuItemId;
  const imageUrl = info.srcUrl;

  const { renameBeforeDownload = false } = await chrome.storage.sync.get("renameBeforeDownload");

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: convertImage,
    args: [imageUrl, format, renameBeforeDownload]
  });
});

function convertImage(imageUrl, format, renameBeforeDownload) {
  const fileName = renameBeforeDownload ? prompt("Rename the image (without extension):", "image") : "image";

  const downloadImage = (blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (format === "gif") {
    fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => downloadImage(blob))
      .catch(() => alert("❌ Could not download GIF."));
    return;
  }

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imageUrl;

  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d").drawImage(img, 0, 0);

    canvas.toBlob(blob => {
      if (blob) {
        downloadImage(blob);
      } else {
        alert("❌ Failed to convert image.");
      }
    }, `image/${format}`);
  };

  img.onerror = () => {
    alert("⚠️ Couldn’t load image. Site may be blocking it (CORS). Try opening in new tab first.");
  };
}

