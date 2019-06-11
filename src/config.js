import { validateConfig } from "./validators/config"

const config = {
  missionStatement: "Edition of Favre yearbooks",
  title: "Favre Yearbooks",
  url: ".",
}

const [validConfig, error] = validateConfig(config)
if (error !== null) {
  console.error(
    `Error in configuration:\n${JSON.stringify(
      validConfig,
      null,
      2,
    )}\nError:\n${JSON.stringify(error, null, 2)}`,
  )
  process.exit(-1)
}

export default validConfig
