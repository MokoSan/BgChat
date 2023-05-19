const { Configuration, OpenAIApi } = require("openai");
import { createParser, ParsedEvent, ReconnectInterval } from "eventsource-parser";


export const config = {
  runtime: "edge",
};

async function OpenAIStream(payload) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let counter = 0;

  const res = await fetch("https://api.openai.com/v1/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
    },
    method: "POST",
    body: JSON.stringify(payload),
  });

  const stream = new ReadableStream({
    async start(controller) {
      function onParse(event) {
        if (event.type === "event") {
          const data = event.data;
          if (data === "[DONE]") {
            controller.close();
            return;
          }
          try {
            const json = JSON.parse(data);
            const text = json.choices[0].text;
            if (counter < 2 && (text.match(/\n/) || []).length) {
              return;
            }
            const queue = encoder.encode(text);
            controller.enqueue(queue);
            counter++;
          } catch (e) {
            controller.error(e);
          }
        }
      }

     // stream response (SSE) from OpenAI may be fragmented into multiple chunks
     // this ensures we properly read chunks & invoke an event for each SSE event stream
     const parser = createParser(onParse);

      // https://web.dev/streams/#asynchronous-iteration
      for await (const chunk of res.body) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;
}

export default async function (req, res) {

  const d = await req.json();
  const data = d["userInput"]; 
  const prompt = `You a very helpful curator of the Bhagwat Gita and answer questions with considerable depth and clarity. 
  The answers should all be complete. All unrelated questions to the Bhagwat Gita must be ignored. The max number of tokens should be 200.
  Answer the question in the <tag></tag>: <tag>${data}</tag>
  `

  const payload = {
    model: "text-davinci-003",
    prompt: prompt,
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 400,
    stream: true,
    n: 1,
  };

    const stream = await OpenAIStream(payload);
    return new Response(stream);
}