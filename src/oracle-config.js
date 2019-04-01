import { validateOracleConfig } from "./validators/oracle-config"

const oracleConfig = {
  user: "USERNAME",
  password: "PASSWORD",
  connectString: "SERVER_NAME/DATABASE_NAME",
}

const [validOracleConfig, error] = validateOracleConfig(oracleConfig)
if (error !== null) {
  console.error(
    `Error in Oracle configuration:\n${JSON.stringify(validOracleConfig, null, 2)}\nError:\n${
      JSON.stringify(error, null, 2)}`
  )
  process.exit(-1)
}

export default validOracleConfig
