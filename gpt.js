// import OpenAI from "openai";
// //export OPENAI_API_KEY="your_api_key_here"

// const client = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY,
// });

// async function run() {
//     const response = await client.responses.create({
//         model: "gpt-5.4-mini",
//         input: "Explain how a binary counter works in simple terms.",
//     });

//     console.log(response.output_text);
// }
const projectIdeas = [
    "Song performance / poetry",
    "Poster",
    "Visual map",
    "Writing: essay or story",
    "Rap battle / lip sync",
    "Act it out",
    "Debate documentary",
    "Debate",
    "Product design",
    "Write a Bible verse",
    "Video game",
    "Digital museum",
    "3D model of civilization",
    "Social media trend post",
    "Play script",
    "A sermon that Father Whitney would say",
    "Day in a life",
    "Jeopardy",
    "Picture book",
    "Bookmark",
    "Jesus in modern times",
    "Merch",
    "Family Feud",
    "Each person gets a role in a simulation with different scenarios",
    "Board game",
    "Choose-your-own-adventure",
    '"Tug of war" debate',
    "Character cards",
    "Mystery box challenge with artifacts or clues",
    "Escape room",
    "Answer a question, then throw a basketball",
    '"What if?" reality simulation / redesign world outcome',
    "Shark Tank pitch",
    "Ping-pong explain-it game where a mistake loses a point",
    "Scavenger hunt",
];

function renderIdeas(ideasGrid, searchTerm) {
    ideasGrid.innerHTML = "";

    const filteredIdeas = projectIdeas.filter((projectName) =>
        projectName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredIdeas.length === 0) {
        const emptyState = document.createElement("p");
        emptyState.className = "empty-state";
        emptyState.textContent = "No matching project ideas yet.";
        ideasGrid.appendChild(emptyState);
        return;
    }

    filteredIdeas.forEach((projectName) => {
        const ideaCard = document.createElement("article");
        ideaCard.className = "idea-card";

        const tag = document.createElement("span");
        tag.className = "idea-tag";
        tag.textContent = "Project Idea";

        const title = document.createElement("h2");
        title.textContent = projectName;

        ideaCard.appendChild(tag);
        ideaCard.appendChild(title);
        ideasGrid.appendChild(ideaCard);
    });
}

window.onload = function () {
    const ideasGrid = document.getElementById("ideas-grid");
    const searchInput = document.getElementById("idea-search");

    renderIdeas(ideasGrid, "");

    searchInput.addEventListener("input", function () {
        renderIdeas(ideasGrid, searchInput.value);
    });
};

// run();
