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

  const { renameBeforeDownload } = await chrome.storage.sync.get({
    renameBeforeDownload: false
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    args: [imageUrl, format, renameBeforeDownload],
    func: async (imageUrl, format, askName) => {
      const name = askName ? prompt("Rename file (without extension):", "image") : "image";

      const download = (blob, filename) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
      };

      if (format === "gif") {
        try {
          const res = await fetch(imageUrl);
          const blob = await res.blob();
          download(blob, `${name}.gif`);
        } catch {
          alert("❌ Failed to download GIF.");
        }
        return;
      }

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(blob => {
          if (blob) {
            download(blob, `${name}.${format}`);
          } else {
            alert("❌ Failed to convert image.");
          }
        }, `image/${format}`);
      };

      img.onerror = () => {
        alert("❌ Failed to load image (possibly CORS issue).");
      };
    }
  });
});
