"""Grants or removes the admin role (role "dev"). Roles can't be changed through the API.

    python set_admin.py persona@mail.com            # make admin
    python set_admin.py persona@mail.com --remove   # back to a normal user
    python set_admin.py --list                      # list admins

Uses the same database as the backend (DATABASE_URL from .env, or the local default).
Add --prod to use the deployed database instead, read from .env.local; refresh that file with
`vercel env pull .env.local` from this folder if it's missing or outdated.

The account must have signed in to Moodify at least once, which is when its profile is created.
"""
import argparse
import os
import re
import sys

from dotenv import load_dotenv

HERE = os.path.dirname(os.path.abspath(__file__))
ADMIN_ROLE = "dev"


def use_prod_database():
    path = os.path.join(HERE, ".env.local")
    if not os.path.exists(path):
        sys.exit("No existe .env.local. Ejecutá `vercel env pull .env.local` en la carpeta backend.")
    values = dict(re.findall(r'^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\r\n]*)"?', open(path, encoding="utf-8").read(), re.M))
    url = values.get("DATABASE_URL_UNPOOLED") or values.get("DATABASE_URL")
    if not url:
        sys.exit(".env.local no tiene DATABASE_URL. Ejecutá `vercel env pull .env.local` en la carpeta backend.")
    os.environ["DATABASE_URL"] = url


def main():
    parser = argparse.ArgumentParser(description="Gestiona administradores de Moodify.")
    parser.add_argument("email", nargs="?", help="email de la cuenta")
    parser.add_argument("--remove", action="store_true", help="quitar el rol de administrador")
    parser.add_argument("--list", action="store_true", help="listar administradores")
    parser.add_argument("--prod", action="store_true", help="usar la base de datos del deploy")
    args = parser.parse_args()
    if not args.list and not args.email:
        parser.error("indicá un email, o --list")

    if args.prod:
        use_prod_database()
    else:
        load_dotenv(os.path.join(HERE, ".env"))

    sys.path.insert(0, HERE)
    from sqlalchemy import func

    import database
    import models

    target = "deploy" if args.prod else "local"
    with database.SessionLocal() as db:
        if args.list:
            admins = db.query(models.UserProfile).filter(models.UserProfile.role == ADMIN_ROLE).order_by(models.UserProfile.email).all()
            print(f"Administradores ({target}): {len(admins)}")
            for user in admins:
                print(f"  {user.email}  ({user.display_name})")
            return

        email = args.email.strip().lower()
        matches = db.query(models.UserProfile).filter(func.lower(models.UserProfile.email) == email).all()
        if not matches:
            sys.exit(f"No hay ninguna cuenta con {email} en la base {target}. "
                     "La cuenta tiene que haber iniciado sesión en Moodify al menos una vez.")
        if len(matches) > 1:
            sys.exit(f"Hay {len(matches)} cuentas con {email}; revisalo a mano en la base de datos.")

        user = matches[0]
        new_role = "user" if args.remove else ADMIN_ROLE
        if user.role == new_role:
            print(f"{user.email} ya {'no ' if args.remove else ''}es administrador ({target}). Nada que cambiar.")
            return
        user.role = new_role
        db.commit()
        print(f"{user.email} {'ya no es' if args.remove else 'ahora es'} administrador ({target}).")
        print("Si tenía la sesión abierta, que recargue la página para ver el cambio.")


if __name__ == "__main__":
    main()
