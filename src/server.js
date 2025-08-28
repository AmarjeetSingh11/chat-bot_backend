import app, { logger } from './app.js';

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
	logger.info(`Server listening on :${port}`);
});


