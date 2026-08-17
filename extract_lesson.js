(function () {
  window.extractBootDevLesson = function extractBootDevLesson() {
    return {
      title: extractTitle(),
      url: window.location.href,
      instructions: extractInstructions(),
      code: extractCode(),
      language: extractLanguage(),
    };
  };

  function extractTitle() {
    const lessonRoot = findLessonRoot();
    const heading =
      lessonRoot?.querySelector("h1") ||
      document.querySelector("main h1") ||
      document.querySelector("h1") ||
      document.querySelector("[data-test*='title' i]");

    return cleanText(heading?.textContent || document.title.replace(/\s*\|\s*Boot\.dev.*/i, ""));
  }

  function extractInstructions() {
    const candidates = [
      findLessonRoot(),
      document.querySelector("[data-test*='lesson' i]"),
      document.querySelector("[data-testid*='lesson' i]"),
      document.querySelector("[data-test*='instructions' i]"),
      document.querySelector("[data-testid*='instructions' i]"),
      document.querySelector("article"),
      document.querySelector("main"),
    ].filter(Boolean);

    for (const element of candidates) {
      const text = cleanText(extractVisibleText(element));

      if (isUsefulInstructionText(text)) {
        return trimLongText(removeLikelyEditorNoise(text), 12000);
      }
    }

    return "";
  }

  function findLessonRoot() {
    const viewers = Array.from(document.querySelectorAll(".viewer")).filter(isVisible);

    return (
      viewers.find((element) => element.querySelector("h1")) ||
      document.querySelector("h1")?.closest(".viewer") ||
      null
    );
  }

  function extractCode() {
    const selectors = [
      "textarea",
      "[contenteditable='true']",
      ".cm-content",
      ".cm-line",
      ".monaco-editor textarea",
      ".view-lines",
      "pre code",
      "pre",
    ];

    for (const selector of selectors) {
      const code = extractCodeFromSelector(selector);

      if (isUsefulCode(code)) {
        return code;
      }
    }

    return "";
  }

  function extractCodeFromSelector(selector) {
    const elements = Array.from(document.querySelectorAll(selector)).filter(isVisible);

    if (elements.length === 0) {
      return "";
    }

    if (selector === ".cm-line") {
      return cleanCode(elements.map((element) => element.textContent || "").join("\n"));
    }

    const bestElement = elements
      .map((element) => ({
        element,
        text: readCodeText(element),
      }))
      .filter((candidate) => isUsefulCode(candidate.text))
      .sort((a, b) => b.text.length - a.text.length)[0];

    return cleanCode(bestElement?.text || "");
  }

  function readCodeText(element) {
    if (!element) {
      return "";
    }

    if ("value" in element && element.value) {
      return element.value;
    }

    if (element.classList.contains("view-lines")) {
      return Array.from(element.querySelectorAll(".view-line"))
        .map((line) => line.textContent || "")
        .join("\n");
    }

    return element.innerText || element.textContent || "";
  }

  function extractLanguage() {
    const languageHints = [
      document.documentElement.lang,
      document.body?.dataset?.language,
      document.querySelector("[data-language]")?.getAttribute("data-language"),
      document.querySelector("[class*='language-']")?.className,
      document.querySelector("code[class*='language-']")?.className,
      document.title,
      window.location.pathname,
    ];

    const knownLanguages = [
      "python",
      "javascript",
      "typescript",
      "go",
      "java",
      "rust",
      "csharp",
      "cpp",
      "c",
      "sql",
      "html",
      "css",
      "shell",
      "ruby",
      "php",
    ];

    const haystack = languageHints
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .replace(/c\+\+/g, " cpp ")
      .replace(/c#/g, " csharp ");
    const tokens = haystack.split(/[^a-z0-9]+/).filter(Boolean);

    return knownLanguages.find((language) => tokens.includes(language)) || "";
  }

  function extractVisibleText(root) {
    if (!root || !isVisible(root)) {
      return "";
    }

    const ignoredSelectors = [
      "button",
      "input",
      "nav",
      "script",
      "style",
      "textarea",
      "[aria-hidden='true']",
      ".cm-editor",
      ".monaco-editor",
    ];

    const clone = root.cloneNode(true);
    clone.querySelectorAll(ignoredSelectors.join(",")).forEach((element) => element.remove());
    return clone.innerText || clone.textContent || "";
  }

  function cleanText(value) {
    return String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function cleanCode(value) {
    return String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function removeLikelyEditorNoise(text) {
    return text
      .replace(/\n?Run\s+Submit\s*$/i, "")
      .replace(/\n?Tests?\s+Output\s+Console\s*/gi, "\n");
  }

  function isUsefulInstructionText(text) {
    return text.length >= 40 && !/^loading/i.test(text);
  }

  function isUsefulCode(code) {
    const trimmed = cleanCode(code);

    if (trimmed.length < 8) {
      return false;
    }

    return /[{}();=]|\b(def|func|function|class|return|import|package|const|let|var|print)\b/.test(
      trimmed
    );
  }

  function isVisible(element) {
    if (!element) {
      return false;
    }

    const style = window.getComputedStyle(element);

    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      element.getClientRects().length > 0
    );
  }

  function trimLongText(text, maxLength) {
    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength).trim()}\n\n[Trimmed by exporter]`;
  }
})();
