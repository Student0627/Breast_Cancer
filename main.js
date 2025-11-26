const themeButtons = document.querySelectorAll(".theme-btn");
const root = document.documentElement;
const quizForm = document.getElementById("wellnessQuiz");
const quizResult = document.querySelector(".quiz-result");
const scanForm = document.getElementById("scanForm");
const scanInput = document.getElementById("scanInput");
const previewFrame = document.querySelector(".preview-frame");
const insightCard = document.querySelector(".insight-card");

const quizMessages = [
    {
        range: [0, 2],
        title: "All clear for now",
        text: "Great job staying in tune with your body. Keep monthly self-checks and book routine screenings."
    },
    {
        range: [3, 5],
        title: "Monitor closely",
        text: "Log any changes this week. If sensations persist for more than two weeks, reach out to a clinician."
    },
    {
        range: [6, 8],
        title: "Schedule a visit",
        text: "Your responses suggest a chat with a doctor would be wise. Bring notes or photos to your appointment."
    }
];

themeButtons.forEach(button => {
    button.addEventListener("click", () => {
        themeButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        root.setAttribute("data-theme", button.dataset.theme);
        document.body.setAttribute("data-theme", button.dataset.theme);
    });
});

if (themeButtons.length) {
    themeButtons[0].classList.add("active");
}

quizForm.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(quizForm);
    let score = 0;
    for (const value of data.values()) {
        score += Number(value || 0);
    }
    const result = quizMessages.find(item => score >= item.range[0] && score <= item.range[1]);
    if (!result) {
        quizResult.innerHTML = "<h3>Complete every question</h3><p>Please answer all prompts to see guidance.</p>";
        return;
    }
    const urgency = score >= 6 ? "urgent" : score >= 3 ? "caution" : "calm";
    quizResult.innerHTML = `<span class="tag ${urgency}">${result.title}</span><p>${result.text}</p><p class="note">This check cannot replace professional screening. Seek immediate care for sudden pain, swelling, or discharge.</p>`;
});

scanForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!scanInput.files.length) {
        previewFrame.innerHTML = "<p>Please choose an image to enhance.</p>";
        return;
    }
    const formData = new FormData();
    formData.append("image", scanInput.files[0]);
    previewFrame.innerHTML = "<p>Processing with OpenCV…</p>";
    insightCard.textContent = "";
    try {
        const response = await fetch("/enhance", { method: "POST", body: formData });
        const result = await response.json();
        if (!response.ok) {
            previewFrame.innerHTML = `<p>${result.error || "Processing error"}</p>`;
            return;
        }
        previewFrame.innerHTML = `<img src="${result.preview}" alt="OpenCV enhanced output">`;
        insightCard.textContent = result.insight || "Contrast map ready";
    } catch (error) {
        previewFrame.innerHTML = "<p>Network error. Try again.</p>";
    }
});
