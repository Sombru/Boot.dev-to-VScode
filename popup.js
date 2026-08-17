(function () {
  const extensionApi = typeof browser !== "undefined" ? browser : chrome;
  const exportButton = document.querySelector("#exportButton");
  const statusBox = document.querySelector("#status");

  exportButton.addEventListener("click", exportLesson);

  async function exportLesson() {
    setBusy(true);
    setStatus("Reading the current tab...");

    try {
      const tab = await getActiveTab();

      if (!tab || !tab.id || !isBootDevUrl(tab.url)) {
        throw new Error("Open a Boot.dev lesson page before exporting.");
      }

      const lesson = await sendMessageToTab(tab.id, { type: "GET_BOOTDEV_LESSON" });

      if (!lesson || !lesson.ok) {
        throw new Error(lesson?.error || "The lesson content could not be read.");
      }

      const files = buildExportFiles(lesson.data);

      if (files.length === 0) {
        throw new Error("No lesson content was found to export.");
      }

      files.forEach((file, index) => {
        setTimeout(() => downloadTextFile(file.name, file.content), index * 150);
      });

      const codeNote = lesson.data.code
        ? "A README and code file were downloaded."
        : "A README was downloaded. Code editor content was not detected.";

      setStatus(codeNote, "success");
    } catch (error) {
      setStatus(error.message || String(error), "error");
    } finally {
      setBusy(false);
    }
  }

  function getActiveTab() {
    if (usesPromiseApi()) {
      return extensionApi.tabs.query({ active: true, currentWindow: true }).then((tabs) => tabs[0]);
    }

    return new Promise((resolve, reject) => {
      extensionApi.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const lastError = getLastError();

        if (lastError) {
          reject(new Error(lastError.message));
          return;
        }

        resolve(tabs[0]);
      });
    });
  }

  function sendMessageToTab(tabId, message) {
    if (usesPromiseApi()) {
      return extensionApi.tabs.sendMessage(tabId, message).catch(() => {
        throw new Error("Could not reach the Boot.dev page. Reload the page and try again.");
      });
    }

    return new Promise((resolve, reject) => {
      extensionApi.tabs.sendMessage(tabId, message, (response) => {
        const lastError = getLastError();

        if (lastError) {
          reject(
            new Error(
              "Could not reach the Boot.dev page. Reload the page and try again."
            )
          );
          return;
        }

        resolve(response);
      });
    });
  }

  function usesPromiseApi() {
    return typeof browser !== "undefined";
  }

  function getLastError() {
    return typeof chrome !== "undefined" ? chrome.runtime?.lastError : null;
  }

  function buildExportFiles(lesson) {
    const baseName = slugify(lesson.title || "bootdev-lesson");
    const readme = formatReadme(lesson);
    const files = [{ name: `${baseName}-README.md`, content: readme }];

    if (lesson.code) {
      const extension = extensionForLanguage(lesson.language);
      files.push({
        name: `${baseName}${extension}`,
        content: lesson.code.endsWith("\n") ? lesson.code : `${lesson.code}\n`,
      });
    }

    return files;
  }

  function formatReadme(lesson) {
    const title = lesson.title || "Boot.dev Lesson";
    const instructions =
      lesson.instructions ||
      "The extension could not confidently extract the visible lesson instructions.";
    const codeStatus = lesson.code
      ? `Detected code language: ${lesson.language || "unknown"}`
      : "Code editor content was not detected.";

    return [
      `# ${title}`,
      "",
      `Source: ${lesson.url || "Unknown Boot.dev page"}`,
      "",
      "## Instructions",
      "",
      instructions,
      "",
      "## Export Notes",
      "",
      codeStatus,
      "",
    ].join("\n");
  }

  function downloadTextFile(filename, content) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.append(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function extensionForLanguage(language) {
    const normalized = String(language || "").toLowerCase();
    const extensions = {
      c: ".c",
      cpp: ".cpp",
      csharp: ".cs",
      css: ".css",
      go: ".go",
      html: ".html",
      java: ".java",
      javascript: ".js",
      js: ".js",
      json: ".json",
      markdown: ".md",
      php: ".php",
      python: ".py",
      py: ".py",
      ruby: ".rb",
      rust: ".rs",
      shell: ".sh",
      sql: ".sql",
      typescript: ".ts",
      ts: ".ts",
      yaml: ".yml",
    };

    return extensions[normalized] || ".txt";
  }

  function isBootDevUrl(url) {
    try {
      return new URL(url).hostname === "www.boot.dev";
    } catch {
      return false;
    }
  }

  function slugify(value) {
    return String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "bootdev-lesson";
  }

  function setBusy(isBusy) {
    exportButton.disabled = isBusy;
    exportButton.textContent = isBusy ? "Exporting..." : "Export lesson";
  }

  function setStatus(message, kind) {
    statusBox.textContent = message;
    statusBox.dataset.kind = kind || "";
  }
})();
