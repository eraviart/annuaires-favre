import { validateServerConfig } from "./validators/server-config"

const serverConfig = {
  gitlab: {
    url: "https://gitlab.huma-num.fr/",
    accessToken: "ACCESS_TOKEN", // Change it!
    projectPath: "eurhisfirm/annuaires-favre",
  },
  sessionSecret: "annuaires-favre secret", // Change it!
}

const [validServerConfig, error] = validateServerConfig(serverConfig)
if (error !== null) {
  console.error(
    `Error in server configuration:\n${JSON.stringify(validServerConfig, null, 2)}\nError:\n${
      JSON.stringify(error, null, 2)}`
  )
  process.exit(-1)
}

export default validServerConfig
