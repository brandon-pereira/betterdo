import jestMongoSetup from "@shelf/jest-mongodb/lib/setup";

export default async (): Promise<void> => {
  process.env.TZ = "America/Edmonton";
  // @ts-expect-error dsas
  await jestMongoSetup({
    rootDir: process.cwd()
  });
};
