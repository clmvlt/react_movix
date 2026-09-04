import { LEGAL_PLACEHOLDER, type LegalDocumentContent } from "./types";

const P = LEGAL_PLACEHOLDER;
const UPDATED_AT = "2026-09-03";

export const termsFr: LegalDocumentContent = {
  title: "Conditions générales d'utilisation",
  intro:
    "Les présentes conditions encadrent l'accès et l'utilisation de la plateforme Movix, service de gestion de livraisons pharmaceutiques proposé aux entreprises de transport et à leurs équipes (interface web et application mobile).",
  updatedAt: UPDATED_AT,
  sections: [
    {
      id: "editeur",
      title: "1. Éditeur du service",
      blocks: [
        {
          type: "p",
          text: `Le service Movix est édité par ${P} (dénomination sociale), ${P} (forme juridique et capital), immatriculée sous le numéro SIREN ${P}, dont le siège social est situé ${P}. Directeur de la publication : ${P}. Contact : ${P}.`,
        },
        {
          type: "p",
          text: `Le service est hébergé sur l'infrastructure de l'éditeur (domaine stack.bzh). Coordonnées de l'hébergeur : ${P}.`,
        },
      ],
    },
    {
      id: "objet",
      title: "2. Objet du service",
      blocks: [
        {
          type: "p",
          text: "Movix permet à une entreprise cliente de gérer ses tournées de livraison : import et suivi des commandes, organisation et ordonnancement des tournées, suivi des colis, déclaration d'anomalies, facturation et notifications. L'application mobile permet aux chauffeurs d'exécuter les tournées sur le terrain (scan, photos de livraison, signalement d'anomalies).",
        },
      ],
    },
    {
      id: "acces",
      title: "3. Accès au service et comptes",
      blocks: [
        {
          type: "p",
          text: "L'accès au service suppose la création d'un compte utilisateur (adresse email et mot de passe, ou connexion via un compte Google). Un compte utilisateur peut être rattaché à une ou plusieurs entreprises clientes, soit par un administrateur de l'entreprise, soit au moyen d'un code d'invitation.",
        },
        {
          type: "ul",
          items: [
            "L'utilisateur s'engage à fournir des informations exactes et à les maintenir à jour.",
            "Les identifiants de connexion sont strictement personnels. L'utilisateur est responsable de leur confidentialité et de toute activité réalisée depuis son compte.",
            "L'entreprise cliente est responsable des accès qu'elle accorde à ses collaborateurs (profils web, mobile, administrateur) et de leur retrait lorsqu'ils ne sont plus justifiés.",
            "Une session web est valable 8 heures. Passé ce délai, une nouvelle connexion est nécessaire.",
          ],
        },
      ],
    },
    {
      id: "acceptation",
      title: "4. Acceptation et modification des conditions",
      blocks: [
        {
          type: "p",
          text: "L'utilisation du service implique l'acceptation des présentes conditions. Cette acceptation est demandée à l'inscription puis à la première connexion pour les comptes créés par un administrateur ou par invitation. Elle est horodatée et associée à la version des conditions en vigueur.",
        },
        {
          type: "p",
          text: "L'éditeur peut faire évoluer les présentes conditions. En cas de modification substantielle, l'acceptation de la nouvelle version est demandée à la connexion suivante. L'utilisateur qui refuse peut se déconnecter et demander la suppression de son compte auprès d'un administrateur de son entreprise.",
        },
      ],
    },
    {
      id: "usage",
      title: "5. Règles d'utilisation",
      blocks: [
        {
          type: "p",
          text: "L'utilisateur s'interdit notamment :",
        },
        {
          type: "ul",
          items: [
            "d'utiliser le service à d'autres fins que la gestion des livraisons de l'entreprise à laquelle il est rattaché ;",
            "de tenter d'accéder aux données d'une autre entreprise ou d'un autre utilisateur ;",
            "de perturber le fonctionnement du service (charge anormale, contournement des mesures de sécurité, extraction automatisée non autorisée) ;",
            "de saisir des contenus illicites, notamment dans les commentaires, notes et photos.",
          ],
        },
        {
          type: "p",
          text: "L'entreprise cliente demeure responsable de l'exactitude des données qu'elle importe (commandes, pharmacies, tarifs) et du respect de la réglementation applicable à son activité, en particulier au transport de produits de santé.",
        },
      ],
    },
    {
      id: "disponibilite",
      title: "6. Disponibilité et évolutions",
      blocks: [
        {
          type: "p",
          text: "L'éditeur s'efforce d'assurer un accès continu au service mais ne garantit pas une disponibilité ininterrompue. Des interruptions peuvent survenir pour maintenance, mise à jour ou en cas d'incident. Les fonctionnalités peuvent évoluer ; les mises à jour sont signalées dans l'interface.",
        },
        {
          type: "p",
          text: "Les itinéraires, durées et heures d'arrivée estimées sont calculés automatiquement à titre indicatif et ne constituent pas un engagement contractuel.",
        },
      ],
    },
    {
      id: "responsabilite",
      title: "7. Responsabilité",
      blocks: [
        {
          type: "p",
          text: "L'éditeur met en oeuvre les moyens raisonnables pour assurer la sécurité et la fiabilité du service. Sa responsabilité ne saurait être engagée en cas de dommage indirect, de perte d'exploitation, d'utilisation non conforme du service, ou de défaillance imputable à l'entreprise cliente, à l'utilisateur ou à un tiers (fournisseur d'accès, service Google, serveur SMTP configuré par l'entreprise).",
        },
        {
          type: "p",
          text: `Les conditions financières et niveaux de service applicables à l'entreprise cliente sont définis dans le contrat conclu avec l'éditeur : ${P}.`,
        },
      ],
    },
    {
      id: "propriete",
      title: "8. Propriété intellectuelle",
      blocks: [
        {
          type: "p",
          text: "Le service, son interface, ses marques et son code demeurent la propriété de l'éditeur. L'entreprise cliente conserve la propriété des données qu'elle importe ou saisit et accorde à l'éditeur le droit de les traiter pour les seuls besoins du service.",
        },
      ],
    },
    {
      id: "donnees",
      title: "9. Données personnelles",
      blocks: [
        {
          type: "p",
          text: "Les traitements de données personnelles réalisés dans le cadre du service sont décrits dans la Politique de confidentialité, qui fait partie intégrante des présentes conditions.",
        },
      ],
    },
    {
      id: "resiliation",
      title: "10. Suspension et suppression du compte",
      blocks: [
        {
          type: "p",
          text: "L'éditeur peut suspendre un compte en cas de manquement aux présentes conditions ou de risque pour la sécurité du service. Un administrateur de l'entreprise peut à tout moment retirer un utilisateur de son entreprise ou désactiver un profil. Le compte utilisateur est conservé jusqu'à sa suppression par un administrateur de l'entreprise ou à la demande de l'utilisateur.",
        },
      ],
    },
    {
      id: "droit",
      title: "11. Droit applicable",
      blocks: [
        {
          type: "p",
          text: `Les présentes conditions sont soumises au droit français. En cas de litige, et à défaut de résolution amiable, les tribunaux compétents sont ceux du ressort de ${P}.`,
        },
      ],
    },
  ],
};

export const privacyFr: LegalDocumentContent = {
  title: "Politique de confidentialité",
  intro:
    "Cette politique décrit les données personnelles traitées par Movix, les finalités de ces traitements, leurs destinataires et les droits dont disposent les personnes concernées.",
  updatedAt: UPDATED_AT,
  sections: [
    {
      id: "responsable",
      title: "1. Responsable du traitement",
      blocks: [
        {
          type: "p",
          text: `Pour les données de compte et le fonctionnement de la plateforme, le responsable du traitement est l'éditeur du service : ${P} (dénomination, adresse, SIREN). Contact pour les questions relatives aux données personnelles : ${P}. Délégué à la protection des données, le cas échéant : ${P}.`,
        },
        {
          type: "p",
          text: "Pour les données métier qu'elle importe ou saisit (commandes, pharmacies, chauffeurs, livraisons), l'entreprise cliente est responsable du traitement et l'éditeur agit en qualité de sous-traitant, conformément au contrat conclu entre eux.",
        },
      ],
    },
    {
      id: "donnees",
      title: "2. Données collectées",
      blocks: [
        {
          type: "p",
          text: "Données fournies à l'inscription ou dans les paramètres du compte :",
        },
        {
          type: "ul",
          items: [
            "adresse email et mot de passe (conservé uniquement sous forme hachée) ;",
            "prénom et nom ;",
            "date de naissance (facultative) ;",
            "photo de profil (facultative, stockée par entreprise) ;",
            "identifiant du compte Google lorsque la connexion Google est utilisée.",
          ],
        },
        {
          type: "p",
          text: "Données d'usage générées par l'utilisation du service :",
        },
        {
          type: "ul",
          items: [
            "entreprise(s) auxquelles l'utilisateur est rattaché et permissions associées ;",
            "tournées, commandes et colis traités, anomalies déclarées ;",
            "photos de livraison et positions de scan relevées sur le terrain ;",
            "notifications émises et consultées ;",
            "préférences : langue, entreprise sélectionnée, date de travail.",
          ],
        },
        {
          type: "p",
          text: "Données techniques collectées automatiquement :",
        },
        {
          type: "ul",
          items: [
            "adresse IP, type de navigateur et d'appareil (User-Agent) ;",
            "journaux des requêtes adressées à l'API, à des fins de sécurité et de support ;",
            "alertes d'erreur techniques transmises à un canal interne Discord de l'éditeur, pouvant contenir l'identifiant du compte concerné.",
          ],
        },
      ],
    },
    {
      id: "finalites",
      title: "3. Finalités et bases légales",
      blocks: [
        {
          type: "table",
          head: ["Finalité", "Données", "Base légale"],
          rows: [
            [
              "Création et gestion du compte, authentification",
              "Identité, email, mot de passe haché, identifiant Google",
              "Exécution du contrat",
            ],
            [
              "Fourniture du service de gestion des livraisons",
              "Données d'usage, données métier de l'entreprise",
              "Exécution du contrat",
            ],
            [
              "Envoi d'emails de service (vérification, réinitialisation, notifications)",
              "Adresse email",
              "Exécution du contrat",
            ],
            [
              "Sécurité, prévention des abus, support technique",
              "Données techniques, journaux",
              "Intérêt légitime de l'éditeur",
            ],
            [
              "Connexion via Google",
              "Identifiant et email du compte Google",
              "Consentement (dépôt de cookies tiers) et exécution du contrat",
            ],
          ],
        },
      ],
    },
    {
      id: "destinataires",
      title: "4. Destinataires et sous-traitants",
      blocks: [
        {
          type: "ul",
          items: [
            "Les administrateurs et utilisateurs habilités de l'entreprise cliente, pour les données relatives à leur entreprise.",
            "Google LLC, uniquement lorsque l'utilisateur choisit la connexion Google (service Google Identity Services).",
            "L'hébergement de l'API, de la base de données et du moteur de calcul d'itinéraires est assuré sur l'infrastructure de l'éditeur (stack.bzh).",
            "Les emails sont envoyés depuis le serveur SMTP de l'éditeur ou, lorsque l'entreprise cliente l'a configuré, depuis le serveur SMTP de cette entreprise.",
            "Les alertes d'erreur techniques sont transmises à un canal interne Discord réservé à l'équipe de l'éditeur.",
          ],
        },
        {
          type: "p",
          text: `Aucune donnée n'est vendue ni transmise à des fins publicitaires. En cas de transfert hors de l'Union européenne (notamment vers Google LLC), l'éditeur s'appuie sur les garanties prévues par la réglementation : ${P}.`,
        },
      ],
    },
    {
      id: "durees",
      title: "5. Durées de conservation",
      blocks: [
        {
          type: "ul",
          items: [
            "Session web : 8 heures à compter de la connexion.",
            "Compte utilisateur et données de profil : jusqu'à la suppression du compte par un administrateur de l'entreprise ou à la demande de l'utilisateur.",
            "Données métier (tournées, commandes, anomalies, photos) : selon la durée définie avec l'entreprise cliente dans le contrat de service.",
            "Notifications : 30 jours.",
            `Journaux techniques et alertes d'erreur : ${P}.`,
          ],
        },
      ],
    },
    {
      id: "droits",
      title: "6. Vos droits",
      blocks: [
        {
          type: "p",
          text: "Conformément au Règlement général sur la protection des données, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité de vos données. Vous pouvez modifier directement vos informations de profil dans les paramètres de votre compte.",
        },
        {
          type: "p",
          text: `Pour exercer vos autres droits, adressez votre demande à ${P}. Une réponse vous sera apportée dans un délai d'un mois. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).`,
        },
      ],
    },
    {
      id: "securite",
      title: "7. Sécurité",
      blocks: [
        {
          type: "p",
          text: "Les échanges avec le service sont chiffrés (HTTPS). Les mots de passe sont stockés sous forme hachée. La session est portée par un cookie inaccessible aux scripts (httpOnly). Les accès aux données sont cloisonnés par entreprise et par permissions.",
        },
      ],
    },
    {
      id: "cookies",
      title: "8. Cookies et stockage local",
      blocks: [
        {
          type: "p",
          text: "Les cookies et données stockées dans le navigateur sont détaillés dans la Politique cookies, accessible depuis le pied de page. Vos choix peuvent être modifiés à tout moment via le lien \"Gérer les cookies\".",
        },
      ],
    },
  ],
};

export const cookiesFr: LegalDocumentContent = {
  title: "Politique cookies",
  intro:
    "Cette page recense les cookies et les données stockées dans votre navigateur par Movix, leur finalité, leur durée et la catégorie à laquelle ils appartiennent. Vous pouvez modifier vos choix à tout moment via le lien \"Gérer les cookies\" du pied de page ou des paramètres.",
  updatedAt: UPDATED_AT,
  sections: [
    {
      id: "categories",
      title: "1. Catégories",
      blocks: [
        {
          type: "ul",
          items: [
            "Nécessaire / fonctionnel : indispensable au fonctionnement du service (session, préférences). Ces éléments ne peuvent pas être désactivés.",
            "Connexion Google (tiers) : script Google Identity Services chargé uniquement si vous l'acceptez. Il dépose des cookies gérés par Google.",
            "Mesure d'audience : aucun outil n'est utilisé à ce jour. Cette catégorie est désactivée par défaut et le restera tant qu'aucun outil n'est ajouté.",
          ],
        },
      ],
    },
    {
      id: "cookies",
      title: "2. Cookies",
      blocks: [
        {
          type: "table",
          head: ["Nom", "Finalité", "Durée", "Catégorie"],
          rows: [
            [
              "auth_token",
              "Cookie de session posé par l'API après connexion (httpOnly, SameSite=Lax). Identifie votre session de manière sécurisée.",
              "8 heures",
              "Nécessaire",
            ],
            [
              "Cookies du domaine accounts.google.com",
              "Déposés par Google Identity Services pour permettre la connexion avec un compte Google. Noms et contenus définis par Google.",
              "Définie par Google",
              "Connexion Google (tiers)",
            ],
          ],
        },
      ],
    },
    {
      id: "stockage",
      title: "3. Stockage local du navigateur",
      blocks: [
        {
          type: "p",
          text: "Ces données sont enregistrées dans le stockage local de votre navigateur (localStorage ou sessionStorage). Elles ne sont pas des cookies et ne sont jamais transmises à des tiers.",
        },
        {
          type: "table",
          head: ["Nom", "Finalité", "Durée", "Catégorie"],
          rows: [
            [
              "movix.session",
              "Indique qu'une session est ouverte pour éviter un appel inutile au chargement.",
              "Jusqu'à la déconnexion",
              "Nécessaire",
            ],
            [
              "movix.token",
              "Jeton de session utilisé lorsque le cookie ne peut pas être porté par la requête (flux temps réel).",
              "Jusqu'à la déconnexion",
              "Nécessaire",
            ],
            [
              "movix.account.<userId>",
              "Entreprise sélectionnée pour votre compte lorsque vous appartenez à plusieurs entreprises.",
              "Persistant",
              "Nécessaire / fonctionnel",
            ],
            [
              "movix.account.last",
              "Dernière entreprise sélectionnée, utilisée au chargement de l'application.",
              "Jusqu'à la déconnexion",
              "Nécessaire / fonctionnel",
            ],
            [
              "movix.lang",
              "Langue d'affichage choisie.",
              "Persistant",
              "Nécessaire / fonctionnel",
            ],
            [
              "movix.theme",
              "Thème d'affichage choisi (clair ou sombre). Absent lorsque vous suivez le réglage de votre appareil.",
              "Persistant",
              "Nécessaire / fonctionnel",
            ],
            [
              "movix.workingDate",
              "Date de travail sélectionnée dans la barre de navigation.",
              "Persistant",
              "Nécessaire / fonctionnel",
            ],
            [
              "movix.dismissedVersion",
              "Version de l'application dont vous avez ignoré la proposition de mise à jour.",
              "Persistant",
              "Nécessaire / fonctionnel",
            ],
            [
              "movix.consent",
              "Vos choix en matière de cookies (version, date, catégories acceptées).",
              "Persistant",
              "Nécessaire",
            ],
            [
              "movix.authRedirect",
              "Page vers laquelle vous revenez après vous être connecté ou inscrit (par exemple un lien d'invitation).",
              "Jusqu'au retour sur cette page, 7 jours au plus",
              "Nécessaire / fonctionnel",
            ],
            [
              "movix.preloadReload",
              "Adresse de la page rechargée après une mise à jour, pour éviter une boucle de rechargement (sessionStorage).",
              "Fermeture de l'onglet",
              "Nécessaire",
            ],
          ],
        },
      ],
    },
    {
      id: "choix",
      title: "4. Vos choix",
      blocks: [
        {
          type: "p",
          text: "Lors de votre première visite, un bandeau vous propose d'accepter ou de refuser les cookies tiers, ou de personnaliser vos choix par catégorie. Votre décision est mémorisée dans votre navigateur (movix.consent) et n'est pas transmise à nos serveurs. Elle vous sera redemandée si cette politique évolue.",
        },
        {
          type: "p",
          text: "Si vous refusez la catégorie Connexion Google, le script Google n'est pas chargé et le bouton \"Continuer avec Google\" est désactivé. Vous pouvez toujours vous connecter avec votre email et votre mot de passe. Si vous retirez votre consentement après avoir utilisé la connexion Google, le script déjà chargé reste actif jusqu'au prochain rechargement de la page.",
        },
        {
          type: "p",
          text: "Vous pouvez également supprimer ces données depuis les réglages de votre navigateur.",
        },
      ],
    },
  ],
};
