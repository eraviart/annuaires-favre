import { validateOracleConfig } from "./validators/oracle-config"

const oracleConfig = {
  user: "monitor",
  password: "monitor",
  // connectString: "db.dfih.fr/dbdfih",
  connectString: "129.199.194.26/dbdfih",
}

const [validOracleConfig, error] = validateOracleConfig(oracleConfig)
if (error !== null) {
  console.error(
    `Error in Oracle configuration:\n${JSON.stringify(
      validOracleConfig,
      null,
      2,
    )}\nError:\n${JSON.stringify(error, null, 2)}`,
  )
  process.exit(-1)
}

export default validOracleConfig
