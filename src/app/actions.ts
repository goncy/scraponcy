"use server";

import {JSDOM} from "jsdom";

export async function extractSummaryFromLinkedinJob(url: string) {
  const html = await fetch(url).then((res) => res.text());

  const {
    window: {document: parser},
  } = new JSDOM(html);

  let body = parser.querySelector(".description__text.description__text--rich")?.textContent;

  if (!body) {
    throw new Error(`Couldn't find the job description for: ${url}`);
  }

  // Normalize text content
  body = body
    .replace(/Show more|Show less/g, "")
    .replace(/[\n\r]+|[\s]{2,}/g, " ")
    .trim();

  return body;
}

export async function extractSummaryFromLinkedinPost(url: string) {
  const html = await fetch(url).then((res) => res.text());

  const {
    window: {document: parser},
  } = new JSDOM(html);

  let body = parser.querySelector(
    "[data-test-id='main-feed-activity-card__commentary']",
  )?.textContent;

  if (!body) {
    throw new Error(`Couldn't find the post description for: ${url}`);
  }

  // Normalize text content
  body = body
    .replace(/Show more|Show less/g, "")
    .replace(/[\n\r]+|[\s]{2,}/g, " ")
    .trim();

  return body;
}
