import OpenAI from "openai";
//export OPENAI_API_KEY="your_api_key_here"
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function run() {
  const response = await client.responses.create({
    model: "gpt-5.4-mini",
    input: "Explain how a binary counter works in simple terms."
  });

  console.log(response.output_text);
}

run();