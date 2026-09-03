#!/usr/bin/env python3
"""
Script de deploiement automatise pour react_movix
Incremente la version, compile le projet React (Vite) par environnement
et deploie le build sur le serveur.
"""

import os
import subprocess
import sys
import time
import json
import shutil
import urllib.request
import urllib.error
from pathlib import Path

import paramiko
from scp import SCPClient

# Racine du projet (le script vit dans ./deploy/, on remonte d'un cran)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
os.chdir(PROJECT_ROOT)

# Configuration du serveur : lue depuis deploy/.env (ignore par git, voir deploy/.env.example)
# ou depuis les variables d'environnement MOVIX_DEPLOY_*.
DEPLOY_ENV_FILE = Path(__file__).resolve().parent / ".env"


def load_deploy_env():
    """Charge deploy/.env dans os.environ sans ecraser les variables deja definies"""
    if not DEPLOY_ENV_FILE.exists():
        return
    for raw in DEPLOY_ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


load_deploy_env()

HOST = os.environ.get("MOVIX_DEPLOY_HOST", "")
PORT = int(os.environ.get("MOVIX_DEPLOY_PORT", "22"))
USERNAME = os.environ.get("MOVIX_DEPLOY_USER", "")
PASSWORD = os.environ.get("MOVIX_DEPLOY_PASSWORD", "")

LOCAL_DIST_PATH = "./dist"
VERSION_FILE = "version.json"
REMOTE_HOME = "/var/www/html"

# Configuration des environnements
# build : script npm (donc le mode Vite, donc le .env.<mode> utilise)
ENVIRONMENTS = {
    "1": {
        "name": "beta",
        "build": "build:beta",
        "path": f"{REMOTE_HOME}/movix_beta",
        "backup": f"{REMOTE_HOME}/movix_beta_backup",
        "url": "beta.movix.fr",
        "requires_confirmation": False
    },
    "2": {
        "name": "demo",
        "build": "build:demo",
        "path": f"{REMOTE_HOME}/movix_demo",
        "backup": f"{REMOTE_HOME}/movix_demo_backup",
        "url": "demo.movix.fr",
        "requires_confirmation": True
    },
    "3": {
        "name": "prod",
        "build": "build:prod",
        "path": f"{REMOTE_HOME}/movix_prod",
        "backup": f"{REMOTE_HOME}/movix_prodbackup",
        "url": "movix.fr",
        "requires_confirmation": True
    },
    "4": {
        "name": "all",
        "requires_confirmation": True
    }
}

ALL_ENV_KEYS = ["1", "2", "3"]


def print_step(step_name):
    """Affiche une etape du deploiement"""
    print(f"\n{'='*50}")
    print(f"🚀 {step_name}")
    print(f"{'='*50}")


def run_command(command, description):
    """Execute une commande locale"""
    print(f"📋 {description}")
    print(f"💻 Commande: {' '.join(command)}")

    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True, shell=True)
        if result.stdout:
            print(f"✅ Sortie: {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur: {e}")
        if e.stdout:
            print(f"📝 Stdout: {e.stdout}")
        if e.stderr:
            print(f"📝 Stderr: {e.stderr}")
        return False


def execute_remote_command(ssh_client, command, description):
    """Execute une commande sur le serveur distant"""
    print(f"📋 {description}")
    print(f"🖥️  Commande distante: {command}")

    try:
        stdin, stdout, stderr = ssh_client.exec_command(command)
        exit_status = stdout.channel.recv_exit_status()

        output = stdout.read().decode('utf-8').strip()
        error = stderr.read().decode('utf-8').strip()

        if output:
            print(f"✅ Sortie: {output}")
        if error and exit_status != 0:
            print(f"❌ Erreur: {error}")
            return False

        return exit_status == 0
    except Exception as e:
        print(f"❌ Erreur lors de l'execution: {e}")
        return False


def create_ssh_connection():
    """Cree et retourne une connexion SSH"""
    print("🔗 Connexion au serveur...")
    ssh = paramiko.SSHClient()

    # Charger les cles hote connues si disponibles
    known_hosts_path = Path.home() / ".ssh" / "known_hosts"
    if known_hosts_path.exists():
        ssh.load_host_keys(str(known_hosts_path))

    # WarningPolicy : avertit si la cle hote est inconnue au lieu de l'accepter silencieusement
    ssh.set_missing_host_key_policy(paramiko.WarningPolicy())
    ssh.connect(HOST, PORT, USERNAME, PASSWORD, timeout=30)
    print("✅ Connexion SSH etablie")
    return ssh


def read_local_version():
    """Retourne la version declaree dans package.json"""
    with open("package.json", "r", encoding="utf-8") as f:
        pkg = json.load(f)
    return pkg.get("version", "0.0.0")


def read_built_version():
    """Retourne la version ecrite dans dist/version.json par le plugin Vite"""
    version_path = os.path.join(LOCAL_DIST_PATH, VERSION_FILE)
    if not os.path.exists(version_path):
        return None
    try:
        with open(version_path, "r", encoding="utf-8") as f:
            return json.load(f).get("version")
    except (json.JSONDecodeError, OSError):
        return None


def build_project(env, expected_version):
    """Compile le projet React pour un environnement donne"""
    print_step(f"COMPILATION DU PROJET REACT ({env['name'].upper()})")

    # Verification de l'existence de package.json
    if not os.path.exists("package.json"):
        print("❌ Fichier package.json non trouve. Executez ce script depuis la racine du projet.")
        return False

    # Installation des dependances si node_modules n'existe pas
    if not os.path.exists("node_modules"):
        print("📦 Installation des dependances...")
        if not run_command(["npm", "install"], "Installation des dependances npm"):
            return False

    # Nettoyage du build precedent : chaque environnement a ses propres variables
    if os.path.exists(LOCAL_DIST_PATH):
        print("🧹 Suppression du build precedent...")
        shutil.rmtree(LOCAL_DIST_PATH)

    # Build de l'environnement (tsc -b && vite build --mode <env>)
    if not run_command(["npm", "run", env["build"]], f"Build {env['name']} ({env['build']})"):
        return False

    # Verification de l'existence du dossier dist
    if not os.path.exists(LOCAL_DIST_PATH):
        print(f"❌ Le dossier dist n'a pas ete genere: {LOCAL_DIST_PATH}")
        return False

    # Verification du manifeste de version (utilise par le bouton "Mettre a jour" cote client)
    built_version = read_built_version()
    if built_version is None:
        print(f"❌ {VERSION_FILE} absent du build. Le client ne pourra pas detecter les mises a jour.")
        return False
    if built_version != expected_version:
        print(f"❌ Version incoherente: {VERSION_FILE} contient {built_version}, attendu {expected_version}")
        return False
    print(f"✅ {VERSION_FILE} genere avec la version {built_version}")

    # Calcul de la taille du build
    total_size = sum(
        os.path.getsize(os.path.join(dirpath, filename))
        for dirpath, dirnames, filenames in os.walk(LOCAL_DIST_PATH)
        for filename in filenames
    ) / (1024 * 1024)  # MB

    print(f"✅ Build genere avec succes: {LOCAL_DIST_PATH} ({total_size:.1f} MB)")
    return True


def deploy_to_server(ssh, env):
    """Deploie les fichiers sur le serveur distant via une connexion SSH existante"""
    remote_web_path = env["path"]
    remote_backup_path = env["backup"]

    print_step(f"DEPLOIEMENT SUR LE SERVEUR ({env['name'].upper()})")

    # Backup du site actuel
    print("💾 Backup du site actuel...")
    backup_cmd = f"rm -rf {remote_backup_path} && cp -r {remote_web_path} {remote_backup_path} 2>/dev/null || echo 'Pas de site existant a sauvegarder'"
    execute_remote_command(ssh, backup_cmd, "Sauvegarde du site actuel")

    # Nettoyage du repertoire distant
    print("🧹 Nettoyage du repertoire distant...")
    clean_cmd = f"mkdir -p {remote_web_path} && rm -rf {remote_web_path}/*"
    execute_remote_command(ssh, clean_cmd, "Suppression des anciens fichiers")

    # Upload des nouveaux fichiers
    print("📤 Upload des fichiers du build...")
    with SCPClient(ssh.get_transport(), progress=progress) as scp:
        for item in os.listdir(LOCAL_DIST_PATH):
            local_path = os.path.join(LOCAL_DIST_PATH, item)
            print(f"   📁 Upload de {item}...")
            scp.put(local_path, recursive=True, remote_path=remote_web_path)

    print("✅ Fichiers uploades avec succes")

    # Verification des fichiers uploades
    verify_cmd = f"ls -la {remote_web_path}/"
    if execute_remote_command(ssh, verify_cmd, "Verification des fichiers uploades"):
        print("✅ Fichiers verifies sur le serveur")

    # Le manifeste de version doit etre present, sinon aucun client ne verra la mise a jour
    version_cmd = f"cat {remote_web_path}/{VERSION_FILE}"
    if not execute_remote_command(ssh, version_cmd, "Verification du manifeste de version"):
        print(f"⚠️  {VERSION_FILE} introuvable sur le serveur")

    # Definir les permissions appropriees
    print("🔧 Configuration des permissions...")
    chmod_cmd = f"chmod -R 755 {remote_web_path}"
    execute_remote_command(ssh, chmod_cmd, "Definition des permissions")

    return True


def http_get(url, timeout=15):
    """Recupere le corps d'une URL en contournant les caches"""
    req = urllib.request.Request(url, headers={"Cache-Control": "no-cache", "Pragma": "no-cache"})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return response.getcode(), response.read().decode("utf-8")


def check_seo_files(site_url, env_name):
    """Verifie que robots.txt (tous envs) et sitemap.xml (prod) sortent bien du build.
    Ces fichiers sont emis dans dist/ par le plugin movix-seo de vite.config.ts ;
    le repertoire distant etant vide avant upload, leur absence serait silencieuse."""
    ok = True
    try:
        _, body = http_get(f"{site_url}/robots.txt")
        lines = [line.strip() for line in body.splitlines()]
        if body.lstrip().startswith("<"):
            print("⚠️  robots.txt absent du build: le serveur sert le fallback SPA")
            ok = False
        elif env_name == "prod" and "Sitemap: https://movix.fr/sitemap.xml" not in lines:
            print("⚠️  robots.txt de prod sans ligne Sitemap (variante d'env intervertie ?)")
            ok = False
        elif env_name != "prod" and "Disallow: /" not in lines:
            print(f"⚠️  robots.txt de {env_name} sans 'Disallow: /': cet environnement serait indexable")
            ok = False
        else:
            print("✅ robots.txt conforme")
    except OSError as e:
        print(f"⚠️  robots.txt illisible: {e}")
        ok = False

    try:
        _, html = http_get(site_url)
        has_noindex = "noindex" in html
        if env_name == "prod" and has_noindex:
            print("⚠️  index.html de prod contient une meta noindex: le site ne sera pas indexe !")
            ok = False
        elif env_name != "prod" and not has_noindex:
            print(f"⚠️  index.html de {env_name} sans meta noindex: cet environnement serait indexable")
            ok = False
        else:
            print("✅ meta robots conforme")
    except OSError as e:
        print(f"⚠️  index.html illisible: {e}")
        ok = False

    if env_name == "prod":
        try:
            _, body = http_get(f"{site_url}/sitemap.xml")
            if "<urlset" in body:
                print("✅ sitemap.xml servi")
            else:
                print("⚠️  sitemap.xml absent ou invalide (fallback SPA ?)")
                ok = False
        except OSError as e:
            print(f"⚠️  sitemap.xml illisible: {e}")
            ok = False
    return ok


def health_check(env, expected_version):
    """Verifie que le site repond et sert bien la version deployee"""
    url = env["url"]
    site_url = f"https://{url}"
    version_url = f"{site_url}/{VERSION_FILE}"
    print(f"🏥 Health check: {site_url}")

    try:
        req = urllib.request.Request(site_url, method="HEAD")
        response = urllib.request.urlopen(req, timeout=15)
        status = response.getcode()
        if status == 200:
            print(f"✅ Site OK ({status})")
        else:
            print(f"⚠️  Site: code HTTP {status}")
    except urllib.error.URLError as e:
        print(f"⚠️  Health check echoue: {e}")
        return False

    # Verification de la version servie : c'est ce fichier que le client interroge
    # pour proposer le bouton "Mettre a jour".
    for attempt in range(3):
        try:
            status, body = http_get(version_url)
            served_version = json.loads(body).get("version")
            if served_version == expected_version:
                print(f"✅ Version servie: {served_version}")
                return check_seo_files(site_url, env["name"])
            print(f"⏳ Version servie: {served_version} (attendu {expected_version}), nouvelle tentative...")
        except (OSError, ValueError) as e:
            print(f"⏳ {VERSION_FILE} illisible ({e}), nouvelle tentative...")
        if attempt < 2:
            time.sleep(3)

    print(f"⚠️  Le serveur ne sert pas encore la version {expected_version} (cache ou CDN ?)")
    return False


def progress(filename, size, sent):
    """Callback de progression pour SCP"""
    sys.stdout.write(f"   {filename}: {float(sent)/float(size)*100:.0f}%   \r")


def bump_version():
    """Incremente la version dans package.json avec confirmation utilisateur"""
    with open("package.json", "r", encoding="utf-8") as f:
        pkg = json.load(f)

    current_version = pkg.get("version", "0.0.0")
    parts = current_version.split(".")
    parts[-1] = str(int(parts[-1]) + 1)
    suggested_version = ".".join(parts)

    print(f"\n📦 Version actuelle: {current_version}")
    print("   (elle est embarquee dans le build et publiee dans version.json)")
    user_input = input(f"   Nouvelle version [{suggested_version}]: ").strip()

    new_version = user_input if user_input else suggested_version

    if new_version == current_version:
        print("⚠️  Version inchangee: les clients deja ouverts ne verront pas le bouton \"Mettre a jour\".")
        confirm = input("   Continuer quand meme? (oui/non): ").strip().lower()
        if confirm != "oui":
            print("❌ Deploiement annule.")
            sys.exit(0)
        return new_version

    pkg["version"] = new_version
    with open("package.json", "w", encoding="utf-8") as f:
        json.dump(pkg, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"✅ Version mise a jour: {current_version} → {new_version}")
    return new_version


def select_environment():
    """Affiche le menu de selection d'environnement et retourne l'environnement choisi"""
    print("\n📋 Selectionnez l'environnement de deploiement:")
    print("-" * 40)
    for key, env in ENVIRONMENTS.items():
        if env["name"] == "all":
            print(f"  {key}: TOUS (beta + demo + prod)")
        else:
            print(f"  {key}: {env['name'].upper()} ({env['url']}) - npm run {env['build']}")
    print("-" * 40)

    while True:
        choice = input("\nVotre choix (1/2/3/4): ").strip()
        if choice in ENVIRONMENTS:
            env = ENVIRONMENTS[choice]

            # Confirmation pour demo, prod et all
            if env["requires_confirmation"]:
                if env["name"] == "all":
                    print("\n⚠️  ATTENTION: Vous allez deployer sur TOUS les environnements (beta + demo + prod)")
                    confirm = input("Confirmez-vous le deploiement sur TOUS les environnements? (oui/non): ").strip().lower()
                else:
                    print(f"\n⚠️  ATTENTION: Vous allez deployer sur {env['name'].upper()} ({env['url']})")
                    confirm = input(f"Confirmez-vous le deploiement sur {env['name'].upper()}? (oui/non): ").strip().lower()

                if confirm != "oui":
                    print("❌ Deploiement annule.")
                    sys.exit(0)

            return env
        else:
            print("❌ Choix invalide. Veuillez entrer 1, 2, 3 ou 4.")


def build_and_deploy(ssh, env, version):
    """Compile puis deploie un environnement (un build par environnement)"""
    if not build_project(env, version):
        print(f"\n❌ ECHEC DE L'ETAPE: Build {env['name'].upper()}")
        return False
    if not deploy_to_server(ssh, env):
        print(f"\n❌ ECHEC DE L'ETAPE: Deploiement sur {env['name'].upper()}")
        return False
    return True


def main():
    """Fonction principale"""
    print("🎯 DEPLOIEMENT AUTOMATISE REACT_MOVIX")
    print("=" * 50)

    # Verification des prerequis
    if not os.path.exists("package.json"):
        print("❌ Fichier package.json non trouve. Executez ce script depuis la racine du projet React.")
        sys.exit(1)

    try:
        import paramiko  # noqa: F401
        from scp import SCPClient  # noqa: F401
    except ImportError:
        print("❌ Modules Python requis manquants. Installez avec:")
        print("pip install -r deploy/requirements.txt")
        sys.exit(1)

    if not HOST or not USERNAME or not PASSWORD:
        print("❌ Identifiants de deploiement manquants. Copiez deploy/.env.example vers deploy/.env")
        print("   et renseignez MOVIX_DEPLOY_HOST / MOVIX_DEPLOY_USER / MOVIX_DEPLOY_PASSWORD.")
        sys.exit(1)

    # Verification de Node.js et npm
    try:
        npm_version = subprocess.run(
            ["npm", "--version"], capture_output=True, text=True, check=True, shell=True
        )
        print(f"📦 NPM version: {npm_version.stdout.strip()}")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ NPM non trouve. Assurez-vous que Node.js et npm sont installes.")
        sys.exit(1)

    print(f"📦 Version en place: {read_local_version()}")

    # Selection de l'environnement
    selected_env = select_environment()
    print(f"\n✅ Environnement selectionne: {selected_env['name'].upper()}")

    # Gestion de la version (avant le build : elle est figee dans le bundle)
    new_version = bump_version()

    start_time = time.time()

    # Connexion SSH unique pour tous les deploiements
    try:
        ssh = create_ssh_connection()
    except paramiko.AuthenticationException:
        print("❌ Erreur d'authentification SSH. Verifiez MOVIX_DEPLOY_USER / MOVIX_DEPLOY_PASSWORD dans deploy/.env.")
        sys.exit(1)
    except paramiko.SSHException as e:
        print(f"❌ Erreur SSH: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Impossible de se connecter au serveur: {e}")
        sys.exit(1)

    try:
        # Un build par environnement : les variables Vite (.env.<mode>) different
        if selected_env["name"] == "all":
            deployed_envs = []
            for index, key in enumerate(ALL_ENV_KEYS, start=1):
                env = ENVIRONMENTS[key]
                print(f"\n{'='*50}")
                print(f"📦 Deploiement {index}/{len(ALL_ENV_KEYS)}: {env['name'].upper()}")
                print(f"{'='*50}")
                if not build_and_deploy(ssh, env, new_version):
                    sys.exit(1)
                deployed_envs.append(env)

            # Health checks
            print_step("HEALTH CHECKS")
            for env in deployed_envs:
                health_check(env, new_version)

            # Succes pour tous
            elapsed_time = time.time() - start_time
            print_step("DEPLOIEMENT TERMINE")
            print(f"🎉 Deploiement reussi sur TOUS les environnements en {elapsed_time:.1f} secondes!")
            print(f"📦 Version deployee: {new_version}")
            print("\n🌐 L'application est maintenant disponible sur:")
            for env in deployed_envs:
                print(f"   • https://{env['url']}")
            print("\n📋 Prochaines etapes:")
            print("   • Les onglets deja ouverts affichent le bouton \"Mettre a jour\" sous 5 minutes")
            print("   • Testez l'application sur chaque environnement")
            print("   • Verifiez la console du navigateur pour d'eventuelles erreurs")
        else:
            if not build_and_deploy(ssh, selected_env, new_version):
                sys.exit(1)

            # Health check
            print_step("HEALTH CHECK")
            health_check(selected_env, new_version)

            # Succes
            elapsed_time = time.time() - start_time
            print_step("DEPLOIEMENT TERMINE")
            print(f"🎉 Deploiement reussi en {elapsed_time:.1f} secondes!")
            print(f"📦 Version deployee: {new_version}")
            print(f"🌐 L'application est maintenant disponible sur https://{selected_env['url']}")
            print("\n📋 Prochaines etapes:")
            print("   • Les onglets deja ouverts affichent le bouton \"Mettre a jour\" sous 5 minutes")
            print("   • Testez l'application")
            print("   • Verifiez la console du navigateur pour d'eventuelles erreurs")
            print(f"   • En cas de probleme, restaurez avec: cp -r {selected_env['backup']}/* {selected_env['path']}/")
    finally:
        ssh.close()
        print("🔒 Connexion SSH fermee")


if __name__ == "__main__":
    main()
