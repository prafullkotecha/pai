// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

require('module-alias/register');
require('dotenv').config();
const fetch = require('node-fetch');
const AsyncLock = require('async-lock');
const logger = require('@dbc/common/logger');
const { getFrameworkInformer } = require('@dbc/common/k8s');
const { alwaysRetryDecorator } = require('@dbc/common/util');
const config = require('@dbc/watcher/framework/config');

const lock = new AsyncLock({ maxPending: Number.MAX_SAFE_INTEGER });

async function synchronizeFramework(eventType, apiObjectStr) {
  const res = await fetch(
    `${config.writeMergerUrl}/api/v1/watchEvents/${eventType}`,
    {
      method: 'POST',
      body: apiObjectStr,
      headers: { 'Content-Type': 'application/json' },
      timeout: config.writeMergerConnectionTimeoutSecond * 1000,
    },
  );
  if (!res.ok) {
    throw new Error(`Request returns a ${res.status} error.`);
  }
}

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

const eventHandler = (eventType, apiObject) => {
  /*
    framework name-based lock + always retry
  */
  const receivedTs = new Date().getTime();
  const state =
    apiObject.status && apiObject.status.state
      ? apiObject.status.state
      : 'Unknown';
  logger.info(
    `Event type=${eventType} receivedTs=${receivedTs} framework=${apiObject.metadata.name} state=${state} received.`,
  );
  lock.acquire(
    apiObject.metadata.name,
    alwaysRetryDecorator(
      () => synchronizeFramework(eventType, JSON.stringify(apiObject)),
      `Sync to write merger type=${eventType} receivedTs=${receivedTs} framework=${apiObject.metadata.name} state=${state}`,
    ),
  );
};

const informer = getFrameworkInformer();

informer.on('add', apiObject => {
  eventHandler('ADDED', apiObject);
});
informer.on('update', apiObject => {
  eventHandler('MODIFED', apiObject);
});
informer.on('delete', apiObject => {
  eventHandler('DELETED', apiObject);
});
informer.on('error', err => {
  // If any error happens, the process should exit, and let Kubernetes restart it.
  logger.error(err, function() {
    process.exit(1);
  });
});
informer.start();
