import { SWRConfig } from "swr";

function SWRProvider({ children }: { children: React.ReactChild }) {
  return (
    <SWRConfig
      value={{
        fetcher: async (url: string) => {
          const res = await fetch(url, {
            credentials: "include"
          });
          if (res.status >= 400) {
            let error = "Unexpected Error";
            try {
              const data = await res.json();
              error = data.error;
            } catch {
              error = "Internal Error";
            }
            console.error("API Request Failed!", url, error);
            throw new Error(error);
          }

          return await res.json();
        }
      }}
    >
      {children}
    </SWRConfig>
  );
}

export default SWRProvider;
