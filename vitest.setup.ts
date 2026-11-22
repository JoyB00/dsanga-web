// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'

// Background jobs (scheduled publish, reminders) must not run inside the test process.
process.env.JOBS_AUTORUN = 'false'
