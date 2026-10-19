import http from "http";

export const DEFAULT_ADMIN = {
  username: process.env.ADMIN_USERNAME || "admin",
  password: process.env.ADMIN_PASSWORD || "Aegis@Admin2026!"
};

export const DEFAULT_USER = {
  username: process.env.TEST_USERNAME || "testuser",
  password: process.env.TEST_PASSWORD || "TestUser@2026!"
};

export function waitForUrl(url: string, timeout = 30000, interval = 1000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryReq = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeout) {
          return reject(new Error(`Timeout waiting for ${url}`));
        }
        setTimeout(tryReq, interval);
      });
      req.setTimeout(2000, () => req.abort());
    };
    tryReq();
  });
}
