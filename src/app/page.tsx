"use client";

import dynamic from "next/dynamic";
import {generateText} from "ai";
import {ollama} from "ollama-ai-provider";
import {useActionState} from "react";

import {extractSummaryFromLinkedinJob, extractSummaryFromLinkedinPost} from "./actions";

import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";

function HomePage() {
  const [tweets, handleSubmit, isPending] = useActionState(createTweets, []);

  async function createTweets(
    _previousTweets: {body: string; tweet: string; link: string}[],
    formData: FormData,
  ) {
    const text = formData.get("links") as string;
    const links = text.split("\n");
    const tweets = [];

    const {text: intro} = await generateText({
      model: ollama("llama3"),
      prompt: `Generate a slightly clickbity tweet (absolute max 280 characters) implying it's "Thursday of Junior / Trainee positions". Add a disclaimer that these positions are not mine and that I don't know the companies or person sharing the position. Include max 2 emojis. Answer should be in ES-ar. Include just the tweet, omit any "Here is the tweet" or reply. Here are some examples:
      ---
      Jueves de 🤝 posiciones Trainee / Junior 🤝

      Esta es una recopilación de búsquedas que me fueron apareciendo en el feed de LinkedIn que considero pueden serles útiles.

      Disclaimer: No conozco las empresas, búsquedas ni a quien las comparte.

      Vamos a lo importante 👇
      ---
      🚨 POSICIONES TRAINEE / JR 🚨

      Intentaré todos los Jueves de recopilar búsquedas Trainee / JR que me encuentre por LinkedIn y hacer un hilo acá.

      Disclaimer: No conozco ni las empresas, puestos ni personas que lo comparten.

      Sin más, vamos a las búsquedas 👇
      ---
      `,
    });
    const {text: outro} = await generateText({
      model: ollama("llama3"),
      prompt: `Invite people to share the tweet (absolute max 280 characters) to help others find a job and let them know this thread is made every thursday. Answer should be in ES-ar. Include just the tweet, omit any "Here is the tweet" or reply. Include max 2 emojis. Here are some examples:
      ---
      Si te sirvió, voy a hacerlo todos los Jueves. Si primera vez que llegaste acá, comparto contenido sobre frontend, principalmente React y Next.js, hago streams en Twitch los Martes ayudando a gente a conseguir su primer trabajo en IT 🤝
      ---
      Ayuda a tu junior de barrio compartiendo así llega a la gente que lo necesita 🤝

      Hasta el Jueves que viene 🙌
      ---
      `,
    });

    tweets.push({body: "", link: "intro", tweet: intro});

    for (const link of links) {
      let body: string;

      if (link.match(/linkedin.com\/jobs/)) {
        body = await extractSummaryFromLinkedinJob(link);
      } else if (link.match(/linkedin.com\/feed|linkedin.com\/post/)) {
        body = await extractSummaryFromLinkedinPost(link);
      }

      const {text: summary} = await generateText({
        model: ollama("llama3"),
        system: `You are an assistant that replies with tweets for job descriptions.

      - Only answer in spanish
      - Output should be one line per position with the following format and nothing else: [seniority] [role] en [company]. [experience required].
      - If it specifies that it is a presential, hybrid or remot position, add it at the end of the format.
      - If it specifies location requirements, add it at the end of the format.
      - If it specifies english level required, add it at the end of the format.
      - If it specifies USD or ARS payment method, add it at the end of the format.
      - If it doesn't include the role or position explicitly, try to infer it from the description, it will be mostly a developer position of some kind.
      - If multiple roles or positions are mentioned, output one line per role or position, but don't include positions that require more than 2 years of experience or ar SSR, SR, Lead or Manager roles.
      - Not talking in first or third person.
      - Less than 260 characters.
      - Never include emojis, inspirational quotes, hashtags, urls or links.
      - Only include information related to tokens specified in the format.
      - If some information couldn't be retrieved, omit the token instead of adding a placeholder.
      - Always follow the specified format.
      - Only return the answer, no feedback from the prompt or extra information.`,
        prompt: body!,
      });

      tweets.push({
        body: body!,
        tweet: `${summary}\n\n${link}`,
        link,
      });
    }

    tweets.push({body: "", link: "outro", tweet: outro});

    return tweets;
  }

  return (
    <section className="grid gap-8">
      <form action={handleSubmit} className="grid gap-4">
        <Textarea name="links" rows={10} />
        <Button className="disabled:opacity-50" disabled={isPending} type="submit">
          Extract
        </Button>
      </form>
      <article className="grid gap-4">
        {tweets.map((item) => (
          <div key={item.link} className="grid gap-2">
            <p>{item.body}</p>
            <Textarea
              className="whitespace-pre-wrap rounded-md border p-4 text-left"
              rows={10}
              onDoubleClick={(event) => event.currentTarget.select()}
            >
              {item.tweet}
            </Textarea>
          </div>
        ))}
      </article>
    </section>
  );
}

function HomePageLoading() {
  return (
    <div className="grid h-64 place-content-center" role="status">
      <svg
        aria-hidden="true"
        className="inline h-8 w-8 animate-spin fill-gray-600 text-gray-200 dark:fill-gray-300 dark:text-gray-600"
        fill="none"
        viewBox="0 0 100 101"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default dynamic(async () => HomePage, {
  ssr: false,
  loading: HomePageLoading,
});
