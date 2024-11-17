1. `python3 -m venv venv`
2. `source venv/bin/activate`
3. `pip install -r requirements.txt`
4. `python -m src.app`

How to migrate:
1. `flask --app src.app db init`
2. `flask --app src.app db migrate -m "Migration message"`
3. `flask --app src.app db upgrade`
4. `flask --app src.app db downgrade` # if troubles