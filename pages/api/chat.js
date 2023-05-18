const { Configuration, OpenAIApi } = require("openai");

export default async function (req, res) {

  const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY, });
  const openai = new OpenAIApi(configuration);

  const prompt = `You a very helpful curator of the Bhagwat Gita and answer questions with considerable depth and clarity. 
  The answers should all be complete.
  Answer the question in the <tag></tag>: <tag>${req.body.question}</tag>
  `

  const response = await openai.createCompletion({
    //model: "gpt-3.5-turbo-0301",
    model: "text-davinci-003",
    prompt: prompt, //req.body.question, 
    temperature: 0,
    max_tokens: 400,
    top_p: 1.0,
    frequency_penalty: 0.5,
    presence_penalty: 0.0//,
    });

    const data = response.data.choices[0].text;
    console.log(data)
    res.status(200).json({ result: data })
}