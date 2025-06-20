# Instrukcja uruchomienia projektu Django

## 1. Wymagania wstępne

- Python 3.12 (zalecana wersja zgodna z Twoim środowiskiem)
- MySQL (np. MySQL Community Server)
- pip (menedżer pakietów Pythona)
- W systemie Windows: Visual C++ Build Tools (do kompilacji niektórych zależności)

## 2. Klonowanie projektu

Wypakuj lub sklonuj projekt do wybranego katalogu, np.:

```
przykladowy_folder
```

## 3. Tworzenie i aktywacja wirtualnego środowiska

W terminalu PowerShell:

```powershell
cd "przykladowy_folder"
python -m venv venv
.\venv\Scripts\Activate.ps1
```

## 4. Instalacja zależności

W katalogu głównym projektu (tam gdzie jest `manage.py`):

```powershell
pip install -r requirements.txt
```

Jeśli nie masz pliku `requirements.txt`, zainstaluj ręcznie:

```powershell
pip install django mysqlclient
```

## 5. Konfiguracja bazy danych MySQL

1. Zainstaluj MySQL i uruchom serwer.
2. Zaloguj się do MySQL:

```powershell
mysql -u root -p
```

3. Utwórz bazę danych i użytkownika (przykład):

```sql
CREATE DATABASE moja_baza CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'moj_uzytkownik'@'localhost' IDENTIFIED BY 'moje_haslo';
GRANT ALL PRIVILEGES ON moja_baza.* TO 'moj_uzytkownik'@'localhost';
FLUSH PRIVILEGES;
```

4. W pliku `backend/backend/settings.py` znajdź sekcję `DATABASES` i ustaw:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'moja_baza',
        'USER': 'moj_uzytkownik',
        'PASSWORD': 'moje_haslo',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
```

## 6. Migracje bazy danych

W katalogu `backend/` (tam gdzie jest `manage.py`):

```powershell
cd backend
python manage.py makemigrations
python manage.py migrate
```

## 7. Tworzenie konta administratora

```powershell
python manage.py createsuperuser
```

Postępuj zgodnie z instrukcjami w terminalu.

## 8. Uruchomienie serwera deweloperskiego

W katalogu `backend/`:

```powershell
python manage.py runserver
```

Aplikacja będzie dostępna pod adresem: http://127.0.0.1:8000/

## 9. Statyczne pliki (opcjonalnie)

Aby zebrać statyczne pliki do katalogu `staticfiles/`:

```powershell
python manage.py collectstatic
```

## 10. Dodatkowe uwagi

- Pliki frontendu (np. `people.js`) znajdują się w: `backend/people/static/people/people.js`
- Szablony HTML: `backend/people/templates/`
- Główne ustawienia Django: `backend/backend/settings.py`

---

W razie problemów sprawdź komunikaty błędów w terminalu lub pliku logów.
