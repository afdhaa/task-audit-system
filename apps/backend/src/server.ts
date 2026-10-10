import { createApp } from "./app";
import { config } from "./core/config/config";
import { logger } from "./core/logger/logger";

const app = createApp();

app.listen(config.port, () => {
  logger.info(`Backend server running on http://localhost:${config.port}`);
});
