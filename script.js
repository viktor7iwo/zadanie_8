/*jslint browser */
(function () {
    const FORM_ENDPOINT = "https://formcarry.com/s/FNdengjCz3R";
    const STORAGE_KEY = "feedbackFormDraft";
    const POPUP_HASH = "#feedback";
    const TEXT_FIELDS = ["name", "email", "phone", "organization", "message"];
 
    const openButton = document.getElementById("open-form");
    const closeButton = document.getElementById("close-form");
    const popup = document.getElementById("popup");
    const panel = document.getElementById("popup-panel");
    const form = document.getElementById("feedback-form");
    const submitButton = document.getElementById("submit-button");
    const statusBox = document.getElementById("status");
 
    function field(name) {
        return form.elements.namedItem(name);
    }
 
    function showStatus(text, kind) {
        statusBox.textContent = text;
        statusBox.className = "status status--" + kind;
    }
 
    function readDraft() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY));
        } catch (ignore) {
            return null;
        }
    }
 
    function writeDraft(draft) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
            return true;
        } catch (ignore) {
            return false;
        }
    }
 
    function clearDraft() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (ignore) {
            return false;
        }
    }
 
    function saveDraft() {
        const draft = {agree: field("agree").checked};
        TEXT_FIELDS.forEach(function (name) {
            draft[name] = field(name).value;
        });
        return writeDraft(draft);
    }
 
    function restoreDraft() {
        const draft = readDraft();
        if (!draft || typeof draft !== "object") {
            return;
        }
        TEXT_FIELDS.forEach(function (name) {
            if (typeof draft[name] === "string") {
                field(name).value = draft[name];
            }
        });
        field("agree").checked = draft.agree === true;
    }
 
    function collectData() {
        const data = {agree: field("agree").checked};
        TEXT_FIELDS.forEach(function (name) {
            data[name] = field(name).value.trim();
        });
        return data;
    }
 
    function showPopup() {
        if (!popup.hidden) {
            return;
        }
        popup.hidden = false;
        document.body.classList.add("no-scroll");
        showStatus("", "info");
        panel.focus();
    }
 
    function hidePopup() {
        if (popup.hidden) {
            return;
        }
        popup.hidden = true;
        document.body.classList.remove("no-scroll");
        openButton.focus();
    }
 
    function openPopup() {
        if (popup.hidden) {
            history.pushState({popup: true}, "", POPUP_HASH);
            showPopup();
        }
    }
 
    function closePopup() {
        if (history.state && history.state.popup) {
            history.back();
        } else {
            history.replaceState(null, "", location.pathname + location.search);
            hidePopup();
        }
    }
 
    function syncWithUrl() {
        if (location.hash === POPUP_HASH) {
            showPopup();
        } else {
            hidePopup();
        }
    }
 
    async function sendForm(event) {
        event.preventDefault();
        submitButton.disabled = true;
        showStatus("Отправляем…", "info");
        try {
            const response = await fetch(FORM_ENDPOINT, {
                body: JSON.stringify(collectData()),
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                method: "POST"
            });
            const result = await response.json();
            if (response.ok && result.status === "success") {
                clearDraft();
                form.reset();
                showStatus("Спасибо! Ваше сообщение отправлено.", "success");
            } else {
                showStatus(
                    "Не удалось отправить форму: " + (result.message || "ошибка сервера"),
                    "error"
                );
            }
        } catch (ignore) {
            showStatus(
                "Не удалось отправить форму. Проверьте подключение и попробуйте ещё раз.",
                "error"
            );
        }
        submitButton.disabled = false;
    }
 
    openButton.addEventListener("click", openPopup);
    closeButton.addEventListener("click", closePopup);
    popup.addEventListener("click", function (event) {
        if (event.target === popup) {
            closePopup();
        }
    });
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !popup.hidden) {
            closePopup();
        }
    });
    window.addEventListener("popstate", syncWithUrl);
    form.addEventListener("input", saveDraft);
    form.addEventListener("change", saveDraft);
    form.addEventListener("submit", sendForm);
 
    restoreDraft();
    syncWithUrl();
}());
 
