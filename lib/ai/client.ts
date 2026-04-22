import OpenAI from "openai";

export function getClient() {
  if (
    !process.env.AZURE_OPENAI_API_KEY ||
    !process.env.AZURE_OPENAI_ENDPOINT ||
    !process.env.AZURE_OPENAI_DEPLOYMENT ||
    !process.env.AZURE_OPENAI_API_VERSION
  ) {
    throw new Error("Missing Azure OpenAI environment variables");
  }

  return new OpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
    defaultQuery: {
      "api-version": process.env.AZURE_OPENAI_API_VERSION,
    },
    defaultHeaders: {
      "api-key": process.env.AZURE_OPENAI_API_KEY,
    },
  });
}