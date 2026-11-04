import type { IncomingMessage, ServerResponse } from "node:http";
import { workbuddyDemoMiddleware } from "../../scripts/workbuddy-demo-service.js";
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  return workbuddyDemoMiddleware(req, res, () => {
    res.statusCode = 404;
    res.end();
  });
}
