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

  async function createTweets(_previousTweets: string[], formData: FormData) {
    const text = formData.get("links") as string;
    const links = text.split("\n");
    const tweets = [];

    for (const link of links) {
      let body: string;

      if (link.match(/linkedin.com\/jobs/)) {
        body = await extractSummaryFromLinkedinJob(link);
      } else if (link.match(/linkedin.com\/feed|linkedin.com\/post/)) {
        body = await extractSummaryFromLinkedinPost(link);
      }

      const {text: summary} = await generateText({
        model: ollama("llama3"),
        prompt: `You are an assistant that replies with tweets from job descriptions.

      - Only answer in spanish
      - Output should be one line per position with the following format and nothing else: [seniority] [role] en [company]. [experience required].
      - If multiple roles or positions are mentioned, output one line per role or position.
      - If it has location requirements, add it at the beginning of the format, like: [location]. [seniority] [role] en [company]. [experience required].
      - Not talking in first or third person.
      - If none of the tokens could be retrieved, output "🚨🚨🚨".
      - Less than 260 characters.
      - Don't include emojis, inspirational quotes, hashtags, urls or links.
      - Don't include information not related to role, company or experience required.
      - Always follow the specified format.
      - Only return the answer, no feedback from the prompt or extra information.

      This is the job description:
      ---
      ${body!}
      ---
      `,
      });

      tweets.push(`${summary}\n\n${link}`);
    }

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
        {tweets.map((tweet) => (
          <button
            key={tweet}
            className="whitespace-pre-wrap rounded-md border p-4 text-left transition-colors active:bg-emerald-400/50"
            type="button"
            onClick={() => navigator.clipboard.writeText(tweet as string)}
          >
            {tweet}
          </button>
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
