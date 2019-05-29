import oracledb from "oracledb"

import oracleConfig from "./oracle-config"

export let pool = null

export async function createPool() {
  try {
    pool = await oracledb.createPool({
      user: oracleConfig.user,
      password: oracleConfig.password,
      connectString: oracleConfig.connectString,
      // Default values shown below:
      // events: false, // whether to handle Oracle Database FAN and RLB events
      // externalAuth: false, // whether connections should be established using External Authentication
      // poolAlias: 'myalias' // set an alias to allow access to the pool via a name.
      // poolIncrement: 1, // only grow the pool by one connection at a time
      poolMax: 10, // poolMax: 4, maximum size of the pool. Increase UV_THREADPOOL_SIZE if you increase poolMax
      poolMin: 0, // poolMin: 0, // start with no connections; let the pool shrink completely
      // poolPingInterval: 60, // check aliveness of connection if in the pool for 60 seconds
      // poolTimeout: 60, // terminate connections that are idle in the pool for 60 seconds
      queueTimeout: 0, // terminate getConnection() calls in the queue longer than 60000 milliseconds
      // stmtCacheSize: 30 // number of statements that are cached in the statement cache of each connection
    })
    return pool
  } catch (error) {
    console.log(
      "An error occured while calling oracledb.createPool:\n",
      error.stack || error,
    )
    throw error
  }
}
