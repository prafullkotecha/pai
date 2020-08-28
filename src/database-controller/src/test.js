require('module-alias/register');
require('dotenv').config();
const fetch = require('node-fetch');
const AsyncLock = require('async-lock');
const logger = require('@dbc/common/logger');
const k8s = require('@dbc/common/k8s');
const { alwaysRetryDecorator } = require('@dbc/common/util');
const _ = require('lodash');

async function main() {
  try{
    const framework = await k8s.getFramework('7226a3e805c643688b605dc470c24083');
    const frameworks = [];
    const n = parseInt(process.argv[2]);
    console.log(n)
    for (let i = 0; i<n; i++) {
      frameworks.push(_.cloneDeep(framework));
    }
    await new Promise((resolve, reject) => {});
  } catch (err) {
    logger.error(err)
  }

}

main()
