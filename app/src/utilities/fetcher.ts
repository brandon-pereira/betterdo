export class FetchError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "FetchError";
    this.status = status;
  }
}

// Default query function, shared with the startup prefetch so preloaded requests
// are identical to the ones the hooks would make.
export async function fetcher(url: string) {
  const res = await fetch(url, {
    credentials: "include"
  });
  if (res.status >= 400) {
    let error: string;
    try {
      const data = await res.json();
      error = data.error;
    } catch {
      error = "Internal Error";
    }
    console.error("API Request Failed!", url, error);
    throw new FetchError(error, res.status);
  }

  return await res.json();
}
