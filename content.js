(function () {
  const runtime = typeof browser !== "undefined" ? browser : chrome;

  runtime.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "GET_BOOTDEV_LESSON") {
      return false;
    }

    try {
      const lesson = window.extractBootDevLesson();

      if (!lesson.instructions && !lesson.code) {
        sendResponse({
          ok: false,
          error: "No visible lesson instructions or code were found on this page.",
        });
        return false;
      }

      sendResponse({ ok: true, data: lesson });
    } catch (error) {
      sendResponse({
        ok: false,
        error: error.message || "Unexpected extraction error.",
      });
    }

    return false;
  });
})();
