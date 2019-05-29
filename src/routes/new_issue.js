import fetch from "node-fetch"
import url from "url"

import serverConfig from "../server-config"
import { validateNonEmptyTrimmedString } from "../validators/core"

const { gitlab } = serverConfig

export async function post(req, res) {
  const [body, error] = validateBody(req.body)
  if (error !== null) {
    console.error(
      `Error in form:\n${JSON.stringify(
        body,
        null,
        2,
      )}\n\nError:\n${JSON.stringify(error, null, 2)}`,
    )
    res.writeHead(400, {
      "Content-Type": "application/json; charset=utf-8",
    })
    return res.end(
      JSON.stringify(
        {
          ...body,
          error: {
            code: 400,
            details: error,
            message: "Le formulaire contient des erreurs.",
          },
        },
        null,
        2,
      ),
    )
  }

  const response = await fetch(
    url.resolve(
      gitlab.url,
      `api/v4/projects/${encodeURIComponent(gitlab.projectPath)}/issues`,
    ),
    {
      method: "POST",
      body: JSON.stringify(
        {
          ...body,
          confidential: false,
        },
        null,
        2,
      ),
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Private-Token": gitlab.accessToken,
      },
    },
  )
  const result = response.ok
    ? await response.json()
    : { error: { code: response.status, message: response.statusText } }
  if (result.error) {
    console.log(result.error.code, result.error.message)
  }

  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
  })
  res.end(
    JSON.stringify(
      {
        description: result.description,
        error: result.error || null,
        title: result.title,
        web_url: result.web_url,
      },
      null,
      2,
    ),
  )
}

function validateBody(body) {
  if (body === null || body === undefined) {
    return [body, "Le formulaire est vide."]
  }
  if (typeof body !== "object") {
    return [
      body,
      `Le formulaire devrait être un "object" et non pas un "${typeof body}".`,
    ]
  }

  body = {
    ...body,
  }
  const remainingKeys = new Set(Object.keys(body))
  const errors = {}

  for (let key of ["description", "title"]) {
    remainingKeys.delete(key)
    const [value, error] = validateNonEmptyTrimmedString(body[key])
    body[key] = value
    if (error !== null) {
      errors[key] = error
    }
  }

  for (let key of remainingKeys) {
    errors[key] = "Unexpected entry"
  }
  return [body, Object.keys(errors).length === 0 ? null : errors]
}
