require('module-alias/register');
require('dotenv').config();
const fetch = require('node-fetch');
const AsyncLock = require('async-lock');
const logger = require('@dbc/common/logger');
const k8s = require('@dbc/common/k8s');
const { timePeriod } = require('@dbc/common/util');
const _ = require('lodash');

function setMemoryReport() {
  function report() {
    const used = process.memoryUsage();
    const rss = Math.round(used.rss / 1024 / 1024 * 100) / 100
    const heapTotal = Math.round(used.heapTotal / 1024 / 1024 * 100) / 100
    const heapUsed = Math.round(used.heapUsed / 1024 / 1024 * 100) / 100
    logger.warn(`[Memory Report]: ALL: ${rss} MB; ALL HEAP: ${heapTotal} MB; USED HEAP ${heapUsed} MB`)
  }
  setInterval(report, 2000);
}
setMemoryReport()

async function main() {
  try{
    const framework = await k8s.getFramework('7226a3e805c643688b605dc470c24083');
    const frameworks = [];
    const n = parseInt(process.argv[2]);
    console.log(n)
    for (let i = 0; i<n; i++) {
      frameworks.push(_.cloneDeep(framework));
    }
    console.log('start waiting...')
    await timePeriod(1000000000);
  } catch (err) {
    logger.error(err)
  }

}

main()
