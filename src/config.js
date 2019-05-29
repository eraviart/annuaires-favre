import { validateConfig } from "./validators/config"

const config = {
  globalAlert: {
    class: "is-danger",
    messageHtml: `
      <article class="container mx-auto my-4" role="alert">
        <div class="bg-orange font-bold rounded-t px-4 py-2 text-white">
          <i class="fas fa-exclamation-triangle"></i> Attention !
        </div>
        <div class="bg-orange-100 border border-orange-400 border-t-0 px-4 py-3 rounded-b text-orange-600">
          <p>
            Ce site est <b>en développement</b>. Les informations qui y figurent peuvent être fausses et surtout
            <b>incomplètes</b>. En cas de doute, référez-vous aux sources des différentes données.
          </p>
          <p class="leading-normal">
            N'hésitez pas à nous
            <a
              class="text-blue underline"
              href="https://gitlab.huma-num.fr/eurhisfirm/annuaires-favre/issues"
              target="_blank"
              title="Support technique"
            >signaler un problème</a>.
          </p>
        </div>
      </article>
    `,
  },
  leftMenu: [
    {
      contentHtml: "Accueil",
      prefetch: true,
      title: "TODO",
      url: ".",
    },
  ],
  missionStatement: "Saisie des annuaires Favre",
  rightMenu: [
    {
      contentHtml: "À propos",
      prefetch: true,
      title: "Informations sur ce site web",
      url: "a-propos",
    },
  ],
  title: "Annuaires Favre",
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
