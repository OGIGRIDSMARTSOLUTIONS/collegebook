require('dotenv').config();
const { startBroadcastWorker } = require('./workers/broadcast.worker');

if (!process.env.REDIS_URL) {
  // eslint-disable-next-line no-console
  console.log(
    'REDIS_URL not set — nothing to run. Without Redis, broadcasts fan out synchronously inside the API process instead (see src/services/broadcast.service.js).'
  );
  process.exit(0);
}

const worker = startBroadcastWorker();

// eslint-disable-next-line no-console
console.log('CollegeBook broadcast worker started, waiting for jobs...');

worker.on('completed', (job, result) => {
  // eslint-disable-next-line no-console
  console.log(`Job ${job.id} (broadcast ${job.data.broadcastId}) completed:`, result);
});

worker.on('failed', (job, err) => {
  // eslint-disable-next-line no-console
  console.error(`Job ${job?.id} failed:`, err.message);
});
